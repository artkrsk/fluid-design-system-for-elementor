import { AJAX_ACTIONS, AJAX_DEFAULTS } from '../constants/API'
import { showControlSpinner, hideControlSpinner } from '../utils'

export class DataManager {
  presets = null
  request = null
  isPending = false

  invalidate() {
    this.presets = null
    this.request = null
    this.isPending = false
  }

  async getPresetsData(el) {
    if (this.presets) {
      hideControlSpinner(el)
      return this.presets
    }

    if (el && el.closest('.elementor-control.e-units-fluid')) {
      showControlSpinner(el)
    }

    if (this.isPending) {
      this.request.finally(() => {
        hideControlSpinner(el)
      })

      return this.request
    }

    this.isPending = true

    this.request = new Promise((resolve, reject) => {
      window.elementor.ajax.addRequest(AJAX_ACTIONS.FETCH_PRESETS, {
        data: AJAX_DEFAULTS.FETCH_PRESETS,
        success: (response) => {
          this.presets = response
          resolve(response)
        },
        error: (error) => {
          reject(error)
        }
      })
    })

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
