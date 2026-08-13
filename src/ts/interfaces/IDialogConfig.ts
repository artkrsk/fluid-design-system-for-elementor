/** Configuration for preset dialog */
export interface IDialogConfig {
  // Explicitly `| undefined`: these are localized strings that may legitimately
  // be absent, and callers pass them straight through from window.ArtsFluidDSStrings.
  headerMessage?: string | undefined
  messageText?: string | undefined
  confirmButton?: string | undefined
  defaultName: string
  defaultMin: string
  defaultMax: string
  /** Shown in the dialog when the request fails without a usable message */
  errorMessage: string
  /** Resolves once the preset is saved and selected; rejects to keep the dialog open */
  onConfirm: (name: string, group: string, minVal: string, maxVal: string) => Promise<void>
}
