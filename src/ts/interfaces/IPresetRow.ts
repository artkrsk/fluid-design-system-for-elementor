/** Repeater-model shape for a fluid preset row (matches the Kit repeater controls) */
export interface IPresetRow {
  _id: string
  title: string
  min: { size: number; unit: string }
  max: { size: number; unit: string }
}
