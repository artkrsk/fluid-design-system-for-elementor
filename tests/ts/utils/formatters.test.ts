import { describe, it, expect } from 'vitest'
import { ValueFormatter } from '@/utils/formatters'

describe('ValueFormatter', () => {
  describe('formatSizeRange', () => {
    it('shows single value when min equals max with same unit', () => {
      expect(ValueFormatter.formatSizeRange('16', 'px', '16', 'px')).toBe('16px')
    })

    it('shows range when values differ', () => {
      expect(ValueFormatter.formatSizeRange('16', 'px', '24', 'px')).toBe('16px ~ 24px')
    })

    it('shows range when units differ even if values equal', () => {
      expect(ValueFormatter.formatSizeRange('16', 'px', '16', 'rem')).toBe('16px ~ 16rem')
    })

    it('handles decimal values', () => {
      expect(ValueFormatter.formatSizeRange('1.5', 'rem', '2.5', 'rem')).toBe('1.5rem ~ 2.5rem')
    })

    it('includes span divider when includeSpan is true', () => {
      const result = ValueFormatter.formatSizeRange('16', 'px', '24', 'px', { includeSpan: true })

      expect(result).toBe(
        '16px<span class="select2-result-fluid-spacing-formatted__size-divider"></span>24px'
      )
    })

    it('returns single value even with includeSpan when values equal', () => {
      const result = ValueFormatter.formatSizeRange('16', 'px', '16', 'px', { includeSpan: true })

      expect(result).toBe('16px')
    })

    it('handles mixed units with span', () => {
      const result = ValueFormatter.formatSizeRange('1', 'rem', '24', 'px', { includeSpan: true })

      expect(result).toBe(
        '1rem<span class="select2-result-fluid-spacing-formatted__size-divider"></span>24px'
      )
    })

    it('handles zero values', () => {
      expect(ValueFormatter.formatSizeRange('0', 'px', '24', 'px')).toBe('0px ~ 24px')
    })

    it('handles negative values', () => {
      expect(ValueFormatter.formatSizeRange('-10', 'px', '10', 'px')).toBe('-10px ~ 10px')
    })
  })

  describe('formatInheritedValue', () => {
    it('returns raw value for custom unit', () => {
      expect(ValueFormatter.formatInheritedValue('some-value', 'custom')).toBe('some-value')
    })

    it('appends unit for non-custom units', () => {
      expect(ValueFormatter.formatInheritedValue('16', 'px')).toBe('16px')
    })

    it('appends rem unit', () => {
      expect(ValueFormatter.formatInheritedValue('1.5', 'rem')).toBe('1.5rem')
    })

    it('handles fluid unit', () => {
      expect(ValueFormatter.formatInheritedValue('preset_name', 'fluid')).toBe('preset_namefluid')
    })

    it('handles empty size with unit', () => {
      expect(ValueFormatter.formatInheritedValue('', 'px')).toBe('px')
    })
  })

  describe('calculateSeparator', () => {
    it('returns ~ when minParsed is null', () => {
      expect(ValueFormatter.calculateSeparator(null, { size: '24', unit: 'px' })).toBe('~')
    })

    it('returns ~ when maxParsed is null', () => {
      expect(ValueFormatter.calculateSeparator({ size: '16', unit: 'px' }, null)).toBe('~')
    })

    it('returns ~ when both are null', () => {
      expect(ValueFormatter.calculateSeparator(null, null)).toBe('~')
    })

    it('returns = for equal non-zero values with same unit', () => {
      expect(
        ValueFormatter.calculateSeparator({ size: '16', unit: 'px' }, { size: '16', unit: 'px' })
      ).toBe('=')
    })

    it('returns ~ for different values', () => {
      expect(
        ValueFormatter.calculateSeparator({ size: '16', unit: 'px' }, { size: '24', unit: 'px' })
      ).toBe('~')
    })

    it('returns ~ for equal values with different units', () => {
      expect(
        ValueFormatter.calculateSeparator({ size: '16', unit: 'px' }, { size: '16', unit: 'rem' })
      ).toBe('~')
    })

    it('returns ~ for both zero values', () => {
      expect(
        ValueFormatter.calculateSeparator({ size: '0', unit: 'px' }, { size: '0', unit: 'px' })
      ).toBe('~')
    })

    it('returns ~ when one value is zero', () => {
      expect(
        ValueFormatter.calculateSeparator({ size: '0', unit: 'px' }, { size: '16', unit: 'px' })
      ).toBe('~')
    })

    it('handles decimal equal values', () => {
      expect(
        ValueFormatter.calculateSeparator(
          { size: '1.5', unit: 'rem' },
          { size: '1.5', unit: 'rem' }
        )
      ).toBe('=')
    })

    it('handles string number comparison correctly', () => {
      // '16.0' and '16' should be equal when parsed as floats
      expect(
        ValueFormatter.calculateSeparator(
          { size: '16.0', unit: 'px' },
          { size: '16', unit: 'px' }
        )
      ).toBe('=')
    })
  })
})
