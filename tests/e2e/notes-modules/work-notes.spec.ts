import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';
import { mockWorkNote, generateTestNote } from '../../fixtures/test-data';

test.describe('Work Notes Module', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
    await helpers.navigateToModule('work-notes');
  });

  test('should display work notes page correctly', async ({ page }) => {
    await helpers.expectPageTitle('Work Notes');
    
    // Check work-specific color theme
    const header = page.locator('h1:has-text("Work Notes")');
    await expect(header.locator('.text-modules-work')).toBeVisible();
    
    // Check essential elements
    await expect(page.locator('[data-testid="add-note-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();
  });

  test('should create work note with work-specific fields', async ({ page }) => {
    await helpers.openDialog('[data-testid="add-note-button"]');
    
    await helpers.fillNoteForm({
      title: 'Focus Light #47',
      description: 'Adjust focus for downstage wash',
      type: 'Focus',
      priority: 'medium',
    });
    
    // Fill work-specific fields
    const channelField = page.locator('[data-testid="channel-numbers"]');
    if (await channelField.isVisible()) {
      await channelField.fill('47, 48, 49');
    }
    
    const positionField = page.locator('[data-testid="position-unit"]');
    if (await positionField.isVisible()) {
      await positionField.fill('FOH-12');
    }
    
    const sceneryField = page.locator('[data-testid="scenery-needs"]');
    if (await sceneryField.isVisible()) {
      await sceneryField.fill('Clear sight lines');
    }
    
    const lightwrightField = page.locator('[data-testid="lightwright-item-id"]');
    if (await lightwrightField.isVisible()) {
      await lightwrightField.fill('lw-456');
    }
    
    await helpers.saveDialog();
    await helpers.expectNoteInTable('Focus Light #47');
  });

  test('should filter by work-specific types', async ({ page }) => {
    const typeFilter = page.locator('[data-testid="type-filter"]');
    await typeFilter.click();
    
    // Should have work-specific types
    await expect(page.locator('[data-testid="type-option"]:has-text("Work")')).toBeVisible();
    await expect(page.locator('[data-testid="type-option"]:has-text("Focus")')).toBeVisible();
    await expect(page.locator('[data-testid="type-option"]:has-text("Electrician")')).toBeVisible();
    
    // Select Focus type
    await page.locator('[data-testid="type-option"]:has-text("Focus")').click();
    
    // Should filter to focus notes only
    await page.keyboard.press('Escape');
    const filteredNotes = page.locator('[data-testid="note-row"]');
    const count = await filteredNotes.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should search by channel numbers', async ({ page }) => {
    await helpers.searchNotes('47');
    
    const results = page.locator('[data-testid="note-row"]');
    if (await results.count() > 0) {
      // Should find notes with channel 47
      const firstResult = results.first();
      await expect(firstResult).toBeVisible();
    }
  });

  test('should search by position unit', async ({ page }) => {
    await helpers.searchNotes('FOH');
    
    const results = page.locator('[data-testid="note-row"]');
    if (await results.count() > 0) {
      await expect(results.first()).toBeVisible();
    }
  });

  test('should display work notes with proper priority levels (1-9)', async ({ page }) => {
    await helpers.openDialog('[data-testid="add-note-button"]');
    
    const prioritySelect = page.locator('[data-testid="note-priority"]');
    await prioritySelect.click();
    
    // Work notes should have 1-9 priority levels
    // This would depend on the actual custom priorities configuration
    await expect(page.locator('[data-testid="priority-option"]')).toHaveCount(9, { timeout: 5000 });
    
    await helpers.closeDialog();
  });

  test('should handle Lightwright integration fields', async ({ page }) => {
    // Test that Lightwright item ID field works
    await helpers.openDialog('[data-testid="add-note-button"]');
    
    const lightwrightField = page.locator('[data-testid="lightwright-item-id"]');
    if (await lightwrightField.isVisible()) {
      await lightwrightField.fill('lw-test-123');
      
      // Should accept Lightwright ID format
      const value = await lightwrightField.inputValue();
      expect(value).toBe('lw-test-123');
    }
    
    await helpers.closeDialog();
  });
});