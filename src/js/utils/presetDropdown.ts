import { buildSelectOptions } from './preset.js'

/**
 * Manages preset dropdown UI operations
 */
export class PresetDropdownManager {
  /**
   * Refreshes a single dropdown with fresh preset data
   * @param {HTMLSelectElement} selectEl - Select element to refresh
   * @param {HTMLElement} controlEl - Control element for context
   */
  static async refreshDropdown(selectEl, controlEl) {
    // Clear existing options
    selectEl.innerHTML = ''

    // Re-populate with fresh data
    await buildSelectOptions(selectEl, controlEl)

    // Refresh Select2
    jQuery(selectEl).trigger('change.select2')
  }

  /**
   * Refreshes multiple dropdowns with fresh preset data
   * @param {HTMLSelectElement[]} selectElements - Array of select elements
   * @param {HTMLElement} controlEl - Control element for context
   */
  static async refreshDropdowns(selectElements, controlEl) {
    if (!selectElements || !Array.isArray(selectElements)) {
      return
    }

    for (const selectEl of selectElements) {
      await PresetDropdownManager.refreshDropdown(selectEl, controlEl)
    }
  }

  /**
   * Updates select element value and triggers Select2 update
   * @param {HTMLSelectElement} selectEl - Select element
   * @param {string} value - Value to set
   */
  static updateSelectValue(selectEl, value) {
    selectEl.value = value
    selectEl.setAttribute('data-value', value)
    jQuery(selectEl).trigger('change.select2')
  }
}
