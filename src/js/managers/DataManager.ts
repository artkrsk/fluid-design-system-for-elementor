import { AJAX_ACTIONS, AJAX_DEFAULTS } from '../constants/API'
import { showControlSpinner, hideControlSpinner, elementorAjaxRequest } from '../utils'

export class DataManager {
  /** @type {import('../interfaces').IPresetGroup[] | null} */
  presets = null
  /** @type {Promise<import('../interfaces').IPresetGroup[]> | null} */
  request = null
  /** @type {boolean} */
  isPending = false

  invalidate() {
    this.presets = null
    this.request = null
    this.isPending = false
  }

  /**
   * @param {HTMLElement} [el]
   * @returns {Promise<import('../interfaces').IPresetGroup[] | null>}
   */
  async getPresetsData(el) {
    if (this.presets) {
      hideControlSpinner(el)
      return this.presets
    }

    if (el && el.closest('.elementor-control.e-units-fluid')) {
      showControlSpinner(el)
    }

    if (this.isPending && this.request) {
      this.request.finally(() => {
        hideControlSpinner(el)
      })

      return this.request
    }

    this.isPending = true

    this.request = elementorAjaxRequest(AJAX_ACTIONS.FETCH_PRESETS, AJAX_DEFAULTS.FETCH_PRESETS).then(
      (response) => {
        this.presets = response
        return response
      }
    )

    try {
      const result = await this.request
      return result
    } catch {
      return null
    } finally {
      this.isPending = false
      hideControlSpinner(el)
    }
  }
}

// Create a singleton instance
const dataManager = new DataManager()

// Export the instance
export default dataManager
