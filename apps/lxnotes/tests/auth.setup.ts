import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

/**
 * One-time interactive auth setup.
 *
 * Opens a visible browser at the configured baseURL's /auth/login page,
 * waits for the user to complete sign-in, then saves the storage state
 * (cookies + localStorage) to tests/.auth/<account>.json.
 *
 * Subsequent tests can load that state and run as the signed-in user
 * without going through the login flow.
 *
 * Run via: `npm run test:auth:setup`
 *
 * Env vars:
 *   LXNOTES_TEST_BASE_URL — defaults to https://www.lxnotes.app
 *   LXNOTES_TEST_ACCOUNT  — slug used as the state filename (default: "default")
 */

const baseURL = process.env.LXNOTES_TEST_BASE_URL ?? 'https://www.lxnotes.app'
const account = process.env.LXNOTES_TEST_ACCOUNT ?? 'default'
const stateDir = path.resolve(__dirname, '.auth')
const statePath = path.join(stateDir, `${account}.json`)

test.describe.configure({ mode: 'serial' })

test('save signed-in storage state', async ({ page }) => {
  test.setTimeout(5 * 60 * 1000)

  fs.mkdirSync(stateDir, { recursive: true })

  // eslint-disable-next-line no-console
  console.log(`\n[auth.setup] Target: ${baseURL}`)
  // eslint-disable-next-line no-console
  console.log(`[auth.setup] State will be saved to: ${statePath}\n`)

  await page.goto(`${baseURL}/auth/login`)

  // Wait for the user to leave the login page. Anything that is NOT /auth/* counts as signed in.
  // The user has up to 5 minutes (test timeout above) to complete sign-in including any 2FA.
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/'), {
    timeout: 5 * 60 * 1000,
  })

  await expect(page).toHaveURL(/^(?!.*\/auth\/).+/)

  await page.context().storageState({ path: statePath })

  // eslint-disable-next-line no-console
  console.log(`\n[auth.setup] Saved state for account "${account}" to ${statePath}`)
  // eslint-disable-next-line no-console
  console.log('[auth.setup] State expires when the Supabase JWT expires (~1 hour).')
  // eslint-disable-next-line no-console
  console.log('[auth.setup] Re-run this when verify tests start failing with redirect-to-login.\n')
})
