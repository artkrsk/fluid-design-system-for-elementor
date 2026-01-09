import { test as base, expect, Page } from '@playwright/test'
import { WPAdminPage } from '../pages/wp-admin'
import { ElementorEditorPage } from '../pages/elementor-editor'

// Re-export test data for convenience
export * from './test-data'

/**
 * Wait for WordPress admin page to be ready.
 *
 * WordPress admin has continuous background requests (heartbeat API, autosave)
 * that prevent 'networkidle' from ever resolving, especially in Firefox.
 * This utility uses 'load' state + explicit selector wait for reliability.
 *
 * @param page - Playwright page object
 * @param selector - Optional selector to wait for (defaults to #wpbody-content)
 */
export async function waitForWpAdmin(
  page: Page,
  selector: string = '#wpbody-content'
): Promise<void> {
  await page.waitForLoadState('load')
  await page.waitForSelector(selector, { timeout: 15000 })
}

/** Custom fixtures for E2E tests */
type Fixtures = {
  wpAdmin: WPAdminPage
  editor: ElementorEditorPage
  testPageId: number
}

export const test = base.extend<Fixtures>({
  /** WordPress admin page object */
  wpAdmin: async ({ page }, use) => {
    const wpAdmin = new WPAdminPage(page)
    await use(wpAdmin)
  },

  /** Elementor editor page object */
  editor: async ({ page }, use) => {
    const editor = new ElementorEditorPage(page)
    await use(editor)
  },

  /** Get the test page ID (created during global setup) */
  testPageId: async ({ wpAdmin }, use) => {
    const pageId = await wpAdmin.getTestPageId()
    if (!pageId) {
      throw new Error('Test page not found. Run global setup first.')
    }
    await use(pageId)
  }
})

export { expect }
