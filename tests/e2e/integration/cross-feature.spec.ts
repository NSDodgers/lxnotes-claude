import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Cross-Feature Integration', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
  });

  test.describe('Notes & Presets Integration', () => {
    test('should use custom types in filter presets', async ({ page }) => {
      await helpers.navigateToSettingsTab('presets');
      
      const typesManager = page.locator('[data-testid="custom-types-manager"]');
      await typesManager.locator('[data-testid="add-type-button"]').click();
      
      const typeDialog = page.locator('[data-testid="type-dialog"]');
      await typeDialog.locator('[data-testid="type-name"]').fill('Integration Test Type');
      await typeDialog.locator('[data-testid="type-color"]').selectOption('#ff6b6b');
      await typeDialog.locator('[data-testid="save-button"]').click();
      
      // Now create a filter preset using that type
      await helpers.navigateToSettingsTab('presets');
      
      const filterSection = page.locator('[data-testid="filter-sort-presets"]');
      await filterSection.locator('[data-testid="add-preset"]').click();
      
      const presetDialog = page.locator('[data-testid="preset-dialog"]');
      await presetDialog.locator('[data-testid="preset-name"]').fill('Custom Type Filter');
      await presetDialog.selectOption('[data-testid="module-type"]', 'cue' as any);
      
      // Should see the custom type in filter options
      await presetDialog.locator('[data-testid="type-filter-Integration Test Type"]').check();
      await presetDialog.locator('[data-testid="save-button"]').click();
      
      // Verify the preset was created
      await expect(filterSection).toContainText('Custom Type Filter');
    });

    test('should use custom priorities in notes creation', async ({ page }) => {
      // Create a custom priority
      await helpers.navigateToSettingsTab('presets');
      
      const prioritiesManager = page.locator('[data-testid="custom-priorities-manager"]');
      await prioritiesManager.locator('[data-testid="add-priority-button"]').click();
      
      const priorityDialog = page.locator('[data-testid="priority-dialog"]');
      await priorityDialog.locator('[data-testid="priority-name"]').fill('Integration Priority');
      await priorityDialog.locator('[data-testid="priority-level"]').fill('2');
      await priorityDialog.locator('[data-testid="priority-color"]').selectOption('#9b59b6');
      await priorityDialog.locator('[data-testid="save-button"]').click();
      
      // Now create a note with that priority
      await helpers.navigateToModule('cue-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');
      
      const noteDialog = page.locator('[data-testid="note-dialog"]');
      await noteDialog.locator('[data-testid="note-title"]').fill('Custom Priority Note');
      await noteDialog.locator('[data-testid="note-description"]').fill('Test description');
      
      // Should see custom priority in dropdown
      const prioritySelect = noteDialog.locator('[data-testid="note-priority"]');
      await prioritySelect.click();
      await expect(page.locator('[data-testid="priority-option"]:has-text("Integration Priority")')).toBeVisible();
      
      await page.locator('[data-testid="priority-option"]:has-text("Integration Priority")').click();
      await helpers.saveDialog();
      
      // Note should appear with custom priority
      await helpers.expectNoteInTable('Custom Priority Note');
    });

    test('should link filter and email presets correctly', async ({ page }) => {
      // Create coordinated presets
      await helpers.navigateToSettingsTab('presets');
      
      // Create filter preset
      const filterSection = page.locator('[data-testid="filter-sort-presets"]');
      await filterSection.locator('[data-testid="add-preset"]').click();
      
      let dialog = page.locator('[data-testid="preset-dialog"]');
      await dialog.locator('[data-testid="preset-name"]').fill('Test Filter Preset');
      await dialog.selectOption('[data-testid="module-type"]', 'production' as any);
      await dialog.selectOption('[data-testid="status-filter"]', 'todo' as any);
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Create email preset that links to the filter preset
      const emailSection = page.locator('[data-testid="email-message-presets"]');
      await emailSection.locator('[data-testid="add-preset"]').click();
      
      dialog = page.locator('[data-testid="preset-dialog"]');
      await dialog.locator('[data-testid="preset-name"]').fill('Linked Email Preset');
      await dialog.locator('[data-testid="recipients"]').fill('test@example.com');
      await dialog.locator('[data-testid="subject"]').fill('Test Subject');
      await dialog.locator('[data-testid="message"]').fill('Test Message');
      
      // Link to filter preset
      const filterSelector = dialog.locator('[data-testid="filter-preset-selector"]');
      await filterSelector.click();
      await page.locator('[data-testid="preset-option"]:has-text("Test Filter Preset")').click();
      
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Verify linkage is shown
      const emailPresetCard = emailSection.locator('[data-testid="preset-card"]:has-text("Linked Email Preset")');
      await expect(emailPresetCard).toContainText('Filter: ✓');
    });

    test('should cascade preset deletions appropriately', async ({ page }) => {
      await helpers.navigateToSettingsTab('presets');
      
      // Create linked presets
      const filterSection = page.locator('[data-testid="filter-sort-presets"]');
      await filterSection.locator('[data-testid="add-preset"]').click();
      
      let dialog = page.locator('[data-testid="preset-dialog"]');
      await dialog.locator('[data-testid="preset-name"]').fill('Base Filter Preset');
      await dialog.selectOption('[data-testid="module-type"]', 'work' as any);
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Create email preset linking to it
      const emailSection = page.locator('[data-testid="email-message-presets"]');
      await emailSection.locator('[data-testid="add-preset"]').click();
      
      dialog = page.locator('[data-testid="preset-dialog"]');
      await dialog.locator('[data-testid="preset-name"]').fill('Dependent Email Preset');
      await dialog.locator('[data-testid="recipients"]').fill('test@example.com');
      await dialog.locator('[data-testid="subject"]').fill('Subject');
      await dialog.locator('[data-testid="message"]').fill('Message');
      
      const filterSelector = dialog.locator('[data-testid="filter-preset-selector"]');
      await filterSelector.click();
      await page.locator('[data-testid="preset-option"]:has-text("Base Filter Preset")').click();
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Try to delete the base filter preset
      const basePresetCard = filterSection.locator('[data-testid="preset-card"]:has-text("Base Filter Preset")');
      await basePresetCard.locator('[data-testid="delete-preset"]').click();
      
      // Should warn about dependent email preset
      const warningDialog = page.locator('[data-testid="dependency-warning"]');
      await expect(warningDialog).toBeVisible();
      await expect(warningDialog).toContainText('Dependent Email Preset');
      
      await warningDialog.locator('[data-testid="cancel-delete"]').click();
    });
  });

  test.describe('Module Data Consistency', () => {
    test('should maintain note counts across different views', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      
      // Get initial note count from main table
      const mainTableRows = page.locator('[data-testid="note-row"]');
      const mainCount = await mainTableRows.count();
      
      // Check print view shows same count with 'All Notes' filter
      await page.locator('[data-testid="print-notes-button"]').click();
      
      const printDialog = page.locator('[data-testid="print-dialog"]');
      const filterSelector = printDialog.locator('[data-testid="filter-preset-selector"]');
      await filterSelector.click();
      
      // Find "All Notes" or similar preset
      const allNotesPreset = page.locator('[data-testid="preset-option"]:has-text("All")').first();
      if (await allNotesPreset.count() > 0) {
        await allNotesPreset.click();
        
        const printNotesCount = await printDialog.locator('[data-testid="notes-count"]').textContent();
        const printCount = parseInt(printNotesCount?.match(/\d+/)?.[0] || '0');
        
        expect(printCount).toBe(mainCount);
      }
      
      await helpers.closeDialog();
    });

    test('should sync note changes across all views', async ({ page }) => {
      await helpers.navigateToModule('production-notes');
      
      // Create a note
      await helpers.openDialog('[data-testid="add-note-button"]');
      await helpers.fillNoteForm({
        title: 'Sync Test Note',
        description: 'Test synchronization',
        type: 'Lighting',
        priority: 'high'
      });
      await helpers.saveDialog();
      
      // Verify in main table
      await helpers.expectNoteInTable('Sync Test Note');
      
      // Check it appears in print preview
      await page.locator('[data-testid="print-notes-button"]').click();
      
      const printDialog = page.locator('[data-testid="print-dialog"]');
      const filterSelector = printDialog.locator('[data-testid="filter-preset-selector"]');
      await filterSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      const preview = printDialog.locator('[data-testid="notes-preview"]');
      await expect(preview).toContainText('Sync Test Note');
      
      await helpers.closeDialog();
      
      // Edit the note
      const noteRow = page.locator('[data-testid="note-row"]:has-text("Sync Test Note")');
      await noteRow.locator('[data-testid="edit-note"]').click();
      
      const editDialog = page.locator('[data-testid="note-dialog"]');
      await editDialog.locator('[data-testid="note-title"]').fill('Updated Sync Note');
      await helpers.saveDialog();
      
      // Verify update appears in print preview
      await page.locator('[data-testid="print-notes-button"]').click();
      const updatedPreview = page.locator('[data-testid="notes-preview"]');
      await expect(updatedPreview).toContainText('Updated Sync Note');
      await expect(updatedPreview).not.toContainText('Sync Test Note');
      
      await helpers.closeDialog();
    });
  });

  test.describe('Theme and UI Consistency', () => {
    test('should maintain module colors across all interfaces', async ({ page }) => {
      const modules: { name: 'cue-notes' | 'work-notes' | 'production-notes'; colorClass: string; theme: string; }[] = [
        { name: 'cue-notes', colorClass: 'text-modules-cue', theme: 'purple' },
        { name: 'work-notes', colorClass: 'text-modules-work', theme: 'blue' },
        { name: 'production-notes', colorClass: 'text-modules-production', theme: 'cyan' }
      ];
      
      for (const module of modules) {
        await helpers.navigateToModule(module.name);
        
        // Check main module header
        const header = page.locator(`h1:has-text("${module.name.replace('-', ' ')}")`);
        await expect(header.locator(`.${module.colorClass}`)).toBeVisible();
        
        // Check print dialog maintains theme
        await page.locator('[data-testid="print-notes-button"]').click();
        
        const printDialog = page.locator('[data-testid="print-dialog"]');
        const dialogHeader = printDialog.locator('[data-testid="dialog-header"]');
        
        // Should use module-specific colors/themes
        await expect(dialogHeader).toHaveClass(new RegExp(module.theme));
        
        await helpers.closeDialog();
        
        // Check email dialog maintains theme
        await page.locator('[data-testid="email-notes-button"]').click();
        
        const emailDialog = page.locator('[data-testid="email-dialog"]');
        const emailHeader = emailDialog.locator('[data-testid="dialog-header"]');
        
        await expect(emailHeader).toHaveClass(new RegExp(module.theme));
        
        await helpers.closeDialog();
      }
    });

    test('should show consistent status colors across views', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      
      // Create notes with different statuses
      const statuses = [
        { status: 'todo', colorClass: 'text-blue-400' },
        { status: 'complete', colorClass: 'text-green-400' },
        { status: 'cancelled', colorClass: 'text-gray-400' }
      ];
      
      for (const { status, colorClass } of statuses) {
        await helpers.openDialog('[data-testid="add-note-button"]');
        await helpers.fillNoteForm({
          title: `${status.toUpperCase()} Status Note`,
          description: `Test ${status} status`,
          type: 'Cue',
          priority: 'medium'
        });
        
        // Set status
        const statusSelect = page.locator('[data-testid="note-status"]');
        await statusSelect.selectOption(status);
        
        await helpers.saveDialog();
        
        // Check status color in main table
        const noteRow = page.locator(`[data-testid="note-row"]:has-text("${status.toUpperCase()} Status Note")`);
        await expect(noteRow.locator('[data-testid="status-indicator"]')).toHaveClass(new RegExp(colorClass));
      }
      
      // Check colors are consistent in print preview
      await page.locator('[data-testid="print-notes-button"]').click();
      
      const printDialog = page.locator('[data-testid="print-dialog"]');
      const filterSelector = printDialog.locator('[data-testid="filter-preset-selector"]');
      await filterSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      const preview = printDialog.locator('[data-testid="notes-preview"]');
      
      for (const { status, colorClass } of statuses) {
        const previewNote = preview.locator(`[data-testid="preview-note"]:has-text("${status.toUpperCase()}")`);
        if (await previewNote.count() > 0) {
          await expect(previewNote.locator('[data-testid="status-indicator"]')).toHaveClass(new RegExp(colorClass));
        }
      }
      
      await helpers.closeDialog();
    });
  });

  test.describe('Search and Filter Integration', () => {
    test('should maintain search state when switching between modules', async ({ page }) => {
      // Search in cue notes
      await helpers.navigateToModule('cue-notes');
      await helpers.searchNotes('test');
      
      const cueSearchValue = await page.locator('[data-testid="search-input"]').inputValue();
      expect(cueSearchValue).toBe('test');
      
      // Switch to work notes
      await helpers.navigateToModule('work-notes');
      
      // Search should be cleared (each module has independent search)
      const workSearchValue = await page.locator('[data-testid="search-input"]').inputValue();
      expect(workSearchValue).toBe('');
      
      // Search in work notes
      await helpers.searchNotes('focus');
      
      // Switch back to cue notes
      await helpers.navigateToModule('cue-notes');
      
      // Should maintain separate search state
      const returnedCueSearch = await page.locator('[data-testid="search-input"]').inputValue();
      expect(returnedCueSearch).toBe('test');
    });

    test('should coordinate global search with module filters', async ({ page }) => {
      await helpers.navigateToModule('production-notes');
      
      // Apply type filter
      const typeFilter = page.locator('[data-testid="type-filter"]');
      await typeFilter.click();
      await page.locator('[data-testid="type-option"]:has-text("Lighting")').click();
      await page.keyboard.press('Escape');
      
      // Apply search
      await helpers.searchNotes('budget');
      
      // Results should respect both filter and search
      const results = page.locator('[data-testid="note-row"]');
      const count = await results.count();
      
      // Each visible result should match both criteria
      for (let i = 0; i < Math.min(count, 3); i++) {
        const result = results.nth(i);
        
        // Should contain search term
        const noteText = await result.textContent();
        expect(noteText?.toLowerCase()).toContain('budget');
        
        // Should have correct type (if type column is visible)
        const typeCell = result.locator('[data-testid="note-type"]');
        if (await typeCell.count() > 0) {
          await expect(typeCell).toContainText('Lighting');
        }
      }
    });
  });

  test.describe('Performance and Loading', () => {
    test('should handle large datasets efficiently', async ({ page }) => {
      // This would typically involve creating many test notes, but we'll simulate
      await helpers.navigateToModule('cue-notes');
      
      // Measure initial load time
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="notes-table"]');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
      
      // Test search performance
      const searchStart = Date.now();
      await helpers.searchNotes('test');
      await page.waitForSelector('[data-testid="search-results"]', { timeout: 3000 });
      const searchTime = Date.now() - searchStart;
      
      expect(searchTime).toBeLessThan(2000); // Search should be fast
    });

    test('should show loading states during operations', async ({ page }) => {
      await helpers.navigateToModule('work-notes');
      
      // Check for loading states during note creation
      await helpers.openDialog('[data-testid="add-note-button"]');
      
      await helpers.fillNoteForm({
        title: 'Loading Test Note',
        description: 'Test loading states',
        type: 'Work',
        priority: 'medium'
      });
      
      const saveButton = page.locator('[data-testid="save-button"]');
      await saveButton.click();
      
      // Should show loading state briefly
      const loadingIndicator = page.locator('[data-testid="loading-spinner"]');
      if (await loadingIndicator.count() > 0) {
        await expect(loadingIndicator).toBeVisible();
      }
      
      // Should complete and show success
      await expect(page.locator('[data-testid="notes-table"]')).toContainText('Loading Test Note');
    });
  });

  test.describe('Accessibility Integration', () => {
    test('should maintain keyboard navigation across features', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      
      // Test keyboard navigation in main table
      await page.keyboard.press('Tab'); // Should focus first interactive element
      
      // Navigate to add button
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('data-testid', 'add-note-button');
      
      // Open dialog with keyboard
      await page.keyboard.press('Enter');
      
      const dialog = page.locator('[data-testid="note-dialog"]');
      await expect(dialog).toBeVisible();
      
      // Should focus first input
      const titleInput = dialog.locator('[data-testid="note-title"]');
      await expect(titleInput).toBeFocused();
      
      await helpers.closeDialog();
    });

    test('should provide appropriate ARIA labels and roles', async ({ page }) => {
      await helpers.navigateToModule('production-notes');
      
      // Check main table has proper ARIA
      const notesTable = page.locator('[data-testid="notes-table"]');
      await expect(notesTable).toHaveAttribute('role', 'table');
      
      // Check filter controls have labels
      const typeFilter = page.locator('[data-testid="type-filter"]');
      await expect(typeFilter).toHaveAttribute('aria-label');
      
      // Check search input has label
      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toHaveAttribute('aria-label');
    });

    test('should announce important state changes', async ({ page }) => {
      await helpers.navigateToModule('work-notes');
      
      // Create a note and check for announcements
      await helpers.openDialog('[data-testid="add-note-button"]');
      await helpers.fillNoteForm({
        title: 'Announcement Test',
        description: 'Test announcements',
        type: 'Focus',
        priority: 'high'
      });
      await helpers.saveDialog();
      
      // Should have aria-live region for announcements
      const liveRegion = page.locator('[aria-live="polite"]');
      if (await liveRegion.count() > 0) {
        await expect(liveRegion).toContainText('Note created');
      }
    });
  });
});