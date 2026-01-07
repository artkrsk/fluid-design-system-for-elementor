/**
 * Checks if a unit value is fluid
 * @param {string | undefined} unit
 * @returns {boolean}
 */
export function isFluidUnit(unit) {
  return unit === 'fluid'
}

/**
 * Checks if a unit value is custom (fluid or custom)
 * @param {string | undefined} unit
 * @returns {boolean}
 */
export function isCustomUnit(unit) {
  return unit === 'fluid' || unit === 'custom'
}

/**
 * Checks if size units array includes fluid
 * @param {string[] | undefined} sizeUnits
 * @returns {boolean}
 */
export function hasFluidInUnits(sizeUnits) {
  return Array.isArray(sizeUnits) && sizeUnits.includes('fluid')
}

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
