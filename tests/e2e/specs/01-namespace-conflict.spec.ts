/**
 * Namespace Conflict Detection Tests
 *
 * These tests verify that Fluid Design System works correctly even when
 * another plugin/theme loads an older version of ArtsUtilities first.
 *
 * Test setup:
 * - "AAAA Arts Utilities Conflict Test" plugin loads FIRST (alphabetically)
 * - It registers a stub Arts\Utilities\Utilities class missing TypeGuards methods
 * - Fluid Design System loads SECOND and should use its own prefixed version
 *
 * IMPORTANT: Without Strauss namespace isolation, these tests will FAIL.
 * After implementing Strauss, these tests should PASS.
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8888'

test.describe('Namespace Conflict Handling', () => {
  /**
   * Track page errors during tests.
   * PHP fatal errors often manifest as JavaScript errors or 500 responses.
   */
  let pageErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    pageErrors = []
    page.on('pageerror', error => {
      pageErrors.push(error.message)
    })
  })

  test('WordPress admin loads without fatal errors when conflict plugin is active', async ({
    page
  }) => {
    // Navigate to plugins page
    const response = await page.goto(`${BASE_URL}/wp-admin/plugins.php`)

    // Should not return 500 (PHP fatal error)
    expect(response?.status(), 'Admin should not return 500 error').toBeLessThan(
      500
    )

    // Verify we're on the plugins page (not an error page)
    await expect(
      page.locator('#wpbody-content'),
      'Admin body should be visible'
    ).toBeVisible({ timeout: 15000 })

    // Verify both plugins are listed
    await expect(
      page.locator('[data-slug="aaaa-arts-utilities-conflict-test"]'),
      'Conflict test plugin should be listed'
    ).toBeVisible()

    await expect(
      page.locator('[data-slug="fluid-design-system-for-elementor"]'),
      'Fluid Design System should be listed'
    ).toBeVisible()
  })

  test('both plugins can be activated simultaneously', async ({ page }) => {
    await page.goto(`${BASE_URL}/wp-admin/plugins.php`)

    // Check if conflict plugin is active (has 'active' class or Deactivate link)
    const conflictPluginRow = page.locator(
      '[data-slug="aaaa-arts-utilities-conflict-test"]'
    )
    const conflictIsActive = await conflictPluginRow
      .locator('.deactivate a')
      .isVisible()
      .catch(() => false)

    // If conflict plugin is not active, activate it
    if (!conflictIsActive) {
      const activateLink = conflictPluginRow.locator('.activate a')
      if (await activateLink.isVisible()) {
        await activateLink.click()
        await page.waitForLoadState('load')
      }
    }

    // Navigate back to plugins page
    await page.goto(`${BASE_URL}/wp-admin/plugins.php`)

    // Check if FDS is active
    const fdsPluginRow = page.locator(
      '[data-slug="fluid-design-system-for-elementor"]'
    )
    const fdsIsActive = await fdsPluginRow
      .locator('.deactivate a')
      .isVisible()
      .catch(() => false)

    // If FDS is not active, try to activate it
    if (!fdsIsActive) {
      const activateLink = fdsPluginRow.locator('.activate a')
      if (await activateLink.isVisible()) {
        const [response] = await Promise.all([
          page.waitForNavigation(),
          activateLink.click()
        ])

        // Activation should not cause 500 error
        expect(
          response?.status(),
          'Plugin activation should not cause fatal error'
        ).toBeLessThan(500)
      }
    }

    // Both plugins should now be active
    await page.goto(`${BASE_URL}/wp-admin/plugins.php`)

    await expect(
      page.locator(
        '[data-slug="aaaa-arts-utilities-conflict-test"] .deactivate a'
      ),
      'Conflict plugin should be active'
    ).toBeVisible()

    await expect(
      page.locator(
        '[data-slug="fluid-design-system-for-elementor"] .deactivate a'
      ),
      'Fluid Design System should be active'
    ).toBeVisible()

    // No fatal error messages should have occurred
    const fatalErrors = pageErrors.filter(
      e =>
        e.includes('get_string_value') ||
        e.includes('get_array_value') ||
        e.includes('get_int_value') ||
        e.includes('Fatal error')
    )
    expect(
      fatalErrors,
      'No TypeGuards-related fatal errors should occur'
    ).toHaveLength(0)
  })

  test('Fluid Design System admin page loads correctly', async ({ page }) => {
    // Navigate to the FDS admin page
    const response = await page.goto(
      `${BASE_URL}/wp-admin/admin.php?page=fluid-design-system`,
      { waitUntil: 'domcontentloaded' }
    )

    // Should not return 500
    expect(
      response?.status(),
      'FDS admin page should not return 500'
    ).toBeLessThan(500)

    // Wait for page to fully load
    await page.waitForLoadState('load')

    // Page should have content (not error message)
    await expect(
      page.locator('#wpbody-content'),
      'Admin content should be visible'
    ).toBeVisible({ timeout: 15000 })

    // Verify FDS admin content is present (Groups heading)
    await expect(
      page.locator('h2:has-text("Groups")'),
      'Groups heading should be visible'
    ).toBeVisible()

    // Check for fatal error indicators in page content
    const pageContent = await page.content()

    // Should not have PHP fatal errors
    expect(
      pageContent.includes('Fatal error'),
      'Page should not contain fatal error message'
    ).toBe(false)

    // Should not have "Call to undefined method" errors
    // (Note: The conflict plugin's admin notice mentions get_string_value,
    // but that's informational, not an error)
    const hasFatalMethodError = pageContent.includes('Call to undefined method') &&
                                 pageContent.includes('get_string_value')
    expect(
      hasFatalMethodError,
      'Page should not show fatal method call errors'
    ).toBe(false)
  })

  test('Elementor menu integration works without conflicts', async ({
    page
  }) => {
    // Navigate to Elementor menu (simpler than opening full editor)
    await page.goto(`${BASE_URL}/wp-admin/admin.php?page=elementor`)

    // Verify Elementor admin page loads
    await expect(
      page.locator('#wpbody-content'),
      'Elementor admin should be visible'
    ).toBeVisible({ timeout: 15000 })

    // Verify no fatal errors occurred during Elementor initialization
    const pageContent = await page.content()
    const hasFatalError =
      pageContent.includes('Fatal error') ||
      (pageContent.includes('Call to undefined method') &&
        pageContent.includes('ArtsUtilities'))

    expect(
      hasFatalError,
      'Elementor should load without namespace-related fatal errors'
    ).toBe(false)

    // No get_string_value errors in page errors
    expect(
      pageErrors.filter(e => e.includes('get_string_value')),
      'No get_string_value errors should occur'
    ).toHaveLength(0)
  })
})

test.describe('Conflict Plugin Verification', () => {
  test('conflict plugin warning notice is displayed', async ({ page }) => {
    await page.goto(`${BASE_URL}/wp-admin/`)

    // The conflict plugin should show a warning notice
    const warningNotice = page.locator(
      '.notice-warning:has-text("Arts Utilities Conflict Test Active")'
    )

    await expect(
      warningNotice,
      'Conflict plugin warning should be visible in admin'
    ).toBeVisible()
  })
})
