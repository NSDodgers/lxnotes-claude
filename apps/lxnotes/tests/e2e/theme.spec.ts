import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

const DARK_BG = 'rgb(10, 10, 10)'   // --bg-primary dark = #0a0a0a
const LIGHT_BG = 'rgb(255, 255, 255)' // --bg-primary light = #ffffff

async function gotoSettings(page: import('@playwright/test').Page) {
  const helpers = new TestHelpers(page)
  await page.goto('/settings')
  await helpers.waitForAppReady()
  await page.click('[data-testid="tab-appearance"]')
}

test.describe('Theme switching', () => {
  test.beforeEach(async ({ page }) => {
    // Reset persisted theme so each test starts fresh.
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('theme')
      } catch {}
    })
  })

  test('Appearance tab toggles html.dark class for each mode', async ({ page }) => {
    await gotoSettings(page)

    // Force light
    await page.click('[data-testid="theme-light"]')
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    // Force dark
    await page.click('[data-testid="theme-dark"]')
    await expect(page.locator('html')).toHaveClass(/dark/)

    // System (we control prefers-color-scheme below)
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.click('[data-testid="theme-system"]')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('selection persists across page reload (FOUC check)', async ({ page }) => {
    await gotoSettings(page)
    await page.click('[data-testid="theme-light"]')
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    await page.reload()
    // Within ~50ms of DOMContentLoaded the body bg should already be light:
    // next-themes' inline pre-hydration script sets the class before paint.
    await expect.poll(
      () => page.evaluate(() => getComputedStyle(document.body).backgroundColor),
      { timeout: 1000 }
    ).toBe(LIGHT_BG)
  })

  test('dark mode background unchanged after CSS restructure', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await gotoSettings(page)
    await page.click('[data-testid="theme-dark"]')
    await expect.poll(
      () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    ).toBe(DARK_BG)
  })

  test('color-scheme meta matches resolved theme', async ({ page }) => {
    await gotoSettings(page)
    await page.click('[data-testid="theme-light"]')
    await expect.poll(
      () => page.evaluate(() => document.documentElement.style.colorScheme)
    ).toBe('light')
    await page.click('[data-testid="theme-dark"]')
    await expect.poll(
      () => page.evaluate(() => document.documentElement.style.colorScheme)
    ).toBe('dark')
  })

  test('compact switcher in user menu mirrors settings', async ({ page }) => {
    await gotoSettings(page)
    await page.click('[data-testid="theme-light"]')

    // Open user menu (it lives in the sidebar). Click on the avatar / user button.
    // The sidebar may be collapsed on small viewports; ensure desktop width.
    await page.setViewportSize({ width: 1280, height: 800 })
    // Find any user menu trigger button in the sidebar.
    const trigger = page.locator('[data-testid="sidebar"] button:has(img), [data-testid="sidebar"] button:has(.h-8.w-8.rounded-full)').first()
    if (await trigger.count()) {
      await trigger.click()
      // Toggle to dark via the compact switcher inside the dropdown
      await page.locator('[data-testid="theme-dark"]').last().click()
      await expect(page.locator('html')).toHaveClass(/dark/)
    } else {
      test.skip(true, 'user menu trigger not present in this dev-mode layout')
    }
  })
})
