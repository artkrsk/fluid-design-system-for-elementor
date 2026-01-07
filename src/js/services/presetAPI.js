import { AJAX_ACTIONS } from '../constants/API'

/**
 * Wraps Elementor AJAX request in a Promise
 * @param {string} action - AJAX action name
 * @param {Object} data - Data to send with request
 * @returns {Promise<any>} Promise that resolves with response or rejects with error
 */
function elementorAjaxRequest(action, data = {}) {
  return new Promise((resolve, reject) => {
    window.elementor?.ajax.addRequest(action, {
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
   * @param {import('../interfaces').ISavePresetData} presetData
   * @returns {Promise<import('../interfaces').IPresetResponse>}
   */
  static async savePreset(presetData) {
    return await elementorAjaxRequest(AJAX_ACTIONS.SAVE_PRESET, presetData)
  }

  /**
   * Updates an existing fluid preset
   * @param {import('../interfaces').IUpdatePresetData} presetData
   * @returns {Promise<import('../interfaces').IPresetResponse>}
   */
  static async updatePreset(presetData) {
    return await elementorAjaxRequest(AJAX_ACTIONS.UPDATE_PRESET, presetData)
  }
}
