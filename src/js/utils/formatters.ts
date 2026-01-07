import type { TParsedValue } from '../types'

interface FormatSizeRangeOptions {
  includeSpan?: boolean
}

/** Value formatting utilities for fluid design system */
export class ValueFormatter {
  /** Formats size display with proper handling of equal values */
  static formatSizeRange(
    minSize: string,
    minUnit: string,
    maxSize: string,
    maxUnit: string,
    options: FormatSizeRangeOptions = {}
  ): string {
    const { includeSpan = false } = options

    // If min and max are equal with same unit, show single value
    if (minSize === maxSize && minUnit === maxUnit) {
      return `${minSize}${minUnit}`
    }

    // Otherwise show range with divider
    if (includeSpan) {
      return `${minSize}${minUnit}<span class="select2-result-fluid-spacing-formatted__size-divider"></span>${maxSize}${maxUnit}`
    }
    return `${minSize}${minUnit} ~ ${maxSize}${maxUnit}`
  }

  /** Formats inherited value for display */
  static formatInheritedValue(inheritedSize: string, sourceUnit: string): string {
    return sourceUnit === 'custom' ? inheritedSize : `${inheritedSize}${sourceUnit}`
  }

  /** Calculates separator text based on value equality */
  static calculateSeparator(
    minParsed: TParsedValue | null,
    maxParsed: TParsedValue | null
  ): '~' | '=' {
    if (!minParsed || !maxParsed) {
      return '~'
    }

    const minValue = parseFloat(minParsed.size)
    const maxValue = parseFloat(maxParsed.size)
    const isSameUnit = minParsed.unit === maxParsed.unit
    const isSameValue = minValue === maxValue
    const isNonZero = minValue !== 0 || maxValue !== 0

    // Show "=" only for non-zero equal values with same unit
    // Keep "~" for: ranges, different units, or zero values
    return isSameValue && isSameUnit && isNonZero ? '=' : '~'
  }
}
