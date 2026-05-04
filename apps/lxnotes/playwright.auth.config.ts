import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

/**
 * Playwright config for AUTHENTICATED tests against a real deployed environment.
 *
 * Separate from the main playwright.config.ts (which spins up `next dev` in
 * NEXT_PUBLIC_DEV_MODE=true with mock auth). This config:
 *   - does NOT start a webServer
 *   - targets a real URL (default: https://www.lxnotes.app)
 *   - uses Playwright storageState saved by `npm run test:auth:setup`
 *
 * Two projects:
 *   setup  — interactive one-time login (headed). Run via:
 *              npm run test:auth:setup
 *   verify — uses the saved state to run authenticated assertions. Run via:
 *              npm run test:auth:verify
 *
 * Auth state lives in tests/.auth/<account>.json (gitignored).
 */

const baseURL = process.env.LXNOTES_TEST_BASE_URL ?? 'https://www.lxnotes.app'
const account = process.env.LXNOTES_TEST_ACCOUNT ?? 'default'
const stateFile = path.resolve(__dirname, 'tests/.auth', `${account}.json`)

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
      },
    },
    {
      name: 'verify',
      testMatch: /auth-.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: stateFile,
      },
    },
  ],
})
