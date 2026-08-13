import type { ICustomPreset } from './ICustomPreset'
import type { IFluidPreset } from './IFluidPreset'

/** Preset group containing either fluid presets, custom presets, or a simple value */
export interface IPresetGroup {
  name: string
  value: (IFluidPreset | ICustomPreset)[] | string
  control_id?: string
}
