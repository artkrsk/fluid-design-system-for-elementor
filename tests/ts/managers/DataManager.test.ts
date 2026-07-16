import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/utils', () => ({
  showControlSpinner: vi.fn(),
  hideControlSpinner: vi.fn(),
  elementorAjaxRequest: vi.fn()
}))

vi.mock('@/services/presetAPI', () => ({
  PresetAPIService: { fetchGroups: vi.fn() }
}))

import { DataManager } from '@/managers/DataManager'
import { elementorAjaxRequest } from '@/utils'
import { PresetAPIService } from '@/services/presetAPI'
import type { IFluidPreset, IPresetGroup } from '@/interfaces'

/** A promise plus the handles to settle it later */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => {
    resolve = r
  })
  return { promise, resolve }
}

function cachedGroups(): IPresetGroup[] {
  return [
    {
      name: 'Spacing',
      control_id: 'fluid_spacing_presets',
      value: [
        {
          id: 'spacing-1',
          value: 'var(--arts-fluid-preset--spacing-1)',
          title: 'Small',
          min_size: '8',
          min_unit: 'px',
          max_size: '16',
          max_unit: 'px',
          editable: true
        }
      ]
    },
    {
      name: 'Typography',
      control_id: 'fluid_typography_presets',
      value: []
    }
  ]
}

const newRow: IFluidPreset = {
  id: 'new-1',
  value: 'var(--arts-fluid-preset--new-1)',
  title: 'Heading',
  min_size: '20',
  min_unit: 'px',
  max_size: '48',
  max_unit: 'px',
  editable: true
}

describe('DataManager', () => {
  let dm: DataManager

  beforeEach(() => {
    vi.clearAllMocks()
    dm = new DataManager()
  })

  it('starts with an empty cache', () => {
    expect(dm.presets).toBeNull()
    expect(dm.request).toBeNull()
    expect(dm.isPending).toBe(false)
    expect(dm.groupsRequest).toBeNull()
  })

  it('invalidate() clears cached presets, the in-flight requests and the pending flag', () => {
    dm.presets = cachedGroups()
    dm.request = Promise.resolve([]) as any
    dm.isPending = true
    dm.groupsRequest = Promise.resolve([]) as any

    dm.invalidate()

    expect(dm.presets).toBeNull()
    expect(dm.request).toBeNull()
    expect(dm.isPending).toBe(false)
    expect(dm.groupsRequest).toBeNull()
  })

  describe('addPreset', () => {
    it('appends the row to its group and leaves the others alone', () => {
      dm.presets = cachedGroups()

      dm.addPreset('fluid_typography_presets', newRow)

      expect(dm.presets![1].value).toEqual([newRow])
      expect(dm.presets![0].value).toHaveLength(1)
    })

    it('drops the cache when the group is not cached', () => {
      dm.presets = cachedGroups()

      dm.addPreset('fluid_custom_unknown_presets', newRow)

      expect(dm.presets).toBeNull()
    })

    it('does nothing on a cold cache, since the next read fetches fresh data', () => {
      dm.addPreset('fluid_typography_presets', newRow)

      expect(dm.presets).toBeNull()
    })

    it('drops an in-flight fetch, whose response predates the write', () => {
      dm.presets = cachedGroups()
      dm.isPending = true
      dm.request = Promise.resolve([]) as any

      dm.addPreset('fluid_typography_presets', newRow)

      expect(dm.presets).toBeNull()
      expect(dm.request).toBeNull()
      expect(dm.isPending).toBe(false)
    })
  })

  describe('updatePreset', () => {
    it('patches the cached row in place', () => {
      dm.presets = cachedGroups()

      dm.updatePreset('fluid_spacing_presets', 'spacing-1', {
        title: 'Renamed',
        min_size: '10',
        max_size: '30'
      })

      expect((dm.presets![0].value as IFluidPreset[])[0]).toEqual({
        id: 'spacing-1',
        value: 'var(--arts-fluid-preset--spacing-1)',
        title: 'Renamed',
        min_size: '10',
        min_unit: 'px',
        max_size: '30',
        max_unit: 'px',
        editable: true
      })
    })

    it('drops the cache when the row is not cached', () => {
      dm.presets = cachedGroups()

      dm.updatePreset('fluid_spacing_presets', 'missing', { title: 'Renamed' })

      expect(dm.presets).toBeNull()
    })

    it('does nothing on a cold cache, since the next read fetches fresh data', () => {
      dm.updatePreset('fluid_spacing_presets', 'spacing-1', { title: 'Renamed' })

      expect(dm.presets).toBeNull()
    })
  })

  describe('getPresetsData', () => {
    it('ignores a response from a request that invalidate() superseded', async () => {
      const first = deferred<IPresetGroup[]>()
      ;(elementorAjaxRequest as any).mockReturnValueOnce(first.promise)

      const pending = dm.getPresetsData()
      dm.invalidate()

      first.resolve(cachedGroups())
      await pending

      expect(dm.presets).toBeNull()
    })

    it('does not let a superseded request clear a newer request pending flag', async () => {
      const first = deferred<IPresetGroup[]>()
      const second = deferred<IPresetGroup[]>()
      ;(elementorAjaxRequest as any)
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise)

      const firstPending = dm.getPresetsData()
      dm.invalidate()
      const secondPending = dm.getPresetsData()

      first.resolve([])
      await firstPending

      expect(dm.isPending).toBe(true)
      expect(dm.presets).toBeNull()

      second.resolve(cachedGroups())
      await secondPending

      expect(dm.isPending).toBe(false)
      expect(dm.presets).toHaveLength(2)
    })
  })

  describe('getGroups', () => {
    it('fetches fresh on every call, so external group edits show up', async () => {
      ;(PresetAPIService.fetchGroups as any).mockResolvedValue([
        { id: 'fluid_spacing_presets', name: 'Spacing' }
      ])

      const groups = await dm.getGroups()
      const again = await dm.getGroups()

      expect(groups).toEqual([{ id: 'fluid_spacing_presets', name: 'Spacing' }])
      expect(again).toEqual(groups)
      expect(PresetAPIService.fetchGroups).toHaveBeenCalledTimes(2)
    })

    it('shares one request between concurrent callers', async () => {
      const fetch = deferred<{ id: string; name: string }[]>()
      ;(PresetAPIService.fetchGroups as any).mockReturnValue(fetch.promise)

      const both = Promise.all([dm.getGroups(), dm.getGroups()])
      fetch.resolve([{ id: 'fluid_spacing_presets', name: 'Spacing' }])
      const [first, second] = await both

      expect(first).toEqual(second)
      expect(PresetAPIService.fetchGroups).toHaveBeenCalledTimes(1)
    })

    it('returns nothing on failure and retries on the next call', async () => {
      ;(PresetAPIService.fetchGroups as any)
        .mockRejectedValueOnce('boom')
        .mockResolvedValueOnce([{ id: 'fluid_spacing_presets', name: 'Spacing' }])

      expect(await dm.getGroups()).toEqual([])

      expect(await dm.getGroups()).toEqual([{ id: 'fluid_spacing_presets', name: 'Spacing' }])
      expect(PresetAPIService.fetchGroups).toHaveBeenCalledTimes(2)
    })
  })
})
