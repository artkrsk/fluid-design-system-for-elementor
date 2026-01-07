import type { ElementorEditor, ElementorCommon, $e } from '@arts/elementor-types'
import type { IArtsFluidDSStrings, IArtsFluidDesignSystem } from './interfaces'

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
    /** Plugin namespace (initialized in index.ts) */
    artsFluidDesignSystem: IArtsFluidDesignSystem
  }
}

export {}
