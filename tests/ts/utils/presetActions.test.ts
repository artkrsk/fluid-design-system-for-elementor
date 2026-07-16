import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/presetAPI', () => ({
  PresetAPIService: {
    savePreset: vi.fn(),
    updatePreset: vi.fn()
  }
}))

vi.mock('@/utils/presetModelSync', () => ({
  insertPresetRow: vi.fn(),
  updatePresetRow: vi.fn()
}))

vi.mock('@/managers', () => ({
  dataManager: { invalidate: vi.fn(), addPreset: vi.fn(), updatePreset: vi.fn() },
  cssManager: { setCssVariable: vi.fn(), restoreCssVariable: vi.fn() }
}))

import { handleCreatePreset, handleUpdatePreset } from '@/utils/presetActions'
import { PresetAPIService } from '@/services/presetAPI'
import { insertPresetRow, updatePresetRow } from '@/utils/presetModelSync'
import { cssManager, dataManager } from '@/managers'

describe('presetActions model sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleCreatePreset', () => {
    it('mirrors the created row into the editor model after the save AJAX resolves', async () => {
      ;(PresetAPIService.savePreset as any).mockResolvedValue({
        id: 'new-id',
        title: 'My Preset',
        control_id: 'fluid_typography_presets'
      })

      await handleCreatePreset(
        'My Preset',
        'fluid_typography_presets',
        '22px',
        '44px',
        'font_size',
        {
          refreshDropdowns: vi.fn().mockResolvedValue(undefined),
          selectPreset: vi.fn()
        }
      )

      expect(insertPresetRow).toHaveBeenCalledWith('fluid_typography_presets', {
        _id: 'new-id',
        title: 'My Preset',
        min: { size: 22, unit: 'px' },
        max: { size: 44, unit: 'px' }
      })
    })

    it('patches the cache with the created row instead of refetching every preset', async () => {
      ;(PresetAPIService.savePreset as any).mockResolvedValue({
        id: 'new-id',
        title: 'My Preset',
        control_id: 'fluid_typography_presets'
      })

      await handleCreatePreset('My Preset', 'typography', '22px', '44px', 'font_size', {
        refreshDropdowns: vi.fn().mockResolvedValue(undefined),
        selectPreset: vi.fn()
      })

      expect(dataManager.addPreset).toHaveBeenCalledWith('fluid_typography_presets', {
        id: 'new-id',
        value: 'var(--arts-fluid-preset--new-id)',
        title: 'My Preset',
        min_size: '22',
        min_unit: 'px',
        max_size: '44',
        max_unit: 'px',
        editable: true
      })
      expect(dataManager.invalidate).not.toHaveBeenCalled()
    })

    it('mirrors the server-sanitized title, not the raw client input', async () => {
      ;(PresetAPIService.savePreset as any).mockResolvedValue({
        id: 'new-id',
        title: 'Sanitized',
        control_id: 'fluid_typography_presets'
      })

      await handleCreatePreset(
        'Raw <b>input</b>',
        'fluid_typography_presets',
        '22px',
        '44px',
        'font_size',
        {
          refreshDropdowns: vi.fn().mockResolvedValue(undefined),
          selectPreset: vi.fn()
        }
      )

      expect(insertPresetRow).toHaveBeenCalledWith(
        'fluid_typography_presets',
        expect.objectContaining({ title: 'Sanitized' })
      )
      expect(dataManager.addPreset).toHaveBeenCalledWith(
        'fluid_typography_presets',
        expect.objectContaining({ title: 'Sanitized' })
      )
    })

    it('keeps an empty server-sanitized title instead of masking it with the raw input', async () => {
      ;(PresetAPIService.savePreset as any).mockResolvedValue({
        id: 'new-id',
        title: '',
        control_id: 'fluid_typography_presets'
      })

      await handleCreatePreset('<b></b>', 'fluid_typography_presets', '22px', '44px', 'font_size', {
        refreshDropdowns: vi.fn().mockResolvedValue(undefined),
        selectPreset: vi.fn()
      })

      expect(dataManager.addPreset).toHaveBeenCalledWith(
        'fluid_typography_presets',
        expect.objectContaining({ title: '' })
      )
    })

    it('resolves and invalidates the cache when a post-persist step fails', async () => {
      ;(PresetAPIService.savePreset as any).mockResolvedValue({
        id: 'new-id',
        title: 'My Preset',
        control_id: 'fluid_typography_presets'
      })

      await expect(
        handleCreatePreset('My Preset', 'fluid_typography_presets', '22px', '44px', 'font_size', {
          refreshDropdowns: vi.fn().mockRejectedValue(new Error('panel torn down')),
          selectPreset: vi.fn()
        })
      ).resolves.toBeUndefined()

      expect(dataManager.invalidate).toHaveBeenCalled()
    })

    it('rejects and does not touch the editor model when the save AJAX fails', async () => {
      ;(PresetAPIService.savePreset as any).mockRejectedValue('boom')

      await expect(
        handleCreatePreset('X', 'fluid_typography_presets', '1px', '2px', 'font_size', {
          refreshDropdowns: vi.fn().mockResolvedValue(undefined),
          selectPreset: vi.fn()
        })
      ).rejects.toBe('boom')

      expect(insertPresetRow).not.toHaveBeenCalled()
    })

    it('resolves only once the new preset has been selected', async () => {
      ;(PresetAPIService.savePreset as any).mockResolvedValue({
        id: 'new-id',
        title: 'My Preset',
        control_id: 'fluid_typography_presets'
      })
      const selectPreset = vi.fn()

      const pending = handleCreatePreset(
        'My Preset',
        'fluid_typography_presets',
        '22px',
        '44px',
        'font_size',
        {
          refreshDropdowns: vi.fn().mockResolvedValue(undefined),
          selectPreset,
          getLinkedSelects: () => [{ setting: 'font_size' }, { setting: 'line_height' }]
        }
      )

      await Promise.resolve()
      expect(selectPreset).not.toHaveBeenCalled()

      await pending

      expect(selectPreset).toHaveBeenCalledWith('font_size', 'var(--arts-fluid-preset--new-id)')
      expect(selectPreset).toHaveBeenCalledWith('line_height', 'var(--arts-fluid-preset--new-id)')
    })

    it('rejects without calling the API when the values do not parse', async () => {
      await expect(
        handleCreatePreset('X', 'fluid_typography_presets', '10pt', '2px', 'font_size', {
          refreshDropdowns: vi.fn().mockResolvedValue(undefined),
          selectPreset: vi.fn()
        })
      ).rejects.toThrow('Invalid min/max value')

      expect(PresetAPIService.savePreset).not.toHaveBeenCalled()
    })
  })

  describe('handleUpdatePreset', () => {
    it('mirrors the edited fields into the editor model after the update AJAX resolves', async () => {
      ;(PresetAPIService.updatePreset as any).mockResolvedValue({
        id: 'preset-1',
        title: 'Renamed',
        control_id: 'fluid_typography_presets'
      })

      await handleUpdatePreset(
        'preset-1',
        'Renamed',
        'fluid_typography_presets',
        '10px',
        '30px',
        vi.fn().mockResolvedValue(undefined)
      )

      expect(updatePresetRow).toHaveBeenCalledWith('fluid_typography_presets', 'preset-1', {
        title: 'Renamed',
        min: { size: 10, unit: 'px' },
        max: { size: 30, unit: 'px' }
      })
    })

    it('patches the cached row instead of refetching every preset', async () => {
      ;(PresetAPIService.updatePreset as any).mockResolvedValue({
        id: 'preset-1',
        title: 'Renamed',
        control_id: 'fluid_typography_presets'
      })

      await handleUpdatePreset(
        'preset-1',
        'Renamed',
        'fluid_typography_presets',
        '10px',
        '30px',
        vi.fn().mockResolvedValue(undefined)
      )

      expect(dataManager.updatePreset).toHaveBeenCalledWith(
        'fluid_typography_presets',
        'preset-1',
        {
          title: 'Renamed',
          min_size: '10',
          min_unit: 'px',
          max_size: '30',
          max_unit: 'px'
        }
      )
      expect(dataManager.invalidate).not.toHaveBeenCalled()
    })

    it('mirrors the server-sanitized title into the editor model', async () => {
      ;(PresetAPIService.updatePreset as any).mockResolvedValue({
        id: 'preset-1',
        title: 'Sanitized',
        control_id: 'fluid_typography_presets'
      })

      await handleUpdatePreset(
        'preset-1',
        'Raw <b>input</b>',
        'fluid_typography_presets',
        '10px',
        '30px',
        vi.fn().mockResolvedValue(undefined)
      )

      expect(updatePresetRow).toHaveBeenCalledWith(
        'fluid_typography_presets',
        'preset-1',
        expect.objectContaining({ title: 'Sanitized' })
      )
      expect(dataManager.updatePreset).toHaveBeenCalledWith(
        'fluid_typography_presets',
        'preset-1',
        expect.objectContaining({ title: 'Sanitized' })
      )
    })

    it('resolves and invalidates the cache when a post-persist step fails', async () => {
      ;(PresetAPIService.updatePreset as any).mockResolvedValue({
        id: 'preset-1',
        title: 'Renamed',
        control_id: 'fluid_typography_presets'
      })

      await expect(
        handleUpdatePreset(
          'preset-1',
          'Renamed',
          'fluid_typography_presets',
          '10px',
          '30px',
          vi.fn().mockRejectedValue(new Error('boom'))
        )
      ).resolves.toBeUndefined()

      expect(dataManager.invalidate).toHaveBeenCalled()
      expect(cssManager.restoreCssVariable).not.toHaveBeenCalled()
    })

    it('rejects and rolls the CSS variable back when the update AJAX fails', async () => {
      ;(PresetAPIService.updatePreset as any).mockRejectedValue(new Error('nope'))

      await expect(
        handleUpdatePreset(
          'preset-1',
          'Renamed',
          'fluid_typography_presets',
          '10px',
          '30px',
          vi.fn().mockResolvedValue(undefined)
        )
      ).rejects.toThrow('nope')

      expect(cssManager.restoreCssVariable).toHaveBeenCalledWith('preset-1')
      expect(updatePresetRow).not.toHaveBeenCalled()
    })
  })
})
