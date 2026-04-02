import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Act Inline Editing', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/demo/cue-notes');
    await helpers.waitForAppReady();
    // Open script manager sidebar
    await page.click('button:has-text("Manage Script")');
  });

  test.describe('Edit existing act inline', () => {
    test('should open inline edit form on double-click', async ({ page }) => {
      const actLabel = page.locator('[data-testid="act-label"]').first();
      await expect(actLabel).toBeVisible();

      // Double-click the act label
      await actLabel.dblclick();

      // Should show inline edit form (input fields), not a modal dialog
      const nameInput = page.locator('input[placeholder="e.g., Act 1, Prologue"]');
      await expect(nameInput).toBeVisible();

      // No modal overlay should exist
      const modalOverlay = page.locator('.fixed.inset-0.z-50');
      await expect(modalOverlay).toHaveCount(0);
    });

    test('should open inline edit form on pencil icon click', async ({ page }) => {
      const actLabel = page.locator('[data-testid="act-label"]').first();
      await actLabel.hover();

      // Click the edit (pencil) button
      const editButton = actLabel.locator('button[title="Edit"]');
      await editButton.click();

      // Should show inline edit form
      const nameInput = page.locator('input[placeholder="e.g., Act 1, Prologue"]');
      await expect(nameInput).toBeVisible();
    });

    test('should save act name on Enter key', async ({ page }) => {
      const actLabel = page.locator('[data-testid="act-label"]').first();
      const originalText = await actLabel.textContent();
      await actLabel.dblclick();

      const nameInput = page.locator('input[placeholder="e.g., Act 1, Prologue"]');
      await nameInput.fill('Edited Act Name');
      await nameInput.press('Enter');

      // Should return to display mode with updated name
      const updatedLabel = page.locator('[data-testid="act-label"]').first();
      await expect(updatedLabel).toContainText('Edited Act Name');
    });

    test('should cancel edit on Escape key', async ({ page }) => {
      const actLabel = page.locator('[data-testid="act-label"]').first();
      const originalText = await actLabel.textContent();
      await actLabel.dblclick();

      const nameInput = page.locator('input[placeholder="e.g., Act 1, Prologue"]');
      await nameInput.fill('Should Not Save');
      await nameInput.press('Escape');

      // Should return to display mode with original name
      const restoredLabel = page.locator('[data-testid="act-label"]').first();
      await expect(restoredLabel).not.toContainText('Should Not Save');
    });
  });

  test.describe('Add new act inline', () => {
    test('should show inline form when Add Act is clicked', async ({ page }) => {
      // Find a page without an act and click Add Act
      const addActButton = page.locator('button:has-text("Add Act")').first();

      if (await addActButton.isVisible()) {
        await addActButton.click();

        // Should show inline edit form, not a modal
        const nameInput = page.locator('input[placeholder="e.g., Act 1, Prologue"]');
        await expect(nameInput).toBeVisible();

        // No modal overlay
        const modalOverlay = page.locator('.fixed.inset-0.z-50');
        await expect(modalOverlay).toHaveCount(0);
      }
    });

    test('should cancel add act on Escape without creating act', async ({ page }) => {
      const addActButton = page.locator('button:has-text("Add Act")').first();

      if (await addActButton.isVisible()) {
        await addActButton.click();

        const nameInput = page.locator('input[placeholder="e.g., Act 1, Prologue"]');
        await nameInput.press('Escape');

        // Add Act button should reappear (no act was created)
        await expect(addActButton).toBeVisible();
      }
    });
  });

  test.describe('Continuation cue display', () => {
    test('should show cue number on continuation acts', async ({ page }) => {
      // All act labels should show a Cue section (including continuations)
      const actLabels = page.locator('[data-testid="act-label"]');
      const count = await actLabels.count();

      for (let i = 0; i < count; i++) {
        const label = actLabels.nth(i);
        // Every act label should have a Cue display
        await expect(label.locator('text=Cue:')).toBeVisible();
      }
    });
  });
});
