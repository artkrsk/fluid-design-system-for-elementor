/**
 * Developer Filters and Hooks Tests
 *
 * Tests the Developer Groups table structure that displays filter-based
 * preset groups added programmatically by themes/plugins.
 */

import { test, expect } from '../fixtures'

const ADMIN_PAGE_URL = '/wp-admin/admin.php?page=fluid-design-system'

test.describe('Developer Groups Table', () => {
  test('developer groups table exists in admin panel', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await page.waitForLoadState('load')

    // Wait for main content to be ready (more reliable than networkidle in Firefox)
    await page.waitForSelector('#wpbody-content', { timeout: 10000 })

    // Verify Developer Groups section exists
    await expect(page.locator('#fluid-developer-groups-table')).toBeVisible()

    // Check for the heading
    const developerHeading = page.locator('h3:has-text("Developer Groups")')
    await expect(developerHeading).toBeVisible()

    // Verify the description explains what developer groups are
    await expect(page.locator('text=programmatically')).toBeVisible()
  })

  test('developer groups table is read-only (no action buttons)', async ({
    page
  }) => {
    await page.goto(ADMIN_PAGE_URL)
    await page.waitForLoadState('load')
    await page.waitForSelector('#wpbody-content', { timeout: 10000 })

    // Verify table structure exists
    await expect(
      page.locator('#fluid-developer-groups-table-list')
    ).toBeVisible()

    // Developer groups should not have edit/delete action buttons
    // Even if rows exist, there should be no .button elements in the table body
    const actionButtons = page.locator(
      '#fluid-developer-groups-table-list tbody .button'
    )
    await expect(actionButtons).toHaveCount(0)
  })

  test('developer groups section has usage documentation', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await page.waitForLoadState('load')
    await page.waitForSelector('#wpbody-content', { timeout: 10000 })

    // Verify the "Why use Developer Groups?" collapsible section exists
    const detailsSection = page.locator(
      'details:has(summary:has-text("Why use Developer Groups?"))'
    )
    await expect(detailsSection).toBeVisible()

    // Expand the details to verify content
    await detailsSection.click()

    // Check for key documentation points
    await expect(page.locator('text=design system tokens')).toBeVisible()
  })
})
