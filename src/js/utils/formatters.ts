/**
 * Value formatting utilities for fluid design system
 */
export class ValueFormatter {
  /**
   * Formats size display with proper handling of equal values
   * @param {string} minSize - Minimum size value
   * @param {string} minUnit - Minimum size unit
   * @param {string} maxSize - Maximum size value
   * @param {string} maxUnit - Maximum size unit
   * @param {Object} [options] - Formatting options
   * @param {boolean} [options.includeSpan=false] - Whether to include span wrapper for divider
   * @returns {string} Formatted size string
   */
  static formatSizeRange(minSize, minUnit, maxSize, maxUnit, options = {}) {
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

  /**
   * Formats inherited value for display
   * @param {string} inheritedSize - The inherited size value
   * @param {string} sourceUnit - The source unit
   * @returns {string} Formatted inherited value
   */
  static formatInheritedValue(inheritedSize, sourceUnit) {
    return sourceUnit === 'custom' ? inheritedSize : `${inheritedSize}${sourceUnit}`
  }

  /**
   * Calculates separator text based on value equality
   * @param {{size: string, unit: string}|null} minParsed - Parsed minimum value
   * @param {{size: string, unit: string}|null} maxParsed - Parsed maximum value
   * @returns {'~' | '='} Separator character
   */
  static calculateSeparator(minParsed, maxParsed) {
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
