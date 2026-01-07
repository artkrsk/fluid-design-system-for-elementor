/** Extended control value with inheritance metadata */
export interface IInheritedControlValue {
  [key: string]: string | number | boolean | string[] | undefined
  unit?: string
  __inheritedFrom?: string
  __directParentDevice?: string
  __inheritPath?: string[]
  __sourceUnit?: string
}
