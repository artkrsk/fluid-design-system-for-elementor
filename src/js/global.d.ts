import type { DataManager } from './managers/DataManager'
import type { ElementorEditor, ElementorCommon, $e } from '@arts/elementor-types'

/** Localized strings for the Fluid Design System */
interface IArtsFluidDSStrings {
  inherit?: string
  customValue?: string
  saveAsPreset?: string
  createNewPreset?: string
  editPreset?: string
  editPresetMessage?: string
  presetName?: string
  spacingPresets?: string
  typographyPresets?: string
  addPreset?: string
  newPreset?: string
  deleteFluidPreset?: string
  deletePresetMessage?: string
  saveChanges?: string
  saveChangesMessage?: string
  error?: string
  failedToSave?: string
  create?: string
  save?: string
  cancel?: string
  discard?: string
  delete?: string
}

/** Global Fluid Design System namespace */
interface IArtsFluidDesignSystem {
  dataManager: DataManager
}

declare global {
  interface Window {
    /** Elementor command system (available after elementor/init-components) */
    $e?: $e
    /** Elementor editor instance (available after elementor/init) */
    elementor?: ElementorEditor
    /** Elementor common utilities (available after elementor/init) */
    elementorCommon?: ElementorCommon
    /** Underscore.js */
    _?: typeof import('underscore')
    /** Localized strings (initialized by wp_localize_script) */
    ArtsFluidDSStrings?: IArtsFluidDSStrings
    /** Plugin namespace (initialized in index.js) */
    artsFluidDesignSystem: IArtsFluidDesignSystem
  }
}

export {}
