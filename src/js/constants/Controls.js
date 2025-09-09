/**
 * Helper function to check if a control is a fluid preset repeater
 * This checks the control model for the is_fluid_preset_repeater flag
 * @param {string} controlName - The name of the control
 * @param {Object} container - The Elementor container with settings
 * @returns {boolean}
 */
function isFluidPresetRepeater(controlName, container) {
  // Try to get the control definition from the container's settings
  const kitControls = container?.view?.model?.controls?.get(controlName)
  if (kitControls) {
    return kitControls.get('is_fluid_preset_repeater') === true
  }

  // Fallback to checking control names for backward compatibility
  return (
    controlName === 'fluid_spacing_presets' ||
    controlName === 'fluid_typography_presets' ||
    (controlName?.startsWith('fluid_custom_') && controlName?.endsWith('_presets'))
  )
}

export const FLUID_REPEATER_CONTROLS = {
  SPACING: 'fluid_spacing_presets',
  TYPOGRAPHY: 'fluid_typography_presets',
  // Helper function
  isFluidPresetRepeater
}
