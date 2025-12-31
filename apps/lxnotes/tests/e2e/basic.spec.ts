import { test, expect } from '@playwright/test';

test.describe('Basic Application Tests', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');

    // Page should load successfully
    await expect(page).toHaveTitle(/LX Notes/);

    // Basic elements should be present
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('Try Demo')).toBeVisible();
  });

  test('should display the LX Notes application', async ({ page }) => {
    await page.goto('/cue-notes');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should have the title in the document
    await expect(page).toHaveTitle(/LX Notes/);

    // Should have some basic content loaded
    await expect(page.locator('body')).toBeVisible();

    // Should not show error states
    await expect(page.locator('text=Error')).not.toBeVisible();
    await expect(page.locator('text=404')).not.toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/cue-notes');
    await page.waitForLoadState('networkidle');

    // Should have navigation to different modules
    await expect(page.locator('a[href="/cue-notes"]')).toBeVisible();
    await expect(page.locator('a[href="/work-notes"]')).toBeVisible();
    await expect(page.locator('a[href="/production-notes"]')).toBeVisible();
    await expect(page.locator('a[href="/settings"]')).toBeVisible();
  });

  test('should navigate between modules', async ({ page }) => {
    await page.goto('/cue-notes');
    await page.waitForLoadState('networkidle');

    // Navigate to work notes
    await page.click('a[href="/work-notes"]');
    await page.waitForURL('**/work-notes');

    // Navigate to production notes
    await page.click('a[href="/production-notes"]');
    await page.waitForURL('**/production-notes');

    // Navigate to settings
    await page.click('a[href="/settings"]');
    await page.waitForURL('**/settings');

    // Return to cue notes
    await page.click('a[href="/cue-notes"]');
    await page.waitForURL('**/cue-notes');
  });

  test('should display different module content', async ({ page }) => {
    // Test each module loads distinct content
    const modules = [
      { path: '/cue-notes', expectedText: 'Cue' },
      { path: '/work-notes', expectedText: 'Work' },
      { path: '/production-notes', expectedText: 'Production' },
      { path: '/settings', expectedText: 'Settings' }
    ];

    for (const mod of modules) {
      await test.step(`Navigate to ${mod.path}`, async () => { // Changed to mod.path for clarity
        await page.goto(mod.path); // Changed to mod.path
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(new RegExp(`/${mod.path.substring(1)}`)); // Changed to mod.path and adjusted regex
      });

      // Should contain module-specific text
      await expect(page.locator('body')).toContainText(mod.expectedText); // Changed to mod.expectedText

      // Should not be an error page
      await expect(page.locator('text=404')).not.toBeVisible();
    }
  });
});