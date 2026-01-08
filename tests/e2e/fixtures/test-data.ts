/**
 * E2E Test Data Definitions
 *
 * Defines test presets with known values and calculable expected results.
 * These presets are seeded via setup-presets.php during global setup.
 */

/** Preset item structure matching PHP/Kit storage format */
export interface TestPreset {
  _id: string
  title: string
  min: { size: number; unit: string }
  max: { size: number; unit: string }
  override_screen_width_enabled?: string
  overriden_min_screen_width?: number
  overriden_max_screen_width?: number
}

/** Test presets organized by control ID */
export const TEST_PRESETS: Record<string, TestPreset[]> = {
  fluid_typography_presets: [
    {
      _id: 'e2e_heading_xl',
      title: 'E2E Heading XL',
      min: { size: 24, unit: 'px' },
      max: { size: 64, unit: 'px' }
    },
    {
      _id: 'e2e_body_text',
      title: 'E2E Body Text',
      min: { size: 14, unit: 'px' },
      max: { size: 18, unit: 'px' }
    },
    {
      _id: 'e2e_negative_margin',
      title: 'E2E Negative Margin',
      min: { size: -20, unit: 'px' },
      max: { size: -80, unit: 'px' }
    },
    {
      _id: 'e2e_inverted',
      title: 'E2E Inverted (min > max)',
      min: { size: 80, unit: 'px' },
      max: { size: 20, unit: 'px' }
    },
    {
      _id: 'e2e_rem_units',
      title: 'E2E REM Units',
      min: { size: 1, unit: 'rem' },
      max: { size: 3, unit: 'rem' }
    },
    {
      _id: 'e2e_static_value',
      title: 'E2E Static (min = max)',
      min: { size: 20, unit: 'px' },
      max: { size: 20, unit: 'px' }
    }
  ],
  fluid_spacing_presets: [
    {
      _id: 'e2e_gap_standard',
      title: 'E2E Gap Standard',
      min: { size: 16, unit: 'px' },
      max: { size: 48, unit: 'px' }
    },
    {
      _id: 'e2e_gap_large',
      title: 'E2E Gap Large',
      min: { size: 32, unit: 'px' },
      max: { size: 120, unit: 'px' }
    }
  ],
  fluid_custom_e2e_test_group_presets: [
    {
      _id: 'e2e_custom_breakpoints',
      title: 'E2E Custom Breakpoints',
      min: { size: 10, unit: 'px' },
      max: { size: 100, unit: 'px' },
      override_screen_width_enabled: 'yes',
      overriden_min_screen_width: 400,
      overriden_max_screen_width: 1600
    }
  ]
}

/** Custom group definitions for wp_options */
export const TEST_CUSTOM_GROUPS = {
  e2e_test_group: {
    name: 'E2E Test Group',
    description: 'Custom group for E2E testing',
    order: 100
  }
}

/** Default and custom breakpoint configurations */
export const TEST_BREAKPOINTS = {
  default: { min: 360, max: 1920 },
  custom: { min: 400, max: 1600 }
}

/**
 * Calculate expected fluid value at a given viewport width.
 *
 * Formula: min + (max - min) * ((viewport - minScreen) / (maxScreen - minScreen))
 * Clamped to [min(minVal, maxVal), max(minVal, maxVal)] for inverted cases.
 */
export function calculateExpectedValue(
  minVal: number,
  maxVal: number,
  viewport: number,
  minScreen: number = TEST_BREAKPOINTS.default.min,
  maxScreen: number = TEST_BREAKPOINTS.default.max
): number {
  // Clamp viewport to breakpoint range
  if (viewport <= minScreen) {
    return minVal
  }
  if (viewport >= maxScreen) {
    return maxVal
  }

  // Linear interpolation
  const progress = (viewport - minScreen) / (maxScreen - minScreen)
  const interpolated = minVal + (maxVal - minVal) * progress

  // Apply clamp bounds (handles inverted min/max)
  const lowerBound = Math.min(minVal, maxVal)
  const upperBound = Math.max(minVal, maxVal)

  return Math.max(lowerBound, Math.min(upperBound, interpolated))
}

/** Pre-calculated expected values for common viewports */
export const EXPECTED_VALUES: Record<string, Record<number, number>> = {
  e2e_heading_xl: {
    360: 24, // min value at min viewport
    1920: 64, // max value at max viewport
    1140: 44, // midpoint: 24 + (64-24) * 0.5 = 44
    768: 34.3 // tablet: 24 + (64-24) * ((768-360)/(1920-360)) ≈ 34.3
  },
  e2e_body_text: {
    360: 14,
    1920: 18,
    1140: 16, // midpoint
    768: 15.0 // tablet
  },
  e2e_negative_margin: {
    360: -20, // min value (less negative)
    1920: -80, // max value (more negative)
    1140: -50 // midpoint
  },
  e2e_inverted: {
    // min (80) > max (20), so clamp handles it
    360: 80, // at min viewport, value is min (80)
    1920: 20, // at max viewport, value is max (20)
    1140: 50 // midpoint: still interpolates linearly within clamp bounds
  },
  e2e_gap_standard: {
    360: 16,
    1920: 48,
    1140: 32
  },
  e2e_gap_large: {
    360: 32,
    1920: 120,
    1140: 76
  },
  e2e_custom_breakpoints: {
    // Uses custom breakpoints: 400-1600
    400: 10, // min at custom min
    1600: 100, // max at custom max
    1000: 55, // midpoint: 10 + (100-10) * 0.5 = 55
    360: 10, // below min, clamped to min value
    1920: 100 // above max, clamped to max value
  }
}

/** CSS variable name for a preset */
export function getCssVarName(presetId: string): string {
  return `--arts-fluid-preset--${presetId}`
}

/** Test page slug */
export const TEST_PAGE_SLUG = 'e2e-fluid-test'

/** Element IDs used in test page for easy selection.
 * These map to HTML `id` attributes (from Elementor's _element_id setting).
 * Use as CSS selectors: `#${TEST_ELEMENT_IDS.headingXl}`
 */
export const TEST_ELEMENT_IDS = {
  headingXl: 'e2e-heading-xl',
  headingInverted: 'e2e-heading-inverted',
  containerNegative: 'e2e-container-negative', // Separate container for negative margin (not in flex)
  spacerStandard: 'e2e-spacer-standard',
  containerGap: 'e2e-container-gap',
  buttonDimensions: 'e2e-button-dimensions',
  customBreakpoint: 'e2e-custom-breakpoint'
}

/** Get CSS selector for element ID */
export function getElementSelector(id: string): string {
  return `#${id}`
}

/** Get CSS selector for the heading title inside an element */
export function getHeadingTitleSelector(id: string): string {
  return `#${id} .elementor-heading-title`
}

/** Get CSS selector for the spacer element inside */
export function getSpacerSelector(id: string): string {
  return `#${id} .elementor-spacer-inner`
}

/** Get CSS selector for container gap element */
export function getContainerSelector(id: string): string {
  return `#${id} > .e-con-inner`
}

/** Viewport presets for testing */
export const TEST_VIEWPORTS = {
  mobile: { width: 360, height: 640 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  midpoint: { width: 1140, height: 900 }
}
