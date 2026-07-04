import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'

/**
 * Issue #40 — a preset added to the Kit while Site Settings is open must survive
 * a Site Settings save + reload.
 *
 * The fix mirrors the newly created row into the editor's in-memory Kit model
 * (via the same document/repeater/insert command the native repeater uses), so
 * the save payload includes it. Without that mirror the stale model overwrites
 * `_elementor_page_settings` on save and the freshly added preset is dropped.
 *
 * The handleCreatePreset -> insertPresetRow wiring is covered by unit tests; this
 * spec covers the editor save/persist integration the fix depends on.
 */

const CONTROL_ID = 'fluid_typography_presets'
const PRESET_TITLE = 'E2E Persistence Preset'

/** Opens Site Settings and waits for the Kit document + its settings model. */
async function openSiteSettings(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const w = window as any
    await w.$e.run('panel/global/open')
  })
  await page.waitForFunction(
    () => {
      const w = window as any
      const kitId = w.elementor?.config?.kit_id
      const container = kitId != null ? w.elementor?.documents?.get?.(kitId)?.container : null
      return !!(
        container &&
        container.settings &&
        container.settings.get('fluid_typography_presets')
      )
    },
    { timeout: 15000 }
  )
}

test.describe('Preset persistence across save + reload (#40)', () => {
  test('a created preset survives Save Changes and a hard reload', async ({
    editor,
    testPageId
  }) => {
    const page = editor.page

    await editor.openPost(testPageId)
    await openSiteSettings(page)

    // Create through the plugin's server action, then mirror into the Kit model
    // exactly as the fixed create flow does.
    const createdId = await page.evaluate(
      async ({ name, title }) => {
        const w = window as any
        const kitId = w.elementor.config.kit_id
        const container = w.elementor.documents.get(kitId).container
        const resp: any = await new Promise((resolve, reject) => {
          w.elementor.ajax.addRequest('arts_fluid_design_system_save_preset', {
            data: {
              title,
              min_size: '18',
              min_unit: 'px',
              max_size: '36',
              max_unit: 'px',
              group: name
            },
            success: resolve,
            error: reject
          })
        })
        await w.$e.run('document/repeater/insert', {
          container,
          name,
          model: {
            _id: resp.id,
            title,
            min: { size: 18, unit: 'px' },
            max: { size: 36, unit: 'px' }
          }
        })
        return resp.id as string
      },
      { name: CONTROL_ID, title: PRESET_TITLE }
    )

    expect(createdId).toBeTruthy()

    // Save Site Settings, then hard reload.
    await editor.save()
    await page.reload()
    await editor.waitForEditor()
    await openSiteSettings(page)

    // The preset must still be in the persisted Kit model after reload.
    const persisted = await page.evaluate(
      ({ name, id }) => {
        const w = window as any
        const kitId = w.elementor.config.kit_id
        const coll = w.elementor.documents.get(kitId).container.settings.get(name)
        return !!(coll && coll.findWhere && coll.findWhere({ _id: id }))
      },
      { name: CONTROL_ID, id: createdId }
    )

    expect(persisted).toBe(true)

    // Cleanup: remove the test preset(s) and save so the Kit is left as found.
    await page.evaluate(
      async ({ name, title }) => {
        const w = window as any
        const kitId = w.elementor.config.kit_id
        const container = w.elementor.documents.get(kitId).container
        const coll = container.settings.get(name)
        let idx = coll.models.findIndex((m: any) => m.get('title') === title)
        while (idx >= 0) {
          await w.$e.run('document/repeater/remove', { container, name, index: idx })
          idx = coll.models.findIndex((m: any) => m.get('title') === title)
        }
      },
      { name: CONTROL_ID, title: PRESET_TITLE }
    )
    await editor.save()
  })
})
