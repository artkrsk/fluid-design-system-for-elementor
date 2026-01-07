import { describe, it, expect } from 'vitest'
import { isFluidUnit, requiresTextInput, hasFluidInUnits } from '@/utils/controls'

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

  // Note: isFluidPresetRepeater is not tested here as it requires
  // Backbone Container/Model mocks. It would need integration tests.
})
