import type { Container, BackboneCollection, BackboneModel } from '@arts/elementor-types'

/** Checks if a unit value is fluid */
export function isFluidUnit(unit: string | undefined): boolean {
  return unit === 'fluid'
}

/** Checks if a unit value is custom (fluid or custom) */
export function isCustomUnit(unit: string | undefined): boolean {
  return unit === 'fluid' || unit === 'custom'
}

/** Checks if size units array includes fluid */
export function hasFluidInUnits(sizeUnits: string[] | undefined): boolean {
  return Array.isArray(sizeUnits) && sizeUnits.includes('fluid')
}

/** Checks if a control is a fluid preset repeater */
export function isFluidPresetRepeater(
  controlName: string | undefined,
  container: Container | undefined
): boolean {
  const controls = (container?.view?.model as any)?.controls as BackboneCollection | undefined
  const kitControls = controls?.get(controlName ?? '') as BackboneModel | undefined
  if (kitControls) {
    return kitControls.get('is_fluid_preset_repeater') === true
  }

  return (
    controlName === 'fluid_spacing_presets' ||
    controlName === 'fluid_typography_presets' ||
    Boolean(controlName?.startsWith('fluid_custom_') && controlName?.endsWith('_presets'))
  )
}
