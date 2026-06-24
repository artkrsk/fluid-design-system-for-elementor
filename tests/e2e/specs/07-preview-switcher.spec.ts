/**
 * Preview-Width Switcher Tests (Issue #18)
 *
 * Drives the editor panel: the per-control Min/Max/Reset switcher resizes the
 * preview iframe to the fluid range's screen anchors WITHOUT switching device
 * mode, so the editable min/max stay in place. Targets the seeded spacer (a
 * fluid slider rendered directly in the panel — no popover needed).
 */

import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { TEST_ELEMENT_IDS } from '../fixtures/test-data'

/** Width of the editor preview wrapper (top frame), rounded */
function previewWrapperWidth(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.getElementById('elementor-preview-responsive-wrapper')
    return el ? Math.round(el.getBoundingClientRect().width) : 0
  })
}

/** Whether our preview-resize override is currently applied */
function previewIsActive(page: Page): Promise<boolean> {
  return page.evaluate(() => document.body.classList.contains('arts-fluid-preview-active'))
}

/** The first visible (non-inherited) switcher in the panel */
function visibleSwitcher(page: Page) {
  return page.locator('#elementor-controls .e-fluid-preview-switcher:not(.e-hidden)').first()
}

test.describe('Preview-width switcher', () => {
  test.beforeEach(async ({ editor, testPageId }) => {
    await editor.openPost(testPageId)
    await editor.selectWidget(`#${TEST_ELEMENT_IDS.spacerStandard}`)
  })

  test('renders Min/Max/Reset for a fluid control', async ({ page }) => {
    const switcher = visibleSwitcher(page)
    await expect(switcher).toBeVisible()
    await expect(switcher.locator('[data-anchor="min"]')).toBeVisible()
    await expect(switcher.locator('[data-anchor="max"]')).toBeVisible()
    await expect(switcher.locator('[data-anchor="reset"]')).toBeVisible()
  })

  test('Min / Max resize the preview to the screen anchors, Reset restores', async ({ page }) => {
    const switcher = visibleSwitcher(page)
    const initialWidth = await previewWrapperWidth(page)

    await switcher.locator('[data-anchor="max"]').click()
    expect(await previewIsActive(page)).toBe(true)
    expect(await previewWrapperWidth(page)).toBe(1920)

    await switcher.locator('[data-anchor="min"]').click()
    expect(await previewWrapperWidth(page)).toBe(360)

    await switcher.locator('[data-anchor="reset"]').click()
    expect(await previewIsActive(page)).toBe(false)
    expect(await previewWrapperWidth(page)).toBe(initialWidth)
  })

  test('device mode stays Desktop while previewing (no real switch)', async ({ page }) => {
    await visibleSwitcher(page).locator('[data-anchor="min"]').click()

    const mode = await page.evaluate(() =>
      window.elementor?.channels?.deviceMode?.request('currentMode')
    )
    expect(mode).toBe('desktop')
    expect(await previewIsActive(page)).toBe(true)
  })

  test('switching native device mode clears our override', async ({ page, editor }) => {
    await visibleSwitcher(page).locator('[data-anchor="min"]').click()
    expect(await previewIsActive(page)).toBe(true)

    await editor.switchDevice('tablet')

    expect(await previewIsActive(page)).toBe(false)
  })

  test('switcher sits on its own row without overflowing the panel', async ({ page }) => {
    const box = await visibleSwitcher(page).boundingBox()
    const panelRight = await page.evaluate(
      () => document.getElementById('elementor-panel')!.getBoundingClientRect().right
    )

    expect(box).not.toBeNull()
    expect(box!.x + box!.width).toBeLessThanOrEqual(panelRight + 1)
  })
})

test.describe('Preview-width switcher in a popover', () => {
  test.beforeEach(async ({ editor, testPageId }) => {
    await editor.openPost(testPageId)
    await editor.selectWidget(`#${TEST_ELEMENT_IDS.headingXl}`)
    await editor.openStyleTab()
  })

  /** Toggle the Typography popover open/closed via its edit pencil */
  async function toggleTypographyPopover(page: Page) {
    await page.evaluate(() => {
      const pencil = document.querySelector(
        '[class*="elementor-control-typography_typography"] .eicon-edit'
      ) as HTMLElement | null
      pencil?.click()
    })
    await page.waitForTimeout(400)
  }

  test('closing the popover while active resets the preview', async ({ page }) => {
    await toggleTypographyPopover(page)

    const switcher = page
      .locator('.elementor-control-typography_font_size .e-fluid-preview-switcher:not(.e-hidden)')
      .first()
    await expect(switcher).toBeVisible()

    await switcher.locator('[data-anchor="min"]').click()
    expect(await previewIsActive(page)).toBe(true)

    await toggleTypographyPopover(page) // close
    expect(await previewIsActive(page)).toBe(false)
  })
})
