/** Supported CSS units for fluid values */
export const CSS_UNITS = ['px', 'rem', 'em', '%', 'vw', 'vh']

/** Regex pattern for parsing value with unit (e.g., "20px", "1.5rem") */
export const VALUE_WITH_UNIT_PATTERN = new RegExp(
  `^(-?[\\d.]+)\\s?(${CSS_UNITS.join('|')})?$`,
  'i'
)

/** Control name constants for fluid preset repeaters */
export const FLUID_REPEATER_CONTROLS = {
  SPACING: 'fluid_spacing_presets',
  TYPOGRAPHY: 'fluid_typography_presets'
}

/** Special value identifier for custom/inline fluid mode in dropdown */
export const CUSTOM_FLUID_VALUE = '__custom__'

/** UI default values */
export const UI_DEFAULTS = {
  /** Default placeholder text for inline min/max inputs */
  INLINE_INPUT_PLACEHOLDER: '0px'
}

/** UI timing constants (milliseconds) */
export const UI_TIMING = {
  /** Delay for Select2 dropdown render completion */
  DROPDOWN_RENDER_DELAY: 10,

  /** Delay before opening dialog after dropdown close (avoids conflicts) */
  DIALOG_OPEN_DELAY: 50
}

/** Select2 dropdown configuration constants */
export const SELECT2_CONFIG = {
  /** When set to -1, hides the search box in dropdown */
  HIDE_SEARCH_BOX: -1
}
