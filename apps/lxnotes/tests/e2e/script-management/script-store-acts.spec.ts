import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Script Store Act Functionality', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/demo/cue-notes');
    await helpers.waitForAppReady();
    // Open script manager sidebar
    await page.click('button:has-text("Manage Script")');
  });

  test.describe('Act State on Pages', () => {
    test('should initialize with act data on demo pages', async ({ page }) => {
      // Act labels should be present from demo data
      const actLabels = page.locator('[data-testid="act-label"]');
      const count = await actLabels.count();
      expect(count).toBeGreaterThan(0);

      // Should see both Act 1 and Act 2 in demo data
      await expect(page.locator('[data-testid="act-label"]').filter({ hasText: 'Act 1' }).first()).toBeVisible();
      await expect(page.locator('[data-testid="act-label"]').filter({ hasText: 'Act 2' }).first()).toBeVisible();
    });
  });
});
