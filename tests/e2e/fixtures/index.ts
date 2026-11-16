import { test as base, expect, type Page } from '@playwright/test'
import { ElementorEditorPage } from '../pages/elementor-editor'
import { WPAdminPage } from '../pages/wp-admin'
import { TYPED_ARITHMETIC_QUERY } from './test-data'

export { emptyKitPresets, resetTestState } from './reset'
// Re-export test data and the state-reset helper for convenience
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
  typedArithmetic: boolean
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
  },

  /**
   * Whether the engine has CSS typed arithmetic, i.e. which formula term it renders.
   * A project that pins `metadata.typedArithmetic` fails here when the engine disagrees, so
   * firefox-legacy can't quietly turn into a second typed run once Firefox drops its pref.
   */
  typedArithmetic: async ({ page }, use, testInfo) => {
    const supported = await page.evaluate(
      (query) => CSS.supports('width', query),
      TYPED_ARITHMETIC_QUERY
    )
    const pinned: unknown = testInfo.project.metadata.typedArithmetic

    if (typeof pinned === 'boolean') {
      expect(
        supported,
        `${testInfo.project.name} must ${pinned ? '' : 'not '}support CSS typed arithmetic`
      ).toBe(pinned)
    }

    await use(supported)
  }
})

export { expect }
