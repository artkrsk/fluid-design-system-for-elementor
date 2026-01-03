/** WordPress AJAX action identifiers */
export const AJAX_ACTIONS = {
  /** Fetch all fluid presets from database */
  FETCH_PRESETS: 'arts_fluid_design_system_presets',

  /** Save a new fluid preset to database */
  SAVE_PRESET: 'arts_fluid_design_system_save_preset',

  /** Fetch preset group metadata */
  GET_GROUPS: 'arts_fluid_design_system_get_groups'
}

/** Default AJAX request parameters */
export const AJAX_DEFAULTS = {
  /** Default search data for preset fetching */
  FETCH_PRESETS: { search: '' }
}
