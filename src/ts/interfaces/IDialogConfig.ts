/** Configuration for preset dialog */
export interface IDialogConfig {
  headerMessage?: string
  messageText?: string
  confirmButton?: string
  defaultName: string
  defaultMin: string
  defaultMax: string
  /** Shown in the dialog when the request fails without a usable message */
  errorMessage: string
  /** Resolves once the preset is saved and selected; rejects to keep the dialog open */
  onConfirm: (name: string, group: string, minVal: string, maxVal: string) => Promise<void>
}
