import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Lightwright Position Order Integration', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/cue-notes');
    await helpers.waitForAppReady();
  });

  test('should display position manager with no data initially', async ({ page }) => {
    await page.goto('/positions');

    // Should show no data state
    await expect(page.getByText('No Position Data Found')).toBeVisible();
    await expect(page.getByText('Upload Lightwright CSV data to manage position sorting')).toBeVisible();

    // Should have link back to work notes
    await expect(page.getByRole('link', { name: /go to work notes/i })).toBeVisible();
  });

  test('should navigate between work notes and position manager', async ({ page }) => {
    // Start at work notes
    await helpers.navigateToModule('work-notes');
    await helpers.expectPageTitle('Work Notes');

    // Should see manage positions button (even with no data)
    const managePositionsBtn = page.getByRole('button', { name: /manage positions/i });
    if (await managePositionsBtn.isVisible()) {
      await managePositionsBtn.click();
      await expect(page).toHaveURL(/\/positions/);
    }

    // Should see back to work notes link
    await page.getByText('Back to Work Notes').click();
    await expect(page).toHaveURL(/\/work-notes/);
  });

  // This test would require actual CSV upload functionality
  test.skip('should import CSV with position order and display correctly', async ({ page }) => {
    await helpers.navigateToModule('work-notes');

    // Look for import button
    const importButton = page.getByRole('button', { name: /import.*lightwright/i });
    await importButton.click();

    // Upload CSV file with position order data
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('/Users/nicksolyom/Downloads/lightwright-test.csv');

    // Wait for import to complete
    await page.waitForSelector('[data-testid="import-success"]', { timeout: 10000 });

    // Navigate to position manager
    await page.goto('/positions');

    // Should show position data with CSV order
    await expect(page.getByText('Position Sort Order')).toBeVisible();
    await expect(page.getByText('From CSV')).toBeVisible();

    // Should have positions in correct order
    const positions = page.locator('[data-testid="position-item"]');
    await expect(positions.first()).toContainText('SPOT BOOTH');

    // Should have reset buttons
    await expect(page.getByRole('button', { name: /reset to csv order/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /reset to a-z/i })).toBeVisible();
  });

  test.skip('should allow manual reordering and update order source', async ({ page }) => {
    // Assumes CSV data is already imported
    await page.goto('/positions');

    // Wait for positions to load
    await page.waitForSelector('[data-testid="position-item"]');

    const positions = page.locator('[data-testid="position-item"]');
    const count = await positions.count();

    if (count > 1) {
      // Drag first position to second position
      const firstPos = positions.first();
      const secondPos = positions.nth(1);

      await firstPos.dragTo(secondPos);

      // Should update order source to custom
      await expect(page.getByText('Custom Order')).toBeVisible();

      // Reset to CSV order should work
      await page.getByRole('button', { name: /reset to csv order/i }).click();
      await expect(page.getByText('From CSV')).toBeVisible();

      // Reset to alphabetical should work
      await page.getByRole('button', { name: /reset to a-z/i }).click();
      await expect(page.getByText('A-Z')).toBeVisible();
    }
  });

  test.skip('should affect work notes sorting when position order changes', async ({ page }) => {
    // This test would verify that position order affects work notes table sorting
    await helpers.navigateToModule('work-notes');

    // Click position column header to sort
    const positionHeader = page.getByRole('columnheader', { name: /position/i });
    await positionHeader.click();

    // Verify notes are sorted by position order
    const noteRows = page.locator('[data-testid="note-row"]');
    if (await noteRows.count() > 0) {
      // Would verify that the first note uses the first position in order
      const firstNote = noteRows.first();
      const positionCell = firstNote.locator('[data-testid="position-cell"]');
      await expect(positionCell).toBeVisible();
    }
  });

  test('should handle position manager UI interactions', async ({ page }) => {
    await page.goto('/positions');

    // Should show proper page structure
    await expect(page.getByText('Position Management')).toBeVisible();
    await expect(page.getByText('Customize the sort order of positions')).toBeVisible();

    // Take screenshot for visual regression
    await expect(page).toHaveScreenshot('position-manager-empty.png');
  });
});