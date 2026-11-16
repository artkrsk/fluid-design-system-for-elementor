import { PREFIX } from './ELEMENTOR'

/** Style element and CSS variable identifiers */
export const STYLES = {
  /** ID of injected style element in Elementor preview frame */
  STYLE_ID: `${PREFIX}-style`,

  /** Prefix for preset CSS custom properties (e.g., --arts-fluid-preset--{id}) */
  VAR_PREFIX: '--arts-fluid-preset--'
} as const

/** CSS vars the clamp() formula reads (must match CSSVariables.php) */
export const FORMULA = {
  /** Global min screen width, unitless */
  VAR_MIN_SCREEN_VALUE: '--arts-fluid-min-screen-value',

  /** Global max minus min screen width, unitless */
  VAR_SCREEN_DIFF: '--arts-fluid-screen-diff',

  /** 1 inside the typed-arithmetic @supports block, unset (0) elsewhere */
  VAR_TYPED: '--arts-fluid-typed',

  /** 100vw inside the typed-arithmetic @supports block, unset (0) elsewhere */
  VAR_VW: '--arts-fluid-vw',

  /** 1px inside the typed-arithmetic @supports block, unset (1) elsewhere */
  VAR_PX: '--arts-fluid-px'
} as const

/** Editor preview-resize identifiers for the fluid Min/Max preview switcher */
export const PREVIEW = {
  /** Editor wrapper element resized to simulate fluid min/max screen widths */
  WRAPPER_ID: 'elementor-preview-responsive-wrapper',

  /** Body class (editor document) that activates the width-override rule */
  ACTIVE_CLASS: 'arts-fluid-preview-active',

  /** CSS var (set on editor body) holding the active preview width */
  VAR_WIDTH: '--arts-fluid-preview-width',

  /** Global fluid anchor value vars on the preview :root (unitless numbers, match CSSVariables.php) */
  VAR_MIN_SCREEN_VALUE: '--arts-fluid-min-screen-value',
  VAR_MAX_SCREEN_VALUE: '--arts-fluid-max-screen-value',

  /** Fallback anchor widths in px (match FluidTypographySpacing defaults) */
  DEFAULT_MIN_WIDTH: 360,
  DEFAULT_MAX_WIDTH: 1920
} as const
