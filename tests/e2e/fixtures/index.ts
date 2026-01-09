import { test as base, expect } from '@playwright/test'
import { WPAdminPage } from '../pages/wp-admin'
import { ElementorEditorPage } from '../pages/elementor-editor'

// Re-export test data for convenience
export * from './test-data'

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
