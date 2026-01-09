import { Page } from '@playwright/test'

export class WPAdminPage {
  constructor(private page: Page) {}

  async goto(path: string = '') {
    await this.page.goto(`/wp-admin/${path}`)
    await this.page.waitForLoadState('networkidle')
  }

  async goToPlugins() {
    await this.goto('plugins.php')
  }

  async goToPages() {
    await this.goto('edit.php?post_type=page')
  }

  async goToSiteSettings() {
    // Navigate to Elementor Site Settings
    await this.page.goto('/wp-admin/admin.php?page=elementor#tab-global-settings')
    await this.page.waitForLoadState('networkidle')
  }

  async getTestPageId(): Promise<number | null> {
    await this.goToPages()

    // Look for either the new fluid test page or the old test page name
    const testPageRow = this.page.locator('tr:has(a.row-title:has-text("E2E Fluid Test Page")), tr:has(a.row-title:has-text("E2E Test Page"))')
    if ((await testPageRow.count()) === 0) {
      return null
    }

    const postId = await testPageRow.getAttribute('id')
    if (!postId) {
      return null
    }

    // Extract ID from "post-123" format
    const match = postId.match(/post-(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }

  async openElementorEditor(postId: number) {
    await this.page.goto(`/wp-admin/post.php?post=${postId}&action=elementor`)
  }
}
