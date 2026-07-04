import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'

/**
 * Issue #40 — a preset added to the Kit while Site Settings is open must survive
 * a Site Settings save + reload.
 *
 * Without the fix, the editor serializes a stale in-memory Kit model on Save and
 * overwrites `_elementor_page_settings`, dropping the freshly added preset — so it
 * is gone after a reload. The fix mirrors the new row into the editor's Kit model
 * (via the same document/repeater/insert command the native repeater uses), so the
 * save payload includes it.
 *
 * The reload here reopens the editor via the page URL rather than page.reload():
 * a plain reload would land on `?active-document=<kit>`, whose multi-step boot
 * (page -> attach-preview -> switch-to-kit) is racy, and the Kit document has no
 * `$element` so the standard readiness wait never resolves. Reopening the page
 * document boots reliably; opening Site Settings then loads the Kit fresh from the
 * server, so its model reflects the persisted meta.
 *
 * (The handleCreatePreset -> insertPresetRow wiring is covered by unit tests.)
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

/**
 * Saves the Kit (Site Settings) document via its save command.
 *
 * The top-bar save button (`editor.save()`) tracks the primary page document's
 * changed state, so it stays disabled for Kit-only edits. Running the Kit's save
 * command directly is the reliable way to persist Site Settings; its promise
 * resolves only after the save AJAX has persisted.
 */
async function saveSiteSettings(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const w = window as any
    const kitId = w.elementor.config.kit_id
    const kitDoc = w.elementor.documents.get(kitId)
    await w.$e.run('document/save/update', { document: kitDoc })
  })
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

    await saveSiteSettings(page)

    // Hard reload: reopen the editor via the page URL (see file header), then load
    // Site Settings fresh so the Kit model reflects the persisted server state.
    await editor.openPost(testPageId)
    await openSiteSettings(page)

    // The freshly loaded Kit model must contain the preset (synchronous model read
    // — no AJAX round trip that could hang).
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
    await saveSiteSettings(page)
  })
})
