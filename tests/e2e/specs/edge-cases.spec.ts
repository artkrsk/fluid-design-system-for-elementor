/**
 * Edge Case Tests
 *
 * Tests unusual but valid configurations:
 * - Negative values
 * - Inverted min/max (min > max)
 * - Custom breakpoints
 * - Values outside breakpoint range
 */

import { test, expect } from '@playwright/test'
import {
  TEST_PAGE_SLUG,
  TEST_ELEMENT_IDS,
  TEST_VIEWPORTS,
  EXPECTED_VALUES,
  TEST_BREAKPOINTS,
  calculateExpectedValue,
  getElementSelector,
  getHeadingTitleSelector
} from '../fixtures/test-data'

const TEST_PAGE_URL = `/${TEST_PAGE_SLUG}/`

/** Tolerance for computed value assertions (in pixels) */
const VALUE_TOLERANCE = 1

test.describe('Inverted Min/Max (min > max)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE_URL)
    await page.waitForLoadState('load')
  })

  test('clamps correctly when min > max at small viewport', async ({
    page
  }) => {
    await page.setViewportSize(TEST_VIEWPORTS.mobile)

    const heading = page.locator(
      getHeadingTitleSelector(TEST_ELEMENT_IDS.headingInverted)
    )
    await expect(heading).toBeVisible()

    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // At 360px with preset (min: 80, max: 20), value should be 80
    expect(fontSize).toBeCloseTo(EXPECTED_VALUES.e2e_inverted[360], VALUE_TOLERANCE)
  })

  test('clamps correctly when min > max at large viewport', async ({
    page
  }) => {
    await page.setViewportSize(TEST_VIEWPORTS.desktop)

    const heading = page.locator(
      getHeadingTitleSelector(TEST_ELEMENT_IDS.headingInverted)
    )
    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // At 1920px with preset (min: 80, max: 20), value should be 20
    expect(fontSize).toBeCloseTo(EXPECTED_VALUES.e2e_inverted[1920], VALUE_TOLERANCE)
  })

  test('interpolates correctly between inverted values', async ({ page }) => {
    await page.setViewportSize(TEST_VIEWPORTS.midpoint)

    const heading = page.locator(
      getHeadingTitleSelector(TEST_ELEMENT_IDS.headingInverted)
    )
    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // At midpoint, should be 50 (halfway between 80 and 20)
    expect(fontSize).toBeCloseTo(EXPECTED_VALUES.e2e_inverted[1140], VALUE_TOLERANCE)
  })

  test('values decrease as viewport increases (inverted scaling)', async ({
    page
  }) => {
    const heading = page.locator(
      getHeadingTitleSelector(TEST_ELEMENT_IDS.headingInverted)
    )

    await page.goto(TEST_PAGE_URL)
    await page.waitForLoadState('load')

    // At small viewport
    await page.setViewportSize(TEST_VIEWPORTS.mobile)
    const smallValue = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // At large viewport
    await page.setViewportSize(TEST_VIEWPORTS.desktop)
    await page.waitForTimeout(100)
    const largeValue = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // Value should DECREASE as viewport increases (inverted behavior)
    expect(smallValue).toBeGreaterThan(largeValue)
  })
})

test.describe('Custom Breakpoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE_URL)
    await page.waitForLoadState('load')
  })

  test('respects custom min breakpoint', async ({ page }) => {
    // Custom preset uses 400px as min breakpoint
    await page.setViewportSize({ width: 400, height: 800 })

    const heading = page.locator(
      getHeadingTitleSelector(TEST_ELEMENT_IDS.customBreakpoint)
    )
    await expect(heading).toBeVisible()

    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // At custom min (400px), value should be 10px
    expect(fontSize).toBeCloseTo(
      EXPECTED_VALUES.e2e_custom_breakpoints[400],
      VALUE_TOLERANCE
    )
  })

  test('respects custom max breakpoint', async ({ page }) => {
    // Custom preset uses 1600px as max breakpoint
    await page.setViewportSize({ width: 1600, height: 800 })

    const heading = page.locator(
      getHeadingTitleSelector(TEST_ELEMENT_IDS.customBreakpoint)
    )
    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // At custom max (1600px), value should be 100px
    expect(fontSize).toBeCloseTo(
      EXPECTED_VALUES.e2e_custom_breakpoints[1600],
      VALUE_TOLERANCE
    )
  })

  test('interpolates within custom range', async ({ page }) => {
    // Custom midpoint: (400 + 1600) / 2 = 1000
    await page.setViewportSize({ width: 1000, height: 800 })

    const heading = page.locator(
      getHeadingTitleSelector(TEST_ELEMENT_IDS.customBreakpoint)
    )
    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // At midpoint of custom range, should be 55px
    expect(fontSize).toBeCloseTo(
      EXPECTED_VALUES.e2e_custom_breakpoints[1000],
      VALUE_TOLERANCE
    )
  })

  test('clamps to min value below custom min breakpoint', async ({ page }) => {
    // Below custom min (400px)
    await page.setViewportSize({ width: 360, height: 800 })

    const heading = page.locator(
      getHeadingTitleSelector(TEST_ELEMENT_IDS.customBreakpoint)
    )
    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // Below custom min, should clamp to min value (10px)
    expect(fontSize).toBeCloseTo(
      EXPECTED_VALUES.e2e_custom_breakpoints[360],
      VALUE_TOLERANCE
    )
  })

  test('clamps to max value above custom max breakpoint', async ({ page }) => {
    // Above custom max (1600px)
    await page.setViewportSize({ width: 1920, height: 800 })

    const heading = page.locator(
      getHeadingTitleSelector(TEST_ELEMENT_IDS.customBreakpoint)
    )
    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // Above custom max, should clamp to max value (100px)
    expect(fontSize).toBeCloseTo(
      EXPECTED_VALUES.e2e_custom_breakpoints[1920],
      VALUE_TOLERANCE
    )
  })
})

test.describe('Extreme Viewports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE_URL)
    await page.waitForLoadState('load')
  })

  test('handles viewport smaller than min breakpoint', async ({ page }) => {
    // Very small viewport (below 360px min)
    await page.setViewportSize({ width: 320, height: 568 })

    const heading = page.locator(getHeadingTitleSelector(TEST_ELEMENT_IDS.headingXl))
    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // Should clamp to min value
    expect(fontSize).toBeCloseTo(24, VALUE_TOLERANCE)
  })

  test('handles viewport larger than max breakpoint', async ({ page }) => {
    // Very large viewport (above 1920px max)
    await page.setViewportSize({ width: 2560, height: 1440 })

    const heading = page.locator(getHeadingTitleSelector(TEST_ELEMENT_IDS.headingXl))
    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // Should clamp to max value
    expect(fontSize).toBeCloseTo(64, VALUE_TOLERANCE)
  })
})

/**
 * CSS Variable Verification tests check that preset formulas are generated correctly.
 * This provides a safety net for formula modifications (e.g., rem unit support).
 * Two-layer verification:
 * 1. :root CSS variables → Proves plugin generated formula correctly
 * 2. getComputedStyle → Proves it renders as expected (tested elsewhere)
 */
test.describe('CSS Variable Presence', () => {
  test('all test CSS variables are defined in :root', async ({ page }) => {
    await page.goto(TEST_PAGE_URL)

    const cssVars = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement)
      return {
        headingXl: style.getPropertyValue('--arts-fluid-preset--e2e_heading_xl'),
        inverted: style.getPropertyValue('--arts-fluid-preset--e2e_inverted'),
        negative: style.getPropertyValue('--arts-fluid-preset--e2e_negative_margin'),
        gapStandard: style.getPropertyValue('--arts-fluid-preset--e2e_gap_standard'),
        gapLarge: style.getPropertyValue('--arts-fluid-preset--e2e_gap_large'),
        customBreakpoints: style.getPropertyValue(
          '--arts-fluid-preset--e2e_custom_breakpoints'
        )
      }
    })

    // All variables should be defined (non-empty)
    expect(cssVars.headingXl).toBeTruthy()
    expect(cssVars.inverted).toBeTruthy()
    expect(cssVars.negative).toBeTruthy()
    expect(cssVars.gapStandard).toBeTruthy()
    expect(cssVars.gapLarge).toBeTruthy()
    expect(cssVars.customBreakpoints).toBeTruthy()
  })

  test('CSS variables contain valid clamp formulas', async ({ page }) => {
    await page.goto(TEST_PAGE_URL)

    const cssVars = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement)
      return {
        headingXl: style.getPropertyValue('--arts-fluid-preset--e2e_heading_xl'),
        gapStandard: style.getPropertyValue('--arts-fluid-preset--e2e_gap_standard')
      }
    })

    // Variables should contain clamp() function
    const clampRegex = /clamp\([^)]+\)/
    expect(cssVars.headingXl).toMatch(clampRegex)
    expect(cssVars.gapStandard).toMatch(clampRegex)
  })
})

/**
 * CSS Formula Structure tests verify the clamp() formula components.
 * These tests ensure the formula generation remains correct after modifications.
 */
test.describe('CSS Formula Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE_URL)
    await page.waitForLoadState('load')
  })

  test('e2e_heading_xl formula contains correct min/max values', async ({
    page
  }) => {
    const cssVar = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue(
        '--arts-fluid-preset--e2e_heading_xl'
      )
    })

    // Formula should contain 24px (min) and 64px (max)
    expect(cssVar).toContain('24px')
    expect(cssVar).toContain('64px')
    expect(cssVar).toMatch(/clamp\(/)
  })

  test('e2e_negative_margin formula contains negative values', async ({
    page
  }) => {
    const cssVar = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue(
        '--arts-fluid-preset--e2e_negative_margin'
      )
    })

    // Formula should contain -20px (min) and -80px (max)
    expect(cssVar).toContain('-20px')
    expect(cssVar).toContain('-80px')
    expect(cssVar).toMatch(/clamp\(/)
  })

  test('e2e_inverted formula handles min > max correctly', async ({ page }) => {
    const cssVar = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue(
        '--arts-fluid-preset--e2e_inverted'
      )
    })

    // Formula should contain 80px and 20px (inverted: min=80, max=20)
    expect(cssVar).toContain('80px')
    expect(cssVar).toContain('20px')
    expect(cssVar).toMatch(/clamp\(/)
  })

  test('e2e_custom_breakpoints formula uses custom screen widths', async ({
    page
  }) => {
    const cssVar = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue(
        '--arts-fluid-preset--e2e_custom_breakpoints'
      )
    })

    // Formula should contain 10px (min) and 100px (max)
    expect(cssVar).toContain('10px')
    expect(cssVar).toContain('100px')
    expect(cssVar).toMatch(/clamp\(/)
    // Custom breakpoints should affect the calc() portion
    // The formula will reference custom min/max screen widths (400/1600)
  })

  test('e2e_rem_units formula contains rem values', async ({ page }) => {
    const cssVar = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue(
        '--arts-fluid-preset--e2e_rem_units'
      )
    })

    // Formula should contain 1rem (min) and 3rem (max)
    expect(cssVar).toContain('1rem')
    expect(cssVar).toContain('3rem')
    expect(cssVar).toMatch(/clamp\(/)
    // REM units are preserved in the formula (not converted to px)
  })

  test('e2e_static_value formula simplifies when min equals max', async ({
    page
  }) => {
    const cssVar = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue(
        '--arts-fluid-preset--e2e_static_value'
      )
    })

    // When min = max (20px), the plugin optimizes the formula to just "20px"
    // instead of the full clamp(20px, calc(...), 20px)
    expect(cssVar.trim()).toBe('20px')
  })

  test('all formulas use clamp with three arguments', async ({ page }) => {
    const cssVars = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement)
      return {
        headingXl: style.getPropertyValue('--arts-fluid-preset--e2e_heading_xl'),
        inverted: style.getPropertyValue('--arts-fluid-preset--e2e_inverted'),
        negative: style.getPropertyValue(
          '--arts-fluid-preset--e2e_negative_margin'
        ),
        gapStandard: style.getPropertyValue(
          '--arts-fluid-preset--e2e_gap_standard'
        ),
        gapLarge: style.getPropertyValue('--arts-fluid-preset--e2e_gap_large'),
        customBreakpoints: style.getPropertyValue(
          '--arts-fluid-preset--e2e_custom_breakpoints'
        ),
        remUnits: style.getPropertyValue('--arts-fluid-preset--e2e_rem_units')
      }
    })

    // Verify clamp structure: clamp(min(...), calc(...), max(...))
    // The plugin uses min()/max() wrappers to handle inverted values correctly
    // Using component checks since nested parentheses make full regex complex
    for (const [name, value] of Object.entries(cssVars)) {
      const trimmed = value.trim()
      expect(trimmed, `${name} should start with clamp(`).toMatch(/^clamp\(/)
      expect(trimmed, `${name} should contain min() wrapper`).toMatch(/min\([^)]+\)/)
      expect(trimmed, `${name} should contain calc()`).toContain('calc(')
      expect(trimmed, `${name} should contain max() wrapper`).toMatch(/max\([^)]+\)/)
      expect(trimmed, `${name} should end with )`).toMatch(/\)$/)
    }
  })
})
