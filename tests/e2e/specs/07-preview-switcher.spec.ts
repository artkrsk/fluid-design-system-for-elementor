/**
 * Preview-Width Switcher Tests (Issue #18)
 *
 * Drives the editor panel: the per-control Min/Max/Reset switcher resizes the
 * preview iframe to the fluid range's screen anchors WITHOUT switching device
 * mode, so the editable min/max stay in place. Targets the seeded spacer (a
 * fluid slider rendered directly in the panel — no popover needed).
 *
 * The preview wrapper has a CSS width transition and its rendered width can be
 * clamped by the editor viewport, so anchor assertions check the width CSS var
 * the switcher sets (deterministic) rather than the rendered pixel width.
 */

import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { TEST_ELEMENT_IDS } from '../fixtures/test-data'

/** Rendered width of the editor preview wrapper (top frame), rounded */
function previewWrapperWidth(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.getElementById('elementor-preview-responsive-wrapper')
    return el ? Math.round(el.getBoundingClientRect().width) : 0
  })
}

/** The preview-width override CSS var the switcher sets on <body> (window-independent) */
function previewWidthVar(page: Page): Promise<string> {
  return page.evaluate(() => document.body.style.getPropertyValue('--arts-fluid-preview-width'))
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
  test.beforeEach(async ({ editor, testPageId, page }) => {
    await editor.openPost(testPageId)
    await editor.selectWidget(`#${TEST_ELEMENT_IDS.spacerStandard}`)
    // The wrapper's width transition isn't under test — disable it so width
    // changes settle instantly instead of sleeping through the animation
    await page.addStyleTag({
      content: '#elementor-preview-responsive-wrapper { transition: none !important; }'
    })
  })

  test('renders Min/Max/Reset for a fluid control', async ({ page }) => {
    const switcher = visibleSwitcher(page)
    await expect(switcher).toBeVisible()
    await expect(switcher.locator('[data-anchor="min"]')).toBeVisible()
    await expect(switcher.locator('[data-anchor="max"]')).toBeVisible()
    await expect(switcher.locator('[data-anchor="reset"]')).toBeVisible()
  })

  test('Min / Max set the preview to the screen anchors, Reset restores', async ({ page }) => {
    const switcher = visibleSwitcher(page)
    const initialWidth = await previewWrapperWidth(page)

    // Max anchor — assert the width var; the rendered width may be clamped by the editor viewport
    await switcher.locator('[data-anchor="max"]').click()
    expect(await previewIsActive(page)).toBe(true)
    expect(await previewWidthVar(page)).toBe('1920px')
    await expect.poll(() => previewWrapperWidth(page)).toBeGreaterThan(360)
    const maxWidth = await previewWrapperWidth(page)

    // Min anchor (360) always fits, so the wrapper actually shrinks to it
    await switcher.locator('[data-anchor="min"]').click()
    expect(await previewWidthVar(page)).toBe('360px')
    await expect.poll(() => previewWrapperWidth(page)).toBe(360)
    const minWidth = await previewWrapperWidth(page)

    expect(minWidth).toBe(360)
    expect(maxWidth).toBeGreaterThan(minWidth) // Max renders wider than Min (real resize, viewport-agnostic)

    // Reset — override cleared, wrapper restored
    await switcher.locator('[data-anchor="reset"]').click()
    expect(await previewIsActive(page)).toBe(false)
    expect(await previewWidthVar(page)).toBe('')
    await expect
      .poll(async () => Math.abs((await previewWrapperWidth(page)) - initialWidth))
      .toBeLessThanOrEqual(2)
  })

  test('device mode stays Desktop while previewing (no real switch)', async ({ page }) => {
    await visibleSwitcher(page).locator('[data-anchor="min"]').click()

    const mode = await page.evaluate(() =>
      window.elementor?.channels?.deviceMode?.request('currentMode')
    )
    expect(mode).toBe('desktop')
    expect(await previewIsActive(page)).toBe(true)
  })

  test('switching native device mode clears our override', async ({ page }) => {
    await visibleSwitcher(page).locator('[data-anchor="min"]').click()
    expect(await previewIsActive(page)).toBe(true)

    // changeDeviceMode is what the native device buttons call; it fires the deviceMode
    // 'change' event the switcher listens to. (The device tabs are icon-only, so clicking
    // them by text is unreliable, and setDeviceMode isn't present on this build.)
    await page.evaluate(() => {
      ;(
        window.elementor as unknown as { changeDeviceMode: (mode: string) => void }
      ).changeDeviceMode('tablet')
    })

    await expect.poll(() => previewIsActive(page)).toBe(false)
  })

  test('switcher sits on its own row without overflowing the panel', async ({ page }) => {
    const box = await visibleSwitcher(page).boundingBox()
    expect(box).not.toBeNull()

    const panelRight = await page.evaluate(() => {
      const panel = document.getElementById('elementor-panel')
      return panel ? panel.getBoundingClientRect().right : 0
    })

    if (box) {
      expect(box.x + box.width).toBeLessThanOrEqual(panelRight + 1)
    }
  })
})

// The popover-close reset (owner becomes hidden -> IntersectionObserver fires) is
// covered by the PreviewSizeManager unit test "resets when the owner becomes hidden".
// An editor e2e for it (open Typography popover, activate, close) proved too
// environment-fragile to gate CI reliably, so it lives only at the unit level.
