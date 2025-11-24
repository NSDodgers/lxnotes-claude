import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';
import { testFilterSortPreset } from '../../fixtures/test-data';

test.describe('Filter & Sort Presets', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/cue-notes');
    await helpers.waitForAppReady();
    await helpers.navigateToSettingsTab('presets');
  });

  test('should display filter & sort presets section', async ({ page }) => {
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    await expect(filterSortSection).toBeVisible();
    
    await expect(filterSortSection.locator('h2:has-text("Filter & Sort Presets")')).toBeVisible();
    await expect(filterSortSection.locator('[data-testid="add-preset"]')).toBeVisible();
  });

  test('should display system default presets for each module', async ({ page }) => {
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    
    // Should show system defaults for different modules
    await expect(filterSortSection).toContainText('Outstanding Cues');
    await expect(filterSortSection).toContainText('High Priority First');
    await expect(filterSortSection).toContainText('Outstanding Issues');
    await expect(filterSortSection).toContainText('By Department');
  });

  test('should filter presets by module', async ({ page }) => {
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    const moduleFilter = filterSortSection.locator('[data-testid="module-filter"]');
    
    // Filter by Cue Notes module
    await moduleFilter.selectOption('cue');
    
    // Should only show cue note presets
    await expect(filterSortSection).toContainText('Outstanding Cues');
    await expect(filterSortSection).not.toContainText('Outstanding Work');
    
    // Filter by Production Notes module
    await moduleFilter.selectOption('production');
    
    // Should only show production note presets
    await expect(filterSortSection).toContainText('Outstanding Issues');
    await expect(filterSortSection).not.toContainText('Outstanding Cues');
    
    // Show all modules
    await moduleFilter.selectOption('all');
    
    // Should show all presets
    await expect(filterSortSection).toContainText('Outstanding Cues');
    await expect(filterSortSection).toContainText('Outstanding Issues');
  });

  test('should create new filter & sort preset', async ({ page }) => {
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    await filterSortSection.locator('[data-testid="add-preset"]').click();
    
    // Fill basic info
    await page.fill('[data-testid="preset-name"]', testFilterSortPreset.name);
    await page.selectOption('[data-testid="module-type"]', testFilterSortPreset.moduleType);
    
    // Set status filter
    await page.selectOption('[data-testid="status-filter"]', testFilterSortPreset.statusFilter || '');
    
    // Select type filters
    for (const type of testFilterSortPreset.typeFilters) {
      await page.check(`[data-testid="type-filter-${type}"]`);
    }
    
    // Select priority filters
    for (const priority of testFilterSortPreset.priorityFilters) {
      await page.check(`[data-testid="priority-filter-${priority}"]`);
    }
    
    // Set sort options
    await page.selectOption('[data-testid="sort-by"]', testFilterSortPreset.sortBy);
    await page.selectOption('[data-testid="sort-order"]', testFilterSortPreset.sortOrder);
    
    if (testFilterSortPreset.groupByType) {
      await page.check('[data-testid="group-by-type"]');
    }
    
    await page.click('[data-testid="save-button"]');
    
    // Should appear in list
    await expect(filterSortSection).toContainText(testFilterSortPreset.name);
  });

  test('should show module-specific form fields', async ({ page }) => {
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    await filterSortSection.locator('[data-testid="add-preset"]').click();
    
    // Select Cue Notes module
    await page.selectOption('[data-testid="module-type"]', 'cue');
    
    // Should show cue-specific sort fields
    const sortBySelect = page.locator('[data-testid="sort-by"]');
    await sortBySelect.click();
    await expect(page.locator('[data-testid="sort-option"]:has-text("Cue Number")')).toBeVisible();
    await expect(page.locator('[data-testid="sort-option"]:has-text("Priority")')).toBeVisible();
    
    // Select Work Notes module
    await page.selectOption('[data-testid="module-type"]', 'work');
    
    // Should show work-specific sort fields
    await sortBySelect.click();
    await expect(page.locator('[data-testid="sort-option"]:has-text("Channel")')).toBeVisible();
    await expect(page.locator('[data-testid="sort-option"]:has-text("Position")')).toBeVisible();
    
    // Select Production Notes module
    await page.selectOption('[data-testid="module-type"]', 'production');
    
    // Should show production-specific sort fields
    await sortBySelect.click();
    await expect(page.locator('[data-testid="sort-option"]:has-text("Department")')).toBeVisible();
    
    await helpers.closeDialog();
  });

  test('should show available types based on module', async ({ page }) => {
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    await filterSortSection.locator('[data-testid="add-preset"]').click();
    
    // Select Cue Notes module
    await page.selectOption('[data-testid="module-type"]', 'cue');
    
    // Should show cue-specific types
    await expect(page.locator('[data-testid="type-filter-Cue"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-filter-Director"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-filter-Designer"]')).toBeVisible();
    
    // Select Production Notes module
    await page.selectOption('[data-testid="module-type"]', 'production');
    
    // Should show production-specific types
    await expect(page.locator('[data-testid="type-filter-Scenic"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-filter-Lighting"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-filter-Costumes"]')).toBeVisible();
    
    await helpers.closeDialog();
  });

  test('should show available priorities based on module', async ({ page }) => {
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    await filterSortSection.locator('[data-testid="add-preset"]').click();
    
    // Select module and check priorities
    await page.selectOption('[data-testid="module-type"]', 'cue');
    
    // Should show priority filters
    const prioritySection = page.locator('[data-testid="priority-filters"]');
    await expect(prioritySection).toBeVisible();
    
    // Should have default priorities
    await expect(prioritySection).toContainText('Critical');
    await expect(prioritySection).toContainText('High');
    await expect(prioritySection).toContainText('Medium');
    await expect(prioritySection).toContainText('Low');
    
    await helpers.closeDialog();
  });

  test('should edit existing filter & sort preset', async ({ page }) => {
    // First create a preset to edit
    await helpers.createFilterSortPreset('Edit Test Filter', 'cue');
    
    // Find and edit the preset
    const presetCard = page.locator('[data-testid="preset-card"]:has-text("Edit Test Filter")');
    await presetCard.locator('[data-testid="edit-preset"]').click();
    
    // Update the preset
    await page.fill('[data-testid="preset-name"]', 'Updated Filter Test');
    await page.selectOption('[data-testid="status-filter"]', 'complete');
    
    await page.click('[data-testid="save-button"]');
    
    // Should show updated values
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    await expect(filterSortSection).toContainText('Updated Filter Test');
    await expect(filterSortSection).toContainText('COMPLETE');
  });

  test('should delete custom filter & sort preset', async ({ page }) => {
    // Create a preset to delete
    await helpers.createFilterSortPreset('Delete Test Filter', 'work');
    
    // Delete the preset
    const presetCard = page.locator('[data-testid="preset-card"]:has-text("Delete Test Filter")');
    await presetCard.locator('[data-testid="delete-preset"]').click();
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Should no longer be in list
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    await expect(filterSortSection).not.toContainText('Delete Test Filter');
  });

  test('should show configuration summary in preset cards', async ({ page }) => {
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    
    // Find a system preset and check its summary
    const outstandingCues = filterSortSection.locator('[data-testid="preset-card"]:has-text("Outstanding Cues")');
    
    // Should show configuration details
    await expect(outstandingCues).toContainText('TODO');
    await expect(outstandingCues).toContainText('priority');
    await expect(outstandingCues).toContainText('desc');
  });

  test('should validate required fields', async ({ page }) => {
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    await filterSortSection.locator('[data-testid="add-preset"]').click();
    
    // Try to save without name
    await page.click('[data-testid="save-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
  });

  test('should handle select all/none for type filters', async ({ page }) => {
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    await filterSortSection.locator('[data-testid="add-preset"]').click();
    
    await page.selectOption('[data-testid="module-type"]', 'cue');
    
    // Select all types
    await page.click('[data-testid="select-all-types"]');
    
    // All type checkboxes should be checked
    const typeCheckboxes = page.locator('[data-testid^="type-filter-"]');
    const count = await typeCheckboxes.count();
    
    for (let i = 0; i < count; i++) {
      await expect(typeCheckboxes.nth(i)).toBeChecked();
    }
    
    // Select none
    await page.click('[data-testid="select-none-types"]');
    
    // All should be unchecked
    for (let i = 0; i < count; i++) {
      await expect(typeCheckboxes.nth(i)).not.toBeChecked();
    }
    
    await helpers.closeDialog();
  });

  test('should handle select all/none for priority filters', async ({ page }) => {
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    await filterSortSection.locator('[data-testid="add-preset"]').click();
    
    await page.selectOption('[data-testid="module-type"]', 'cue');
    
    // Select all priorities
    await page.click('[data-testid="select-all-priorities"]');
    
    // All priority checkboxes should be checked
    const priorityCheckboxes = page.locator('[data-testid^="priority-filter-"]');
    const count = await priorityCheckboxes.count();
    
    for (let i = 0; i < count; i++) {
      await expect(priorityCheckboxes.nth(i)).toBeChecked();
    }
    
    // Select none
    await page.click('[data-testid="select-none-priorities"]');
    
    // All should be unchecked
    for (let i = 0; i < count; i++) {
      await expect(priorityCheckboxes.nth(i)).not.toBeChecked();
    }
    
    await helpers.closeDialog();
  });

  test('should show live preview of filter results', async ({ page }) => {
    const filterSortSection = page.locator('[data-testid="filter-sort-presets"]');
    await filterSortSection.locator('[data-testid="add-preset"]').click();
    
    await page.selectOption('[data-testid="module-type"]', 'cue');
    await page.selectOption('[data-testid="status-filter"]', 'todo');
    
    // Should show preview of how many notes match
    const preview = page.locator('[data-testid="filter-preview"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('notes match');
    
    await helpers.closeDialog();
  });
});