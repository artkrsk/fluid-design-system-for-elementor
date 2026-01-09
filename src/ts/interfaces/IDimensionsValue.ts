/** Dimensions control value (padding, margin, border-radius) */
export interface IDimensionsValue {
  [key: string]: string | boolean | undefined
  unit: string
  top: string
  right: string
  bottom: string
  left: string
  isLinked?: boolean
}
