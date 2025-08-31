import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Error Handling & Performance', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', (route) => {
        route.abort('failed');
      });

      await helpers.navigateToModule('cue-notes');

      // Try to create a note during network failure
      await helpers.openDialog('[data-testid="add-note-button"]');
      await helpers.fillNoteForm({
        title: 'Network Test Note',
        description: 'This should fail gracefully',
        type: 'Cue',
        priority: 'high'
      });

      const saveButton = page.locator('[data-testid="save-button"]');
      await saveButton.click();

      // Should show error message
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('network');

      // Should allow retry
      const retryButton = page.locator('[data-testid="retry-button"]');
      if (await retryButton.count() > 0) {
        await expect(retryButton).toBeVisible();
      }

      await helpers.closeDialog();

      // Restore network
      await page.unroute('**/api/**');
    });

    test('should validate form inputs and show helpful errors', async ({ page }) => {
      await helpers.navigateToModule('production-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');

      const dialog = page.locator('[data-testid="note-dialog"]');
      
      // Try to save with empty title
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Should show validation error
      const titleError = dialog.locator('[data-testid="title-error"]');
      await expect(titleError).toBeVisible();
      await expect(titleError).toContainText('required');

      // Fill title but leave description empty (if required)
      await dialog.locator('[data-testid="note-title"]').fill('Test Title');
      await dialog.locator('[data-testid="save-button"]').click();

      // Should show description error if required
      const descError = dialog.locator('[data-testid="description-error"]');
      if (await descError.count() > 0) {
        await expect(descError).toBeVisible();
      }

      // Fill all required fields
      await dialog.locator('[data-testid="note-description"]').fill('Test description');
      await dialog.locator('[data-testid="save-button"]').click();

      // Should succeed now
      await expect(dialog).not.toBeVisible();
      await helpers.expectNoteInTable('Test Title');
    });

    test('should handle malformed data gracefully', async ({ page }) => {
      // Mock API to return malformed data
      await page.route('**/api/notes**', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({
              // Malformed response - missing required fields
              data: [
                { id: 1, title: null, description: undefined },
                { id: 2, /* missing title */ description: 'Test' }
              ]
            })
          });
        } else {
          route.continue();
        }
      });

      await helpers.navigateToModule('work-notes');

      // Should handle malformed data without crashing
      const notesTable = page.locator('[data-testid="notes-table"]');
      await expect(notesTable).toBeVisible();

      // Should show error state or empty state rather than crashing
      const errorState = page.locator('[data-testid="data-error"]');
      const emptyState = page.locator('[data-testid="empty-state"]');
      
      const hasError = await errorState.count() > 0;
      const isEmpty = await emptyState.count() > 0;
      
      expect(hasError || isEmpty).toBeTruthy();

      await page.unroute('**/api/notes**');
    });

    test('should handle preset deletion errors', async ({ page }) => {
      await helpers.navigateToSettingsTab('presets');

      // Mock deletion API to fail
      await page.route('**/api/presets/**', (route) => {
        if (route.request().method() === 'DELETE') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Deletion failed' })
          });
        } else {
          route.continue();
        }
      });

      const filterSection = page.locator('[data-testid="filter-sort-presets"]');
      
      // First create a preset to delete
      await filterSection.locator('[data-testid="add-preset"]').click();
      let dialog = page.locator('[data-testid="preset-dialog"]');
      await dialog.locator('[data-testid="preset-name"]').fill('Error Test Preset');
      await dialog.selectOption('[data-testid="module-type"]', 'cue');
      await dialog.locator('[data-testid="save-button"]').click();

      // Now try to delete it
      const presetCard = filterSection.locator('[data-testid="preset-card"]:has-text("Error Test Preset")');
      await presetCard.locator('[data-testid="delete-preset"]').click();

      const confirmDialog = page.locator('[data-testid="delete-confirmation"]');
      await confirmDialog.locator('[data-testid="confirm-delete"]').click();

      // Should show deletion error
      const deleteError = page.locator('[data-testid="delete-error"]');
      await expect(deleteError).toBeVisible();
      await expect(deleteError).toContainText('failed');

      // Preset should still be visible (deletion failed)
      await expect(presetCard).toBeVisible();

      await page.unroute('**/api/presets/**');
    });

    test('should handle file upload errors', async ({ page }) => {
      await helpers.navigateToSettingsTab('presets');

      // Mock file upload failure
      await page.route('**/api/import**', (route) => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid file format' })
        });
      });

      const importButton = page.locator('[data-testid="import-settings"]');
      if (await importButton.count() > 0) {
        // Set up file upload
        const fileInput = page.locator('input[type="file"]');
        
        if (await fileInput.count() > 0) {
          // Upload invalid file
          await fileInput.setInputFiles({
            name: 'invalid.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('invalid content')
          });

          // Should show import error
          const importError = page.locator('[data-testid="import-error"]');
          await expect(importError).toBeVisible();
          await expect(importError).toContainText('Invalid file');
        }
      }

      await page.unroute('**/api/import**');
    });

    test('should handle concurrent editing conflicts', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');

      // Create a note to edit
      await helpers.openDialog('[data-testid="add-note-button"]');
      await helpers.fillNoteForm({
        title: 'Conflict Test Note',
        description: 'Original description',
        type: 'Cue',
        priority: 'medium'
      });
      await helpers.saveDialog();

      // Simulate concurrent edit by mocking API response
      await page.route('**/api/notes/**', (route) => {
        if (route.request().method() === 'PUT') {
          route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({ 
              error: 'Conflict: Note was modified by another user',
              currentVersion: {
                title: 'Conflict Test Note',
                description: 'Modified by another user'
              }
            })
          });
        } else {
          route.continue();
        }
      });

      // Try to edit the note
      const noteRow = page.locator('[data-testid="note-row"]:has-text("Conflict Test Note")');
      await noteRow.locator('[data-testid="edit-note"]').click();

      const editDialog = page.locator('[data-testid="note-dialog"]');
      await editDialog.locator('[data-testid="note-description"]').fill('My changes');
      await editDialog.locator('[data-testid="save-button"]').click();

      // Should show conflict resolution dialog
      const conflictDialog = page.locator('[data-testid="conflict-resolution"]');
      await expect(conflictDialog).toBeVisible();
      
      // Should show both versions
      await expect(conflictDialog).toContainText('My changes');
      await expect(conflictDialog).toContainText('Modified by another user');

      // Should allow choosing version
      const useMyVersionButton = conflictDialog.locator('[data-testid="use-my-version"]');
      const useTheirVersionButton = conflictDialog.locator('[data-testid="use-their-version"]');
      
      await expect(useMyVersionButton).toBeVisible();
      await expect(useTheirVersionButton).toBeVisible();

      await conflictDialog.locator('[data-testid="cancel-edit"]').click();
      await helpers.closeDialog();

      await page.unroute('**/api/notes/**');
    });
  });

  test.describe('Performance Tests', () => {
    test('should load initial page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await helpers.waitForAppReady();
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000); // 5 second load time budget
      
      // Check that all critical elements are visible
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="app-header"]')).toBeVisible();
    });

    test('should handle rapid navigation efficiently', async ({ page }) => {
      const modules = ['cue-notes', 'work-notes', 'production-notes'];
      const navigationTimes: number[] = [];

      // Test rapid switching between modules
      for (let i = 0; i < 10; i++) {
        const module = modules[i % modules.length];
        
        const startTime = Date.now();
        await helpers.navigateToModule(module);
        await page.waitForSelector('[data-testid="notes-table"]');
        const navTime = Date.now() - startTime;
        
        navigationTimes.push(navTime);
      }

      // Average navigation time should be reasonable
      const avgTime = navigationTimes.reduce((a, b) => a + b) / navigationTimes.length;
      expect(avgTime).toBeLessThan(1000); // 1 second average

      // No navigation should take extremely long
      const maxTime = Math.max(...navigationTimes);
      expect(maxTime).toBeLessThan(3000); // 3 second max
    });

    test('should handle large search results efficiently', async ({ page }) => {
      await helpers.navigateToModule('production-notes');

      // Search for common term that might return many results
      const searchStart = Date.now();
      await helpers.searchNotes('e'); // Single letter likely to match many items
      
      // Wait for search to complete
      await page.waitForTimeout(500); // Allow search debounce
      
      const searchTime = Date.now() - searchStart;
      expect(searchTime).toBeLessThan(2000); // 2 second search budget

      // UI should remain responsive during search
      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toBeEnabled();

      // Clear search efficiently
      const clearStart = Date.now();
      await searchInput.clear();
      await page.waitForTimeout(500); // Allow debounce
      const clearTime = Date.now() - clearStart;
      
      expect(clearTime).toBeLessThan(1000); // 1 second to clear
    });

    test('should handle multiple dialog operations efficiently', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');

      const operationTimes: number[] = [];

      // Test opening/closing dialogs rapidly
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        // Open dialog
        await helpers.openDialog('[data-testid="add-note-button"]');
        
        // Close dialog
        await helpers.closeDialog();
        
        const operationTime = Date.now() - startTime;
        operationTimes.push(operationTime);
      }

      // Each open/close cycle should be fast
      const avgTime = operationTimes.reduce((a, b) => a + b) / operationTimes.length;
      expect(avgTime).toBeLessThan(800); // 800ms average per cycle

      // No operation should be extremely slow
      const maxTime = Math.max(...operationTimes);
      expect(maxTime).toBeLessThan(2000); // 2 second max
    });

    test('should maintain performance with complex filters', async ({ page }) => {
      await helpers.navigateToModule('work-notes');

      const filterStart = Date.now();

      // Apply multiple filters
      const statusFilter = page.locator('[data-testid="status-filter"]');
      await statusFilter.selectOption('todo');

      const typeFilter = page.locator('[data-testid="type-filter"]');
      await typeFilter.click();
      await page.locator('[data-testid="type-option"]').first().click();
      await page.keyboard.press('Escape');

      const priorityFilter = page.locator('[data-testid="priority-filter"]');
      if (await priorityFilter.count() > 0) {
        await priorityFilter.click();
        await page.locator('[data-testid="priority-option"]').first().click();
        await page.keyboard.press('Escape');
      }

      // Apply search on top of filters
      await helpers.searchNotes('focus');

      // Wait for all filters to apply
      await page.waitForTimeout(1000);

      const totalFilterTime = Date.now() - filterStart;
      expect(totalFilterTime).toBeLessThan(3000); // 3 second budget for complex filtering

      // Results should be visible
      const resultsTable = page.locator('[data-testid="notes-table"]');
      await expect(resultsTable).toBeVisible();

      // Clear all filters efficiently
      const clearStart = Date.now();
      
      await statusFilter.selectOption('');
      await page.locator('[data-testid="clear-filters"]').click();
      await page.locator('[data-testid="search-input"]').clear();
      
      await page.waitForTimeout(500);
      const clearTime = Date.now() - clearStart;
      
      expect(clearTime).toBeLessThan(1500); // 1.5 second to clear all
    });

    test('should handle preset operations efficiently', async ({ page }) => {
      await helpers.navigateToSettingsTab('presets');

      const presetOperations: number[] = [];

      // Test creating presets rapidly
      for (let i = 0; i < 3; i++) {
        const operationStart = Date.now();

        const filterSection = page.locator('[data-testid="filter-sort-presets"]');
        await filterSection.locator('[data-testid="add-preset"]').click();

        const dialog = page.locator('[data-testid="preset-dialog"]');
        await dialog.locator('[data-testid="preset-name"]').fill(`Performance Test ${i}`);
        await dialog.selectOption('[data-testid="module-type"]', 'cue');
        await dialog.locator('[data-testid="save-button"]').click();

        // Wait for preset to appear
        await expect(filterSection).toContainText(`Performance Test ${i}`);

        const operationTime = Date.now() - operationStart;
        presetOperations.push(operationTime);
      }

      // Each preset creation should be reasonable
      const avgTime = presetOperations.reduce((a, b) => a + b) / presetOperations.length;
      expect(avgTime).toBeLessThan(2000); // 2 second average per preset

      // No single operation should be extremely slow
      const maxTime = Math.max(...presetOperations);
      expect(maxTime).toBeLessThan(5000); // 5 second max
    });
  });

  test.describe('Resource Management', () => {
    test('should not leak memory during extended use', async ({ page }) => {
      // This is a basic test - full memory leak testing would require more specialized tools
      await helpers.navigateToModule('cue-notes');

      // Perform many operations that could cause leaks
      for (let i = 0; i < 20; i++) {
        // Open and close dialogs
        await helpers.openDialog('[data-testid="add-note-button"]');
        await page.locator('[data-testid="note-title"]').fill(`Memory Test ${i}`);
        await helpers.closeDialog();

        // Navigate between modules
        const modules = ['cue-notes', 'work-notes', 'production-notes'];
        await helpers.navigateToModule(modules[i % modules.length]);

        // Perform searches
        await helpers.searchNotes(`test${i}`);
        await page.locator('[data-testid="search-input"]').clear();
      }

      // App should still be responsive after extensive use
      const finalNavStart = Date.now();
      await helpers.navigateToModule('cue-notes');
      await page.waitForSelector('[data-testid="notes-table"]');
      const finalNavTime = Date.now() - finalNavStart;

      expect(finalNavTime).toBeLessThan(2000); // Should not degrade significantly
    });

    test('should handle large file operations efficiently', async ({ page }) => {
      await helpers.navigateToSettingsTab('presets');

      // Test export performance
      const exportStart = Date.now();
      
      const exportButton = page.locator('[data-testid="export-settings"]');
      if (await exportButton.count() > 0) {
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        
        const download = await downloadPromise;
        const exportTime = Date.now() - exportStart;
        
        expect(exportTime).toBeLessThan(3000); // 3 second export budget
        expect(download.suggestedFilename()).toMatch(/\.(json|zip)$/);
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle browser back/forward correctly', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      
      // Navigate to settings
      await helpers.navigateToSettingsTab('presets');
      
      // Use browser back
      await page.goBack();
      
      // Should return to cue notes
      await expect(page.locator('h1')).toContainText('Cue Notes');
      
      // Use browser forward
      await page.goForward();
      
      // Should return to settings
      await expect(page.locator('h1')).toContainText('Settings');
      
      // App should remain functional
      const presetSection = page.locator('[data-testid="filter-sort-presets"]');
      await expect(presetSection).toBeVisible();
    });

    test('should handle page refresh gracefully', async ({ page }) => {
      await helpers.navigateToModule('work-notes');
      
      // Apply some filters and search
      await helpers.searchNotes('test');
      const statusFilter = page.locator('[data-testid="status-filter"]');
      await statusFilter.selectOption('todo');
      
      // Refresh page
      await page.reload();
      await helpers.waitForAppReady();
      
      // Should return to default state but remain functional
      const searchInput = page.locator('[data-testid="search-input"]');
      const searchValue = await searchInput.inputValue();
      
      // Search should be cleared after refresh (expected behavior)
      expect(searchValue).toBe('');
      
      // Should be able to perform new operations
      await helpers.searchNotes('refresh');
      const newSearchValue = await searchInput.inputValue();
      expect(newSearchValue).toBe('refresh');
    });

    test('should handle rapid user interactions gracefully', async ({ page }) => {
      await helpers.navigateToModule('production-notes');
      
      // Rapid clicking should not cause issues
      const addButton = page.locator('[data-testid="add-note-button"]');
      
      // Click rapidly multiple times
      await addButton.click();
      await addButton.click();
      await addButton.click();
      
      // Only one dialog should open
      const dialogs = page.locator('[data-testid="note-dialog"]');
      const dialogCount = await dialogs.count();
      
      expect(dialogCount).toBeLessThanOrEqual(1);
      
      if (dialogCount === 1) {
        await helpers.closeDialog();
      }
      
      // App should remain responsive
      await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();
    });

    test('should handle invalid URL routes gracefully', async ({ page }) => {
      // Navigate to invalid route
      await page.goto('/invalid-route');
      
      // Should handle gracefully (redirect to home or show 404)
      const is404 = await page.locator('h1:has-text("404")').count() > 0;
      const isHome = await page.locator('[data-testid="sidebar"]').count() > 0;
      
      expect(is404 || isHome).toBeTruthy();
      
      // If redirected to home, app should be functional
      if (isHome) {
        await helpers.navigateToModule('cue-notes');
        await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();
      }
    });
  });
});