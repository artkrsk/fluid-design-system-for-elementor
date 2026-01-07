/**
 * Checks if a control is a fluid preset repeater
 * @param {string | undefined} controlName
 * @param {import('@arts/elementor-types').Container | undefined} container
 * @returns {boolean}
 */
export function isFluidPresetRepeater(controlName, container) {
  /** @type {import('@arts/elementor-types').BackboneCollection | undefined} */
  const controls = /** @type {any} */ (container?.view?.model)?.controls
  /** @type {import('@arts/elementor-types').BackboneModel | undefined} */
  const kitControls = controls?.get(controlName ?? '')
  if (kitControls) {
    return kitControls.get('is_fluid_preset_repeater') === true
  }

  return (
    controlName === 'fluid_spacing_presets' ||
    controlName === 'fluid_typography_presets' ||
    Boolean(controlName?.startsWith('fluid_custom_') && controlName?.endsWith('_presets'))
  )
}
