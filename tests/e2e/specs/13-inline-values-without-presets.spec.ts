/**
 * Inline fluid values on a Kit with no presets (Issue #75).
 *
 * An inline clamp divides by var(--arts-fluid-screen-diff). That var must come
 * from the always-printed breakpoint controls, not from the preset repeaters,
 * which Elementor skips entirely when they have no rows.
 */

import {
  calculateExpectedValue,
  emptyKitPresets,
  expect,
  getSpacerSelector,
  resetTestState,
  TEST_ELEMENT_IDS,
  TEST_PAGE_SLUG,
  TEST_VIEWPORTS,
  test
} from '../fixtures'

const TEST_PAGE_URL = `/${TEST_PAGE_SLUG}/`

/** Tolerance for computed value assertions (in pixels) */
const VALUE_TOLERANCE = 1

test.describe('Inline fluid values without presets', () => {
  test.beforeAll(() => {
    emptyKitPresets()
  })

  // Restore the seeded presets that the other specs depend on
  test.afterAll(() => {
    resetTestState()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE_URL)
    await page.waitForLoadState('load')
  })

  test('Kit CSS declares the screen range variable', async ({ page }) => {
    const screenDiff = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--arts-fluid-screen-diff')
    )

    expect(screenDiff.trim()).not.toBe('')
  })

  test('inline spacer height scales between its min and max', async ({ page }) => {
    const spacer = page.locator(getSpacerSelector(TEST_ELEMENT_IDS.spacerInline))
    const getHeight = () => spacer.evaluate((el) => parseFloat(getComputedStyle(el).height))

    // An invalid clamp collapses the spacer to 0
    await page.setViewportSize(TEST_VIEWPORTS.mobile)
    await expect.poll(getHeight).toBeCloseTo(40, VALUE_TOLERANCE)

    // Poll: the resize repaint lands asynchronously
    await page.setViewportSize(TEST_VIEWPORTS.midpoint)
    await expect
      .poll(getHeight)
      .toBeCloseTo(calculateExpectedValue(40, 180, TEST_VIEWPORTS.midpoint.width), VALUE_TOLERANCE)

    await page.setViewportSize(TEST_VIEWPORTS.desktop)
    await expect.poll(getHeight).toBeCloseTo(180, VALUE_TOLERANCE)
  })
})
