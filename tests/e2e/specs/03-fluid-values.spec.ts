/**
 * Fluid Value Computation Tests
 *
 * Tests that fluid presets compute to expected CSS values at various viewport widths.
 * Uses deterministic test presets seeded during global setup.
 */

import type { Page } from '@playwright/test'
import { generateClampFormula } from '@ts/utils/clamp'
import {
  calculateExpectedValue,
  calculateFluidValue,
  calculatePresetValue,
  expect,
  getContainerSelector,
  getExpectedValue,
  getHeadingTitleSelector,
  getSpacerSelector,
  TEST_ELEMENT_IDS,
  TEST_PAGE_SLUG,
  TEST_VIEWPORTS,
  TYPED_ARITHMETIC_QUERY,
  test
} from '../fixtures'

const TEST_PAGE_URL = `/${TEST_PAGE_SLUG}/`

/** Tolerance for computed value assertions (in pixels) */
const VALUE_TOLERANCE = 1

test.describe('Fluid Typography Font Size', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE_URL)
    await page.waitForLoadState('load')
  })

  test('renders correct font-size at min viewport (360px)', async ({ page }) => {
    await page.setViewportSize(TEST_VIEWPORTS.mobile)

    const heading = page.locator(getHeadingTitleSelector(TEST_ELEMENT_IDS.headingXl))
    await expect(heading).toBeVisible()

    const fontSize = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))

    expect(fontSize).toBeCloseTo(getExpectedValue('e2e_heading_xl', 360), VALUE_TOLERANCE)
  })

  test('renders correct font-size at max viewport (1920px)', async ({ page }) => {
    await page.setViewportSize(TEST_VIEWPORTS.desktop)

    const heading = page.locator(getHeadingTitleSelector(TEST_ELEMENT_IDS.headingXl))
    const fontSize = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))

    expect(fontSize).toBeCloseTo(getExpectedValue('e2e_heading_xl', 1920), VALUE_TOLERANCE)
  })

  test('interpolates correctly at midpoint (1140px)', async ({ page }) => {
    await page.setViewportSize(TEST_VIEWPORTS.midpoint)

    const heading = page.locator(getHeadingTitleSelector(TEST_ELEMENT_IDS.headingXl))
    const fontSize = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))

    expect(fontSize).toBeCloseTo(getExpectedValue('e2e_heading_xl', 1140), VALUE_TOLERANCE)
  })

  test('interpolates correctly at tablet (768px)', async ({ page }) => {
    await page.setViewportSize(TEST_VIEWPORTS.tablet)

    const heading = page.locator(getHeadingTitleSelector(TEST_ELEMENT_IDS.headingXl))
    const fontSize = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))

    // Calculate expected value dynamically
    const expected = calculateExpectedValue(24, 64, 768)
    expect(fontSize).toBeCloseTo(expected, VALUE_TOLERANCE)
  })

  test('CSS variable contains clamp formula', async ({ page }) => {
    await page.goto(TEST_PAGE_URL)

    const cssVarValue = await page.evaluate(() => {
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
    const heightMobile = await spacer.evaluate((el) => parseFloat(getComputedStyle(el).height))
    expect(heightMobile).toBeCloseTo(getExpectedValue('e2e_gap_standard', 360), VALUE_TOLERANCE)

    // At max viewport (poll: the resize repaint lands asynchronously)
    await page.setViewportSize(TEST_VIEWPORTS.desktop)
    await expect
      .poll(() => spacer.evaluate((el) => parseFloat(getComputedStyle(el).height)))
      .toBeCloseTo(getExpectedValue('e2e_gap_standard', 1920), VALUE_TOLERANCE)
  })

  test('container gap scales with viewport', async ({ page }) => {
    const container = page.locator(getContainerSelector(TEST_ELEMENT_IDS.containerGap))

    // At min viewport
    await page.setViewportSize(TEST_VIEWPORTS.mobile)
    const gapMobile = await container.evaluate((el) => parseFloat(getComputedStyle(el).gap))
    expect(gapMobile).toBeCloseTo(getExpectedValue('e2e_gap_large', 360), VALUE_TOLERANCE)

    // At max viewport (poll: the resize repaint lands asynchronously)
    await page.setViewportSize(TEST_VIEWPORTS.desktop)
    await expect
      .poll(() => container.evaluate((el) => parseFloat(getComputedStyle(el).gap)))
      .toBeCloseTo(getExpectedValue('e2e_gap_large', 1920), VALUE_TOLERANCE)
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

      // Poll until the resize repaint settles on the expected value, then
      // record the settled reading for the monotonicity check below
      const expected = calculateExpectedValue(24, 64, width)
      await expect
        .poll(() => heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)))
        .toBeCloseTo(expected, VALUE_TOLERANCE)

      const fontSize = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
      results.push({ width, fontSize, expected })
    }

    // Verify values are monotonically increasing
    for (let i = 1; i < results.length; i++) {
      // Loop bounds guarantee both entries exist.
      const current = results[i]!
      const previous = results[i - 1]!
      expect(current.fontSize).toBeGreaterThan(previous.fontSize)
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

/** Viewport widths for the unit-aware checks */
const UNIT_VIEWPORTS = [360, 768, 1140, 1920]

/** Computed px of a CSS property on the first element matching `selector` */
const readPx = (page: Page, selector: string, property: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el, prop) => parseFloat(getComputedStyle(el).getPropertyValue(prop)), property)

/** What rem resolves against on the test page */
const readRootFontSize = (page: Page) =>
  page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))

test.describe('Unit-aware interpolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE_URL)
    await page.waitForLoadState('load')
  })

  test('the @supports block switches the formula exactly where the engine has typed arithmetic', async ({
    page,
    typedArithmetic
  }) => {
    const { inlineCss, typedVar } = await page.evaluate(() => ({
      inlineCss: document.getElementById('elementor-frontend-inline-css')?.textContent ?? '',
      typedVar: getComputedStyle(document.documentElement)
        .getPropertyValue('--arts-fluid-typed')
        .trim()
    }))

    expect(inlineCss).toContain(`@supports (width: ${TYPED_ARITHMETIC_QUERY})`)
    expect(typedVar).toBe(typedArithmetic ? '1' : '')
  })

  test('px to rem font size with an em line height', async ({ page, typedArithmetic }) => {
    const title = getHeadingTitleSelector(TEST_ELEMENT_IDS.headingUnits)

    for (const width of UNIT_VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 })
      const root = await readRootFontSize(page)

      await expect
        .poll(() => readPx(page, title, 'font-size'), { message: `font-size at ${width}px` })
        .toBeCloseTo(calculatePresetValue('e2e_mixed_units', width, typedArithmetic, root), 0)

      // em resolves against the element's own (fluid) font size
      const fontSize = await readPx(page, title, 'font-size')
      expect(await readPx(page, title, 'line-height'), `line-height at ${width}px`).toBeCloseTo(
        calculatePresetValue('e2e_em_line_height', width, typedArithmetic, root, fontSize),
        0
      )
    }
  })

  test('rem to px font size (inverted)', async ({ page, typedArithmetic }) => {
    const title = getHeadingTitleSelector(TEST_ELEMENT_IDS.headingMixedInverted)

    for (const width of UNIT_VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 })
      const root = await readRootFontSize(page)

      await expect
        .poll(() => readPx(page, title, 'font-size'), { message: `font-size at ${width}px` })
        .toBeCloseTo(calculatePresetValue('e2e_mixed_inverted', width, typedArithmetic, root), 0)
    }
  })

  test('rem preset with custom screen widths', async ({ page, typedArithmetic }) => {
    const title = getHeadingTitleSelector(TEST_ELEMENT_IDS.customBreakpointRem)

    for (const width of [360, 400, 1000, 1600, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      const root = await readRootFontSize(page)

      await expect
        .poll(() => readPx(page, title, 'font-size'), { message: `font-size at ${width}px` })
        .toBeCloseTo(
          calculatePresetValue('e2e_custom_breakpoints_rem', width, typedArithmetic, root),
          0
        )
    }
  })

  test('inline rem value', async ({ page, typedArithmetic }) => {
    const spacer = getSpacerSelector(TEST_ELEMENT_IDS.spacerInlineRem)

    for (const width of UNIT_VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 })
      const root = await readRootFontSize(page)

      await expect
        .poll(() => readPx(page, spacer, 'height'), { message: `height at ${width}px` })
        .toBeCloseTo(calculateFluidValue(2 * root, 10 * root, 2, 10, width, typedArithmetic), 0)
    }
  })

  // Saved content keeps its stored formula until re-edited, so it must render as it always did
  test('inline rem value saved in the previous formula shape keeps its px-only result', async ({
    page
  }) => {
    const spacer = getSpacerSelector(TEST_ELEMENT_IDS.spacerInlineLegacy)

    for (const width of UNIT_VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 })
      const root = await readRootFontSize(page)

      await expect
        .poll(() => readPx(page, spacer, 'height'), { message: `height at ${width}px` })
        .toBeCloseTo(calculateFluidValue(2 * root, 10 * root, 2, 10, width, false), 0)
    }
  })
})

/** Stored [size, unit] of one end of an inline fluid value */
type TStoredSize = readonly [number | string, string]

/** One inline fluid value applied to one CSS property */
interface IUnitCase {
  property: string
  min: TStoredSize
  max: TStoredSize
}

/** Probe geometry: em in font-size resolves against the stage, other em/% against the case element */
const MATRIX = {
  STAGE_ID: 'e2e-unit-matrix',
  STAGE_WIDTH: 1000,
  STAGE_FONT_SIZE: 20,
  CASE_FONT_SIZE: 100,
  VIEWPORT_HEIGHT: 600,
  VIEWPORTS: [300, 360, 768, 1140, 1920, 2400]
} as const

/** Every px/rem/em/%/vw/vh pair both ways, plus edge values across typographic properties */
function buildUnitCases(): IUnitCase[] {
  const ends: Record<string, [number, number]> = {
    px: [20, 120],
    rem: [1, 3],
    em: [0.5, 2],
    '%': [10, 50],
    vw: [2, 8],
    vh: [5, 20]
  }
  const units = Object.keys(ends)
  const cases: IUnitCase[] = []

  for (const minUnit of units) {
    for (const maxUnit of units) {
      const [minLow, minHigh] = ends[minUnit] as [number, number]
      const [maxLow, maxHigh] = ends[maxUnit] as [number, number]
      cases.push({ property: 'width', min: [minLow, minUnit], max: [maxHigh, maxUnit] })
      cases.push({ property: 'width', min: [minHigh, minUnit], max: [maxLow, maxUnit] })
    }
  }

  const edges: [string, TStoredSize, TStoredSize][] = [
    ['font-size', [1, 'rem'], [3, 'rem']],
    ['font-size', [1, 'em'], [3, 'em']],
    ['font-size', [100, '%'], [300, '%']],
    ['font-size', [16, 'px'], [3, 'rem']],
    ['font-size', [3, 'rem'], [16, 'px']],
    ['font-size', [2, 'em'], [40, 'px']],
    ['line-height', ['1.0', 'em'], ['0.9', 'em']],
    ['line-height', [120, '%'], [90, '%']],
    ['line-height', [32, 'px'], [129.6, 'px']],
    ['line-height', [1.2, 'em'], [40, 'px']],
    ['letter-spacing', [-0.02, 'em'], [0.05, 'em']],
    ['letter-spacing', [-1, 'px'], [0.1, 'rem']],
    ['margin-left', [-20, 'px'], [20, 'px']],
    ['margin-left', [-2, 'rem'], [-5, 'rem']],
    ['margin-left', [-1, 'rem'], [30, 'px']],
    ['width', [0, 'px'], [0, 'px']],
    ['width', [0, 'px'], [2, 'rem']],
    ['width', [16, 'px'], [1, 'rem']],
    ['width', ['.5', 'rem'], ['1.5', 'rem']],
    ['width', [0.875, 'rem'], [1.3125, 'rem']],
    ['width', [0, 'px'], [10000, 'px']],
    ['width', [1, 'rem'], [1, 'rem']],
    ['width', [2, 'em'], [2, 'em']],
    ['border-top-left-radius', [2, 'px'], [2, 'rem']]
  ]
  for (const [property, min, max] of edges) {
    cases.push({ property, min, max })
  }

  return cases
}

/** Px value of one stored end, as the browser resolves it for that property in the probe */
function resolveStoredSize(
  [rawSize, unit]: TStoredSize,
  property: string,
  viewport: number,
  rootFontSize: number
): number {
  const size = Number(rawSize)

  switch (unit) {
    case 'rem':
      return size * rootFontSize
    case 'em':
      return size * (property === 'font-size' ? MATRIX.STAGE_FONT_SIZE : MATRIX.CASE_FONT_SIZE)
    case '%':
      if (property === 'font-size') {
        return (size / 100) * MATRIX.STAGE_FONT_SIZE
      }
      if (property === 'line-height') {
        return (size / 100) * MATRIX.CASE_FONT_SIZE
      }
      return (size / 100) * MATRIX.STAGE_WIDTH
    case 'vw':
      return (size / 100) * viewport
    case 'vh':
      return (size / 100) * MATRIX.VIEWPORT_HEIGHT
    default:
      return size
  }
}

/** Cases whose computed value doesn't match the expected path at this viewport width */
async function findUnitMismatches(
  page: Page,
  cases: IUnitCase[],
  viewport: number,
  typed: boolean
): Promise<string[]> {
  const { root, values } = await page.evaluate(
    (properties) => ({
      root: parseFloat(getComputedStyle(document.documentElement).fontSize),
      values: properties.map((property, index) =>
        getComputedStyle(
          document.getElementById(`e2e-unit-case-${index}`) as HTMLElement
        ).getPropertyValue(property)
      )
    }),
    cases.map((unitCase) => unitCase.property)
  )

  return cases.flatMap((unitCase, index) => {
    const minPx = resolveStoredSize(unitCase.min, unitCase.property, viewport, root)
    const maxPx = resolveStoredSize(unitCase.max, unitCase.property, viewport, root)
    const expected = calculateFluidValue(
      minPx,
      maxPx,
      Number(unitCase.min[0]),
      Number(unitCase.max[0]),
      viewport,
      typed
    )
    const actual = values[index] ?? ''

    return Math.abs(parseFloat(actual) - expected) <= Math.max(0.6, Math.abs(expected) * 0.002)
      ? []
      : [
          `${unitCase.property} ${unitCase.min.join('')} → ${unitCase.max.join('')}: got ${actual}, expected ${expected.toFixed(2)}px`
        ]
  })
}

test.describe('Unit-aware interpolation: unit combinations', () => {
  test('inline formulas resolve every unit pair on the expected path', async ({
    page,
    typedArithmetic
  }) => {
    await page.goto(TEST_PAGE_URL)
    await page.waitForLoadState('load')

    const cases = buildUnitCases()
    const css = [
      `#${MATRIX.STAGE_ID} { position: absolute; top: 0; left: 0; width: ${MATRIX.STAGE_WIDTH}px; font-size: ${MATRIX.STAGE_FONT_SIZE}px; visibility: hidden; }`,
      `#${MATRIX.STAGE_ID} > div { display: block; height: 1px; margin: 0; padding: 0; border: 0; font-size: ${MATRIX.CASE_FONT_SIZE}px; }`,
      ...cases.map(
        (unitCase, index) =>
          `#${MATRIX.STAGE_ID} > #e2e-unit-case-${index} { ${unitCase.property}: ${generateClampFormula(unitCase.min[0], unitCase.min[1], unitCase.max[0], unitCase.max[1])}; }`
      )
    ].join('\n')

    // The real page supplies the Kit screen vars and the plugin's @supports block
    await page.evaluate(
      ({ rules, stageId, count }) => {
        const style = document.createElement('style')
        style.textContent = rules
        document.head.appendChild(style)

        const stage = document.createElement('div')
        stage.id = stageId
        for (let index = 0; index < count; index++) {
          const item = document.createElement('div')
          item.id = `e2e-unit-case-${index}`
          stage.appendChild(item)
        }
        document.body.appendChild(stage)
      },
      { rules: css, stageId: MATRIX.STAGE_ID, count: cases.length }
    )

    for (const width of MATRIX.VIEWPORTS) {
      await page.setViewportSize({ width, height: MATRIX.VIEWPORT_HEIGHT })
      await expect
        .poll(() => findUnitMismatches(page, cases, width, typedArithmetic), {
          message: `unit combinations at ${width}px`
        })
        .toEqual([])
    }
  })
})
