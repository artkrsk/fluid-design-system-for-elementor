import type { IFluidPreset } from './IFluidPreset'

/** Preset group containing either fluid presets or a simple value */
export interface IPresetGroup {
  name: string
  value: IFluidPreset[] | string
  control_id?: string
}
