/**
 * Site Settings repeater lifecycle — first end-to-end coverage of the
 * internal hook system (HookOnRepeaterAdd/Remove + CSSManager + the
 * StateManager removal window):
 *
 *   add row    -> CSS variable appears in the preview
 *   remove row -> CSS variable is unset
 *   undo       -> Elementor re-fires document/repeater/insert with
 *                 isRestored, and the hook restores the variable
 *
 * Persistence is asserted spec-08 style: save the Kit, reopen the editor via
 * the page URL and read the freshly loaded model (never page.reload()).
 */

import { test, expect, resetTestState, getCssVarName } from '../fixtures'

const CONTROL = 'fluid_spacing_presets'

test.describe('Preset repeater lifecycle', () => {
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
    await editor.openSiteSettingsFluidTab(CONTROL)
  })

  test('adding a preset row injects its CSS variable into the preview', async ({
    editor
  }) => {
    const itemId = await editor.addRepeaterRow(CONTROL, 'E2E Runtime Preset')

    await expect
      .poll(() => editor.getCssVariableValue(getCssVarName(itemId)), {
        message: 'New row CSS variable should be set in the preview'
      })
      .not.toBe('')
  })

  test('removing a preset unsets its CSS variable and undo restores it', async ({
    editor,
    page
  }) => {
    const varName = getCssVarName('e2e_gap_standard')

    expect(await editor.getCssVariableValue(varName)).not.toBe('')

    // Seeded row 0 = E2E Gap Standard
    await editor.removeRepeaterRow(CONTROL, 0)
    await expect
      .poll(() => editor.getCssVariableValue(varName), {
        message: 'Removed preset variable should compute empty (unset)'
      })
      .toBe('')

    await page.evaluate(() => {
      const w = window as any
      w.$e.run('document/history/undo')
    })

    await expect(
      page.locator(`.elementor-control-${CONTROL} .elementor-repeater-fields`).first()
    ).toBeVisible()
    await expect
      .poll(() => editor.getCssVariableValue(varName), {
        message: 'Undo should restore the preset CSS variable'
      })
      .not.toBe('')
  })

  test('deleting a preset and saving persists the removal', async ({
    editor,
    page,
    testPageId
  }) => {
    // Seeded row 1 = E2E Gap Large
    await editor.removeRepeaterRow(CONTROL, 1)
    await editor.saveSiteSettings()

    await editor.openPost(testPageId)
    await editor.openSiteSettings()

    const stillThere = await page.evaluate((name) => {
      const w = window as any
      const coll = w.elementor.documents
        .get(w.elementor.config.kit_id)
        .container.settings.get(name)
      return Boolean(coll?.findWhere?.({ _id: 'e2e_gap_large' }))
    }, CONTROL)

    expect(stillThere, 'Deleted preset must not survive save + reopen').toBe(false)
  })
})
