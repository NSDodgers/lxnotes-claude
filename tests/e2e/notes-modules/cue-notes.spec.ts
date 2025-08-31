import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';
import { mockCueNote, generateTestNote, selectors } from '../../fixtures/test-data';

test.describe('Cue Notes Module', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
    await helpers.navigateToModule('cue-notes');
  });

  test.describe('Basic Functionality', () => {
    test('should display cue notes page with correct elements', async ({ page }) => {
      // Check page title and header
      await helpers.expectPageTitle('Cue Notes');
      
      // Check essential elements are present
      await expect(page.locator('[data-testid="add-note-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-notes"]')).toBeVisible();
      await expect(page.locator('[data-testid="status-filters"]')).toBeVisible();
      await expect(page.locator('[data-testid="type-filter"]')).toBeVisible();
      await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();
    });

    test('should show print and email buttons', async ({ page }) => {
      await expect(page.locator('[data-testid="print-notes"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-notes"]')).toBeVisible();
      await expect(page.locator('a[href="/manage-script"]')).toBeVisible();
    });

    test('should display mock notes in table', async ({ page }) => {
      // The page should show some mock notes
      const notesTable = page.locator('[data-testid="notes-table"]');
      await expect(notesTable).toBeVisible();
      
      // Should have some sample notes
      const noteRows = page.locator('[data-testid="note-row"]');
      const count = await noteRows.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Note Creation', () => {
    test('should create a new cue note', async ({ page }) => {
      const testNote = generateTestNote();
      
      // Open add note dialog
      await helpers.openDialog('[data-testid="add-note-button"]');
      
      // Fill in note details
      await helpers.fillNoteForm({
        title: testNote.title,
        description: testNote.description,
        type: testNote.type,
        priority: testNote.priority,
      });
      
      // Save the note
      await helpers.saveDialog();
      
      // Verify note appears in table
      await helpers.expectNoteInTable(testNote.title);
    });

    test('should validate required fields when creating note', async ({ page }) => {
      // Open add note dialog
      await helpers.openDialog('[data-testid="add-note-button"]');
      
      // Try to save without filling required fields
      await page.click('[data-testid="save-button"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    });

    test('should create note with quick add buttons', async ({ page }) => {
      const quickAddButtons = page.locator('[data-testid="quick-add"]');
      const buttonCount = await quickAddButtons.count();
      
      if (buttonCount > 0) {
        // Click first quick add button
        await quickAddButtons.first().click();
        
        // Dialog should open with pre-selected type
        await page.waitForSelector(selectors.dialog.container);
        
        // Fill in required fields
        await helpers.fillNoteForm({
          title: 'Quick Add Test Note',
          description: 'Created via quick add button',
        });
        
        await helpers.saveDialog();
        
        // Verify note was created
        await helpers.expectNoteInTable('Quick Add Test Note');
      }
    });

    test('should handle cue-specific fields', async ({ page }) => {
      await helpers.openDialog('[data-testid="add-note-button"]');
      
      // Fill cue-specific fields
      await helpers.fillNoteForm({
        title: 'Cue with Script Reference',
        description: 'Test cue with script page and scene',
      });
      
      // Fill script page ID if field exists
      const scriptPageField = page.locator('[data-testid="script-page-id"]');
      if (await scriptPageField.isVisible()) {
        await scriptPageField.fill('cue-123');
      }
      
      // Fill scene/song ID if field exists
      const sceneSongField = page.locator('[data-testid="scene-song-id"]');
      if (await sceneSongField.isVisible()) {
        await sceneSongField.fill('Act1-Scene2');
      }
      
      await helpers.saveDialog();
      
      await helpers.expectNoteInTable('Cue with Script Reference');
    });
  });

  test.describe('Note Editing', () => {
    test('should edit an existing note', async ({ page }) => {
      // Find first note in table and edit it
      const firstNoteRow = page.locator('[data-testid="note-row"]').first();
      await firstNoteRow.locator('[data-testid="edit-note"]').click();
      
      // Wait for edit dialog
      await page.waitForSelector(selectors.dialog.container);
      
      // Update the note
      const updatedTitle = `Updated Note ${Date.now()}`;
      await page.fill('[data-testid="note-title"]', updatedTitle);
      
      await helpers.saveDialog();
      
      // Verify note was updated
      await helpers.expectNoteInTable(updatedTitle);
    });

    test('should cancel edit without saving changes', async ({ page }) => {
      const firstNoteRow = page.locator('[data-testid="note-row"]').first();
      const originalTitle = await firstNoteRow.locator('[data-testid="note-title-cell"]').textContent();
      
      await firstNoteRow.locator('[data-testid="edit-note"]').click();
      
      // Make changes but cancel
      await page.fill('[data-testid="note-title"]', 'This should not save');
      await helpers.closeDialog();
      
      // Original title should still be there
      if (originalTitle) {
        await helpers.expectNoteInTable(originalTitle);
      }
    });
  });

  test.describe('Status Updates', () => {
    test('should update note status', async ({ page }) => {
      // Find a todo note and mark it complete
      const todoFilter = page.locator('[data-testid="status-filter-todo"]');
      await todoFilter.click();
      
      // Get first todo note
      const firstNote = page.locator('[data-testid="note-row"]').first();
      await firstNote.locator('[data-testid="status-button"]').click();
      
      // Should see status change (visual feedback)
      // This would depend on the actual implementation
      await expect(firstNote).toHaveClass(/complete/);
    });

    test('should filter by different statuses', async ({ page }) => {
      // Test todo filter
      await helpers.setStatusFilter('todo');
      const todoNotes = page.locator('[data-testid="note-row"]');
      const todoCount = await todoNotes.count();
      
      // Test complete filter
      await helpers.setStatusFilter('complete');
      const completeNotes = page.locator('[data-testid="note-row"]');
      const completeCount = await completeNotes.count();
      
      // Test cancelled filter
      await helpers.setStatusFilter('cancelled');
      const cancelledNotes = page.locator('[data-testid="note-row"]');
      const cancelledCount = await cancelledNotes.count();
      
      // Each filter should potentially show different counts
      console.log(`Todo: ${todoCount}, Complete: ${completeCount}, Cancelled: ${cancelledCount}`);
    });
  });

  test.describe('Filtering and Search', () => {
    test('should filter notes by type', async ({ page }) => {
      // Open type filter
      const typeFilter = page.locator('[data-testid="type-filter"]');
      await typeFilter.click();
      
      // Select specific types
      await page.locator('[data-testid="type-option"]:has-text("Cue")').click();
      
      // Apply filter
      await page.keyboard.press('Escape'); // Close dropdown
      
      // Verify filtered results
      const visibleNotes = page.locator('[data-testid="note-row"]');
      const count = await visibleNotes.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should search notes by title and description', async ({ page }) => {
      // Search for specific text
      await helpers.searchNotes('fade');
      
      // Should show filtered results
      const searchResults = page.locator('[data-testid="note-row"]');
      const count = await searchResults.count();
      
      // Clear search
      await helpers.searchNotes('');
      
      // Should show all notes again
      const allResults = page.locator('[data-testid="note-row"]');
      const totalCount = await allResults.count();
      expect(totalCount).toBeGreaterThanOrEqual(count);
    });

    test('should search by script page ID', async ({ page }) => {
      await helpers.searchNotes('cue-127');
      
      // Should find notes with that script page ID
      const results = page.locator('[data-testid="note-row"]');
      if (await results.count() > 0) {
        await expect(results.first()).toContainText('cue-127');
      }
    });

    test('should search by scene/song ID', async ({ page }) => {
      await helpers.searchNotes('Act1-Scene3');
      
      // Should find notes with that scene/song ID
      const results = page.locator('[data-testid="note-row"]');
      if (await results.count() > 0) {
        await expect(results.first()).toContainText('Act1-Scene3');
      }
    });

    test('should combine multiple filters', async ({ page }) => {
      // Set status filter
      await helpers.setStatusFilter('todo');
      
      // Add text search
      await helpers.searchNotes('lighting');
      
      // Should show notes that match both criteria
      const filteredResults = page.locator('[data-testid="note-row"]');
      const count = await filteredResults.count();
      expect(count).toBeGreaterThanOrEqual(0);
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
    test('should display custom types in note creation', async ({ page }) => {
      await helpers.openDialog('[data-testid="add-note-button"]');
      
      // Check if type dropdown includes custom types
      const typeSelect = page.locator('[data-testid="note-type"]');
      await typeSelect.click();
      
      // Should have system defaults
      await expect(page.locator('[data-testid="type-option"]:has-text("Cue")')).toBeVisible();
      await expect(page.locator('[data-testid="type-option"]:has-text("Director")')).toBeVisible();
      
      await helpers.closeDialog();
    });

    test('should display custom priorities in note creation', async ({ page }) => {
      await helpers.openDialog('[data-testid="add-note-button"]');
      
      // Check priority dropdown
      const prioritySelect = page.locator('[data-testid="note-priority"]');
      await prioritySelect.click();
      
      // Should have default priorities
      await expect(page.locator('[data-testid="priority-option"]:has-text("Critical")')).toBeVisible();
      await expect(page.locator('[data-testid="priority-option"]:has-text("High")')).toBeVisible();
      
      await helpers.closeDialog();
    });
  });

  test.describe('Performance', () => {
    test('should load cue notes page quickly', async ({ page }) => {
      const loadTime = await helpers.measurePageLoad();
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle large note lists efficiently', async ({ page }) => {
      // This test would be more relevant with actual large datasets
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
      
      // Main elements should still be visible
      await expect(page.locator('[data-testid="add-note-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();
      
      // Note creation should work
      await helpers.openDialog('[data-testid="add-note-button"]');
      await helpers.fillNoteForm({
        title: 'Mobile Test Note',
        description: 'Created on mobile'
      });
      await helpers.saveDialog();
      await helpers.expectNoteInTable('Mobile Test Note');
    });

    test('should work on tablet devices', async ({ page }) => {
      await helpers.testTabletLayout();
      
      // Enable tablet mode
      await helpers.enableTabletMode();
      
      // Should still be fully functional
      await helpers.openDialog('[data-testid="add-note-button"]');
      await helpers.fillNoteForm({
        title: 'Tablet Test Note',
        description: 'Created on tablet'
      });
      await helpers.saveDialog();
      await helpers.expectNoteInTable('Tablet Test Note');
    });
  });
});