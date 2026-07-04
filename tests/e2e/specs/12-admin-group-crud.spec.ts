/**
 * Admin group CRUD through the real UI: create (inline add + Save Changes),
 * rename (immediate AJAX), reorder (server round-trip), delete (native
 * confirm + Save Changes) and the sync of an admin-created group into the
 * Elementor Site Settings panel.
 *
 * Reorder is asserted through the AJAX handler rather than a jQuery-UI drag:
 * the drag gesture is the flakiest interaction in the suite and adds no
 * coverage beyond stock sortable; the handler, nonce, persistence and
 * re-render are the plugin's code.
 */

import { Page } from '@playwright/test'
import { test, expect, waitForWpAdmin, resetTestState } from '../fixtures'

const ADMIN_PAGE_URL = '/wp-admin/admin.php?page=fluid-design-system'

async function openAdmin(page: Page) {
  await page.goto(ADMIN_PAGE_URL)
  await waitForWpAdmin(page, '#fluid-main-groups-table')
}

/** Inline-add a group and persist it via Save Changes (waits for the refresh) */
async function createGroupViaAdmin(page: Page, name: string) {
  await page.locator('#inline-add-row .editable-add-title').click()
  await page.locator('#inline-add-row .add-title-input').fill(name)
  await page.locator('#inline-add-row .add-group-save').click()
  await expect(page.locator('tr.temp-new-group')).toBeVisible()

  const saveResponse = page.waitForResponse(
    (response) =>
      response.url().includes('admin-ajax.php') &&
      (response.request().postData() ?? '').includes('save_all_changes')
  )
  await page.locator('#save_changes').dispatchEvent('click') // real mouse click is intercepted on the submit input; the delegated jQuery handler catches a dispatched click
  expect((await saveResponse).status()).toBe(200)

  // The AJAX response replaces the table HTML; the temp row must be gone
  await expect(page.locator('tr.temp-new-group')).toHaveCount(0)
  await expect(
    page.locator('tr.group-row.group-custom').filter({ hasText: name })
  ).toBeVisible()
}

test.describe('Admin group CRUD', () => {
  test.beforeAll(() => {
    resetTestState()
  })

  // Restore the seeded baseline for the next browser/run: this spec persists
  // destructive changes to shared Kit/page state that read-only specs depend on.
  test.afterAll(() => {
    resetTestState()
  })

  test.beforeEach(async ({ page }) => {
    await openAdmin(page)
  })

  test('creates a group via inline add and Save Changes', async ({ page }) => {
    await createGroupViaAdmin(page, 'E2E CRUD Group')

    const row = page
      .locator('tr.group-row.group-custom')
      .filter({ hasText: 'E2E CRUD Group' })
    const groupId = await row.getAttribute('data-group-id')
    expect(groupId).toBeTruthy()
    expect(groupId!.startsWith('temp_')).toBe(false)
  })

  test('renames a group inline via immediate AJAX', async ({ page }) => {
    const row = page
      .locator('tr.group-row.group-custom')
      .filter({ hasText: 'E2E Test Group' })

    await row.locator('.editable-title').click()
    const input = row.locator('.title-input')
    await input.fill('E2E Test Group Renamed')

    const renameResponse = page.waitForResponse(
      (response) =>
        response.url().includes('admin-ajax.php') &&
        (response.request().postData() ?? '').includes('update_title')
    )
    await input.press('Enter')
    expect((await renameResponse).status()).toBe(200)

    // Full reload proves persistence, not just optimistic DOM
    await openAdmin(page)
    await expect(
      page.locator('tr.group-row.group-custom').filter({ hasText: 'E2E Test Group Renamed' })
    ).toBeVisible()
  })

  test('reorder round-trips through the server', async ({ page }) => {
    const readOrder = () =>
      page.evaluate(() =>
        Array.from(
          document.querySelectorAll('#fluid-groups-tbody tr.sortable-row')
        ).map((row) => row.getAttribute('data-group-id'))
      )

    const before = await readOrder()
    expect(before.length).toBeGreaterThanOrEqual(3)
    const reversed = [...before].reverse()

    const result = await page.evaluate(async (order) => {
      const w = window as any
      const body = new URLSearchParams()
      body.set('action', 'fluid_design_system_admin_action')
      body.set('fluid_action', 'reorder_groups')
      body.set('security', w.fluidDesignSystemAdmin.ajaxNonce)
      for (const id of order) {
        body.append('group_order[]', id as string)
      }
      const response = await fetch(w.fluidDesignSystemAdmin.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        credentials: 'same-origin'
      })
      return response.json()
    }, reversed)
    expect(result.success).toBe(true)

    await openAdmin(page)
    expect(await readOrder()).toEqual(reversed)
  })

  test('deletes a group with presets after native confirm', async ({ page }) => {
    // The seeded group holds one preset, so deletion asks for confirmation
    page.on('dialog', (dialog) => dialog.accept())

    const row = page
      .locator('tr.group-row.group-custom')
      .filter({ hasText: 'E2E Test Group' })
    await row.locator('.fluid-delete-group').click()
    await expect(row).toHaveClass(/marked-for-deletion/)

    const saveResponse = page.waitForResponse(
      (response) =>
        response.url().includes('admin-ajax.php') &&
        (response.request().postData() ?? '').includes('save_all_changes')
    )
    await page.locator('#save_changes').dispatchEvent('click') // real mouse click is intercepted on the submit input; the delegated jQuery handler catches a dispatched click
    expect((await saveResponse).status()).toBe(200)

    await expect(
      page.locator('tr.group-row.group-custom').filter({ hasText: 'E2E Test Group' })
    ).toHaveCount(0)
  })

  test('admin-created group appears in Elementor Site Settings', async ({
    page,
    editor,
    testPageId
  }) => {
    // Resolving the testPageId fixture navigates to the Pages list, so re-open
    // the Fluid admin here rather than relying on the beforeEach navigation.
    await openAdmin(page)
    await createGroupViaAdmin(page, 'E2E Sync Group')

    const groupId = await page
      .locator('tr.group-row.group-custom')
      .filter({ hasText: 'E2E Sync Group' })
      .getAttribute('data-group-id')
    expect(groupId).toBeTruthy()

    await editor.openPost(testPageId)
    await editor.openSiteSettings()
    await page.evaluate(() => {
      const w = window as any
      w.$e.route('panel/global/arts-fluid-design-system-tab-fluid-typography-spacing')
    })

    await expect(
      page.locator(`.elementor-control-section_fluid_custom_${groupId}_presets`),
      'New group section should render in the fluid tab'
    ).toBeVisible({ timeout: 15000 })
  })
})
