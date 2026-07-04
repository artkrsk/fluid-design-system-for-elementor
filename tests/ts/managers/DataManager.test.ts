import { describe, it, expect, beforeEach } from 'vitest'
import { DataManager } from '@/managers/DataManager'

describe('DataManager', () => {
  let dm: DataManager

  beforeEach(() => {
    dm = new DataManager()
  })

  it('starts with an empty cache', () => {
    expect(dm.presets).toBeNull()
    expect(dm.request).toBeNull()
    expect(dm.isPending).toBe(false)
  })

  it('invalidate() clears cached presets, the in-flight request and the pending flag', () => {
    dm.presets = [{ name: 'Group', value: [] }] as any
    dm.request = Promise.resolve([]) as any
    dm.isPending = true

    dm.invalidate()

    expect(dm.presets).toBeNull()
    expect(dm.request).toBeNull()
    expect(dm.isPending).toBe(false)
  })
})
