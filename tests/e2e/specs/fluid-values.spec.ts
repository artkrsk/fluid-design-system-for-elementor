/**
 * Fluid Value Computation Tests
 *
 * Tests that fluid presets compute to expected CSS values at various viewport widths.
 * Uses deterministic test presets seeded during global setup.
 */

import { test, expect } from '@playwright/test'
import {
  TEST_PAGE_SLUG,
  TEST_ELEMENT_IDS,
  TEST_VIEWPORTS,
  EXPECTED_VALUES,
  getCssVarName,
  calculateExpectedValue,
  getElementSelector,
  getHeadingTitleSelector,
  getSpacerSelector,
  getContainerSelector
} from '../fixtures/test-data'

const TEST_PAGE_URL = `/${TEST_PAGE_SLUG}/`

/** Tolerance for computed value assertions (in pixels) */
const VALUE_TOLERANCE = 1

test.describe('Fluid Typography Font Size', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE_URL)
    await page.waitForLoadState('load')
  })

  test('renders correct font-size at min viewport (360px)', async ({
    page
  }) => {
    await page.setViewportSize(TEST_VIEWPORTS.mobile)

    const heading = page.locator(getHeadingTitleSelector(TEST_ELEMENT_IDS.headingXl))
    await expect(heading).toBeVisible()

    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    expect(fontSize).toBeCloseTo(EXPECTED_VALUES.e2e_heading_xl[360], VALUE_TOLERANCE)
  })

  test('renders correct font-size at max viewport (1920px)', async ({
    page
  }) => {
    await page.setViewportSize(TEST_VIEWPORTS.desktop)

    const heading = page.locator(getHeadingTitleSelector(TEST_ELEMENT_IDS.headingXl))
    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    expect(fontSize).toBeCloseTo(EXPECTED_VALUES.e2e_heading_xl[1920], VALUE_TOLERANCE)
  })

  test('interpolates correctly at midpoint (1140px)', async ({ page }) => {
    await page.setViewportSize(TEST_VIEWPORTS.midpoint)

    const heading = page.locator(getHeadingTitleSelector(TEST_ELEMENT_IDS.headingXl))
    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    expect(fontSize).toBeCloseTo(EXPECTED_VALUES.e2e_heading_xl[1140], VALUE_TOLERANCE)
  })

  test('interpolates correctly at tablet (768px)', async ({ page }) => {
    await page.setViewportSize(TEST_VIEWPORTS.tablet)

    const heading = page.locator(getHeadingTitleSelector(TEST_ELEMENT_IDS.headingXl))
    const fontSize = await heading.evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    )

    // Calculate expected value dynamically
    const expected = calculateExpectedValue(24, 64, 768)
    expect(fontSize).toBeCloseTo(expected, VALUE_TOLERANCE)
  })

  test('CSS variable contains clamp formula', async ({ page }) => {
    await page.goto(TEST_PAGE_URL)

    const cssVarValue = await page.evaluate(() => {
      const style = document.documentElement.style
      return getComputedStyle(document.documentElement).getPropertyValue(
        '--arts-fluid-preset--e2e_heading_xl'
      )
    })

    // CSS variable should contain clamp() formula
    expect(cssVarValue.trim()).toMatch(/clamp\(/)
  })
})

test.describe('Fluid Spacing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE_URL)
    await page.waitForLoadState('load')
  })

  test('spacer height scales with viewport', async ({ page }) => {
    const spacer = page.locator(getSpacerSelector(TEST_ELEMENT_IDS.spacerStandard))

    // At min viewport
    await page.setViewportSize(TEST_VIEWPORTS.mobile)
    const heightMobile = await spacer.evaluate(
      el => parseFloat(getComputedStyle(el).height)
    )
    expect(heightMobile).toBeCloseTo(EXPECTED_VALUES.e2e_gap_standard[360], VALUE_TOLERANCE)

    // At max viewport
    await page.setViewportSize(TEST_VIEWPORTS.desktop)
    // Need to wait for repaint
    await page.waitForTimeout(100)
    const heightDesktop = await spacer.evaluate(
      el => parseFloat(getComputedStyle(el).height)
    )
    expect(heightDesktop).toBeCloseTo(EXPECTED_VALUES.e2e_gap_standard[1920], VALUE_TOLERANCE)
  })

  test('container gap scales with viewport', async ({ page }) => {
    const container = page.locator(getContainerSelector(TEST_ELEMENT_IDS.containerGap))

    // At min viewport
    await page.setViewportSize(TEST_VIEWPORTS.mobile)
    const gapMobile = await container.evaluate(
      el => parseFloat(getComputedStyle(el).gap)
    )
    expect(gapMobile).toBeCloseTo(EXPECTED_VALUES.e2e_gap_large[360], VALUE_TOLERANCE)

    // At max viewport
    await page.setViewportSize(TEST_VIEWPORTS.desktop)
    await page.waitForTimeout(100)
    const gapDesktop = await container.evaluate(
      el => parseFloat(getComputedStyle(el).gap)
    )
    expect(gapDesktop).toBeCloseTo(EXPECTED_VALUES.e2e_gap_large[1920], VALUE_TOLERANCE)
  })
})

test.describe('Viewport Transition', () => {
  test('values update smoothly as viewport changes', async ({ page }) => {
    await page.goto(TEST_PAGE_URL)

    const heading = page.locator(getHeadingTitleSelector(TEST_ELEMENT_IDS.headingXl))
    const viewportWidths = [360, 600, 900, 1200, 1500, 1920]
    const results: { width: number; fontSize: number; expected: number }[] = []

    for (const width of viewportWidths) {
      await page.setViewportSize({ width, height: 800 })
      await page.waitForTimeout(50) // Allow repaint

      const fontSize = await heading.evaluate(
        el => parseFloat(getComputedStyle(el).fontSize)
      )

      const expected = calculateExpectedValue(24, 64, width)
      results.push({ width, fontSize, expected })

      expect(fontSize).toBeCloseTo(expected, VALUE_TOLERANCE)
    }

    // Verify values are monotonically increasing
    for (let i = 1; i < results.length; i++) {
      expect(results[i].fontSize).toBeGreaterThan(results[i - 1].fontSize)
    }
  })
})

test.describe('Multiple Fluid Elements', () => {
  test('all fluid elements on page render correctly', async ({ page }) => {
    await page.setViewportSize(TEST_VIEWPORTS.midpoint)
    await page.goto(TEST_PAGE_URL)
    await page.waitForLoadState('load')

    // Check heading
    const heading = page.locator(getHeadingTitleSelector(TEST_ELEMENT_IDS.headingXl))
    await expect(heading).toBeVisible()

    // Check spacer
    const spacer = page.locator(getSpacerSelector(TEST_ELEMENT_IDS.spacerStandard))
    await expect(spacer).toBeVisible()

    // Check container
    const container = page.locator(getContainerSelector(TEST_ELEMENT_IDS.containerGap))
    await expect(container).toBeVisible()

    // Verify CSS variables are present in document
    const cssVars = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement)
      return {
        headingXl: style.getPropertyValue('--arts-fluid-preset--e2e_heading_xl'),
        gapStandard: style.getPropertyValue('--arts-fluid-preset--e2e_gap_standard'),
        gapLarge: style.getPropertyValue('--arts-fluid-preset--e2e_gap_large')
      }
    })

    expect(cssVars.headingXl).toBeTruthy()
    expect(cssVars.gapStandard).toBeTruthy()
    expect(cssVars.gapLarge).toBeTruthy()
  })
})
