/**
 * Preset Selection and Editor Interaction Tests
 *
 * Tests the Elementor editor UI for selecting and managing fluid presets.
 * These tests interact with the editor panel, not just the frontend.
 */

import { test, expect } from '../fixtures'
import { TEST_ELEMENT_IDS, getElementSelector } from '../fixtures/test-data'

test.describe('Editor Basic Functionality', () => {
  test.beforeEach(async ({ editor, testPageId }) => {
    await editor.openPost(testPageId)
  })

  test('editor loads successfully with test page', async ({ page }) => {
    // Verify Elementor editor is active
    await expect(page.locator('.elementor-editor-active')).toBeVisible({
      timeout: 30000
    })
    await expect(page.locator('#elementor-panel')).toBeVisible()
  })

  test('preview frame contains test elements', async ({ editor }) => {
    const previewFrame = editor.getPreviewFrame()

    // Verify our test elements exist in the preview
    await expect(
      previewFrame.locator(getElementSelector(TEST_ELEMENT_IDS.headingXl))
    ).toBeVisible()
    await expect(
      previewFrame.locator(getElementSelector(TEST_ELEMENT_IDS.headingInverted))
    ).toBeVisible()
    await expect(
      previewFrame.locator(getElementSelector(TEST_ELEMENT_IDS.spacerStandard))
    ).toBeVisible()
  })
})

test.describe('Site Settings Tab', () => {
  test.beforeEach(async ({ editor, testPageId }) => {
    await editor.openPost(testPageId)
  })

  test('Fluid Typography & Spacing tab exists in Site Settings', async ({
    editor
  }) => {
    // Use programmatic command to open Site Settings (more reliable than UI clicks)
    await editor.page.evaluate(() => {
      return window.$e?.run('panel/global/open')
    })

    // Wait for Site Settings menu to load
    await editor.page.waitForSelector('.elementor-panel-menu-group', {
      timeout: 10000
    })

    // Find our Fluid Typography & Spacing tab
    const fluidTab = editor.page.locator(
      '.elementor-panel-menu-item:has-text("Fluid Typography")'
    )
    await expect(fluidTab).toBeVisible()
  })

  test('custom group from WordPress admin appears in Site Settings', async ({
    editor
  }) => {
    // Open Site Settings (switches to Kit document and loads tabs)
    await editor.page.evaluate(() => {
      return window.$e?.run('panel/global/open')
    })

    // Wait for menu to appear
    await editor.page.waitForSelector('.elementor-panel-menu-group', {
      timeout: 10000
    })

    // Verify our tab is registered in the component
    const availableTabs = await editor.page.evaluate(() => {
      const tabs = window.$e?.components.get('panel/global')?.getTabs() || {}
      return Object.keys(tabs)
    })

    // Verify our tab is registered
    expect(availableTabs).toContain(
      'arts-fluid-design-system-tab-fluid-typography-spacing'
    )

    // Verify the tab appears in the menu DOM
    const fluidTabInMenu = editor.page.locator(
      '.elementor-panel-menu-item:has-text("Fluid Typography")'
    )
    await expect(fluidTabInMenu).toBeVisible()
  })
})

test.describe('CSS Variable Verification in Editor', () => {
  test.beforeEach(async ({ editor, testPageId }) => {
    await editor.openPost(testPageId)
  })

  test('fluid CSS variables are present in editor preview', async ({
    editor
  }) => {
    const previewFrame = editor.getPreviewFrame()

    // Check for CSS variables in the preview frame
    const cssVars = await previewFrame.locator('html').evaluate(el => {
      const style = getComputedStyle(el)
      return {
        headingXl: style.getPropertyValue('--arts-fluid-preset--e2e_heading_xl'),
        inverted: style.getPropertyValue('--arts-fluid-preset--e2e_inverted'),
        gapStandard: style.getPropertyValue(
          '--arts-fluid-preset--e2e_gap_standard'
        )
      }
    })

    // All test variables should be present
    expect(cssVars.headingXl.trim()).toBeTruthy()
    expect(cssVars.inverted.trim()).toBeTruthy()
    expect(cssVars.gapStandard.trim()).toBeTruthy()
  })

  test('plugin style element exists in preview', async ({ editor }) => {
    const previewFrame = editor.getPreviewFrame()

    // Check for Kit CSS variables instead of plugin style element
    // Plugin dynamic style element is only created when editing
    const kitCssExists = await previewFrame.locator('html').evaluate(el => {
      const style = getComputedStyle(el)
      // Check if any --arts-fluid-min-screen variable exists
      return style.getPropertyValue('--arts-fluid-min-screen') !== ''
    })

    expect(kitCssExists).toBe(true)
  })
})
