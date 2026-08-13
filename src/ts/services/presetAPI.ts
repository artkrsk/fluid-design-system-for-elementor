import { AJAX_ACTIONS } from '../constants'
import type {
  IPresetGroupOption,
  IPresetResponse,
  ISavePresetData,
  IUpdatePresetData
} from '../interfaces'
import { elementorAjaxRequest } from '../utils/elementorAjax'

/** Service for preset-related API calls */
export class PresetAPIService {
  /** Fetches all available preset groups */
  static async fetchGroups(): Promise<IPresetGroupOption[]> {
    const groups = await elementorAjaxRequest<IPresetGroupOption[]>(AJAX_ACTIONS.GET_GROUPS)
    return groups || []
  }

  /** Saves a new fluid preset */
  static async savePreset(presetData: ISavePresetData): Promise<IPresetResponse> {
    return await elementorAjaxRequest<IPresetResponse>(AJAX_ACTIONS.SAVE_PRESET, presetData)
  }

  /** Updates an existing fluid preset */
  static async updatePreset(presetData: IUpdatePresetData): Promise<IPresetResponse> {
    return await elementorAjaxRequest<IPresetResponse>(AJAX_ACTIONS.UPDATE_PRESET, presetData)
  }
}
