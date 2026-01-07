import { VALUE_WITH_UNIT_PATTERN, CUSTOM_FLUID_VALUE } from '../constants/VALUES'
import { isInlineClampValue } from './clamp'

/**
 * Check if control value object is empty
 * @param {Record<string, any> | null | undefined} value
 * @returns {boolean}
 */
export function isEmptyControlValue(value) {
  return !value || Object.keys(value).length === 0
}

/**
 * Check if value represents a custom fluid value (either placeholder or inline clamp)
 * @param {string | null | undefined} value
 * @returns {boolean}
 */
export function isCustomFluidValue(value) {
  if (!value) {
    return false
  }
  return value === CUSTOM_FLUID_VALUE || isInlineClampValue(value)
}

/**
 * Input validation utilities for fluid design system
 */
export class ValidationService {
  /**
   * Checks if both parsed values are zero
   * @param {import('../types').TParsedValue} minParsed
   * @param {import('../types').TParsedValue} maxParsed
   * @returns {boolean}
   */
  static isBothValuesZero(minParsed, maxParsed) {
    return parseFloat(minParsed.size) === 0 && parseFloat(maxParsed.size) === 0
  }

  /**
   * Parses a value with unit like "20px" or "1.5rem"
   * @param {string} value
   * @returns {import('../types').TParsedValue | null}
   */
  static parseValueWithUnit(value) {
    // Empty value defaults to 0px
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return { size: '0', unit: 'px' }
    }

    // Strict validation: only allow specific units (px, rem, em, %, vw, vh)
    const match = value.trim().match(VALUE_WITH_UNIT_PATTERN)
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
   * @param {string} minValue
   * @param {string} maxValue
   * @returns {import('../types').TValidationResult}
   */
  static validateMinMax(minValue, maxValue) {
    const minParsed = ValidationService.parseValueWithUnit(minValue)
    const maxParsed = ValidationService.parseValueWithUnit(maxValue)

    if (!minParsed || !maxParsed) {
      return { valid: false, error: 'Invalid value format' }
    }

    if (ValidationService.isBothValuesZero(minParsed, maxParsed)) {
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

    const parsed = ValidationService.parseValueWithUnit(value)
    const isValid = parsed !== null
    input.classList.toggle('e-fluid-inline-invalid', !isValid)
    return isValid
  }
}
