import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Column Configuration', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/demo/cue-notes');
    await helpers.waitForAppReady();
    // Clear column layout state before each test
    await page.evaluate(() => localStorage.removeItem('notes-table-column-layout'));
    await page.reload();
    await helpers.waitForAppReady();
  });

  test('should show column config trigger button', async ({ page }) => {
    const trigger = page.locator('[data-testid="column-config-trigger"]');
    await expect(trigger).toBeVisible();
  });

  test('should open popover with all columns listed', async ({ page }) => {
    await page.locator('[data-testid="column-config-trigger"]').click();

    // Should show "Always visible" section with pinned columns
    await expect(page.getByText('Always visible')).toBeVisible();
    await expect(page.getByText('Actions')).toBeVisible();
    await expect(page.getByText('Note')).toBeVisible();

    // Should show "Customizable" section with hideable columns
    await expect(page.getByText('Customizable')).toBeVisible();
    await expect(page.getByText('Priority')).toBeVisible();
    await expect(page.getByText('Type')).toBeVisible();
    await expect(page.getByText('Cue #')).toBeVisible();
  });

  test('should hide a column when eye icon is clicked', async ({ page }) => {
    // Verify "Scenery Needs" column header is visible in table
    const table = page.locator('[data-testid="notes-table"]');
    await expect(table.getByText('Scenery Needs')).toBeVisible();

    // Open popover and toggle off Scenery Needs
    await page.locator('[data-testid="column-config-trigger"]').click();

    // Find the Scenery Needs row and click its eye toggle
    const sceneryRow = page.getByText('Scenery Needs').locator('..');
    await sceneryRow.locator('button[aria-label*="Toggle"]').click();

    // Close popover
    await page.keyboard.press('Escape');

    // Column should be hidden from the table
    await expect(table.getByText('Scenery Needs')).toBeHidden();
  });

  test('should show hidden column when eye icon is clicked again', async ({ page }) => {
    const table = page.locator('[data-testid="notes-table"]');

    // Hide a column first
    await page.locator('[data-testid="column-config-trigger"]').click();
    const sceneryRow = page.getByText('Scenery Needs').locator('..');
    await sceneryRow.locator('button[aria-label*="Toggle"]').click();
    await page.keyboard.press('Escape');
    await expect(table.getByText('Scenery Needs')).toBeHidden();

    // Re-show it
    await page.locator('[data-testid="column-config-trigger"]').click();
    const sceneryRow2 = page.getByText('Scenery Needs').locator('..');
    await sceneryRow2.locator('button[aria-label*="Toggle"]').click();
    await page.keyboard.press('Escape');
    await expect(table.getByText('Scenery Needs')).toBeVisible();
  });

  test('should persist column config after page reload', async ({ page }) => {
    const table = page.locator('[data-testid="notes-table"]');

    // Hide Scenery Needs
    await page.locator('[data-testid="column-config-trigger"]').click();
    const sceneryRow = page.getByText('Scenery Needs').locator('..');
    await sceneryRow.locator('button[aria-label*="Toggle"]').click();
    await page.keyboard.press('Escape');
    await expect(table.getByText('Scenery Needs')).toBeHidden();

    // Reload page
    await page.reload();
    await helpers.waitForAppReady();

    // Column should still be hidden
    await expect(table.getByText('Scenery Needs')).toBeHidden();
  });

  test('should reset all column config when Reset is clicked', async ({ page }) => {
    const table = page.locator('[data-testid="notes-table"]');

    // Hide a column
    await page.locator('[data-testid="column-config-trigger"]').click();
    const sceneryRow = page.getByText('Scenery Needs').locator('..');
    await sceneryRow.locator('button[aria-label*="Toggle"]').click();
    await page.keyboard.press('Escape');
    await expect(table.getByText('Scenery Needs')).toBeHidden();

    // Click Reset
    await page.locator('[data-testid="column-config-trigger"]').click();
    await page.locator('[data-testid="column-config-reset"]').click();
    await page.keyboard.press('Escape');

    // Column should be visible again
    await expect(table.getByText('Scenery Needs')).toBeVisible();
  });

  test('should not allow hiding pinned columns', async ({ page }) => {
    await page.locator('[data-testid="column-config-trigger"]').click();

    // Actions and Note should not have toggle buttons in the "Always visible" section
    // They should show disabled eye icons (no button wrapper)
    const alwaysVisibleSection = page.getByText('Always visible').locator('..');

    // The pinned columns should NOT have clickable toggle buttons
    const pinnedButtons = alwaysVisibleSection.locator('button[aria-label*="Toggle"]');
    await expect(pinnedButtons).toHaveCount(0);
  });
});
