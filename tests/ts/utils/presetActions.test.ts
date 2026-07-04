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
  dataManager: { invalidate: vi.fn() },
  cssManager: { setCssVariable: vi.fn(), restoreCssVariable: vi.fn() }
}))

import { handleCreatePreset, handleUpdatePreset } from '@/utils/presetActions'
import { PresetAPIService } from '@/services/presetAPI'
import { insertPresetRow, updatePresetRow } from '@/utils/presetModelSync'

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

    it('does not touch the editor model when the save AJAX fails', async () => {
      ;(PresetAPIService.savePreset as any).mockRejectedValue('boom')
      ;(window as any).elementorCommon = {
        dialogsManager: { createWidget: () => ({ show: vi.fn() }) }
      }
      ;(window as any).ArtsFluidDSStrings = {}

      await handleCreatePreset('X', 'fluid_typography_presets', '1px', '2px', 'font_size', {
        refreshDropdowns: vi.fn().mockResolvedValue(undefined),
        selectPreset: vi.fn()
      })

      expect(insertPresetRow).not.toHaveBeenCalled()
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
  })
})
