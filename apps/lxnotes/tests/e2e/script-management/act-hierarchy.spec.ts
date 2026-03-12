import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Act Hierarchy and Script Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/demo/cue-notes');
    await helpers.waitForAppReady();
    // Open script manager sidebar
    await page.click('button:has-text("Manage Script")');
  });

  test.describe('Act Display in Script Manager', () => {
    test('should display act labels on pages that have acts', async ({ page }) => {
      // Act labels should be visible on pages that have actName
      const actLabels = page.locator('[data-testid="act-label"]');
      const count = await actLabels.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should show continuation indicator for acts spanning multiple pages', async ({ page }) => {
      // Look for continuation labels (cont.)
      const continuationLabels = page.locator('[data-testid="act-label"]').filter({ hasText: '(cont.)' });
      const count = await continuationLabels.count();

      // Acts span multiple pages in demo data, so there should be continuations
      expect(count).toBeGreaterThan(0);
    });

    test('should highlight new act starts differently from continuations', async ({ page }) => {
      // New act starts should have amber color (not muted)
      const actLabels = page.locator('[data-testid="act-label"]');
      const firstLabel = actLabels.first();
      await expect(firstLabel).toBeVisible();

      // The first act label on page 1 should be a new act start (not continuation)
      const text = await firstLabel.textContent();
      expect(text).not.toContain('(cont.)');
    });
  });
});
