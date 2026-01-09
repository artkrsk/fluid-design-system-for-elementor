import { buildSelectOptions } from './preset'

/** Manages preset dropdown UI operations */
export class PresetDropdownManager {
  /** Refreshes a single dropdown with fresh preset data */
  static async refreshDropdown(selectEl: HTMLSelectElement, controlEl: HTMLElement): Promise<void> {
    // Clear existing options
    selectEl.innerHTML = ''

    // Re-populate with fresh data
    await buildSelectOptions(selectEl, controlEl)

    // Refresh Select2
    jQuery(selectEl).trigger('change.select2')
  }

  /** Refreshes multiple dropdowns with fresh preset data */
  static async refreshDropdowns(
    selectElements: HTMLSelectElement[] | null,
    controlEl: HTMLElement
  ): Promise<void> {
    if (!selectElements || !Array.isArray(selectElements)) {
      return
    }

    for (const selectEl of selectElements) {
      await PresetDropdownManager.refreshDropdown(selectEl, controlEl)
    }
  }

  /** Updates select element value and triggers Select2 update */
  static updateSelectValue(selectEl: HTMLSelectElement, value: string): void {
    selectEl.value = value
    selectEl.setAttribute('data-value', value)
    jQuery(selectEl).trigger('change.select2')
  }
}
