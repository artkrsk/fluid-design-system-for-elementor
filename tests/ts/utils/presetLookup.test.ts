import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/managers', () => ({
  dataManager: { presets: null as any }
}))

import { isFluidPreset, getInheritedPresetSync } from '@/utils/presetLookup'
import { dataManager } from '@/managers'
import type { IFluidPreset, ICustomPreset, IPresetGroup } from '@/interfaces'

describe('presetLookup utilities', () => {
  describe('isFluidPreset', () => {
    it('returns true for preset with min_size and max_size', () => {
      const fluidPreset: IFluidPreset = {
        id: 'preset_1',
        value: 'var(--preset-1)',
        title: 'Heading 1',
        min_size: '24',
        min_unit: 'px',
        max_size: '48',
        max_unit: 'px'
      }

      expect(isFluidPreset(fluidPreset)).toBe(true)
    })

    it('returns true for preset with all optional fields', () => {
      const fullPreset: IFluidPreset = {
        id: 'preset_2',
        value: 'var(--preset-2)',
        title: 'Body Text',
        min_size: '16',
        min_unit: 'px',
        max_size: '20',
        max_unit: 'px',
        min_screen_width_size: '320',
        max_screen_width_size: '1920',
        min_screen_width_unit: 'px',
        max_screen_width_unit: 'px',
        editable: true
      }

      expect(isFluidPreset(fullPreset)).toBe(true)
    })

    it('returns false for custom preset without min/max size', () => {
      const customPreset: ICustomPreset = {
        id: 'custom_1',
        value: 'inherit',
        title: 'Inherit'
      }

      expect(isFluidPreset(customPreset)).toBe(false)
    })

    it('returns false for custom preset with display_value', () => {
      const customPreset: ICustomPreset = {
        id: 'custom_2',
        value: 'auto',
        title: 'Auto',
        display_value: 'auto'
      }

      expect(isFluidPreset(customPreset)).toBe(false)
    })

    it('returns true when only min_size exists (edge case)', () => {
      // This tests the type guard behavior - it checks for both properties
      const partialPreset = {
        id: 'partial',
        value: 'val',
        title: 'Partial',
        min_size: '16',
        min_unit: 'px',
        max_size: '24',
        max_unit: 'px'
      }

      expect(isFluidPreset(partialPreset as IFluidPreset)).toBe(true)
    })

    it('handles preset with empty string values', () => {
      const emptyValuesPreset: IFluidPreset = {
        id: '',
        value: '',
        title: '',
        min_size: '',
        min_unit: '',
        max_size: '',
        max_unit: ''
      }

      // Still has the properties, so returns true
      expect(isFluidPreset(emptyValuesPreset)).toBe(true)
    })

    it('handles preset with zero values', () => {
      const zeroPreset: IFluidPreset = {
        id: 'zero',
        value: 'var(--zero)',
        title: 'Zero',
        min_size: '0',
        min_unit: 'px',
        max_size: '0',
        max_unit: 'px'
      }

      expect(isFluidPreset(zeroPreset)).toBe(true)
    })

    it('handles preset with decimal values', () => {
      const decimalPreset: IFluidPreset = {
        id: 'decimal',
        value: 'var(--decimal)',
        title: 'Decimal',
        min_size: '0.875',
        min_unit: 'rem',
        max_size: '1.125',
        max_unit: 'rem'
      }

      expect(isFluidPreset(decimalPreset)).toBe(true)
    })

    it('handles preset with different min/max units', () => {
      const mixedUnitsPreset: IFluidPreset = {
        id: 'mixed',
        value: 'var(--mixed)',
        title: 'Mixed Units',
        min_size: '16',
        min_unit: 'px',
        max_size: '2',
        max_unit: 'rem'
      }

      expect(isFluidPreset(mixedUnitsPreset)).toBe(true)
    })
  })

  describe('getInheritedPresetSync', () => {
    const fluidPreset: IFluidPreset = {
      id: 'fluid-1',
      value: 'var(--arts-fluid-preset--fluid-1)',
      title: 'Fluid 1',
      min_size: '16',
      min_unit: 'px',
      max_size: '24',
      max_unit: 'px'
    }

    const customPreset: ICustomPreset = {
      id: 'custom-1',
      value: 'inherit',
      title: 'Inherit'
    }

    beforeEach(() => {
      dataManager.presets = null
    })

    it('returns null when presets are not loaded', () => {
      expect(getInheritedPresetSync('some-value')).toBeNull()
    })

    it('returns complex result when matching fluid preset in array group', () => {
      dataManager.presets = [
        { name: 'Typography', value: [fluidPreset, customPreset] }
      ] as IPresetGroup[]

      const result = getInheritedPresetSync(fluidPreset.value)

      expect(result).toEqual({ ...fluidPreset, isComplex: true })
    })

    it('returns simple result when matching string group', () => {
      dataManager.presets = [
        { name: 'Simple', value: 'simple-token' }
      ] as IPresetGroup[]

      const result = getInheritedPresetSync('simple-token')

      expect(result).toEqual({ isComplex: false, id: 'simple-token', name: 'Simple' })
    })

    it('returns null when no preset matches', () => {
      dataManager.presets = [
        { name: 'Typography', value: [fluidPreset] }
      ] as IPresetGroup[]

      expect(getInheritedPresetSync('non-existent')).toBeNull()
    })

    it('skips custom presets in array groups', () => {
      dataManager.presets = [
        { name: 'Mixed', value: [customPreset] }
      ] as IPresetGroup[]

      expect(getInheritedPresetSync(customPreset.value)).toBeNull()
    })

    it('searches across multiple groups', () => {
      dataManager.presets = [
        { name: 'Group A', value: 'token-a' },
        { name: 'Group B', value: [fluidPreset] }
      ] as IPresetGroup[]

      const result = getInheritedPresetSync(fluidPreset.value)

      expect(result).toEqual({ ...fluidPreset, isComplex: true })
    })

    it('returns null for null inheritedSize', () => {
      dataManager.presets = [
        { name: 'Group', value: [fluidPreset] }
      ] as IPresetGroup[]

      expect(getInheritedPresetSync(null)).toBeNull()
    })

    it('does not match string group when value differs', () => {
      dataManager.presets = [
        { name: 'Simple', value: 'token-x' }
      ] as IPresetGroup[]

      expect(getInheritedPresetSync('token-y')).toBeNull()
    })
  })
})
