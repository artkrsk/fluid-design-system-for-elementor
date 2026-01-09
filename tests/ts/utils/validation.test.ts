import { describe, it, expect } from 'vitest'
import { isEmptyControlValue, isCustomFluidValue, ValidationService } from '@/utils/validation'
import { CUSTOM_FLUID_VALUE } from '@/constants'

describe('validation utilities', () => {
  describe('isEmptyControlValue', () => {
    it('returns true for null', () => {
      expect(isEmptyControlValue(null)).toBe(true)
    })

    it('returns true for undefined', () => {
      expect(isEmptyControlValue(undefined)).toBe(true)
    })

    it('returns true for empty object', () => {
      expect(isEmptyControlValue({})).toBe(true)
    })

    it('returns false for object with properties', () => {
      expect(isEmptyControlValue({ size: '16px' })).toBe(false)
    })

    it('returns false for object with falsy values', () => {
      expect(isEmptyControlValue({ value: 0 })).toBe(false)
      expect(isEmptyControlValue({ value: '' })).toBe(false)
    })
  })

  describe('isCustomFluidValue', () => {
    it('returns false for null', () => {
      expect(isCustomFluidValue(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isCustomFluidValue(undefined)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isCustomFluidValue('')).toBe(false)
    })

    it('returns true for CUSTOM_FLUID_VALUE constant', () => {
      expect(isCustomFluidValue(CUSTOM_FLUID_VALUE)).toBe(true)
    })

    it('returns true for inline clamp formula', () => {
      expect(isCustomFluidValue('clamp(16px, calc(...), 24px)')).toBe(true)
    })

    it('returns false for preset reference', () => {
      expect(isCustomFluidValue('preset_heading_1')).toBe(false)
    })

    it('returns false for regular value', () => {
      expect(isCustomFluidValue('16px')).toBe(false)
    })
  })

  describe('ValidationService', () => {
    describe('isBothValuesZero', () => {
      it('returns true when both values are zero', () => {
        expect(
          ValidationService.isBothValuesZero({ size: '0', unit: 'px' }, { size: '0', unit: 'rem' })
        ).toBe(true)
      })

      it('returns true for string zero variations', () => {
        expect(
          ValidationService.isBothValuesZero({ size: '0.0', unit: 'px' }, { size: '0', unit: 'px' })
        ).toBe(true)
      })

      it('returns false when min is non-zero', () => {
        expect(
          ValidationService.isBothValuesZero({ size: '16', unit: 'px' }, { size: '0', unit: 'px' })
        ).toBe(false)
      })

      it('returns false when max is non-zero', () => {
        expect(
          ValidationService.isBothValuesZero({ size: '0', unit: 'px' }, { size: '24', unit: 'px' })
        ).toBe(false)
      })

      it('returns false when both are non-zero', () => {
        expect(
          ValidationService.isBothValuesZero({ size: '16', unit: 'px' }, { size: '24', unit: 'px' })
        ).toBe(false)
      })
    })

    describe('parseValueWithUnit', () => {
      it('returns default 0px for empty string', () => {
        expect(ValidationService.parseValueWithUnit('')).toEqual({ size: '0', unit: 'px' })
      })

      it('returns default 0px for whitespace only', () => {
        expect(ValidationService.parseValueWithUnit('   ')).toEqual({ size: '0', unit: 'px' })
      })

      it('returns default 0px for non-string input', () => {
        // @ts-expect-error - testing runtime behavior
        expect(ValidationService.parseValueWithUnit(null)).toEqual({ size: '0', unit: 'px' })
      })

      it('parses px values', () => {
        expect(ValidationService.parseValueWithUnit('16px')).toEqual({ size: '16', unit: 'px' })
      })

      it('parses rem values', () => {
        expect(ValidationService.parseValueWithUnit('1.5rem')).toEqual({ size: '1.5', unit: 'rem' })
      })

      it('parses em values', () => {
        expect(ValidationService.parseValueWithUnit('2em')).toEqual({ size: '2', unit: 'em' })
      })

      it('parses percentage values', () => {
        expect(ValidationService.parseValueWithUnit('50%')).toEqual({ size: '50', unit: '%' })
      })

      it('parses vw values', () => {
        expect(ValidationService.parseValueWithUnit('100vw')).toEqual({ size: '100', unit: 'vw' })
      })

      it('parses vh values', () => {
        expect(ValidationService.parseValueWithUnit('100vh')).toEqual({ size: '100', unit: 'vh' })
      })

      it('parses negative values', () => {
        expect(ValidationService.parseValueWithUnit('-16px')).toEqual({ size: '-16', unit: 'px' })
      })

      it('parses decimal values', () => {
        expect(ValidationService.parseValueWithUnit('0.875rem')).toEqual({
          size: '0.875',
          unit: 'rem'
        })
      })

      it('handles whitespace around value', () => {
        expect(ValidationService.parseValueWithUnit('  16px  ')).toEqual({ size: '16', unit: 'px' })
      })

      it('handles space between number and unit', () => {
        expect(ValidationService.parseValueWithUnit('16 px')).toEqual({ size: '16', unit: 'px' })
      })

      it('defaults to px when no unit provided', () => {
        expect(ValidationService.parseValueWithUnit('16')).toEqual({ size: '16', unit: 'px' })
      })

      it('returns null for invalid unit', () => {
        expect(ValidationService.parseValueWithUnit('16xyz')).toBeNull()
      })

      it('returns null for text without number', () => {
        expect(ValidationService.parseValueWithUnit('invalid')).toBeNull()
      })

      it('is case insensitive for units', () => {
        expect(ValidationService.parseValueWithUnit('16PX')).toEqual({ size: '16', unit: 'PX' })
        expect(ValidationService.parseValueWithUnit('1.5REM')).toEqual({ size: '1.5', unit: 'REM' })
      })
    })

    describe('validateMinMax', () => {
      it('returns valid for correct min/max pair', () => {
        const result = ValidationService.validateMinMax('16px', '24px')

        expect(result.valid).toBe(true)
        expect(result.values?.minParsed).toEqual({ size: '16', unit: 'px' })
        expect(result.values?.maxParsed).toEqual({ size: '24', unit: 'px' })
      })

      it('returns valid for different units', () => {
        const result = ValidationService.validateMinMax('1rem', '2rem')

        expect(result.valid).toBe(true)
      })

      it('returns invalid for malformed min value', () => {
        const result = ValidationService.validateMinMax('invalid', '24px')

        expect(result.valid).toBe(false)
        expect(result.error).toBe('Invalid value format')
      })

      it('returns invalid for malformed max value', () => {
        const result = ValidationService.validateMinMax('16px', 'invalid')

        expect(result.valid).toBe(false)
        expect(result.error).toBe('Invalid value format')
      })

      it('returns invalid for both values zero', () => {
        const result = ValidationService.validateMinMax('0px', '0rem')

        expect(result.valid).toBe(false)
        expect(result.error).toBe('Cannot create 0~0 preset')
      })

      it('returns valid when only min is zero', () => {
        const result = ValidationService.validateMinMax('0px', '24px')

        expect(result.valid).toBe(true)
      })

      it('returns valid when only max is zero', () => {
        const result = ValidationService.validateMinMax('16px', '0px')

        expect(result.valid).toBe(true)
      })

      it('handles empty strings as 0px defaults', () => {
        const result = ValidationService.validateMinMax('', '')

        expect(result.valid).toBe(false)
        expect(result.error).toBe('Cannot create 0~0 preset')
      })
    })

    describe('validateInputElement', () => {
      it('returns true and removes invalid class for empty input', () => {
        const input = document.createElement('input')
        input.value = ''
        input.classList.add('e-fluid-inline-invalid')

        const result = ValidationService.validateInputElement(input)

        expect(result).toBe(true)
        expect(input.classList.contains('e-fluid-inline-invalid')).toBe(false)
      })

      it('returns true and removes invalid class for whitespace input', () => {
        const input = document.createElement('input')
        input.value = '   '

        const result = ValidationService.validateInputElement(input)

        expect(result).toBe(true)
      })

      it('returns true for valid value', () => {
        const input = document.createElement('input')
        input.value = '16px'

        const result = ValidationService.validateInputElement(input)

        expect(result).toBe(true)
        expect(input.classList.contains('e-fluid-inline-invalid')).toBe(false)
      })

      it('returns false and adds invalid class for invalid value', () => {
        const input = document.createElement('input')
        input.value = 'invalid'

        const result = ValidationService.validateInputElement(input)

        expect(result).toBe(false)
        expect(input.classList.contains('e-fluid-inline-invalid')).toBe(true)
      })

      it('removes invalid class when value becomes valid', () => {
        const input = document.createElement('input')
        input.value = 'invalid'
        ValidationService.validateInputElement(input)

        input.value = '16px'
        const result = ValidationService.validateInputElement(input)

        expect(result).toBe(true)
        expect(input.classList.contains('e-fluid-inline-invalid')).toBe(false)
      })
    })
  })
})
