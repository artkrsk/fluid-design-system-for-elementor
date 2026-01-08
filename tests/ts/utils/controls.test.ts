import { describe, it, expect } from 'vitest'
import { isFluidUnit, requiresTextInput, hasFluidInUnits, isFluidPresetRepeater } from '@/utils/controls'

describe('controls utilities', () => {
  describe('isFluidUnit', () => {
    it('returns true for fluid', () => {
      expect(isFluidUnit('fluid')).toBe(true)
    })

    it('returns false for px', () => {
      expect(isFluidUnit('px')).toBe(false)
    })

    it('returns false for rem', () => {
      expect(isFluidUnit('rem')).toBe(false)
    })

    it('returns false for custom', () => {
      expect(isFluidUnit('custom')).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isFluidUnit(undefined)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isFluidUnit('')).toBe(false)
    })
  })

  describe('requiresTextInput', () => {
    it('returns true for fluid', () => {
      expect(requiresTextInput('fluid')).toBe(true)
    })

    it('returns true for custom', () => {
      expect(requiresTextInput('custom')).toBe(true)
    })

    it('returns false for px', () => {
      expect(requiresTextInput('px')).toBe(false)
    })

    it('returns false for rem', () => {
      expect(requiresTextInput('rem')).toBe(false)
    })

    it('returns false for em', () => {
      expect(requiresTextInput('em')).toBe(false)
    })

    it('returns false for percentage', () => {
      expect(requiresTextInput('%')).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(requiresTextInput(undefined)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(requiresTextInput('')).toBe(false)
    })
  })

  describe('hasFluidInUnits', () => {
    it('returns true when array includes fluid', () => {
      expect(hasFluidInUnits(['px', 'rem', 'fluid'])).toBe(true)
    })

    it('returns true when fluid is only element', () => {
      expect(hasFluidInUnits(['fluid'])).toBe(true)
    })

    it('returns false when array does not include fluid', () => {
      expect(hasFluidInUnits(['px', 'rem', 'em'])).toBe(false)
    })

    it('returns false for empty array', () => {
      expect(hasFluidInUnits([])).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(hasFluidInUnits(undefined)).toBe(false)
    })

    it('returns false for non-array value', () => {
      // @ts-expect-error - testing runtime behavior
      expect(hasFluidInUnits('fluid')).toBe(false)
      // @ts-expect-error - testing runtime behavior
      expect(hasFluidInUnits(null)).toBe(false)
    })

    it('is case sensitive', () => {
      expect(hasFluidInUnits(['FLUID'])).toBe(false)
      expect(hasFluidInUnits(['Fluid'])).toBe(false)
    })
  })

  describe('isFluidPresetRepeater', () => {
    // Testing fallback logic when container is undefined
    // The function checks name patterns when Backbone model lookup fails

    describe('built-in preset repeaters', () => {
      it('returns true for fluid_spacing_presets', () => {
        expect(isFluidPresetRepeater('fluid_spacing_presets', undefined)).toBe(true)
      })

      it('returns true for fluid_typography_presets', () => {
        expect(isFluidPresetRepeater('fluid_typography_presets', undefined)).toBe(true)
      })
    })

    describe('custom group preset repeaters', () => {
      it('returns true for fluid_custom_abc_presets', () => {
        expect(isFluidPresetRepeater('fluid_custom_abc_presets', undefined)).toBe(true)
      })

      it('returns true for fluid_custom_my-group_presets (with hyphen)', () => {
        expect(isFluidPresetRepeater('fluid_custom_my-group_presets', undefined)).toBe(true)
      })

      it('returns true for fluid_custom_123_presets (numeric ID)', () => {
        expect(isFluidPresetRepeater('fluid_custom_123_presets', undefined)).toBe(true)
      })

      it('returns true for fluid_custom_a_presets (single char ID)', () => {
        expect(isFluidPresetRepeater('fluid_custom_a_presets', undefined)).toBe(true)
      })
    })

    describe('invalid patterns', () => {
      it('returns false for fluid_custom_ (missing _presets suffix)', () => {
        expect(isFluidPresetRepeater('fluid_custom_', undefined)).toBe(false)
      })

      it('returns false for fluid_custom_presets (empty group ID)', () => {
        // Matches PHP regex /^fluid_custom_(.+)_presets$/ which requires non-empty group_id
        expect(isFluidPresetRepeater('fluid_custom_presets', undefined)).toBe(false)
      })

      it('returns false for other_control', () => {
        expect(isFluidPresetRepeater('other_control', undefined)).toBe(false)
      })

      it('returns false for undefined controlName', () => {
        expect(isFluidPresetRepeater(undefined, undefined)).toBe(false)
      })

      it('returns false for empty string', () => {
        expect(isFluidPresetRepeater('', undefined)).toBe(false)
      })

      it('returns false for partial match at start only', () => {
        expect(isFluidPresetRepeater('fluid_custom_abc', undefined)).toBe(false)
      })

      it('returns false for partial match at end only', () => {
        expect(isFluidPresetRepeater('abc_presets', undefined)).toBe(false)
      })

      it('returns false for similar but incorrect patterns', () => {
        expect(isFluidPresetRepeater('fluid_spacing_preset', undefined)).toBe(false)
        expect(isFluidPresetRepeater('fluid_typography_preset', undefined)).toBe(false)
      })
    })
  })
})
