/**
 * Editor fluid-unit loop: the core interactive flow the plugin exists for.
 *
 * Uses the seeded spacer (#e2e-spacer-standard, single-select `space` control,
 * already on the fluid unit with E2E Gap Standard applied). Assertions check
 * the widget's applied style and the element model — never the :root preset
 * variables, which exist regardless of any selection.
 */

import { test, expect, resetTestState, TEST_ELEMENT_IDS } from '../fixtures'

const SPACER = `#${TEST_ELEMENT_IDS.spacerStandard}`

/** Reads the spacer's `space` setting from the (current) document model */
async function getSpacerSpaceSetting(
  page: import('@playwright/test').Page
): Promise<{ unit: string; size: string | number }> {
  return page.evaluate((elementId) => {
    const w = window as any
    const findByElementId = (container: any): any => {
      for (const child of container.children ?? []) {
        if (child.settings?.get?.('_element_id') === elementId) {
          return child
        }
        const nested = findByElementId(child)
        if (nested) {
          return nested
        }
      }
      return null
    }
    const doc = w.elementor.documents.getCurrent()
    const widget = findByElementId(doc.container)
    const space = widget?.settings?.get?.('space') ?? {}
    return { unit: space.unit ?? '', size: space.size ?? '' }
  }, TEST_ELEMENT_IDS.spacerStandard)
}

test.describe('Editor fluid unit loop', () => {
  test.beforeAll(() => {
    resetTestState()
  })

  // Restore the seeded baseline for the next browser/run: this spec persists
  // destructive changes to shared Kit/page state that read-only specs depend on.
  test.afterAll(() => {
    resetTestState()
  })

  test.beforeEach(async ({ editor, testPageId }) => {
    await editor.openPost(testPageId)
    await editor.selectWidget(SPACER)
  })

  test('fluid is offered by the units switcher on an eligible control', async ({
    page
  }) => {
    const control = page.locator('.elementor-control-space')

    // Seeded state: the control is already on the fluid unit
    await expect(control.locator('.e-units-switcher')).toHaveAttribute(
      'data-selected',
      'fluid'
    )

    await control.locator('.e-units-switcher').click()
    await expect(
      control.locator('.e-units-choices label[data-choose="fluid"]'),
      'Injected fluid unit should be a selectable choice'
    ).toBeVisible()
    // Selecting the (already active) unit closes the overlay again
    await control.locator('.e-units-choices label[data-choose="fluid"]').click()
  })

  test('switching units swaps the preset dropdown for the native input and back', async ({
    editor,
    page
  }) => {
    const control = page.locator('.elementor-control-space')

    await expect(control.locator('.select2-container')).toBeVisible()

    await editor.switchUnit('space', 'px')
    await expect(
      control.locator('.select2-container'),
      'Preset dropdown should be gone on a native unit'
    ).toBeHidden()

    await editor.switchUnit('space', 'fluid')
    await expect(
      control.locator('.select2-container'),
      'Preset dropdown should return on the fluid unit'
    ).toBeVisible()
  })

  test('selecting a preset applies it to the widget and survives save + reopen', async ({
    editor,
    page,
    testPageId
  }) => {
    await editor.selectFluidPreset('space', 'E2E Gap Large')

    // Element model references the newly selected preset with the fluid unit
    const applied = await getSpacerSpaceSetting(page)
    expect(applied.unit).toBe('fluid')
    expect(String(applied.size)).toContain('e2e_gap_large')

    // Applied style respects the preset's clamp bounds (32px – 120px)
    const height = await editor
      .getPreviewFrame()
      .locator(`${SPACER} .elementor-spacer-inner`)
      .evaluate((el) => parseFloat(getComputedStyle(el).height))
    expect(height).toBeGreaterThanOrEqual(32)
    expect(height).toBeLessThanOrEqual(120)

    await editor.save()

    // Reopen via the page URL (never page.reload) and re-verify from the
    // freshly loaded model.
    await editor.openPost(testPageId)
    await editor.selectWidget(SPACER)

    const persisted = await getSpacerSpaceSetting(page)
    expect(persisted.unit).toBe('fluid')
    expect(String(persisted.size)).toContain('e2e_gap_large')
    await expect(
      page.locator('.elementor-control-space .select2-selection__rendered')
    ).toContainText('E2E Gap Large')
  })
})
