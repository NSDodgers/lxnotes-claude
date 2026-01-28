import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Print & Email Integration', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/cue-notes');
    await helpers.waitForAppReady();
  });

  test.describe('Print Notes Sidebar — Card Flow', () => {
    test('should access print sidebar from each module', async ({ page }) => {
      const modules: ('cue-notes' | 'work-notes' | 'production-notes')[] = ['cue-notes', 'work-notes', 'production-notes'];

      for (const mod of modules) {
        await test.step(`Verify print/email buttons in ${mod}`, async () => {
          await helpers.navigateToModule(mod);

          const printButton = page.locator('[data-testid="print-notes-button"]');
          const emailButton = page.locator('[data-testid="email-notes-button"]');

          await expect(printButton).toBeVisible();
          await expect(emailButton).toBeVisible();
        });

        // Open print sidebar and verify card grid appears
        await page.locator('[data-testid="print-notes-button"]').click();
        await expect(page.locator('[data-testid="preset-card-grid"]')).toBeVisible();

        // Should show preset cards and create-new card
        await expect(page.locator('[data-testid="preset-card-create-new"]')).toBeVisible();
        await expect(page.locator('[data-testid="preset-card-custom-one-off"]')).toBeVisible();

        // Close sidebar
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });

    test('should select a print preset card and see confirm panel', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await page.locator('[data-testid="print-notes-button"]').click();

      // Click first preset card
      const firstCard = page.locator('[data-testid^="preset-card-"]:not([data-testid="preset-card-create-new"]):not([data-testid="preset-card-custom-one-off"])').first();
      await firstCard.click();

      // Should show confirm panel
      const confirmPanel = page.locator('[data-testid="confirm-send-panel"]');
      await expect(confirmPanel).toBeVisible();

      // Should have back button and submit button
      await expect(page.locator('[data-testid="confirm-panel-back"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-panel-submit"]')).toBeVisible();

      // Back button returns to cards
      await page.locator('[data-testid="confirm-panel-back"]').click();
      await expect(page.locator('[data-testid="preset-card-grid"]')).toBeVisible();

      await page.keyboard.press('Escape');
    });

    test('should generate PDF from confirm panel', async ({ page }) => {
      await helpers.navigateToModule('production-notes');
      await page.locator('[data-testid="print-notes-button"]').click();

      // Select first preset card
      const firstCard = page.locator('[data-testid^="preset-card-"]:not([data-testid="preset-card-create-new"]):not([data-testid="preset-card-custom-one-off"])').first();
      await firstCard.click();

      // Wait for confirm panel
      await expect(page.locator('[data-testid="confirm-send-panel"]')).toBeVisible();

      // Generate PDF
      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-testid="confirm-panel-submit"]').click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });

    test('should use custom one-off print flow', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await page.locator('[data-testid="print-notes-button"]').click();

      // Click custom one-off link
      await page.locator('[data-testid="preset-card-custom-one-off"]').click();

      // Should show filter and page style selectors
      await expect(page.locator('text=Filter & Sort Preset')).toBeVisible();
      await expect(page.locator('text=Page Style Preset')).toBeVisible();

      // Back button returns to cards
      await page.locator('button:has-text("Back")').click();
      await expect(page.locator('[data-testid="preset-card-grid"]')).toBeVisible();

      await page.keyboard.press('Escape');
    });

    test('should open wizard from create-new card', async ({ page }) => {
      await helpers.navigateToModule('work-notes');
      await page.locator('[data-testid="print-notes-button"]').click();

      // Click create new card
      await page.locator('[data-testid="preset-card-create-new"]').click();

      // Should show wizard
      await expect(page.locator('[data-testid="preset-wizard"]')).toBeVisible();

      await page.keyboard.press('Escape');
    });
  });

  test.describe('Email Sidebar — Card Flow', () => {
    test('should access email sidebar from modules', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');

      const emailButton = page.locator('[data-testid="email-notes-button"]');
      await expect(emailButton).toBeVisible();

      await emailButton.click();

      // Should show card grid (not old dropdown)
      await expect(page.locator('[data-testid="preset-card-grid"]')).toBeVisible();

      await page.keyboard.press('Escape');
    });

    test('should select email preset card and see confirm panel with resolved placeholders', async ({ page }) => {
      await helpers.navigateToModule('production-notes');
      await page.locator('[data-testid="email-notes-button"]').click();

      // Click first email preset card
      const firstCard = page.locator('[data-testid^="preset-card-"]:not([data-testid="preset-card-create-new"]):not([data-testid="preset-card-custom-one-off"])').first();

      if (await firstCard.count() > 0) {
        await firstCard.click();

        // Should show confirm panel
        const confirmPanel = page.locator('[data-testid="confirm-send-panel"]');
        await expect(confirmPanel).toBeVisible();

        // Should NOT contain unresolved placeholders (key UX improvement)
        const panelText = await confirmPanel.textContent();
        expect(panelText).not.toContain('{{');

        // Should have submit button
        await expect(page.locator('[data-testid="confirm-panel-submit"]')).toBeVisible();
      }

      await page.keyboard.press('Escape');
    });
  });

  test.describe('Cross-Module Integration', () => {
    test('should show module-scoped preset cards across all modules', async ({ page }) => {
      const modules: ('cue-notes' | 'work-notes' | 'production-notes')[] = ['cue-notes', 'work-notes', 'production-notes'];

      for (const mod of modules) {
        await helpers.navigateToModule(mod);

        // Check print sidebar shows cards
        await page.locator('[data-testid="print-notes-button"]').click();
        await expect(page.locator('[data-testid="preset-card-grid"]')).toBeVisible();

        // Should have at least the create-new and custom-one-off cards
        await expect(page.locator('[data-testid="preset-card-create-new"]')).toBeVisible();

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Check email sidebar shows cards
        await page.locator('[data-testid="email-notes-button"]').click();
        await expect(page.locator('[data-testid="preset-card-grid"]')).toBeVisible();

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle PDF generation errors gracefully', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await page.locator('[data-testid="print-notes-button"]').click();

      // Select a preset card
      const firstCard = page.locator('[data-testid^="preset-card-"]:not([data-testid="preset-card-create-new"]):not([data-testid="preset-card-custom-one-off"])').first();

      if (await firstCard.count() > 0) {
        await firstCard.click();
        await expect(page.locator('[data-testid="confirm-send-panel"]')).toBeVisible();

        // Click submit
        await page.locator('[data-testid="confirm-panel-submit"]').click();

        // Wait for result (success or error)
        await page.waitForTimeout(5000);

        // If there's an error, verify it's displayed
        const errorMessage = page.locator('.text-red-400, [data-testid="generation-error"]');
        if (await errorMessage.count() > 0) {
          await expect(errorMessage).toBeVisible();
        }
      }

      await page.keyboard.press('Escape');
    });
  });
});
