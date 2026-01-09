import type { ISavePresetData } from './ISavePresetData'

/** AJAX data for updating a preset */
export interface IUpdatePresetData extends ISavePresetData {
  preset_id: string
}
