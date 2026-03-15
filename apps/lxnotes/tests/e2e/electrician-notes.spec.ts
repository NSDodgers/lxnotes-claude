import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Electrician Notes Module', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Page Loading', () => {
    test('should load the electrician notes page', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      // Page title should show
      await expect(page.locator('h1')).toContainText('Electrician Notes');

      // Zap icon should be visible (lightning bolt)
      await expect(page.locator('h1 svg')).toBeVisible();

      // Should not be an error page
      await expect(page.locator('text=404')).not.toBeVisible();
    });

    test('should have green module color theme', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      // The Zap icon should have the electrician module color class
      const icon = page.locator('h1 svg');
      await expect(icon).toHaveClass(/text-modules-electrician/);
    });

    test('should display status filter buttons without "In Review"', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      // Should have To Do, Complete, Cancelled buttons
      await expect(page.getByRole('button', { name: /To Do/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Complete/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Cancelled/ })).toBeVisible();

      // Should NOT have In Review button
      await expect(page.getByRole('button', { name: /In Review/ })).not.toBeVisible();
    });

    test('should display the notes table', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      // Notes table should be present
      await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();
    });

    test('should display Add Electrician Note button', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      await expect(page.getByRole('button', { name: /Add Electrician Note/ })).toBeVisible();
    });

    test('should display hookup-related action buttons', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      // Should have fixture/hookup related buttons like work notes
      await expect(page.getByRole('button', { name: /Import Hookup CSV/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /View Hookup/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Manage Positions/ })).toBeVisible();
    });

    test('should display PDF and Email buttons', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      await expect(page.getByRole('button', { name: /PDF/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Email/ })).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should appear in sidebar navigation', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      // Electrician Notes link should exist in sidebar
      const sidebarLink = page.locator('a[href="/electrician-notes"]');
      await expect(sidebarLink).toBeVisible();
      await expect(sidebarLink).toContainText('Electrician Notes');
    });

    test('should be positioned after Work Notes in sidebar', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      // Get all nav links
      const navLinks = page.locator('[data-testid="sidebar"] nav a');
      const linkTexts: string[] = [];
      const count = await navLinks.count();
      for (let i = 0; i < count; i++) {
        linkTexts.push(await navLinks.nth(i).innerText());
      }

      const workIndex = linkTexts.findIndex(t => t.includes('Work Notes'));
      const elecIndex = linkTexts.findIndex(t => t.includes('Electrician Notes'));
      const prodIndex = linkTexts.findIndex(t => t.includes('Production Notes'));

      expect(workIndex).toBeGreaterThanOrEqual(0);
      expect(elecIndex).toBeGreaterThanOrEqual(0);
      // Electrician should be after Work and before Production
      expect(elecIndex).toBe(workIndex + 1);
      expect(elecIndex).toBeLessThan(prodIndex);
    });

    test('should navigate to electrician notes from sidebar', async ({ page }) => {
      await page.goto('/cue-notes');
      await helpers.waitForAppReady();

      // Click the electrician notes link
      await page.click('a[href="/electrician-notes"]');
      await page.waitForURL('**/electrician-notes');

      await expect(page).toHaveURL(/.*\/electrician-notes/);
      await expect(page.locator('h1')).toContainText('Electrician Notes');
    });

    test('should navigate back from electrician notes', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      // Navigate to work notes
      await page.click('a[href="/work-notes"]');
      await page.waitForURL('**/work-notes');
      await expect(page.locator('h1')).toContainText('Work Notes');

      // Navigate back
      await page.goBack();
      await expect(page).toHaveURL(/.*\/electrician-notes/);
    });
  });

  test.describe('Search and Filters', () => {
    test('should have a search input', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute('placeholder', /electrician/i);
    });

    test('should filter by status', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      // Click Complete status filter
      await page.getByRole('button', { name: /Complete/ }).click();

      // Should still be on electrician notes
      await expect(page.locator('h1')).toContainText('Electrician Notes');
    });

    test('should have type filter with electrician-specific types', async ({ page }) => {
      await page.goto('/electrician-notes');
      await helpers.waitForAppReady();

      // Quick add bar should show electrician types (work, focus, paperwork, think)
      // when in todo status — use the label text to find the section
      const quickAddLabel = page.locator('text=Quick Add:');
      if (await quickAddLabel.isVisible()) {
        // Should have Focus, Paperwork, Think quick-add buttons
        await expect(page.getByRole('button', { name: 'Focus' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Paperwork' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Think' })).toBeVisible();
      }
    });
  });

  test.describe('Demo Mode', () => {
    test('should load demo electrician notes', async ({ page }) => {
      await page.goto('/demo/electrician-notes');
      // Demo takes longer to initialize
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await expect(page.locator('h1')).toContainText('Electrician Notes');

      // Should have the notes table
      await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();
    });

    test('should display demo data in the table', async ({ page }) => {
      await page.goto('/demo/electrician-notes');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // The table should contain some demo note content
      const table = page.locator('[data-testid="notes-table"]');
      await expect(table).toBeVisible();

      // Check that table has rows (demo data)
      const rows = table.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    });
  });
});

test.describe('Work Notes Module - Regression', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should still load work notes page correctly', async ({ page }) => {
    await page.goto('/work-notes');
    await helpers.waitForAppReady();

    await expect(page.locator('h1')).toContainText('Work Notes');
    await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();
  });

  test('should still have "In Review" status button on work notes', async ({ page }) => {
    await page.goto('/work-notes');
    await helpers.waitForAppReady();

    // Work notes SHOULD have In Review
    await expect(page.getByRole('button', { name: /In Review/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /To Do/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Complete/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancelled/ })).toBeVisible();
  });

  test('should still display work notes icon (Wrench)', async ({ page }) => {
    await page.goto('/work-notes');
    await helpers.waitForAppReady();

    // Wrench icon should be present with blue module color
    const icon = page.locator('h1 svg');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveClass(/text-modules-work/);
  });

  test('should still have hookup/fixture buttons', async ({ page }) => {
    await page.goto('/work-notes');
    await helpers.waitForAppReady();

    await expect(page.getByRole('button', { name: /Import Hookup CSV/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /View Hookup/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Manage Positions/ })).toBeVisible();
  });

  test('should still have Add Work Note button', async ({ page }) => {
    await page.goto('/work-notes');
    await helpers.waitForAppReady();

    await expect(page.getByRole('button', { name: /Add Work Note/ })).toBeVisible();
  });

  test('should still appear in sidebar', async ({ page }) => {
    await page.goto('/work-notes');
    await helpers.waitForAppReady();

    const workLink = page.locator('a[href="/work-notes"]');
    await expect(workLink).toBeVisible();
    await expect(workLink).toContainText('Work Notes');
  });

  test('should still navigate between all modules including electrician', async ({ page }) => {
    await page.goto('/work-notes');
    await helpers.waitForAppReady();

    // Navigate to electrician notes
    await page.click('a[href="/electrician-notes"]');
    await page.waitForURL('**/electrician-notes');
    await expect(page.locator('h1')).toContainText('Electrician Notes');

    // Navigate back to work notes
    await page.click('a[href="/work-notes"]');
    await page.waitForURL('**/work-notes');
    await expect(page.locator('h1')).toContainText('Work Notes');
  });

  test('should load work notes in demo mode', async ({ page }) => {
    await page.goto('/demo/work-notes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.locator('h1')).toContainText('Work Notes');
    await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();

    // Should have demo data
    const rows = page.locator('[data-testid="notes-table"] tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});

test.describe('Module Differentiation', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('electrician notes should NOT have review status, work notes SHOULD', async ({ page }) => {
    // Check electrician - no review
    await page.goto('/electrician-notes');
    await helpers.waitForAppReady();
    await expect(page.getByRole('button', { name: /In Review/ })).not.toBeVisible();

    // Check work - has review
    await page.goto('/work-notes');
    await helpers.waitForAppReady();
    await expect(page.getByRole('button', { name: /In Review/ })).toBeVisible();
  });

  test('both modules should have fixture columns in the table', async ({ page }) => {
    // Check work notes table headers
    await page.goto('/work-notes');
    await helpers.waitForAppReady();
    const workTable = page.locator('[data-testid="notes-table"]');
    await expect(workTable).toContainText('Channels');
    await expect(workTable).toContainText('Position');

    // Check electrician notes table headers
    await page.goto('/electrician-notes');
    await helpers.waitForAppReady();
    const elecTable = page.locator('[data-testid="notes-table"]');
    await expect(elecTable).toContainText('Channels');
    await expect(elecTable).toContainText('Position');
  });

  test('each module should have its own color theme', async ({ page }) => {
    // Work notes - blue
    await page.goto('/work-notes');
    await helpers.waitForAppReady();
    const workIcon = page.locator('h1 svg');
    await expect(workIcon).toHaveClass(/text-modules-work/);

    // Electrician notes - green
    await page.goto('/electrician-notes');
    await helpers.waitForAppReady();
    const elecIcon = page.locator('h1 svg');
    await expect(elecIcon).toHaveClass(/text-modules-electrician/);
  });

  test('all four modules should be accessible from sidebar', async ({ page }) => {
    await page.goto('/cue-notes');
    await helpers.waitForAppReady();

    await expect(page.locator('a[href="/cue-notes"]')).toBeVisible();
    await expect(page.locator('a[href="/work-notes"]')).toBeVisible();
    await expect(page.locator('a[href="/electrician-notes"]')).toBeVisible();
    await expect(page.locator('a[href="/production-notes"]')).toBeVisible();
  });
});
