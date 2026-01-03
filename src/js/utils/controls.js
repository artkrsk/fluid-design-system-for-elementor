/**
 * Checks if a control is a fluid preset repeater
 * @param {string} controlName - The name of the control
 * @param {Object} container - The Elementor container with settings
 * @returns {boolean}
 */
export function isFluidPresetRepeater(controlName, container) {
  const kitControls = container?.view?.model?.controls?.get(controlName)
  if (kitControls) {
    return kitControls.get('is_fluid_preset_repeater') === true
  }

  return (
    controlName === 'fluid_spacing_presets' ||
    controlName === 'fluid_typography_presets' ||
    (controlName?.startsWith('fluid_custom_') && controlName?.endsWith('_presets'))
  )
}
