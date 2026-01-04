import { AJAX_ACTIONS } from '../constants/API'

/**
 * Wraps Elementor AJAX request in a Promise
 * @param {string} action - AJAX action name
 * @param {Object} data - Data to send with request
 * @returns {Promise<any>} Promise that resolves with response or rejects with error
 */
function elementorAjaxRequest(action, data = {}) {
  return new Promise((resolve, reject) => {
    window.elementor.ajax.addRequest(action, {
      data,
      success: resolve,
      error: reject
    })
  })
}

/**
 * Service for preset-related API calls
 * Wraps Elementor AJAX with Promise-based interface
 */
export class PresetAPIService {
  /**
   * Fetches all available preset groups
   * @returns {Promise<Array<{id: string, name: string}>>} Array of groups
   * @throws {Error} If AJAX request fails
   */
  static async fetchGroups() {
    const groups = await elementorAjaxRequest(AJAX_ACTIONS.GET_GROUPS)
    return groups || []
  }

  /**
   * Saves a new fluid preset
   * @param {{title: string, min_size: string, min_unit: string, max_size: string, max_unit: string, group: string}} presetData - Preset data to save
   * @returns {Promise<{id: string}>} Saved preset with generated ID
   * @throws {Error} If AJAX request fails
   */
  static async savePreset(presetData) {
    return await elementorAjaxRequest(AJAX_ACTIONS.SAVE_PRESET, presetData)
  }

  /**
   * Updates an existing fluid preset
   * @param {{preset_id: string, title: string, min_size: string, min_unit: string, max_size: string, max_unit: string, group: string}} presetData - Preset data to update
   * @returns {Promise<{id: string, title: string, control_id: string}>} Updated preset info
   * @throws {Error} If AJAX request fails
   */
  static async updatePreset(presetData) {
    return await elementorAjaxRequest(AJAX_ACTIONS.UPDATE_PRESET, presetData)
  }
}
