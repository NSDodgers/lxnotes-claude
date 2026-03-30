import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Sidebar Customization', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    // Clear sidebar config from localStorage before each test
    await page.goto('/demo/cue-notes');
    await helpers.waitForAppReady();
    await page.evaluate(() => localStorage.removeItem('sidebar-config'));
    await page.reload();
    await helpers.waitForAppReady();
  });

  test('should show Modules tab in Settings', async ({ page }) => {
    await page.goto('/demo/settings');
    await helpers.waitForAppReady();

    // Modules tab should be visible and active by default
    const modulesTab = page.locator('[data-testid="tab-modules"]');
    await expect(modulesTab).toBeVisible();
  });

  test('should show all 4 modules in settings by default', async ({ page }) => {
    await page.goto('/demo/settings');
    await helpers.waitForAppReady();

    // Click modules tab
    await page.locator('[data-testid="tab-modules"]').click();

    // All 4 modules should be listed
    await expect(page.getByText('Cue Notes')).toBeVisible();
    await expect(page.getByText('Work Notes')).toBeVisible();
    await expect(page.getByText('Electrician Notes')).toBeVisible();
    await expect(page.getByText('Production Notes')).toBeVisible();
  });

  test('should hide a module from sidebar when eye icon is toggled', async ({ page }) => {
    // Verify all 4 modules visible in sidebar initially
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar.getByText('Cue Notes')).toBeVisible();
    await expect(sidebar.getByText('Production Notes')).toBeVisible();

    // Go to settings and hide Cue Notes
    await page.goto('/demo/settings');
    await helpers.waitForAppReady();
    await page.locator('[data-testid="tab-modules"]').click();

    // Find the Cue Notes eye toggle and click it
    const cueRow = page.locator('text=Cue Notes').locator('..');
    const eyeButton = cueRow.locator('button[aria-label*="Hide Cue Notes"]');
    await eyeButton.click();

    // Navigate back and check sidebar
    await page.goto('/demo/work-notes');
    await helpers.waitForAppReady();

    // Cue Notes should be gone from sidebar
    await expect(sidebar.getByText('Cue Notes')).not.toBeVisible();
    // Other modules should still be there
    await expect(sidebar.getByText('Work Notes')).toBeVisible();
  });

  test('should persist sidebar config across page refresh', async ({ page }) => {
    // Go to settings and hide Production Notes
    await page.goto('/demo/settings');
    await helpers.waitForAppReady();
    await page.locator('[data-testid="tab-modules"]').click();

    const prodRow = page.locator('text=Production Notes').locator('..');
    const eyeButton = prodRow.locator('button[aria-label*="Hide Production Notes"]');
    await eyeButton.click();

    // Refresh page
    await page.reload();
    await helpers.waitForAppReady();

    // Production Notes should still be hidden in sidebar
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar.getByText('Production Notes')).not.toBeVisible();
  });

  test('should show Electrician Notes Config tab in settings', async ({ page }) => {
    await page.goto('/demo/settings');
    await helpers.waitForAppReady();

    const elecTab = page.locator('[data-testid="tab-electrician-notes"]');
    await expect(elecTab).toBeVisible();
  });

  test('should show combined view toggle in modules settings', async ({ page }) => {
    await page.goto('/demo/settings');
    await helpers.waitForAppReady();
    await page.locator('[data-testid="tab-modules"]').click();

    // Combined views section should be present
    await expect(page.getByText('Combined Views')).toBeVisible();
    await expect(page.getByText('Work + Electrician Notes')).toBeVisible();
  });

  test('should enable combined view and show it in sidebar', async ({ page }) => {
    // Go to settings and enable combined view
    await page.goto('/demo/settings');
    await helpers.waitForAppReady();
    await page.locator('[data-testid="tab-modules"]').click();

    // Find combined view toggle and enable it
    const combinedRow = page.locator('text=Work + Electrician Notes').locator('..');
    const eyeButton = combinedRow.locator('button[aria-label*="Enable"]');
    await eyeButton.click();

    // Navigate to see sidebar
    await page.goto('/demo/work-notes');
    await helpers.waitForAppReady();

    // Combined view should appear in sidebar
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar.getByText('Work + Electrician Notes')).toBeVisible();
  });

  test('should have reset to defaults link', async ({ page }) => {
    await page.goto('/demo/settings');
    await helpers.waitForAppReady();
    await page.locator('[data-testid="tab-modules"]').click();

    await expect(page.getByText('Reset to defaults')).toBeVisible();
  });
});
