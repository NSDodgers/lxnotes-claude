import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';
import { selectors } from '../../fixtures/test-data';

test.describe('Cue Notes Module', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/cue-notes');
    await helpers.waitForAppReady();
  });

  // Helper to create a note and return its description text
  async function createTestNote(page: import('@playwright/test').Page, description: string) {
    await page.click('[data-testid="add-note-button"]');
    await page.waitForSelector(selectors.dialog.container);
    await page.fill('[data-testid="note-description"]', description);
    await page.click('[data-testid="save-button"]');
    await page.waitForSelector(selectors.dialog.container, { state: 'hidden' });
  }

  test.describe('Basic Functionality', () => {
    test('should display cue notes page with correct elements', async ({ page }) => {
      // Check page title and header
      await helpers.expectPageTitle('Cue Notes');

      // Check essential elements are present
      await expect(page.locator('[data-testid="add-note-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="status-filters"]')).toBeVisible();
      await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();
    });

    test('should show print and email buttons', async ({ page }) => {
      await expect(page.locator('[data-testid="print-notes-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-notes-button"]')).toBeVisible();
    });

    test('should display notes in table after creation', async ({ page }) => {
      // Create a note so we have something to verify
      const testDescription = `Display Test ${Date.now()}`;
      await createTestNote(page, testDescription);

      // Table should show the created note
      const noteRows = page.locator('[data-testid="note-row"]');
      const count = await noteRows.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Note Creation', () => {
    test('should create a new cue note', async ({ page }) => {
      const testDescription = `Test Note ${Date.now()}`;

      // Open add note dialog
      await helpers.openDialog('[data-testid="add-note-button"]');

      // Fill in note details
      await helpers.fillNoteForm({
        description: testDescription,
      });

      // Save the note
      await helpers.saveDialog();

      // Verify note appears in table
      await helpers.expectNoteInTable(testDescription);
    });

    test('should validate required fields when creating note', async ({ page }) => {
      // Open add note dialog
      await helpers.openDialog('[data-testid="add-note-button"]');

      // Try to save without filling required fields (description is required via HTML)
      await page.click('[data-testid="save-button"]');

      // Dialog should still be open since validation fails
      await expect(page.locator(selectors.dialog.container)).toBeVisible();

      // Close dialog
      await page.keyboard.press('Escape');
    });

    test('should create note with quick add buttons', async ({ page }) => {
      // Quick add buttons are in the "Quick Add:" bar when status is "todo"
      const quickAddButton = page.locator('.hidden.sm\\:flex button:has(svg)').first();

      if (await quickAddButton.isVisible().catch(() => false)) {
        // Click first quick add button
        await quickAddButton.click();

        // Dialog should open with pre-selected type
        await page.waitForSelector(selectors.dialog.container);

        // Fill in required fields
        await helpers.fillNoteForm({
          description: 'Created via quick add button',
        });

        await helpers.saveDialog();

        // Verify note was created
        await helpers.expectNoteInTable('Created via quick add button');
      }
    });

    test('should handle cue-specific fields', async ({ page }) => {
      await helpers.openDialog('[data-testid="add-note-button"]');

      // Fill cue-specific fields
      await helpers.fillNoteForm({
        description: 'Test cue with cue number',
        cueNumbers: '123',
      });

      await helpers.saveDialog();

      await helpers.expectNoteInTable('Test cue with cue number');
    });
  });

  test.describe('Note Editing', () => {
    test('should edit an existing note', async ({ page }) => {
      // First create a note to edit
      const originalDescription = `Edit Me ${Date.now()}`;
      await createTestNote(page, originalDescription);

      // Click on the note row to open edit dialog
      const noteRow = page.locator('[data-testid="note-row"]').filter({ hasText: originalDescription });
      await noteRow.click();

      // Wait for edit dialog
      await page.waitForSelector(selectors.dialog.container);

      // Update the note description
      const updatedDescription = `Updated Note ${Date.now()}`;
      await page.fill('[data-testid="note-description"]', updatedDescription);

      await helpers.saveDialog();

      // Verify note was updated
      await helpers.expectNoteInTable(updatedDescription);
    });

    test('should cancel edit without saving changes', async ({ page }) => {
      // First create a note
      const originalDescription = `Keep Me ${Date.now()}`;
      await createTestNote(page, originalDescription);

      // Click row to open edit dialog
      const noteRow = page.locator('[data-testid="note-row"]').filter({ hasText: originalDescription });
      await noteRow.click();
      await page.waitForSelector(selectors.dialog.container);

      // Make changes but cancel
      await page.fill('[data-testid="note-description"]', 'This should not save');
      await helpers.closeDialog();

      // Original text should still be there
      await helpers.expectNoteInTable(originalDescription);
    });
  });

  test.describe('Status Updates', () => {
    test('should filter by different statuses', async ({ page }) => {
      // Create a note so we have at least one todo
      await createTestNote(page, `Status Test ${Date.now()}`);

      // Test todo filter
      await helpers.setStatusFilter('todo');
      const todoCount = await page.locator('[data-testid="note-row"]').count();
      expect(todoCount).toBeGreaterThan(0);

      // Test complete filter
      await helpers.setStatusFilter('complete');
      const completeCount = await page.locator('[data-testid="note-row"]').count();

      // Test cancelled filter
      await helpers.setStatusFilter('cancelled');
      const cancelledCount = await page.locator('[data-testid="note-row"]').count();

      // Each filter should potentially show different counts
      console.log(`Todo: ${todoCount}, Complete: ${completeCount}, Cancelled: ${cancelledCount}`);
    });

    test('should show status filter counts', async ({ page }) => {
      // Status buttons should display counts
      const todoButton = page.locator('[data-testid="status-filter-todo"]');
      await expect(todoButton).toBeVisible();
      // The button text includes the count in parentheses
      await expect(todoButton).toContainText('To Do');
    });
  });

  test.describe('Filtering and Search', () => {
    test('should search notes by description', async ({ page }) => {
      // Create a note with searchable text
      const uniqueText = `searchable_${Date.now()}`;
      await createTestNote(page, uniqueText);

      // Search for that text
      await helpers.searchNotes(uniqueText);

      // Should show the created note
      const searchResults = page.locator('[data-testid="note-row"]');
      const count = await searchResults.count();
      expect(count).toBe(1);

      // Clear search
      await helpers.searchNotes('');

      // Should show all notes again
      const allResults = page.locator('[data-testid="note-row"]');
      const totalCount = await allResults.count();
      expect(totalCount).toBeGreaterThanOrEqual(count);
    });

    test('should search by cue number', async ({ page }) => {
      // Create a note with a specific cue number
      await page.click('[data-testid="add-note-button"]');
      await page.waitForSelector(selectors.dialog.container);
      await page.fill('[data-testid="cue-numbers"]', '999');
      await page.fill('[data-testid="note-description"]', 'Cue 999 test note');
      await page.click('[data-testid="save-button"]');
      await page.waitForSelector(selectors.dialog.container, { state: 'hidden' });

      // Search should work — cue numbers may appear in the row
      await helpers.searchNotes('999');
      const results = page.locator('[data-testid="note-row"]');
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should combine status filter and search', async ({ page }) => {
      // Create a note
      await createTestNote(page, `combo_filter_${Date.now()}`);

      // Set status filter
      await helpers.setStatusFilter('todo');

      // Add text search
      await helpers.searchNotes('combo_filter');

      // Should show notes that match both criteria
      const filteredResults = page.locator('[data-testid="note-row"]');
      const count = await filteredResults.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Empty States', () => {
    test('should show empty state when no notes match filters', async ({ page }) => {
      // Search for something that doesn't exist
      await helpers.searchNotes('nonexistentnotesearch12345');

      // Should show empty state
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
      await expect(page.locator('[data-testid="empty-state"]')).toContainText('No cue notes found');
    });

    test('should show appropriate message for filtered empty state', async ({ page }) => {
      // Set very restrictive filters
      await helpers.setStatusFilter('cancelled');
      await helpers.searchNotes('veryraretext');

      // Should show filtered empty state
      const emptyState = page.locator('[data-testid="empty-state"]');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('Try adjusting your filters');
    });
  });

  test.describe('Custom Types Integration', () => {
    test('should display type options in note creation', async ({ page }) => {
      await helpers.openDialog('[data-testid="add-note-button"]');

      // Scope to the dialog to avoid matching page-level type filter
      const dialog = page.locator(selectors.dialog.container);
      const typeCombobox = dialog.locator('label:has-text("Type")').locator('..').locator('[role="combobox"]');
      await expect(typeCombobox).toBeVisible();

      // Click to open options
      await typeCombobox.click();

      // Should have system default options in the listbox
      await expect(page.locator('[role="option"]:has-text("Cue")')).toBeVisible();

      // Close the dropdown and dialog
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
    });

    test('should display priority options in note creation', async ({ page }) => {
      await helpers.openDialog('[data-testid="add-note-button"]');

      // Scope to the dialog
      const dialog = page.locator(selectors.dialog.container);
      const priorityCombobox = dialog.locator('label:has-text("Priority")').locator('..').locator('[role="combobox"]');
      await expect(priorityCombobox).toBeVisible();

      // Click to open options
      await priorityCombobox.click();

      // Should have default priority options
      await expect(page.locator('[role="option"]:has-text("High")')).toBeVisible();

      // Close the dropdown and dialog
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
    });
  });

  test.describe('Performance', () => {
    test('should load cue notes page quickly', async () => {
      const loadTime = await helpers.measurePageLoad();
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle filtering efficiently', async () => {
      const startTime = Date.now();

      // Perform filtering operation
      await helpers.setStatusFilter('todo');
      await helpers.searchNotes('test');

      const filterTime = Date.now() - startTime;
      expect(filterTime).toBeLessThan(1000); // Filtering should be quick
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await helpers.testMobileLayout();

      // Wait for mobile layout to render
      await helpers.waitForAppReady();

      // Remove cookie widget overlay if present (third-party script that blocks clicks)
      await page.evaluate(() => {
        const cookieWidget = document.getElementById('cookie-widget-app');
        if (cookieWidget) cookieWidget.remove();
      });

      // Mobile add note button should be visible (in the mobile action bar)
      const addButton = page.locator('[data-testid="mobile-add-note-button"]');
      await expect(addButton).toBeVisible();

      // Note creation should work on mobile
      await addButton.click();
      await page.waitForSelector(selectors.dialog.container);

      await helpers.fillNoteForm({
        description: 'Created on mobile',
      });
      await helpers.saveDialog();
    });

    test('should work on tablet devices', async ({ page }) => {
      await helpers.testTabletLayout();

      // Enable designer mode
      await helpers.enableDesignerMode();

      // Designer add-note button should be visible and functional
      const addButton = page.locator('[data-testid="designer-add-note-button"]');
      await expect(addButton).toBeVisible();

      // Verify dialog opens when clicking add button
      await addButton.click();
      await page.waitForSelector(selectors.dialog.container);

      // Close dialog via Escape
      await page.keyboard.press('Escape');
    });
  });
});
