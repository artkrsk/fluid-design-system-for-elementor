import type { Container, BackboneCollection, BackboneModel } from '@arts/elementor-types'

/** Checks if a unit value is fluid */
export function isFluidUnit(unit: string | undefined): boolean {
  return unit === 'fluid'
}

/** Checks if unit type requires text input instead of number spinner */
export function requiresTextInput(unit: string | undefined): boolean {
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
    /^fluid_custom_.+_presets$/.test(controlName ?? '')
  )
}
