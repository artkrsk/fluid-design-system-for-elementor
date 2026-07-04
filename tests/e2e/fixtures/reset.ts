import { execSync } from 'child_process'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Repo root (this file lives at tests/e2e/fixtures/) */
const REPO_ROOT = path.resolve(__dirname, '../../..')

/** Plugin path inside the wp-env container (same constant as global-setup) */
const PLUGIN_PATH =
  '/var/www/html/wp-content/plugins/fluid-design-system-for-elementor'

/**
 * Resets seeded presets, groups, breakpoints and the test page to the exact
 * global-setup baseline. Mutating specs call this in beforeAll so their
 * writes cannot leak into sibling specs or later runs; a Playwright retry
 * restarts the worker and re-runs beforeAll, wiping a failed attempt's state.
 *
 * Costs one wp-env CLI round-trip (a few seconds) — call it per spec file,
 * not per test.
 */
export function resetTestState(): void {
  execSync(
    `npm run wp-env run cli -- wp eval-file ${PLUGIN_PATH}/tests/e2e/fixtures/reset-state.php`,
    { cwd: REPO_ROOT, stdio: 'pipe', timeout: 120000 }
  )
}
