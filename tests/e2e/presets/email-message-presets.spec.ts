import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';
import { testEmailMessagePreset } from '../../fixtures/test-data';

test.describe('Email Message Presets', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
    await helpers.navigateToSettingsTab('presets');
  });

  test('should display email message presets section', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await expect(emailSection).toBeVisible();
    
    await expect(emailSection.locator('h2:has-text("Email Message Presets")')).toBeVisible();
    await expect(emailSection.locator('[data-testid="add-preset"]')).toBeVisible();
  });

  test('should display system default presets', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    
    // Should show system defaults
    await expect(emailSection).toContainText('Daily Report');
    await expect(emailSection).toContainText('Tech Rehearsal Notes');
  });

  test('should create new email message preset', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();
    
    // Fill basic info
    await page.fill('[data-testid="preset-name"]', testEmailMessagePreset.name);
    await page.fill('[data-testid="recipients"]', testEmailMessagePreset.recipients);
    await page.fill('[data-testid="subject"]', testEmailMessagePreset.subject);
    await page.fill('[data-testid="message"]', testEmailMessagePreset.message);
    
    // Set options
    if (testEmailMessagePreset.includeNotesInBody) {
      await page.check('[data-testid="include-notes-in-body"]');
    }
    
    if (testEmailMessagePreset.attachPdf) {
      await page.check('[data-testid="attach-pdf"]');
    }
    
    await page.click('[data-testid="save-button"]');
    
    // Should appear in list
    await expect(emailSection).toContainText(testEmailMessagePreset.name);
  });

  test('should validate email addresses', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();
    
    // Fill with invalid email
    await page.fill('[data-testid="preset-name"]', 'Invalid Email Test');
    await page.fill('[data-testid="recipients"]', 'invalid-email, another-invalid');
    await page.fill('[data-testid="subject"]', 'Test Subject');
    await page.fill('[data-testid="message"]', 'Test Message');
    
    await page.click('[data-testid="save-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('valid email');
    
    await helpers.closeDialog();
  });

  test('should insert placeholders via click', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();
    
    // Click to insert placeholder in subject
    await page.click('[data-testid="subject"]');
    await page.click('[data-testid="insert-placeholder-subject"]');
    await page.click('[data-testid="placeholder-production-title"]');
    
    // Should insert placeholder
    const subjectValue = await page.inputValue('[data-testid="subject"]');
    expect(subjectValue).toContain('{{PRODUCTION_TITLE}}');
    
    // Click to insert placeholder in message
    await page.click('[data-testid="message"]');
    await page.click('[data-testid="insert-placeholder-message"]');
    await page.click('[data-testid="placeholder-todo-count"]');
    
    // Should insert placeholder
    const messageValue = await page.inputValue('[data-testid="message"]');
    expect(messageValue).toContain('{{TODO_COUNT}}');
    
    await helpers.closeDialog();
  });

  test('should show placeholder chips with categories', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();
    
    // Show placeholder chips
    await page.click('[data-testid="show-placeholders"]');
    
    // Should show categories
    await expect(page.locator('[data-testid="category-production"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-user"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-notes"]')).toBeVisible();
    
    // Filter by category
    await page.click('[data-testid="category-user"]');
    
    // Should show only user placeholders
    await expect(page.locator('[data-testid="placeholder-user-full-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="placeholder-production-title"]')).not.toBeVisible();
    
    await helpers.closeDialog();
  });

  test('should link to filter & sort presets', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();
    
    // Should have filter preset selector
    const filterPresetSelector = page.locator('[data-testid="filter-preset-selector"]');
    await expect(filterPresetSelector).toBeVisible();
    
    // Click to select a filter preset
    await filterPresetSelector.click();
    
    // Should show available filter presets
    await expect(page.locator('[data-testid="preset-option"]')).toHaveCount(3, { timeout: 5000 });
    
    await helpers.closeDialog();
  });

  test('should conditionally show page style preset selector', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();
    
    // Page style selector should not be visible initially
    await expect(page.locator('[data-testid="page-style-preset-selector"]')).not.toBeVisible();
    
    // Enable PDF attachment
    await page.check('[data-testid="attach-pdf"]');
    
    // Now page style selector should be visible
    await expect(page.locator('[data-testid="page-style-preset-selector"]')).toBeVisible();
    
    // Disable PDF attachment
    await page.uncheck('[data-testid="attach-pdf"]');
    
    // Should hide again
    await expect(page.locator('[data-testid="page-style-preset-selector"]')).not.toBeVisible();
    
    await helpers.closeDialog();
  });

  test('should show preview with resolved placeholders', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();
    
    // Fill with placeholders
    await page.fill('[data-testid="subject"]', '{{PRODUCTION_TITLE}} - Report {{CURRENT_DATE}}');
    await page.fill('[data-testid="message"]', 'Outstanding: {{TODO_COUNT}}\nCompleted: {{COMPLETE_COUNT}}');
    
    // Show preview
    await page.click('[data-testid="show-preview"]');
    
    const preview = page.locator('[data-testid="email-preview"]');
    await expect(preview).toBeVisible();
    
    // Should show resolved placeholders
    await expect(preview).toContainText('Sample Production');
    await expect(preview).toContainText(new Date().toLocaleDateString());
    await expect(preview).toContainText('Outstanding: 0'); // Mock data
    await expect(preview).toContainText('Completed: 0'); // Mock data
    
    await helpers.closeDialog();
  });

  test('should edit existing email preset', async ({ page }) => {
    // Find a system preset to view (cannot edit)
    const dailyReportCard = page.locator('[data-testid="preset-card"]:has-text("Daily Report")');
    
    // Should not have edit button for system presets
    await expect(dailyReportCard.locator('[data-testid="edit-preset"]')).not.toBeVisible();
    
    // Create a custom preset to edit
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();
    
    await page.fill('[data-testid="preset-name"]', 'Edit Test Email');
    await page.fill('[data-testid="recipients"]', 'test@example.com');
    await page.fill('[data-testid="subject"]', 'Original Subject');
    await page.fill('[data-testid="message"]', 'Original Message');
    
    await page.click('[data-testid="save-button"]');
    
    // Now edit it
    const customPresetCard = page.locator('[data-testid="preset-card"]:has-text("Edit Test Email")');
    await customPresetCard.locator('[data-testid="edit-preset"]').click();
    
    // Update values
    await page.fill('[data-testid="subject"]', 'Updated Subject');
    await page.fill('[data-testid="message"]', 'Updated Message');
    
    await page.click('[data-testid="save-button"]');
    
    // Should show updated values (in expanded view)
    await customPresetCard.click(); // Expand details
    await expect(customPresetCard).toContainText('Updated Subject');
  });

  test('should show integration badges for linked presets', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();
    
    await page.fill('[data-testid="preset-name"]', 'Integration Test Email');
    await page.fill('[data-testid="recipients"]', 'test@example.com');
    await page.fill('[data-testid="subject"]', 'Test Subject');
    await page.fill('[data-testid="message"]', 'Test Message');
    
    // Link to filter preset
    const filterSelector = page.locator('[data-testid="filter-preset-selector"]');
    await filterSelector.click();
    await page.click('[data-testid="preset-option"]:first');
    
    // Enable PDF and link to page style preset
    await page.check('[data-testid="attach-pdf"]');
    const pageStyleSelector = page.locator('[data-testid="page-style-preset-selector"]');
    await pageStyleSelector.click();
    await page.click('[data-testid="preset-option"]:first');
    
    await page.click('[data-testid="save-button"]');
    
    // Should show integration badges
    const presetCard = page.locator('[data-testid="preset-card"]:has-text("Integration Test Email")');
    await expect(presetCard).toContainText('Filter: ✓');
    await expect(presetCard).toContainText('PDF: ✓');
  });

  test('should handle long recipient lists', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();
    
    const longRecipientList = Array.from({ length: 10 }, (_, i) => `user${i}@example.com`).join(', ');
    
    await page.fill('[data-testid="preset-name"]', 'Many Recipients Test');
    await page.fill('[data-testid="recipients"]', longRecipientList);
    await page.fill('[data-testid="subject"]', 'Test Subject');
    await page.fill('[data-testid="message"]', 'Test Message');
    
    await page.click('[data-testid="save-button"]');
    
    // Should save successfully
    await expect(emailSection).toContainText('Many Recipients Test');
    
    // Should show recipient count in summary
    const presetCard = page.locator('[data-testid="preset-card"]:has-text("Many Recipients Test")');
    await expect(presetCard).toContainText('10 recipients');
  });

  test('should show detailed view with expandable cards', async ({ page }) => {
    // Find a system preset with detailed view
    const dailyReportCard = page.locator('[data-testid="preset-card"]:has-text("Daily Report")');
    
    // Click to expand details
    await dailyReportCard.click();
    
    // Should show expanded information
    await expect(dailyReportCard.locator('[data-testid="preset-details"]')).toBeVisible();
    
    // Should show subject template
    await expect(dailyReportCard).toContainText('{{PRODUCTION_TITLE}}');
    await expect(dailyReportCard).toContainText('{{CURRENT_DATE}}');
  });

  test('should provide manage presets link', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();
    
    // Should have link to manage other presets
    const manageLink = page.locator('a:has-text("Manage presets")');
    await expect(manageLink).toBeVisible();
    await expect(manageLink).toHaveAttribute('href', '/settings?tab=presets');
    
    await helpers.closeDialog();
  });
});