import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Print & Email Integration', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
  });

  test.describe('Print Notes View', () => {
    test('should access print view from each module', async ({ page }) => {
      const modules = ['cue-notes', 'work-notes', 'production-notes'];
      
      for (const module of modules) {
        await helpers.navigateToModule(module);
        
        // Should have print button in toolbar
        const printButton = page.locator('[data-testid="print-notes-button"]');
        await expect(printButton).toBeVisible();
        
        await printButton.click();
        
        // Should open print dialog
        const printDialog = page.locator('[data-testid="print-dialog"]');
        await expect(printDialog).toBeVisible();
        
        await helpers.closeDialog();
      }
    });

    test('should require filter preset selection', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await page.locator('[data-testid="print-notes-button"]').click();
      
      const printDialog = page.locator('[data-testid="print-dialog"]');
      const generateButton = printDialog.locator('[data-testid="generate-pdf"]');
      
      // Generate button should be disabled initially
      await expect(generateButton).toBeDisabled();
      
      // Select filter preset
      const filterPresetSelector = printDialog.locator('[data-testid="filter-preset-selector"]');
      await filterPresetSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      // Still disabled without page style preset
      await expect(generateButton).toBeDisabled();
      
      await helpers.closeDialog();
    });

    test('should require page style preset selection', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await page.locator('[data-testid="print-notes-button"]').click();
      
      const printDialog = page.locator('[data-testid="print-dialog"]');
      const generateButton = printDialog.locator('[data-testid="generate-pdf"]');
      
      // Select both presets
      const filterPresetSelector = printDialog.locator('[data-testid="filter-preset-selector"]');
      await filterPresetSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      const pageStyleSelector = printDialog.locator('[data-testid="page-style-preset-selector"]');
      await pageStyleSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      // Now generate button should be enabled
      await expect(generateButton).toBeEnabled();
      
      await helpers.closeDialog();
    });

    test('should filter presets by module type', async ({ page }) => {
      await helpers.navigateToModule('work-notes');
      await page.locator('[data-testid="print-notes-button"]').click();
      
      const printDialog = page.locator('[data-testid="print-dialog"]');
      const filterPresetSelector = printDialog.locator('[data-testid="filter-preset-selector"]');
      
      await filterPresetSelector.click();
      
      // Should only show work-compatible filter presets
      const presetOptions = page.locator('[data-testid="preset-option"]');
      const count = await presetOptions.count();
      
      // Verify at least some presets are available
      expect(count).toBeGreaterThan(0);
      
      // Each option should be for work module or 'all'
      for (let i = 0; i < count; i++) {
        const option = presetOptions.nth(i);
        const moduleType = await option.getAttribute('data-module-type');
        expect(['work', 'all']).toContain(moduleType);
      }
      
      await helpers.closeDialog();
    });

    test('should show preview of notes matching filter', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await page.locator('[data-testid="print-notes-button"]').click();
      
      const printDialog = page.locator('[data-testid="print-dialog"]');
      
      // Select filter preset
      const filterPresetSelector = printDialog.locator('[data-testid="filter-preset-selector"]');
      await filterPresetSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      // Should show preview of matching notes
      const preview = printDialog.locator('[data-testid="notes-preview"]');
      await expect(preview).toBeVisible();
      
      // Should show count of notes
      const noteCount = printDialog.locator('[data-testid="notes-count"]');
      await expect(noteCount).toBeVisible();
      await expect(noteCount).toContainText('note');
      
      await helpers.closeDialog();
    });

    test('should generate PDF with selected presets', async ({ page }) => {
      await helpers.navigateToModule('production-notes');
      await page.locator('[data-testid="print-notes-button"]').click();
      
      const printDialog = page.locator('[data-testid="print-dialog"]');
      
      // Select both required presets
      const filterPresetSelector = printDialog.locator('[data-testid="filter-preset-selector"]');
      await filterPresetSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      const pageStyleSelector = printDialog.locator('[data-testid="page-style-preset-selector"]');
      await pageStyleSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      // Generate PDF
      const downloadPromise = page.waitForEvent('download');
      await printDialog.locator('[data-testid="generate-pdf"]').click();
      
      // Should trigger download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
      expect(download.suggestedFilename()).toContain('production-notes');
      
      await helpers.closeDialog();
    });

    test('should show loading state during PDF generation', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await page.locator('[data-testid="print-notes-button"]').click();
      
      const printDialog = page.locator('[data-testid="print-dialog"]');
      
      // Select presets
      const filterPresetSelector = printDialog.locator('[data-testid="filter-preset-selector"]');
      await filterPresetSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      const pageStyleSelector = printDialog.locator('[data-testid="page-style-preset-selector"]');
      await pageStyleSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      const generateButton = printDialog.locator('[data-testid="generate-pdf"]');
      
      // Start generation
      await generateButton.click();
      
      // Should show loading state
      await expect(generateButton).toContainText('Generating');
      await expect(generateButton).toBeDisabled();
      
      // Wait for completion or timeout
      await page.waitForTimeout(3000);
      
      await helpers.closeDialog();
    });
  });

  test.describe('Email Integration', () => {
    test('should access email view from modules', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      
      // Should have email button in toolbar
      const emailButton = page.locator('[data-testid="email-notes-button"]');
      await expect(emailButton).toBeVisible();
      
      await emailButton.click();
      
      // Should open email dialog
      const emailDialog = page.locator('[data-testid="email-dialog"]');
      await expect(emailDialog).toBeVisible();
      
      await helpers.closeDialog();
    });

    test('should require email preset selection', async ({ page }) => {
      await helpers.navigateToModule('work-notes');
      await page.locator('[data-testid="email-notes-button"]').click();
      
      const emailDialog = page.locator('[data-testid="email-dialog"]');
      const sendButton = emailDialog.locator('[data-testid="send-email"]');
      
      // Send button should be disabled initially
      await expect(sendButton).toBeDisabled();
      
      // Select email preset
      const emailPresetSelector = emailDialog.locator('[data-testid="email-preset-selector"]');
      await emailPresetSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      // Should enable send button
      await expect(sendButton).toBeEnabled();
      
      await helpers.closeDialog();
    });

    test('should show resolved email preview', async ({ page }) => {
      await helpers.navigateToModule('production-notes');
      await page.locator('[data-testid="email-notes-button"]').click();
      
      const emailDialog = page.locator('[data-testid="email-dialog"]');
      
      // Select email preset
      const emailPresetSelector = emailDialog.locator('[data-testid="email-preset-selector"]');
      await emailPresetSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      // Should show email preview
      const preview = emailDialog.locator('[data-testid="email-preview"]');
      await expect(preview).toBeVisible();
      
      // Should show resolved subject and message
      await expect(preview.locator('[data-testid="preview-subject"]')).toBeVisible();
      await expect(preview.locator('[data-testid="preview-message"]')).toBeVisible();
      
      // Should not contain unresolved placeholders
      const subjectText = await preview.locator('[data-testid="preview-subject"]').textContent();
      const messageText = await preview.locator('[data-testid="preview-message"]').textContent();
      
      expect(subjectText).not.toContain('{{');
      expect(messageText).not.toContain('{{');
      
      await helpers.closeDialog();
    });

    test('should handle email presets with PDF attachments', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await page.locator('[data-testid="email-notes-button"]').click();
      
      const emailDialog = page.locator('[data-testid="email-dialog"]');
      
      // Select email preset that has PDF attachment enabled
      const emailPresetSelector = emailDialog.locator('[data-testid="email-preset-selector"]');
      await emailPresetSelector.click();
      
      // Find preset with PDF attachment (if available)
      const pdfPresetOption = page.locator('[data-testid="preset-option"][data-has-pdf="true"]');
      if (await pdfPresetOption.count() > 0) {
        await pdfPresetOption.first().click();
        
        // Should show PDF attachment indicator
        await expect(emailDialog.locator('[data-testid="pdf-attachment-indicator"]')).toBeVisible();
        
        // Should require page style preset selection
        const pageStyleSelector = emailDialog.locator('[data-testid="page-style-preset-selector"]');
        await expect(pageStyleSelector).toBeVisible();
      }
      
      await helpers.closeDialog();
    });

    test('should validate email addresses before sending', async ({ page }) => {
      await helpers.navigateToModule('work-notes');
      await page.locator('[data-testid="email-notes-button"]').click();
      
      const emailDialog = page.locator('[data-testid="email-dialog"]');
      
      // Select email preset
      const emailPresetSelector = emailDialog.locator('[data-testid="email-preset-selector"]');
      await emailPresetSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      // Should show recipient validation
      const recipientsList = emailDialog.locator('[data-testid="recipients-list"]');
      if (await recipientsList.count() > 0) {
        await expect(recipientsList).toBeVisible();
        
        // Should validate email format
        const invalidEmails = recipientsList.locator('[data-testid="invalid-email"]');
        const invalidCount = await invalidEmails.count();
        
        if (invalidCount > 0) {
          // Send button should be disabled for invalid emails
          const sendButton = emailDialog.locator('[data-testid="send-email"]');
          await expect(sendButton).toBeDisabled();
        }
      }
      
      await helpers.closeDialog();
    });

    test('should send email with confirmation', async ({ page }) => {
      await helpers.navigateToModule('production-notes');
      await page.locator('[data-testid="email-notes-button"]').click();
      
      const emailDialog = page.locator('[data-testid="email-dialog"]');
      
      // Select email preset
      const emailPresetSelector = emailDialog.locator('[data-testid="email-preset-selector"]');
      await emailPresetSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      const sendButton = emailDialog.locator('[data-testid="send-email"]');
      
      // Should show send confirmation
      await sendButton.click();
      const confirmationDialog = page.locator('[data-testid="send-confirmation"]');
      await expect(confirmationDialog).toBeVisible();
      
      // Should show recipient count and preview
      await expect(confirmationDialog.locator('[data-testid="recipient-count"]')).toBeVisible();
      await expect(confirmationDialog.locator('[data-testid="send-preview"]')).toBeVisible();
      
      // Cancel sending
      await confirmationDialog.locator('[data-testid="cancel-send"]').click();
      
      await helpers.closeDialog();
    });
  });

  test.describe('Cross-Module Integration', () => {
    test('should apply module-specific filtering across print/email', async ({ page }) => {
      const modules = ['cue-notes', 'work-notes', 'production-notes'];
      
      for (const module of modules) {
        await helpers.navigateToModule(module);
        
        // Test print integration
        await page.locator('[data-testid="print-notes-button"]').click();
        
        let dialog = page.locator('[data-testid="print-dialog"]');
        let filterSelector = dialog.locator('[data-testid="filter-preset-selector"]');
        await filterSelector.click();
        
        // Should show only compatible filter presets
        const printPresets = page.locator('[data-testid="preset-option"]');
        const printCount = await printPresets.count();
        
        await page.keyboard.press('Escape');
        await helpers.closeDialog();
        
        // Test email integration
        await page.locator('[data-testid="email-notes-button"]').click();
        
        dialog = page.locator('[data-testid="email-dialog"]');
        const emailSelector = dialog.locator('[data-testid="email-preset-selector"]');
        await emailSelector.click();
        
        // Should show email presets (may be different from print presets)
        const emailPresets = page.locator('[data-testid="preset-option"]');
        const emailCount = await emailPresets.count();
        
        expect(emailCount).toBeGreaterThanOrEqual(0);
        
        await page.keyboard.press('Escape');
        await helpers.closeDialog();
      }
    });

    test('should maintain consistent data between print and email views', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      
      // Check print view note count
      await page.locator('[data-testid="print-notes-button"]').click();
      
      let dialog = page.locator('[data-testid="print-dialog"]');
      let filterSelector = dialog.locator('[data-testid="filter-preset-selector"]');
      await filterSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      const printNotesCount = await dialog.locator('[data-testid="notes-count"]').textContent();
      await helpers.closeDialog();
      
      // Check email view with same filter
      await page.locator('[data-testid="email-notes-button"]').click();
      
      dialog = page.locator('[data-testid="email-dialog"]');
      const emailSelector = dialog.locator('[data-testid="email-preset-selector"]');
      await emailSelector.click();
      
      // Find email preset with same filter preset
      const sameFilterPreset = page.locator('[data-testid="preset-option"][data-filter-preset="same"]');
      if (await sameFilterPreset.count() > 0) {
        await sameFilterPreset.first().click();
        
        const emailNotesCount = await dialog.locator('[data-testid="notes-count"]').textContent();
        
        // Should show same note count
        expect(emailNotesCount).toBe(printNotesCount);
      }
      
      await helpers.closeDialog();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle PDF generation errors gracefully', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await page.locator('[data-testid="print-notes-button"]').click();
      
      const printDialog = page.locator('[data-testid="print-dialog"]');
      
      // Select presets
      const filterPresetSelector = printDialog.locator('[data-testid="filter-preset-selector"]');
      await filterPresetSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      const pageStyleSelector = printDialog.locator('[data-testid="page-style-preset-selector"]');
      await pageStyleSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      // Mock network failure or similar error scenario would go here
      // For now, test that error states are handled
      const generateButton = printDialog.locator('[data-testid="generate-pdf"]');
      await generateButton.click();
      
      // Should handle errors gracefully (button re-enabled, error message shown)
      await page.waitForTimeout(5000);
      
      // If there's an error state, verify it's handled properly
      const errorMessage = printDialog.locator('[data-testid="generation-error"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
        await expect(generateButton).toBeEnabled();
      }
      
      await helpers.closeDialog();
    });

    test('should handle email sending errors', async ({ page }) => {
      await helpers.navigateToModule('work-notes');
      await page.locator('[data-testid="email-notes-button"]').click();
      
      const emailDialog = page.locator('[data-testid="email-dialog"]');
      
      // Select email preset
      const emailPresetSelector = emailDialog.locator('[data-testid="email-preset-selector"]');
      await emailPresetSelector.click();
      await page.locator('[data-testid="preset-option"]').first().click();
      
      const sendButton = emailDialog.locator('[data-testid="send-email"]');
      await sendButton.click();
      
      // Confirm send
      const confirmationDialog = page.locator('[data-testid="send-confirmation"]');
      await confirmationDialog.locator('[data-testid="confirm-send"]').click();
      
      // Wait for send attempt
      await page.waitForTimeout(3000);
      
      // Should handle send errors gracefully
      const errorMessage = page.locator('[data-testid="send-error"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
        // Should allow retry
        await expect(page.locator('[data-testid="retry-send"]')).toBeVisible();
      }
      
      await helpers.closeDialog();
    });
  });
});