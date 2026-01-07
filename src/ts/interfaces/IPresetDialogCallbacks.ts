/** Callbacks for preset dialog operations */
export interface IPresetDialogCallbacks {
  /** Called when creating a new preset */
  onCreate?: (name: string, group: string, minVal: string, maxVal: string, setting: string) => void
  /** Called when updating an existing preset */
  onUpdate?: (presetId: string, name: string, group: string, minVal: string, maxVal: string) => void
  /** Gets inline input container for live preview */
  getInlineContainer?: (setting: string) => HTMLElement | null
}
