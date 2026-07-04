/**
 * Developer Filters and Hooks Tests
 *
 * Tests the Developer Groups table with a REAL filter-registered group: the
 * mu-plugin fixture (tests/e2e/fixtures/mu-plugins/fluid-e2e-filter-group.php)
 * hooks arts/fluid_design_system/custom_presets, so the table is populated,
 * not just structurally present.
 */

import { test, expect, waitForWpAdmin } from '../fixtures'

const ADMIN_PAGE_URL = '/wp-admin/admin.php?page=fluid-design-system'

test.describe('Developer Groups Table', () => {
  test('filter-registered group renders in the developer table', async ({
    page
  }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForWpAdmin(page)

    const filterRow = page
      .locator('#fluid-developer-groups-table-list tr.group-row.group-filter')
      .filter({ hasText: 'E2E Filter Group' })

    await expect(filterRow, 'mu-plugin group should be listed').toBeVisible()
    await expect(filterRow.locator('.group-type-badge.group-type-filter')).toBeVisible()
  })

  test('developer groups table exists in admin panel', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForWpAdmin(page)

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
    await waitForWpAdmin(page)

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
    await waitForWpAdmin(page)

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
