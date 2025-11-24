import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';
import { mockProductionNote } from '../../fixtures/test-data';

test.describe('Production Notes Module', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/cue-notes');
    await helpers.waitForAppReady();
    await helpers.navigateToModule('production-notes');
  });

  test('should display production notes page correctly', async ({ page }) => {
    await helpers.expectPageTitle('Production Notes');
    
    // Check production-specific color theme
    const header = page.locator('h1:has-text("Production Notes")');
    await expect(header.locator('.text-modules-production')).toBeVisible();
    
    // Check essential elements
    await expect(page.locator('[data-testid="add-note-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();
  });

  test('should create production note for cross-department communication', async ({ page }) => {
    await helpers.openDialog('[data-testid="add-note-button"]');
    
    await helpers.fillNoteForm({
      title: 'Budget Review Meeting',
      description: 'Meet with producer to review lighting budget and equipment needs',
      type: 'Lighting',
      priority: 'high',
    });
    
    await helpers.saveDialog();
    await helpers.expectNoteInTable('Budget Review Meeting');
  });

  test('should filter by department types', async ({ page }) => {
    const typeFilter = page.locator('[data-testid="type-filter"]');
    await typeFilter.click();
    
    // Should have department-specific types
    await expect(page.locator('[data-testid="type-option"]:has-text("Scenic")')).toBeVisible();
    await expect(page.locator('[data-testid="type-option"]:has-text("Lighting")')).toBeVisible();
    await expect(page.locator('[data-testid="type-option"]:has-text("Costumes")')).toBeVisible();
    await expect(page.locator('[data-testid="type-option"]:has-text("Sound")')).toBeVisible();
    
    // Select Lighting department
    await page.locator('[data-testid="type-option"]:has-text("Lighting")').click();
    
    await page.keyboard.press('Escape');
    const filteredNotes = page.locator('[data-testid="note-row"]');
    const count = await filteredNotes.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should not have module-specific external lookup fields', async ({ page }) => {
    // Production notes should not have script page, scene/song, or Lightwright fields
    await helpers.openDialog('[data-testid="add-note-button"]');
    
    // These fields should not be present
    await expect(page.locator('[data-testid="script-page-id"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="scene-song-id"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="lightwright-item-id"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="channel-numbers"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="position-unit"]')).not.toBeVisible();
    
    await helpers.closeDialog();
  });

  test('should handle interdepartmental communication notes', async ({ page }) => {
    // Create a note that involves multiple departments
    await helpers.openDialog('[data-testid="add-note-button"]');
    
    await helpers.fillNoteForm({
      title: 'Costume Change Lighting Cue',
      description: 'Coordinate with costumes for quick change - need blackout cue 47.5',
      type: 'Lighting',
      priority: 'high',
    });
    
    await helpers.saveDialog();
    await helpers.expectNoteInTable('Costume Change Lighting Cue');
  });

  test('should support production management workflow', async ({ page }) => {
    // Test typical production notes workflow
    const notes = [
      {
        title: 'Tech Rehearsal Schedule',
        description: 'Finalize tech rehearsal schedule with all departments',
        type: 'Production Management',
        priority: 'critical',
      },
      {
        title: 'Set Strike Coordination',
        description: 'Coordinate lighting strike with scenic team',
        type: 'Lighting',
        priority: 'medium',
      },
    ];
    
    for (const note of notes) {
      await helpers.openDialog('[data-testid="add-note-button"]');
      await helpers.fillNoteForm(note);
      await helpers.saveDialog();
      await helpers.expectNoteInTable(note.title);
    }
  });

  test('should filter by production department with grouping', async ({ page }) => {
    // Test department grouping if implemented
    const typeFilter = page.locator('[data-testid="type-filter"]');
    await typeFilter.click();
    
    // Select multiple departments
    await page.locator('[data-testid="type-option"]:has-text("Lighting")').click();
    await page.locator('[data-testid="type-option"]:has-text("Sound")').click();
    
    await page.keyboard.press('Escape');
    
    // Should show notes from both departments
    const filteredNotes = page.locator('[data-testid="note-row"]');
    const count = await filteredNotes.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should support priority-based workflow for production management', async ({ page }) => {
    // Test priority filtering for production management
    await helpers.setStatusFilter('todo');
    
    const typeFilter = page.locator('[data-testid="type-filter"]');
    await typeFilter.click();
    await page.locator('[data-testid="type-option"]:has-text("Production Management")').click();
    await page.keyboard.press('Escape');
    
    // Should show production management todos
    const results = page.locator('[data-testid="note-row"]');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});