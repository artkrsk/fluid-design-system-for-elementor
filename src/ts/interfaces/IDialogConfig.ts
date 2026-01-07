/** Configuration for preset dialog */
export interface IDialogConfig {
  headerMessage?: string
  messageText?: string
  confirmButton?: string
  defaultName: string
  defaultMin: string
  defaultMax: string
  onConfirm: (name: string, group: string, minVal: string, maxVal: string) => void
}
