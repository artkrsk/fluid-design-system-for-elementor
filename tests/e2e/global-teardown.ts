import { FullConfig } from '@playwright/test'

async function globalTeardown(_config: FullConfig) {
  console.log('[E2E Teardown] Cleanup complete')
  // Optional: Clean up test data here if needed
  // For shared fixtures approach, we keep test data between runs
}

export default globalTeardown
