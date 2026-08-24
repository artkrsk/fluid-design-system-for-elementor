import type { FullConfig } from '@playwright/test'

async function globalTeardown(_config: FullConfig) {
  console.log('[E2E Teardown] Cleanup complete')
  // For shared fixtures approach, we keep test data between runs
}

export default globalTeardown
