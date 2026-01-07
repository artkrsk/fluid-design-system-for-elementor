/** Fluid preset with min/max size values */
export interface IFluidPreset {
  id: string
  value: string
  title: string
  min_size: string
  min_unit: string
  max_size: string
  max_unit: string
  min_screen_width_size?: string
  max_screen_width_size?: string
  min_screen_width_unit?: string
  max_screen_width_unit?: string
  editable?: boolean
}
