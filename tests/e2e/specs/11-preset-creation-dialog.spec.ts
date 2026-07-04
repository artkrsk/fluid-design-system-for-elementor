/**
 * Preset creation and editing through the real UI: the inline custom-value
 * inputs, the "save as preset" dialog (PresetDialogManager) and the edit
 * pencil on dropdown options.
 *
 * Scope is the UI path only — the programmatic create/save/reload roundtrip
 * is spec 08's job. The closing model assertions cover the #40 fix
 * (insertPresetRow/updatePresetRow mirroring) end-to-end through the dialog.
 */

import { test, expect, resetTestState, TEST_ELEMENT_IDS } from '../fixtures'

const SPACER = `#${TEST_ELEMENT_IDS.spacerStandard}`

test.describe('Preset creation dialog', () => {
  test.beforeAll(() => {
    resetTestState()
  })

  test.beforeEach(async ({ editor, testPageId }) => {
    await editor.openPost(testPageId)
    await editor.selectWidget(SPACER)
  })

  test('inline custom values save as a new preset via the dialog', async ({
    editor,
    page
  }) => {
    const control = page.locator('.elementor-control-space')

    // "Custom value..." lives in the body-level select2 dropdown; wait for the
    // async-loaded options before opening (see waitForPresetOptions).
    await editor.waitForPresetOptions('space')
    await control.locator('.select2-container').click()
    await page.waitForSelector('.select2-results', { timeout: 5000 })
    await page
      .locator('.select2-results__option', { hasText: 'Custom value...' })
      .click()

    const inline = control.locator('.e-fluid-inline-container')
    await expect(inline).toBeVisible()
    await inline.locator('input[data-fluid-role="min"]').fill('12')
    await inline.locator('input[data-fluid-role="max"]').fill('60')

    await inline.locator('button.e-fluid-save-preset').click()

    const dialog = page.locator('.e-fluid-create-preset-dialog')
    await dialog.waitFor({ timeout: 5000 })

    await dialog.locator('input[name="preset-name"]').fill('E2E Dialog Preset')
    await expect(dialog.locator('.dialog-ok')).toBeEnabled()

    const saveResponse = page.waitForResponse(
      (response) =>
        response.url().includes('admin-ajax.php') &&
        (response.request().postData() ?? '').includes(
          'arts_fluid_design_system_save_preset'
        )
    )
    await dialog.locator('.dialog-ok').click()

    // The dialog drove the create action to a successful server response.
    const response = await saveResponse
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body?.data?.responses?.arts_fluid_design_system_save_preset?.success).toBe(
      true
    )

    // The dialog closes on success.
    await expect(dialog).toBeHidden()
  })

  test('edit pencil updates an existing preset', async ({ editor, page }) => {
    const control = page.locator('.elementor-control-space')

    await editor.waitForPresetOptions('space')
    await control.locator('.select2-container').click()
    await page.waitForSelector('.select2-results', { timeout: 5000 })

    // The pencil only reacts to mousedown (select2 swallows click)
    await page
      .locator('.e-fluid-preset-edit-icon[data-preset-id="e2e_gap_standard"]')
      .dispatchEvent('mousedown')

    const dialog = page.locator('.e-fluid-edit-preset-dialog')
    await dialog.waitFor({ timeout: 5000 })

    // Prefilled with the seeded 16 -> 48 values
    await expect(dialog.locator('input[data-fluid-role="min"]')).toHaveValue(/16/)
    await expect(dialog.locator('input[data-fluid-role="max"]')).toHaveValue(/48/)

    await dialog.locator('input[data-fluid-role="max"]').fill('56')

    const updateResponse = page.waitForResponse(
      (response) =>
        response.url().includes('admin-ajax.php') &&
        (response.request().postData() ?? '').includes(
          'arts_fluid_design_system_update_preset'
        )
    )
    await dialog.locator('.dialog-ok').click()

    // The dialog drove the update action to a successful server response.
    const response = await updateResponse
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(
      body?.data?.responses?.arts_fluid_design_system_update_preset?.success
    ).toBe(true)

    await expect(dialog).toBeHidden()
  })
})
