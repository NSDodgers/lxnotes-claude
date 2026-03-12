import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Work Notes - In Review Status', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/cue-notes');
    await helpers.waitForAppReady();
    await helpers.navigateToModule('work-notes');
  });

  test('should show In Review filter button on work notes', async ({ page }) => {
    // Work notes should have 4 status filter buttons
    const statusButtons = page.locator('button:has-text("To Do"), button:has-text("In Review"), button:has-text("Complete"), button:has-text("Cancelled")');
    await expect(statusButtons).toHaveCount(4);

    // Specifically check "In Review" button exists
    const reviewButton = page.locator('button:has-text("In Review")');
    await expect(reviewButton).toBeVisible();
  });

  test('should show review action button (eye icon) in work note rows', async ({ page }) => {
    // Each work note row should have a review button with eye icon
    const firstRow = page.locator('tr').filter({ has: page.locator('button[title="Mark as in review"]') }).first();
    await expect(firstRow).toBeVisible();

    const reviewActionButton = firstRow.locator('button[title="Mark as in review"]');
    await expect(reviewActionButton).toBeVisible();
  });

  test('should toggle note to In Review status', async ({ page }) => {
    // Click the review (eye) button on the first todo note
    const reviewButton = page.locator('button[title="Mark as in review"]').first();
    await reviewButton.click();

    // The note should disappear from the todo view (since we're filtered to todo)
    // Wait for the UI to update
    await page.waitForTimeout(500);

    // Switch to In Review filter
    const inReviewFilter = page.locator('button:has-text("In Review")');
    await inReviewFilter.click();
    await page.waitForTimeout(500);

    // Should see at least one note in the In Review view
    const noteRows = page.locator('[data-testid="notes-table"] tbody tr');
    const count = await noteRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should toggle note back from In Review to Todo', async ({ page }) => {
    // First, put a note into review
    const reviewButton = page.locator('button[title="Mark as in review"]').first();
    await reviewButton.click();
    await page.waitForTimeout(500);

    // Switch to In Review filter
    const inReviewFilter = page.locator('button:has-text("In Review")');
    await inReviewFilter.click();
    await page.waitForTimeout(500);

    // Click the review button again to toggle back to todo
    const toggleBackButton = page.locator('button[title="Mark as todo"]').first();
    await toggleBackButton.click();
    await page.waitForTimeout(500);

    // Switch back to Todo filter
    const todoFilter = page.locator('button:has-text("To Do")');
    await todoFilter.click();
    await page.waitForTimeout(500);

    // Should still have todo notes
    const noteRows = page.locator('[data-testid="notes-table"] tbody tr');
    const count = await noteRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should mark In Review note as complete directly', async ({ page }) => {
    // Put a note into review first
    const reviewButton = page.locator('button[title="Mark as in review"]').first();
    await reviewButton.click();
    await page.waitForTimeout(500);

    // Switch to In Review filter
    const inReviewFilter = page.locator('button:has-text("In Review")');
    await inReviewFilter.click();
    await page.waitForTimeout(500);

    // Verify there's a note with a complete button visible
    const completeButton = page.locator('button[title="Mark as complete"]').first();
    await expect(completeButton).toBeVisible();

    // Click complete button on the in-review note
    await completeButton.click();
    await page.waitForTimeout(500);

    // The note should no longer be in the In Review view — expect empty state
    await expect(page.getByText('No notes found')).toBeVisible();
  });

  test('should NOT show In Review filter on cue notes', async ({ page }) => {
    await helpers.navigateToModule('cue-notes');

    // Cue notes should NOT have "In Review" button
    const reviewButton = page.locator('button:has-text("In Review")');
    await expect(reviewButton).toHaveCount(0);

    // Should still have the other 3 status buttons
    const todoButton = page.locator('button:has-text("To Do")');
    await expect(todoButton).toBeVisible();
  });

  test('should NOT show In Review filter on production notes', async ({ page }) => {
    await helpers.navigateToModule('production-notes');

    // Production notes should NOT have "In Review" button
    const reviewButton = page.locator('button:has-text("In Review")');
    await expect(reviewButton).toHaveCount(0);
  });

  test('should NOT show review action button on cue note rows', async ({ page }) => {
    await helpers.navigateToModule('cue-notes');

    // Cue notes should not have the eye/review button
    const reviewActionButton = page.locator('button[title="Mark as in review"]');
    await expect(reviewActionButton).toHaveCount(0);
  });
});
