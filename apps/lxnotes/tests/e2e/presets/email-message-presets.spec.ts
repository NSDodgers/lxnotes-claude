import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';
import { testEmailMessagePreset } from '../../fixtures/test-data';

test.describe('Email Message Presets', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/cue-notes');
    await helpers.waitForAppReady();
    await helpers.navigateToSettingsTab('presets');
    // Email presets are in the Action Presets section (visible by default, no collapse)
  });

  test('should display email message presets section', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await expect(emailSection).toBeVisible();

    await expect(emailSection.locator('h2:has-text("Email Message Presets")')).toBeVisible();
    await expect(emailSection.locator('[data-testid="add-preset"]')).toBeVisible();
  });

  test('should display system default presets', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');

    await expect(emailSection).toContainText('Daily Report');
    await expect(emailSection).toContainText('Tech Rehearsal Notes');
  });

  test('should create new email message preset', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();

    await page.fill('[data-testid="preset-name"]', testEmailMessagePreset.name);
    await page.fill('[data-testid="recipients"]', testEmailMessagePreset.recipients);
    await page.fill('[data-testid="subject"]', testEmailMessagePreset.subject);
    await page.fill('[data-testid="message"]', testEmailMessagePreset.message);

    if (testEmailMessagePreset.includeNotesInBody) {
      await page.check('[data-testid="include-notes-in-body"]');
    }

    if (testEmailMessagePreset.attachPdf) {
      await page.check('[data-testid="attach-pdf"]');
    }

    await page.click('[data-testid="save-button"]');

    await expect(emailSection).toContainText(testEmailMessagePreset.name);
  });

  test('should validate email addresses', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();

    await page.fill('[data-testid="preset-name"]', 'Invalid Email Test');
    await page.fill('[data-testid="recipients"]', 'invalid-email, another-invalid');
    await page.fill('[data-testid="subject"]', 'Test Subject');
    await page.fill('[data-testid="message"]', 'Test Message');

    await page.click('[data-testid="save-button"]');

    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('valid email');

    await helpers.closeDialog();
  });

  test('should insert placeholders via click', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();

    await page.click('[data-testid="subject"]');
    await page.click('[data-testid="insert-placeholder-subject"]');
    await page.click('[data-testid="placeholder-production-title"]');

    const subjectValue = await page.inputValue('[data-testid="subject"]');
    expect(subjectValue).toContain('{{PRODUCTION_TITLE}}');

    await page.click('[data-testid="message"]');
    await page.click('[data-testid="insert-placeholder-message"]');
    await page.click('[data-testid="placeholder-todo-count"]');

    const messageValue = await page.inputValue('[data-testid="message"]');
    expect(messageValue).toContain('{{TODO_COUNT}}');

    await helpers.closeDialog();
  });

  test('should show placeholder chips with categories', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();

    await page.click('[data-testid="show-placeholders"]');

    await expect(page.locator('[data-testid="category-production"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-user"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-notes"]')).toBeVisible();

    await page.click('[data-testid="category-user"]');

    await expect(page.locator('[data-testid="placeholder-user-full-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="placeholder-production-title"]')).not.toBeVisible();

    await helpers.closeDialog();
  });

  test('should link to filter & sort presets', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();

    const filterPresetSelector = page.locator('[data-testid="filter-preset-selector"]');
    await expect(filterPresetSelector).toBeVisible();

    await filterPresetSelector.click();

    await expect(page.locator('[data-testid="preset-option"]')).toHaveCount(3, { timeout: 5000 });

    await helpers.closeDialog();
  });

  test('should conditionally show page style preset selector', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();

    await expect(page.locator('[data-testid="page-style-preset-selector"]')).not.toBeVisible();

    await page.check('[data-testid="attach-pdf"]');

    await expect(page.locator('[data-testid="page-style-preset-selector"]')).toBeVisible();

    await page.uncheck('[data-testid="attach-pdf"]');

    await expect(page.locator('[data-testid="page-style-preset-selector"]')).not.toBeVisible();

    await helpers.closeDialog();
  });

  test('should edit existing email preset', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();

    await page.fill('[data-testid="preset-name"]', 'Edit Test Email');
    await page.fill('[data-testid="recipients"]', 'test@example.com');
    await page.fill('[data-testid="subject"]', 'Original Subject');
    await page.fill('[data-testid="message"]', 'Original Message');

    await page.click('[data-testid="save-button"]');

    const customPresetCard = page.locator('[data-testid="preset-card"]:has-text("Edit Test Email")');
    await customPresetCard.locator('[data-testid="edit-preset"]').click();

    await page.fill('[data-testid="subject"]', 'Updated Subject');
    await page.fill('[data-testid="message"]', 'Updated Message');

    await page.click('[data-testid="save-button"]');

    await customPresetCard.click();
    await expect(customPresetCard).toContainText('Updated Subject');
  });

  test('should show integration badges for linked presets', async ({ page }) => {
    const emailSection = page.locator('[data-testid="email-message-presets"]');
    await emailSection.locator('[data-testid="add-preset"]').click();

    await page.fill('[data-testid="preset-name"]', 'Integration Test Email');
    await page.fill('[data-testid="recipients"]', 'test@example.com');
    await page.fill('[data-testid="subject"]', 'Test Subject');
    await page.fill('[data-testid="message"]', 'Test Message');

    const filterSelector = page.locator('[data-testid="filter-preset-selector"]');
    await filterSelector.click();
    await page.click('[data-testid="preset-option"]:first');

    await page.check('[data-testid="attach-pdf"]');
    const pageStyleSelector = page.locator('[data-testid="page-style-preset-selector"]');
    await pageStyleSelector.click();
    await page.click('[data-testid="preset-option"]:first');

    await page.click('[data-testid="save-button"]');

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

    await expect(emailSection).toContainText('Many Recipients Test');

    const presetCard = page.locator('[data-testid="preset-card"]:has-text("Many Recipients Test")');
    await expect(presetCard).toContainText('10 recipients');
  });
});
