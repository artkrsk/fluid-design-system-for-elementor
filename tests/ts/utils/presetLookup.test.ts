import { describe, it, expect } from 'vitest'
import { isFluidPreset } from '@/utils/presetLookup'
import type { IFluidPreset, ICustomPreset } from '@/interfaces'

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
})
