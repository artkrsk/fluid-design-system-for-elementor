import { AJAX_ACTIONS, AJAX_DEFAULTS } from '../constants/API'
import { showControlSpinner, hideControlSpinner, elementorAjaxRequest } from '../utils'
import type { IPresetGroup } from '../interfaces'

export class DataManager {
  presets: IPresetGroup[] | null = null
  request: Promise<IPresetGroup[]> | null = null
  isPending: boolean = false

  invalidate(): void {
    this.presets = null
    this.request = null
    this.isPending = false
  }

  async getPresetsData(el?: HTMLElement): Promise<IPresetGroup[] | null> {
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

    this.request = elementorAjaxRequest<IPresetGroup[]>(AJAX_ACTIONS.FETCH_PRESETS, AJAX_DEFAULTS.FETCH_PRESETS).then(
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
