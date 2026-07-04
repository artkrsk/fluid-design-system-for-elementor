import { request, FullConfig } from '@playwright/test'
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

const STORAGE_STATE_PATH = './tests/e2e/.auth/admin.json'

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0]!.use

  console.log('[E2E Setup] Starting global setup...')

  // Step 1: Enable pretty permalinks
  await enablePermalinks()

  // Step 2: Seed test presets via WP-CLI
  await seedTestPresets()

  // Step 3: Create test page via WP-CLI
  await createTestPage()

  // Step 4: Verify wp-env activated all plugins; clear Elementor's one-time
  // activation redirect so it can't hijack the first admin navigation
  verifyPluginsActive()

  // Step 5: Login over HTTP (no browser) and save auth state
  await loginAndSaveState(baseURL!)

  console.log('[E2E Setup] Global setup complete!')
}

/**
 * Log into WordPress with plain HTTP requests and persist the auth cookies as
 * a Playwright storage state usable by every browser project.
 *
 * A UI login (fill wp-login form, wait for the redirect to load) was flaky on
 * the CI runner: the first /wp-admin/ page load could stall past 60s. Cookies
 * are all the tests need, so obtain them at the protocol level instead.
 */
async function loginAndSaveState(baseURL: string): Promise<void> {
  console.log(`[E2E Setup] Logging into WordPress at ${baseURL}`)

  const context = await request.newContext({ baseURL })

  try {
    // Readiness poll: the web container may still be warming up even when the
    // CLI container is already responsive. Doubles as the wordpress_test_cookie
    // preflight — wp-login.php sets it on GET and requires it on POST.
    await waitForHttpOk(context, '/wp-login.php', 10, 3000)

    // Login POST with a few attempts; success = a wordpress_logged_in_* cookie
    // in the jar (redirects are followed automatically, cookies retained).
    let loggedIn = false
    for (let attempt = 1; attempt <= 3 && !loggedIn; attempt++) {
      const response = await context.post('/wp-login.php', {
        form: {
          log: WP_USERNAME,
          pwd: WP_PASSWORD,
          'wp-submit': 'Log In',
          testcookie: '1',
          redirect_to: `${baseURL}/wp-admin/`
        }
      })

      const { cookies } = await context.storageState()
      loggedIn = cookies.some(cookie =>
        cookie.name.startsWith('wordpress_logged_in_')
      )

      if (!loggedIn) {
        const body = await response.text()
        console.error(
          `[E2E Setup] Login attempt ${attempt}/3 failed: ` +
            `HTTP ${response.status()} ${response.url()}\n` +
            `Body snippet: ${body.replace(/\s+/g, ' ').slice(0, 500)}`
        )
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    if (!loggedIn) {
      logEnvironmentDiagnostics()
      throw new Error(
        '[E2E Setup] Login failed: no wordpress_logged_in_* cookie after 3 attempts'
      )
    }
    console.log('[E2E Setup] Successfully logged in')

    // Authenticated warmup: proves the cookies work end-to-end, absorbs any
    // one-time admin redirect, warms the admin PHP path before the first test,
    // and times the exact request that used to stall the old UI login.
    const start = Date.now()
    const admin = await context.get('/wp-admin/')
    const elapsed = Date.now() - start
    const adminBody = await admin.text()

    if (!admin.ok() || !adminBody.includes('wpadminbar')) {
      logEnvironmentDiagnostics()
      throw new Error(
        `[E2E Setup] Authenticated /wp-admin/ check failed: HTTP ${admin.status()} ` +
          `${admin.url()} in ${elapsed}ms\n` +
          `Body snippet: ${adminBody.replace(/\s+/g, ' ').slice(0, 500)}`
      )
    }
    console.log(`[E2E Setup] Warmed up /wp-admin/ in ${elapsed}ms`)

    await context.storageState({ path: STORAGE_STATE_PATH })
    console.log('[E2E Setup] Saved authentication state')
  } finally {
    await context.dispose()
  }
}

/** Poll a URL until it responds 200, logging failures along the way */
async function waitForHttpOk(
  context: Awaited<ReturnType<typeof request.newContext>>,
  url: string,
  attempts: number,
  delayMs: number
): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await context.get(url)
      if (response.ok()) {
        return
      }
      console.log(
        `[E2E Setup] Waiting for ${url}: HTTP ${response.status()} (attempt ${attempt}/${attempts})`
      )
    } catch (error) {
      console.log(
        `[E2E Setup] Waiting for ${url}: ${(error as Error).message} (attempt ${attempt}/${attempts})`
      )
    }
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  logEnvironmentDiagnostics()
  throw new Error(`[E2E Setup] ${url} did not respond 200 after ${attempts} attempts`)
}

/** Best-effort environment state dump so CI failures are diagnosable from the log */
function logEnvironmentDiagnostics(): void {
  const commands = [
    'docker ps',
    'npm run wp-env run cli -- wp option get siteurl',
    'npm run wp-env run cli -- tail -n 50 /var/www/html/wp-content/debug.log'
  ]

  for (const command of commands) {
    try {
      const output = execSync(command, {
        cwd: path.resolve(__dirname, '../..'),
        timeout: 60000
      })
      console.error(`[E2E Diagnostics] $ ${command}\n${output.toString().trim()}`)
    } catch (error) {
      console.error(`[E2E Diagnostics] $ ${command} failed: ${(error as Error).message}`)
    }
  }
}

/**
 * Assert wp-env auto-activated every plugin from .wp-env.json and delete
 * Elementor's activation-redirect transient. The old UI-based activation via
 * plugins.php is gone: without a browser in setup, Elementor's one-time
 * redirect would otherwise land on the first test navigation instead.
 */
function verifyPluginsActive(): void {
  console.log('[E2E Setup] Verifying active plugins...')

  const activePlugins = execSync(
    `npm run wp-env run cli -- wp plugin list --status=active --field=name`,
    {
      cwd: path.resolve(__dirname, '../..'),
      timeout: 60000
    }
  ).toString()

  // Elementor's directory name follows the downloaded zip (elementor.latest-stable)
  const required = ['fluid-design-system-for-elementor', 'elementor']
  const missing = required.filter(name => !activePlugins.includes(name))
  if (missing.length > 0) {
    throw new Error(
      `[E2E Setup] Expected wp-env to auto-activate plugins, but missing: ${missing.join(', ')}.\n` +
        `Active plugins:\n${activePlugins}`
    )
  }

  try {
    execSync(
      `npm run wp-env run cli -- wp transient delete elementor_activation_redirect`,
      {
        cwd: path.resolve(__dirname, '../..'),
        stdio: 'ignore',
        timeout: 60000
      }
    )
  } catch {
    // Transient may simply not exist — the authenticated warmup request
    // absorbs any residual redirect either way.
  }

  console.log('[E2E Setup] Plugins active')
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
