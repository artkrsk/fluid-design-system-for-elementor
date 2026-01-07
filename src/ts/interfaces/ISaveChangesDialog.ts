/** Save changes dialog widget */
export interface ISaveChangesDialog {
  onConfirm: () => void
  onCancel: () => void
  setSettings(key: string, value: unknown): void
}
