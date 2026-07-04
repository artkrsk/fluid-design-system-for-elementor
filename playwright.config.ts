import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e/specs',
  timeout: 60000,
  expect: {
    // Headroom for elements that render slowly on the CI runner (e.g. AJAX-populated controls)
    timeout: 15000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  /* Fail fast: stop after first failure (namespace conflict = critical).
     PLAYWRIGHT_MAX_FAILURES overrides for runs that should keep going after a
     flake, e.g. the weekly cross-browser job. */
  maxFailures: process.env.PLAYWRIGHT_MAX_FAILURES
    ? Number(process.env.PLAYWRIGHT_MAX_FAILURES)
    : process.env.CI
      ? 1
      : 0,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.WP_BASE_URL || 'http://localhost:8888',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // The default navigation timeout is 30s; bump it for the slow self-hosted runner so
    // a sluggish page load doesn't flake the suite. Covers every page.goto / waitForURL /
    // waitForLoadState (e.g. the heavy Elementor editor and wp-admin pages).
    navigationTimeout: 60000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './tests/e2e/.auth/admin.json'
      }
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: './tests/e2e/.auth/admin.json'
      }
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: './tests/e2e/.auth/admin.json'
      }
    }
  ],
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts'
})
