/** Callbacks for preset dialog operations */
export interface IPresetDialogCallbacks {
  /** Called when creating a new preset; rejects to keep the dialog open with an error */
  onCreate?: (
    name: string,
    group: string,
    minVal: string,
    maxVal: string,
    setting: string
  ) => Promise<void>
  /** Called when updating an existing preset; rejects to keep the dialog open with an error */
  onUpdate?: (
    presetId: string,
    name: string,
    group: string,
    minVal: string,
    maxVal: string
  ) => Promise<void>
  /** Gets inline input container for live preview */
  getInlineContainer?: (setting: string) => HTMLElement | null
}
