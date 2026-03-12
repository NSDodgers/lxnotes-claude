import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Cue Lookup with Act Context', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/demo/cue-notes');
    await helpers.waitForAppReady();
    // Open script manager sidebar
    await page.click('button:has-text("Manage Script")');
  });

  test('should have act names on script pages in demo mode', async ({ page }) => {
    // Verify act labels exist on pages
    const actLabels = page.locator('[data-testid="act-label"]');
    const count = await actLabels.count();
    expect(count).toBeGreaterThan(0);
  });
});
