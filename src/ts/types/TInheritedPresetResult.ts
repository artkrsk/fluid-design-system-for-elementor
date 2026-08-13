import type { IFluidPreset } from '../interfaces'

/** Result type for inherited preset lookup */
export type TInheritedPresetResult =
  | (IFluidPreset & { isComplex: true })
  | { isComplex: false; id: string; name: string }
  | null
