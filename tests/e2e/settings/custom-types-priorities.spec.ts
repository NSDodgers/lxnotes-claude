import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Custom Types & Priorities Settings', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/cue-notes');
    await helpers.waitForAppReady();
    await helpers.navigateToSettingsTab('general');
  });

  test('should display customization settings page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    await expect(page.locator('[data-testid="customization-tab"]')).toHaveClass(/bg-card/);
    
    // Should show both managers
    await expect(page.locator('[data-testid="custom-types-manager"]')).toBeVisible();
    await expect(page.locator('[data-testid="custom-priorities-manager"]')).toBeVisible();
  });

  test.describe('Custom Types Manager', () => {
    test('should show default types for each module', async ({ page }) => {
      const typesManager = page.locator('[data-testid="custom-types-manager"]');
      
      // Should show module tabs
      await expect(typesManager.locator('[data-testid="module-tab-cue"]')).toBeVisible();
      await expect(typesManager.locator('[data-testid="module-tab-work"]')).toBeVisible();
      await expect(typesManager.locator('[data-testid="module-tab-production"]')).toBeVisible();
      
      // Check default cue note types
      await expect(typesManager).toContainText('Cue');
      await expect(typesManager).toContainText('Director');
      await expect(typesManager).toContainText('Designer');
    });

    test('should switch between module tabs', async ({ page }) => {
      const typesManager = page.locator('[data-testid="custom-types-manager"]');
      
      // Switch to work module
      await typesManager.locator('[data-testid="module-tab-work"]').click();
      await expect(typesManager).toContainText('Work');
      await expect(typesManager).toContainText('Focus');
      
      // Switch to production module
      await typesManager.locator('[data-testid="module-tab-production"]').click();
      await expect(typesManager).toContainText('Scenic');
      await expect(typesManager).toContainText('Lighting');
      await expect(typesManager).toContainText('Costumes');
    });

    test('should add new custom type', async ({ page }) => {
      const typesManager = page.locator('[data-testid="custom-types-manager"]');
      
      // Add new cue note type
      await typesManager.locator('[data-testid="add-type-button"]').click();
      
      const dialog = page.locator('[data-testid="type-dialog"]');
      await dialog.locator('[data-testid="type-name"]').fill('Custom Cue Type');
      await dialog.locator('[data-testid="type-color"]').selectOption('#ff6b6b');
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Should appear in list
      await expect(typesManager).toContainText('Custom Cue Type');
      
      // Should show color indicator
      const typeItem = typesManager.locator('[data-testid="type-item"]:has-text("Custom Cue Type")');
      await expect(typeItem.locator('[data-testid="color-indicator"]')).toBeVisible();
    });

    test('should edit existing custom type', async ({ page }) => {
      // First add a type to edit
      const typesManager = page.locator('[data-testid="custom-types-manager"]');
      await typesManager.locator('[data-testid="add-type-button"]').click();
      
      let dialog = page.locator('[data-testid="type-dialog"]');
      await dialog.locator('[data-testid="type-name"]').fill('Edit Test Type');
      await dialog.locator('[data-testid="type-color"]').selectOption('#4ecdc4');
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Now edit it
      const typeItem = typesManager.locator('[data-testid="type-item"]:has-text("Edit Test Type")');
      await typeItem.locator('[data-testid="edit-type"]').click();
      
      dialog = page.locator('[data-testid="type-dialog"]');
      await dialog.locator('[data-testid="type-name"]').fill('Updated Test Type');
      await dialog.locator('[data-testid="type-color"]').selectOption('#45b7d1');
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Should show updated name
      await expect(typesManager).toContainText('Updated Test Type');
      await expect(typesManager).not.toContainText('Edit Test Type');
    });

    test('should delete custom type with confirmation', async ({ page }) => {
      // Add a type to delete
      const typesManager = page.locator('[data-testid="custom-types-manager"]');
      await typesManager.locator('[data-testid="add-type-button"]').click();
      
      const dialog = page.locator('[data-testid="type-dialog"]');
      await dialog.locator('[data-testid="type-name"]').fill('Delete Test Type');
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Delete it
      const typeItem = typesManager.locator('[data-testid="type-item"]:has-text("Delete Test Type")');
      await typeItem.locator('[data-testid="delete-type"]').click();
      
      // Confirm deletion
      await page.locator('[data-testid="confirm-delete"]').click();
      
      // Should be removed
      await expect(typesManager).not.toContainText('Delete Test Type');
    });

    test('should not allow deleting system default types', async ({ page }) => {
      const typesManager = page.locator('[data-testid="custom-types-manager"]');
      
      // System types should not have delete buttons
      const systemTypeItem = typesManager.locator('[data-testid="type-item"]:has-text("Cue")').first();
      await expect(systemTypeItem.locator('[data-testid="delete-type"]')).not.toBeVisible();
    });

    test('should validate type name requirements', async ({ page }) => {
      const typesManager = page.locator('[data-testid="custom-types-manager"]');
      await typesManager.locator('[data-testid="add-type-button"]').click();
      
      const dialog = page.locator('[data-testid="type-dialog"]');
      
      // Try to save without name
      await dialog.locator('[data-testid="save-button"]').click();
      await expect(dialog.locator('[data-testid="validation-error"]')).toBeVisible();
      
      // Try duplicate name
      await dialog.locator('[data-testid="type-name"]').fill('Cue');
      await dialog.locator('[data-testid="save-button"]').click();
      await expect(dialog.locator('[data-testid="validation-error"]')).toContainText('already exists');
      
      await helpers.closeDialog();
    });

    test('should show type usage count', async ({ page }) => {
      const typesManager = page.locator('[data-testid="custom-types-manager"]');
      
      // Type items should show usage count
      const typeItem = typesManager.locator('[data-testid="type-item"]').first();
      await expect(typeItem.locator('[data-testid="usage-count"]')).toBeVisible();
    });
  });

  test.describe('Custom Priorities Manager', () => {
    test('should show default priorities for each module', async ({ page }) => {
      const prioritiesManager = page.locator('[data-testid="custom-priorities-manager"]');
      
      // Should show module tabs
      await expect(prioritiesManager.locator('[data-testid="module-tab-cue"]')).toBeVisible();
      await expect(prioritiesManager.locator('[data-testid="module-tab-work"]')).toBeVisible();
      await expect(prioritiesManager.locator('[data-testid="module-tab-production"]')).toBeVisible();
      
      // Check default priorities (should show standard high/medium/low)
      await expect(prioritiesManager).toContainText('High');
      await expect(prioritiesManager).toContainText('Medium');
      await expect(prioritiesManager).toContainText('Low');
    });

    test('should show work module has 1-9 priority levels', async ({ page }) => {
      const prioritiesManager = page.locator('[data-testid="custom-priorities-manager"]');
      
      // Switch to work module
      await prioritiesManager.locator('[data-testid="module-tab-work"]').click();
      
      // Should show 9 priority levels for work notes
      const priorityItems = prioritiesManager.locator('[data-testid="priority-item"]');
      await expect(priorityItems).toHaveCount(9);
      
      // Should show numerical priorities
      await expect(prioritiesManager).toContainText('1');
      await expect(prioritiesManager).toContainText('5');
      await expect(prioritiesManager).toContainText('9');
    });

    test('should add new custom priority', async ({ page }) => {
      const prioritiesManager = page.locator('[data-testid="custom-priorities-manager"]');
      
      await prioritiesManager.locator('[data-testid="add-priority-button"]').click();
      
      const dialog = page.locator('[data-testid="priority-dialog"]');
      await dialog.locator('[data-testid="priority-name"]').fill('Urgent');
      await dialog.locator('[data-testid="priority-level"]').fill('1');
      await dialog.locator('[data-testid="priority-color"]').selectOption('#ff4757');
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Should appear in list
      await expect(prioritiesManager).toContainText('Urgent');
    });

    test('should reorder priorities by drag and drop', async ({ page }) => {
      const prioritiesManager = page.locator('[data-testid="custom-priorities-manager"]');
      
      // Should have drag handles
      const firstPriority = prioritiesManager.locator('[data-testid="priority-item"]').first();
      const dragHandle = firstPriority.locator('[data-testid="drag-handle"]');
      await expect(dragHandle).toBeVisible();
      
      // Note: Full drag-and-drop testing would require more complex interactions
      // This tests that the UI elements are present
    });

    test('should edit existing custom priority', async ({ page }) => {
      // First add a priority to edit
      const prioritiesManager = page.locator('[data-testid="custom-priorities-manager"]');
      await prioritiesManager.locator('[data-testid="add-priority-button"]').click();
      
      let dialog = page.locator('[data-testid="priority-dialog"]');
      await dialog.locator('[data-testid="priority-name"]').fill('Test Priority');
      await dialog.locator('[data-testid="priority-level"]').fill('2');
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Edit it
      const priorityItem = prioritiesManager.locator('[data-testid="priority-item"]:has-text("Test Priority")');
      await priorityItem.locator('[data-testid="edit-priority"]').click();
      
      dialog = page.locator('[data-testid="priority-dialog"]');
      await dialog.locator('[data-testid="priority-name"]').fill('Updated Priority');
      await dialog.locator('[data-testid="priority-level"]').fill('3');
      await dialog.locator('[data-testid="save-button"]').click();
      
      await expect(prioritiesManager).toContainText('Updated Priority');
      await expect(prioritiesManager).not.toContainText('Test Priority');
    });

    test('should prevent duplicate priority levels', async ({ page }) => {
      const prioritiesManager = page.locator('[data-testid="custom-priorities-manager"]');
      await prioritiesManager.locator('[data-testid="add-priority-button"]').click();
      
      const dialog = page.locator('[data-testid="priority-dialog"]');
      await dialog.locator('[data-testid="priority-name"]').fill('Duplicate Level');
      await dialog.locator('[data-testid="priority-level"]').fill('1'); // Assuming level 1 exists
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Should show validation error
      await expect(dialog.locator('[data-testid="validation-error"]')).toContainText('level already exists');
      
      await helpers.closeDialog();
    });

    test('should show priority level in sorted order', async ({ page }) => {
      const prioritiesManager = page.locator('[data-testid="custom-priorities-manager"]');
      
      // Priorities should be displayed in level order (lowest to highest)
      const priorityItems = prioritiesManager.locator('[data-testid="priority-item"]');
      const count = await priorityItems.count();
      
      if (count > 1) {
        // Check that first item has lower or equal level than second
        const firstLevel = await priorityItems.first().locator('[data-testid="priority-level"]').textContent();
        const secondLevel = await priorityItems.nth(1).locator('[data-testid="priority-level"]').textContent();
        
        expect(parseInt(firstLevel || '0')).toBeLessThanOrEqual(parseInt(secondLevel || '0'));
      }
    });
  });

  test.describe('Settings Integration', () => {
    test('should persist custom types across page reloads', async ({ page }) => {
      const typesManager = page.locator('[data-testid="custom-types-manager"]');
      
      // Add a custom type
      await typesManager.locator('[data-testid="add-type-button"]').click();
      const dialog = page.locator('[data-testid="type-dialog"]');
      await dialog.locator('[data-testid="type-name"]').fill('Persistent Type');
      await dialog.locator('[data-testid="save-button"]').click();
      
      // Reload page
      await page.reload();
      await helpers.waitForAppReady();
      await helpers.navigateToSettingsTab('general');
      
      // Should still be there
      await expect(page.locator('[data-testid="custom-types-manager"]')).toContainText('Persistent Type');
    });

    test('should show impact warning when deleting used types', async ({ page }) => {
      // This would test if types are used in existing notes
      const typesManager = page.locator('[data-testid="custom-types-manager"]');
      
      // Add and then try to delete a type (assuming it gets used)
      await typesManager.locator('[data-testid="add-type-button"]').click();
      const dialog = page.locator('[data-testid="type-dialog"]');
      await dialog.locator('[data-testid="type-name"]').fill('Used Type');
      await dialog.locator('[data-testid="save-button"]').click();
      
      // If the type has usage count > 0, should show warning
      const typeItem = typesManager.locator('[data-testid="type-item"]:has-text("Used Type")');
      const usageCount = await typeItem.locator('[data-testid="usage-count"]').textContent();
      
      if (usageCount && parseInt(usageCount) > 0) {
        await typeItem.locator('[data-testid="delete-type"]').click();
        await expect(page.locator('[data-testid="impact-warning"]')).toBeVisible();
        await page.locator('[data-testid="cancel-delete"]').click();
      }
    });

    test('should export/import custom settings', async ({ page }) => {
      const settingsPage = page.locator('[data-testid="settings-page"]');
      
      // Should have export/import buttons
      await expect(settingsPage.locator('[data-testid="export-settings"]')).toBeVisible();
      await expect(settingsPage.locator('[data-testid="import-settings"]')).toBeVisible();
      
      // Export should trigger download
      const downloadPromise = page.waitForEvent('download');
      await settingsPage.locator('[data-testid="export-settings"]').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('lx-notes-settings');
    });

    test('should reset to defaults with confirmation', async ({ page }) => {
      const settingsPage = page.locator('[data-testid="settings-page"]');
      
      // Should have reset button
      await expect(settingsPage.locator('[data-testid="reset-defaults"]')).toBeVisible();
      
      // Should require confirmation
      await settingsPage.locator('[data-testid="reset-defaults"]').click();
      await expect(page.locator('[data-testid="reset-confirmation"]')).toBeVisible();
      await page.locator('[data-testid="cancel-reset"]').click();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const typesManager = page.locator('[data-testid="custom-types-manager"]');
      
      // Should stack module tabs vertically on mobile
      await expect(typesManager.locator('[data-testid="mobile-tab-selector"]')).toBeVisible();
      
      // Should show compact type items
      const typeItem = typesManager.locator('[data-testid="type-item"]').first();
      await expect(typeItem).toHaveClass(/compact/);
    });

    test('should handle tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Settings should adapt to tablet layout
      const settingsContainer = page.locator('[data-testid="settings-container"]');
      await expect(settingsContainer).toHaveClass(/tablet-layout/);
    });
  });
});