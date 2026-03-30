import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Combined Work + Electrician View', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/demo/combined/work-electrician');
    await helpers.waitForAppReady();
  });

  test('should display the combined view page with teal header', async ({ page }) => {
    await expect(page.getByText('Work + Electrician Notes')).toBeVisible();
  });

  test('should show notes from both modules', async ({ page }) => {
    // The demo data should include both work and electrician notes
    // The combined view should show more notes than either individual module
    const noteCount = page.getByText(/\d+ notes?/)
    await expect(noteCount).toBeVisible();
  });

  test('should have add note button', async ({ page }) => {
    const addButton = page.locator('[data-testid="combined-add-note"]');
    await expect(addButton).toBeVisible();
  });

  test('should show module type selector when creating a note', async ({ page }) => {
    // Click add note
    await page.locator('[data-testid="combined-add-note"]').click();

    // Dialog should open
    const dialog = page.locator('[data-testid="add-note-dialog"]');
    await expect(dialog).toBeVisible();

    // Module selector should be present
    await expect(dialog.getByText('Module')).toBeVisible();
  });

  test('should have status filter buttons', async ({ page }) => {
    await expect(page.locator('[data-testid="combined-status-todo"]')).toBeVisible();
    await expect(page.locator('[data-testid="combined-status-complete"]')).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    await expect(page.locator('[data-testid="combined-search"]')).toBeVisible();
  });

  test('should be accessible via direct URL', async ({ page }) => {
    // Navigate directly to the combined view URL
    await page.goto('/demo/combined/work-electrician');
    await helpers.waitForAppReady();

    // Page should render normally
    await expect(page.getByText('Work + Electrician Notes')).toBeVisible();
  });
});
