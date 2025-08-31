import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';
import { testPageStylePreset } from '../../fixtures/test-data';

test.describe('Page Style Presets', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
    await helpers.navigateToSettingsTab('presets');
  });

  test('should display page style presets section', async ({ page }) => {
    const pageStyleSection = page.locator('[data-testid="page-style-presets"]');
    await expect(pageStyleSection).toBeVisible();
    
    // Should have header and add button
    await expect(pageStyleSection.locator('h2:has-text("Page Style Presets")')).toBeVisible();
    await expect(pageStyleSection.locator('[data-testid="add-preset"]')).toBeVisible();
  });

  test('should display system default presets', async ({ page }) => {
    const pageStyleSection = page.locator('[data-testid="page-style-presets"]');
    
    // Should show system defaults
    await expect(pageStyleSection).toContainText('Letter Portrait');
    await expect(pageStyleSection).toContainText('Letter Landscape');
    await expect(pageStyleSection).toContainText('A4 Portrait');
    
    // System presets should have system badge
    const systemBadges = pageStyleSection.locator('.text-xs:has-text("System")');
    const badgeCount = await systemBadges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(3);
  });

  test('should create new page style preset', async ({ page }) => {
    const pageStyleSection = page.locator('[data-testid="page-style-presets"]');
    await pageStyleSection.locator('[data-testid="add-preset"]').click();
    
    // Fill preset form
    await page.fill('[data-testid="preset-name"]', testPageStylePreset.name);
    await page.selectOption('[data-testid="paper-size"]', testPageStylePreset.paperSize);
    await page.selectOption('[data-testid="orientation"]', testPageStylePreset.orientation);
    
    if (testPageStylePreset.includeCheckboxes) {
      await page.check('[data-testid="include-checkboxes"]');
    } else {
      await page.uncheck('[data-testid="include-checkboxes"]');
    }
    
    await page.click('[data-testid="save-button"]');
    
    // Should appear in list
    await expect(pageStyleSection).toContainText(testPageStylePreset.name);
  });

  test('should edit existing custom preset', async ({ page }) => {
    // First create a preset to edit
    await helpers.createPageStylePreset('Edit Test Preset', {
      paperSize: 'letter',
      orientation: 'portrait',
      includeCheckboxes: true
    });
    
    // Find and edit the preset
    const presetCard = page.locator('[data-testid="preset-card"]:has-text("Edit Test Preset")');
    await presetCard.locator('[data-testid="edit-preset"]').click();
    
    // Update the preset
    await page.fill('[data-testid="preset-name"]', 'Updated Test Preset');
    await page.selectOption('[data-testid="orientation"]', 'landscape');
    await page.click('[data-testid="save-button"]');
    
    // Should show updated values
    const pageStyleSection = page.locator('[data-testid="page-style-presets"]');
    await expect(pageStyleSection).toContainText('Updated Test Preset');
    await expect(pageStyleSection).toContainText('landscape');
  });

  test('should delete custom preset', async ({ page }) => {
    // Create a preset to delete
    await helpers.createPageStylePreset('Delete Test Preset', {
      paperSize: 'a4',
      orientation: 'portrait',
      includeCheckboxes: false
    });
    
    // Delete the preset
    const presetCard = page.locator('[data-testid="preset-card"]:has-text("Delete Test Preset")');
    await presetCard.locator('[data-testid="delete-preset"]').click();
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Should no longer be in list
    const pageStyleSection = page.locator('[data-testid="page-style-presets"]');
    await expect(pageStyleSection).not.toContainText('Delete Test Preset');
  });

  test('should not allow editing/deleting system presets', async ({ page }) => {
    // Find a system preset
    const systemPreset = page.locator('[data-testid="preset-card"]:has-text("Letter Portrait")');
    
    // Should not have edit/delete buttons
    await expect(systemPreset.locator('[data-testid="edit-preset"]')).not.toBeVisible();
    await expect(systemPreset.locator('[data-testid="delete-preset"]')).not.toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    const pageStyleSection = page.locator('[data-testid="page-style-presets"]');
    await pageStyleSection.locator('[data-testid="add-preset"]').click();
    
    // Try to save without name
    await page.click('[data-testid="save-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
  });

  test('should show preset configuration summary', async ({ page }) => {
    // Check that presets show their configuration
    const letterPortrait = page.locator('[data-testid="preset-card"]:has-text("Letter Portrait")');
    
    // Should show configuration details
    await expect(letterPortrait).toContainText('LETTER');
    await expect(letterPortrait).toContainText('portrait');
    await expect(letterPortrait).toContainText('Checkboxes');
  });

  test('should collapse/expand presets section', async ({ page }) => {
    const pageStyleSection = page.locator('[data-testid="page-style-presets"]');
    const toggleButton = pageStyleSection.locator('[data-testid="toggle-collapse"]');
    
    // Should be expanded initially
    await expect(pageStyleSection.locator('[data-testid="preset-list"]')).toBeVisible();
    
    // Collapse
    await toggleButton.click();
    await expect(pageStyleSection.locator('[data-testid="preset-list"]')).not.toBeVisible();
    
    // Expand again
    await toggleButton.click();
    await expect(pageStyleSection.locator('[data-testid="preset-list"]')).toBeVisible();
  });

  test('should show preset count in header', async ({ page }) => {
    const pageStyleSection = page.locator('[data-testid="page-style-presets"]');
    
    // Should show count of presets
    await expect(pageStyleSection).toContainText('(');
    await expect(pageStyleSection).toContainText(')');
  });

  test('should handle all paper size options', async ({ page }) => {
    const paperSizes = ['letter', 'a4', 'legal'];
    
    for (const size of paperSizes) {
      const pageStyleSection = page.locator('[data-testid="page-style-presets"]');
      await pageStyleSection.locator('[data-testid="add-preset"]').click();
      
      await page.fill('[data-testid="preset-name"]', `Test ${size.toUpperCase()} Preset`);
      await page.selectOption('[data-testid="paper-size"]', size);
      await page.selectOption('[data-testid="orientation"]', 'portrait');
      
      await page.click('[data-testid="save-button"]');
      
      // Should show the paper size in summary
      await expect(pageStyleSection).toContainText(size.toUpperCase());
    }
  });

  test('should handle both orientation options', async ({ page }) => {
    const orientations = ['portrait', 'landscape'];
    
    for (const orientation of orientations) {
      const pageStyleSection = page.locator('[data-testid="page-style-presets"]');
      await pageStyleSection.locator('[data-testid="add-preset"]').click();
      
      await page.fill('[data-testid="preset-name"]', `Test ${orientation} Preset`);
      await page.selectOption('[data-testid="paper-size"]', 'letter');
      await page.selectOption('[data-testid="orientation"]', orientation);
      
      await page.click('[data-testid="save-button"]');
      
      // Should show orientation in summary
      await expect(pageStyleSection).toContainText(orientation);
    }
  });

  test('should handle checkbox option toggle', async ({ page }) => {
    // Test with checkboxes enabled
    const pageStyleSection = page.locator('[data-testid="page-style-presets"]');
    await pageStyleSection.locator('[data-testid="add-preset"]').click();
    
    await page.fill('[data-testid="preset-name"]', 'Checkbox Test Preset');
    await page.selectOption('[data-testid="paper-size"]', 'letter');
    await page.selectOption('[data-testid="orientation"]', 'portrait');
    await page.check('[data-testid="include-checkboxes"]');
    
    await page.click('[data-testid="save-button"]');
    
    // Should show checkboxes in summary
    await expect(pageStyleSection).toContainText('Checkboxes');
    
    // Test with checkboxes disabled
    await pageStyleSection.locator('[data-testid="add-preset"]').click();
    
    await page.fill('[data-testid="preset-name"]', 'No Checkbox Test Preset');
    await page.selectOption('[data-testid="paper-size"]', 'letter');
    await page.selectOption('[data-testid="orientation"]', 'portrait');
    await page.uncheck('[data-testid="include-checkboxes"]');
    
    await page.click('[data-testid="save-button"]');
    
    // Should show no checkboxes in summary
    await expect(pageStyleSection).toContainText('No Checkboxes');
  });
});