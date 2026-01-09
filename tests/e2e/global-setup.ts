import { chromium, FullConfig } from '@playwright/test'
import { execSync } from 'child_process'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WP_USERNAME = process.env.WP_USERNAME || 'admin'
const WP_PASSWORD = process.env.WP_PASSWORD || 'password'

/** Plugin path inside wp-env container */
const PLUGIN_PATH =
  '/var/www/html/wp-content/plugins/fluid-design-system-for-elementor'

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use

  console.log('[E2E Setup] Starting global setup...')

  // Step 1: Enable pretty permalinks
  await enablePermalinks()

  // Step 2: Seed test presets via WP-CLI
  await seedTestPresets()

  // Step 3: Create test page via WP-CLI
  await createTestPage()

  // Step 3: Login and save auth state
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log(`[E2E Setup] Logging into WordPress at ${baseURL}`)

  try {
    // Login to WordPress
    await page.goto(`${baseURL}/wp-login.php`)
    await page.fill('#user_login', WP_USERNAME)
    await page.fill('#user_pass', WP_PASSWORD)
    await page.click('#wp-submit')

    // Wait for admin dashboard
    await page.waitForURL('**/wp-admin/**', { timeout: 30000 })
    console.log('[E2E Setup] Successfully logged in')

    // Activate plugin if not already active
    await page.goto(`${baseURL}/wp-admin/plugins.php`)
    const pluginRow = page.locator(
      '[data-slug="fluid-design-system-for-elementor"]'
    )

    if ((await pluginRow.count()) > 0) {
      const activateLink = pluginRow.locator('a.activate')
      if ((await activateLink.count()) > 0) {
        await activateLink.click()
        await page.waitForLoadState('networkidle')
        console.log('[E2E Setup] Activated Fluid Design System plugin')
      } else {
        console.log('[E2E Setup] Plugin already active')
      }
    }

    // Activate Elementor if not already active
    const elementorRow = page.locator('[data-slug="elementor"]')
    if ((await elementorRow.count()) > 0) {
      const activateLink = elementorRow.locator('a.activate')
      if ((await activateLink.count()) > 0) {
        await activateLink.click()
        await page.waitForLoadState('networkidle')
        console.log('[E2E Setup] Activated Elementor plugin')
      }
    }

    // Save authentication state
    await context.storageState({ path: './tests/e2e/.auth/admin.json' })
    console.log('[E2E Setup] Saved authentication state')
  } catch (error) {
    console.error('[E2E Setup] Setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }

  console.log('[E2E Setup] Global setup complete!')
}

/**
 * Enable pretty permalinks in WordPress.
 */
async function enablePermalinks(): Promise<void> {
  console.log('[E2E Setup] Enabling pretty permalinks...')

  try {
    execSync(
      `npm run wp-env run cli -- wp rewrite structure '/%postname%/' --hard`,
      {
        cwd: path.resolve(__dirname, '../..'),
        stdio: 'inherit',
        timeout: 60000
      }
    )

    execSync(`npm run wp-env run cli -- wp rewrite flush`, {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'inherit',
      timeout: 60000
    })

    console.log('[E2E Setup] Pretty permalinks enabled')
  } catch (error) {
    console.error('[E2E Setup] Failed to enable permalinks:', error)
    throw error
  }
}

/**
 * Runs PHP setup script to seed test presets into Kit settings.
 */
async function seedTestPresets(): Promise<void> {
  console.log('[E2E Setup] Seeding test presets...')

  try {
    const scriptPath = `${PLUGIN_PATH}/tests/e2e/fixtures/setup-presets.php`

    execSync(`npm run wp-env run cli -- wp eval-file "${scriptPath}"`, {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'inherit',
      timeout: 60000
    })

    console.log('[E2E Setup] Test presets seeded successfully')
  } catch (error) {
    console.error('[E2E Setup] Failed to seed presets:', error)
    throw error
  }
}

/**
 * Runs PHP setup script to create test page with widgets.
 */
async function createTestPage(): Promise<void> {
  console.log('[E2E Setup] Creating test page...')

  try {
    const scriptPath = `${PLUGIN_PATH}/tests/e2e/fixtures/setup-page.php`

    execSync(`npm run wp-env run cli -- wp eval-file "${scriptPath}"`, {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'inherit',
      timeout: 60000
    })

    console.log('[E2E Setup] Test page created successfully')
  } catch (error) {
    console.error('[E2E Setup] Failed to create test page:', error)
    throw error
  }
}

export default globalSetup
