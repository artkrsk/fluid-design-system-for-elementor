/** Gaps control value (row/column gaps) */
export interface IGapsValue {
  [key: string]: string | boolean | undefined
  unit: string
  column: string
  row: string
  isLinked?: boolean
}
