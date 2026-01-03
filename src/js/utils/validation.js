/**
 * Input validation utilities for fluid design system
 */
export class ValidationService {
  /**
   * Parses a value with unit like "20px" or "1.5rem"
   * @param {string} value - Value to parse
   * @returns {{size: string, unit: string}|null} Parsed value or null if invalid
   */
  static parseValueWithUnit(value) {
    // Empty value defaults to 0px
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return { size: '0', unit: 'px' }
    }

    // Strict validation: only allow specific units (px, rem, em, %, vw, vh)
    const match = value.trim().match(/^(-?[\d.]+)\s*(px|rem|em|%|vw|vh)?$/i)
    if (!match) {
      return null
    }

    return {
      size: match[1],
      unit: match[2] || 'px' // Default to px if no unit
    }
  }

  /**
   * Validates if both min and max inputs have valid values
   * @param {string} minValue - Minimum value to validate
   * @param {string} maxValue - Maximum value to validate
   * @returns {{valid: boolean, error?: string, values?: Object}} Validation result
   */
  static validateMinMax(minValue, maxValue) {
    const minParsed = this.parseValueWithUnit(minValue)
    const maxParsed = this.parseValueWithUnit(maxValue)

    if (!minParsed || !maxParsed) {
      return { valid: false, error: 'Invalid value format' }
    }

    // Check if both values are zero
    if (parseFloat(minParsed.size) === 0 && parseFloat(maxParsed.size) === 0) {
      return { valid: false, error: 'Cannot create 0~0 preset' }
    }

    return { valid: true, values: { minParsed, maxParsed } }
  }

  /**
   * Validates an input element and applies visual feedback
   * @param {HTMLInputElement} input - Input element to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static validateInputElement(input) {
    const value = input.value.trim()

    // Empty is valid (just not ready yet)
    if (!value) {
      input.classList.remove('e-fluid-inline-invalid')
      return true
    }

    const parsed = this.parseValueWithUnit(value)
    const isValid = parsed !== null
    input.classList.toggle('e-fluid-inline-invalid', !isValid)
    return isValid
  }
}
