import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Inline Editing Select Dropdowns', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/work-notes');
    await helpers.waitForAppReady();
  });

  test('quick-add: priority select advances to type select on single interaction', async ({ page }) => {
    // Click quick-add zone to create a new inline note
    const quickAddZone = page.locator('[data-testid="work-quick-add-zone"]');
    await quickAddZone.click();

    // Title input should be active — type a title and press Tab to advance
    const titleInput = page.locator('[data-testid="notes-table"] input[type="text"]');
    await expect(titleInput).toBeFocused();
    await titleInput.fill('Test Select Dropdown Note');
    await titleInput.press('Tab');

    // Priority select should now be focused
    const prioritySelect = page.locator('[data-testid="notes-table"] select').first();
    await expect(prioritySelect).toBeFocused();

    // Select a priority value — this should advance to the type column
    await prioritySelect.selectOption({ index: 1 });

    // Type select should now appear and be focused without extra clicks
    const typeSelect = page.locator('[data-testid="notes-table"] select').first();
    await expect(typeSelect).toBeFocused({ timeout: 2000 });

    // Should be able to interact with the type select immediately
    const typeOptions = await typeSelect.locator('option').allTextContents();
    expect(typeOptions.length).toBeGreaterThan(0);

    // Select a type value to complete inline editing
    await typeSelect.selectOption({ index: 1 });
  });

  test('quick-add: Tab key advances through select dropdowns without double-fire', async ({ page }) => {
    // Create a new inline note
    const quickAddZone = page.locator('[data-testid="work-quick-add-zone"]');
    await quickAddZone.click();

    // Fill title and tab to priority
    const titleInput = page.locator('[data-testid="notes-table"] input[type="text"]');
    await titleInput.fill('Tab Advance Test');
    await titleInput.press('Tab');

    // Priority select should be focused
    const prioritySelect = page.locator('[data-testid="notes-table"] select').first();
    await expect(prioritySelect).toBeFocused();

    // Press Tab on priority — should advance to type
    await prioritySelect.press('Tab');

    // Type select should be focused
    const typeSelect = page.locator('[data-testid="notes-table"] select').first();
    await expect(typeSelect).toBeFocused({ timeout: 2000 });
  });

  test('clicking an already-active select cell keeps it responsive', async ({ page }) => {
    // Create a new inline note and advance to priority
    const quickAddZone = page.locator('[data-testid="work-quick-add-zone"]');
    await quickAddZone.click();

    const titleInput = page.locator('[data-testid="notes-table"] input[type="text"]');
    await titleInput.fill('Re-click Test');
    await titleInput.press('Tab');

    // Priority select should be focused
    const prioritySelect = page.locator('[data-testid="notes-table"] select').first();
    await expect(prioritySelect).toBeFocused();

    // Click the same priority cell again — should remain focused, not re-render
    // Find the table cell containing the select and click it
    const priorityCell = prioritySelect.locator('..');
    await priorityCell.click();

    // The select should still be present and focused (not destroyed by re-render)
    await expect(page.locator('[data-testid="notes-table"] select').first()).toBeVisible();
  });

  test('Escape key cancels inline editing from select dropdown', async ({ page }) => {
    // Create a new inline note and advance to priority
    const quickAddZone = page.locator('[data-testid="work-quick-add-zone"]');
    await quickAddZone.click();

    const titleInput = page.locator('[data-testid="notes-table"] input[type="text"]');
    await titleInput.fill('Escape Test');
    await titleInput.press('Tab');

    // Priority select should be focused
    const prioritySelect = page.locator('[data-testid="notes-table"] select').first();
    await expect(prioritySelect).toBeFocused();

    // Press Escape — should cancel editing
    await prioritySelect.press('Escape');

    // No select should be visible (editing cancelled)
    await expect(page.locator('[data-testid="notes-table"] select')).toHaveCount(0, { timeout: 2000 });
  });

  test('clicking existing note priority cell activates select and advances to type', async ({ page }) => {
    // First create a note so we have something to click on
    const quickAddZone = page.locator('[data-testid="work-quick-add-zone"]');
    await quickAddZone.click();

    const titleInput = page.locator('[data-testid="notes-table"] input[type="text"]');
    await titleInput.fill('Existing Note Click Test');
    await titleInput.press('Tab');

    // Complete inline editing by selecting priority and type
    const prioritySelect = page.locator('[data-testid="notes-table"] select').first();
    await prioritySelect.selectOption({ index: 1 });
    const typeSelect = page.locator('[data-testid="notes-table"] select').first();
    await typeSelect.selectOption({ index: 1 });

    // Wait for editing to finish
    await expect(page.locator('[data-testid="notes-table"] select')).toHaveCount(0, { timeout: 2000 });

    // Now click on the priority cell of the note we just created
    // Column order: actions(0), priority(1), type(2), ...
    const noteRow = page.locator('[data-testid="notes-table"] tbody tr').filter({ hasText: 'Existing Note Click Test' });
    const priorityCell = noteRow.locator('td').nth(1);
    await priorityCell.click();

    // Priority select should appear
    const editPrioritySelect = page.locator('[data-testid="notes-table"] select').first();
    await expect(editPrioritySelect).toBeVisible();

    // Select a new priority — should advance to type
    await editPrioritySelect.selectOption({ index: 2 });

    // Type select should appear and be focused
    const editTypeSelect = page.locator('[data-testid="notes-table"] select').first();
    await expect(editTypeSelect).toBeFocused({ timeout: 2000 });
  });
});
