import { describe, it, expect } from 'vitest'
import { generateClampFormula, isInlineClampValue, parseClampFormula } from '@/utils/clamp'

describe('clamp utilities', () => {
  describe('generateClampFormula', () => {
    it('generates clamp formula with px units', () => {
      const result = generateClampFormula(16, 'px', 24, 'px')

      expect(result).toContain('clamp(')
      expect(result).toContain('min(16px, 24px)')
      expect(result).toContain('max(16px, 24px)')
      expect(result).toContain('calc((16px)')
      expect(result).toContain('(24 - 16)')
    })

    it('generates clamp formula with rem units', () => {
      const result = generateClampFormula(1, 'rem', 2, 'rem')

      expect(result).toContain('min(1rem, 2rem)')
      expect(result).toContain('max(1rem, 2rem)')
    })

    it('handles mixed units', () => {
      const result = generateClampFormula(16, 'px', 2, 'rem')

      expect(result).toContain('min(16px, 2rem)')
      expect(result).toContain('max(16px, 2rem)')
    })

    it('handles string number inputs', () => {
      const result = generateClampFormula('16', 'px', '24', 'px')

      expect(result).toContain('min(16px, 24px)')
    })

    it('handles decimal values', () => {
      const result = generateClampFormula(1.5, 'rem', 2.5, 'rem')

      expect(result).toContain('min(1.5rem, 2.5rem)')
      expect(result).toContain('(2.5 - 1.5)')
    })

    it('handles inverted values (max < min)', () => {
      const result = generateClampFormula(24, 'px', 16, 'px')

      // min() and max() CSS functions will handle the ordering
      expect(result).toContain('min(24px, 16px)')
      expect(result).toContain('max(24px, 16px)')
    })

    it('uses CSS variables for screen widths', () => {
      const result = generateClampFormula(16, 'px', 24, 'px')

      expect(result).toContain('var(--arts-fluid-min-screen)')
      expect(result).toContain('var(--arts-fluid-screen-diff)')
    })
  })

  describe('isInlineClampValue', () => {
    it('returns true for clamp formula', () => {
      expect(isInlineClampValue('clamp(16px, calc(...), 24px)')).toBe(true)
    })

    it('returns true for any string starting with clamp(', () => {
      expect(isInlineClampValue('clamp(')).toBe(true)
    })

    it('returns false for preset reference', () => {
      expect(isInlineClampValue('preset_heading_1')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isInlineClampValue('')).toBe(false)
    })

    it('returns false for non-string values', () => {
      // @ts-expect-error - testing runtime behavior
      expect(isInlineClampValue(null)).toBe(false)
      // @ts-expect-error - testing runtime behavior
      expect(isInlineClampValue(undefined)).toBe(false)
      // @ts-expect-error - testing runtime behavior
      expect(isInlineClampValue(123)).toBe(false)
    })

    it('returns false for clamp in middle of string', () => {
      expect(isInlineClampValue('value: clamp(16px, ..., 24px)')).toBe(false)
    })
  })

  describe('parseClampFormula', () => {
    it('parses generated clamp formula correctly', () => {
      const formula = generateClampFormula(16, 'px', 24, 'px')
      const parsed = parseClampFormula(formula)

      expect(parsed).not.toBeNull()
      expect(parsed?.minSize).toBe('16')
      expect(parsed?.minUnit).toBe('px')
      expect(parsed?.maxSize).toBe('24')
      expect(parsed?.maxUnit).toBe('px')
    })

    it('parses formula with rem units', () => {
      const formula = generateClampFormula(1, 'rem', 2, 'rem')
      const parsed = parseClampFormula(formula)

      expect(parsed?.minSize).toBe('1')
      expect(parsed?.minUnit).toBe('rem')
      expect(parsed?.maxSize).toBe('2')
      expect(parsed?.maxUnit).toBe('rem')
    })

    it('parses formula with decimal values', () => {
      const formula = generateClampFormula(1.5, 'rem', 2.5, 'rem')
      const parsed = parseClampFormula(formula)

      expect(parsed?.minSize).toBe('1.5')
      expect(parsed?.maxSize).toBe('2.5')
    })

    it('returns null for non-clamp string', () => {
      expect(parseClampFormula('preset_heading_1')).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(parseClampFormula('')).toBeNull()
    })

    it('returns null for malformed clamp', () => {
      expect(parseClampFormula('clamp(invalid)')).toBeNull()
    })

    it('roundtrips formula generation and parsing', () => {
      const testCases = [
        { min: 16, minUnit: 'px', max: 24, maxUnit: 'px' },
        { min: 1, minUnit: 'rem', max: 2, maxUnit: 'rem' },
        { min: 0.875, minUnit: 'em', max: 1.25, maxUnit: 'em' },
        { min: 14, minUnit: 'px', max: 18, maxUnit: 'px' }
      ]

      for (const tc of testCases) {
        const formula = generateClampFormula(tc.min, tc.minUnit, tc.max, tc.maxUnit)
        const parsed = parseClampFormula(formula)

        expect(parsed).not.toBeNull()
        expect(parsed?.minSize).toBe(String(tc.min))
        expect(parsed?.minUnit).toBe(tc.minUnit)
        expect(parsed?.maxSize).toBe(String(tc.max))
        expect(parsed?.maxUnit).toBe(tc.maxUnit)
      }
    })
  })
})
