import { AJAX_ACTION_GET_GROUPS, AJAX_ACTION_SAVE_PRESET } from '../constants/AJAX'

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
    return new Promise((resolve, reject) => {
      window.elementor.ajax.addRequest(AJAX_ACTION_GET_GROUPS, {
        data: {},
        success: (groups) => {
          resolve(groups || [])
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  }

  /**
   * Saves a new fluid preset
   * @param {{title: string, min_size: string, min_unit: string, max_size: string, max_unit: string, group: string}} presetData - Preset data to save
   * @returns {Promise<{id: string}>} Saved preset with generated ID
   * @throws {Error} If AJAX request fails
   */
  static async savePreset(presetData) {
    return new Promise((resolve, reject) => {
      window.elementor.ajax.addRequest(AJAX_ACTION_SAVE_PRESET, {
        data: presetData,
        success: (response) => {
          resolve(response)
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  }
}
