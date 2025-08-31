import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Navigation', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
  });

  test('should display the main dashboard with sidebar', async ({ page }) => {
    // Check if sidebar is visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    
    // Check if main content area is visible
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    
    // Check if LX Notes logo is visible
    await expect(page.locator('img[alt="LX Notes"]')).toBeVisible();
  });

  test('should navigate between modules', async ({ page }) => {
    // Navigate to Cue Notes
    await helpers.navigateToModule('cue-notes');
    await helpers.expectPageTitle('Cue Notes');
    await expect(page).toHaveURL(/.*\/cue-notes/);

    // Navigate to Work Notes
    await helpers.navigateToModule('work-notes');
    await helpers.expectPageTitle('Work Notes');
    await expect(page).toHaveURL(/.*\/work-notes/);

    // Navigate to Production Notes
    await helpers.navigateToModule('production-notes');
    await helpers.expectPageTitle('Production Notes');
    await expect(page).toHaveURL(/.*\/production-notes/);

    // Navigate to Settings
    await helpers.navigateToModule('settings');
    await helpers.expectPageTitle('Settings');
    await expect(page).toHaveURL(/.*\/settings/);
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Navigate to Cue Notes
    await helpers.navigateToModule('cue-notes');
    
    // Check if the active link is highlighted
    const cueNotesLink = page.locator('a[href="/cue-notes"]');
    await expect(cueNotesLink).toHaveClass(/border-modules-production/);
    
    // Check other links are not highlighted
    const workNotesLink = page.locator('a[href="/work-notes"]');
    await expect(workNotesLink).not.toHaveClass(/border-modules-production/);
  });

  test('should toggle sidebar collapse', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]');
    const collapseButton = page.locator('[data-testid="sidebar-collapse"]');
    
    // Initially sidebar should be expanded
    await expect(sidebar).toHaveClass(/w-64/);
    
    // Click collapse button
    await collapseButton.click();
    
    // Sidebar should be collapsed
    await expect(sidebar).toHaveClass(/w-16/);
    
    // Click expand button
    await collapseButton.click();
    
    // Sidebar should be expanded again
    await expect(sidebar).toHaveClass(/w-64/);
  });

  test('should toggle tablet mode', async ({ page }) => {
    const tabletToggle = page.locator('[data-testid="tablet-mode-toggle"]');
    
    // Initially tablet mode should be off
    await expect(tabletToggle).not.toHaveClass(/bg-modules-production/);
    
    // Enable tablet mode
    await helpers.enableTabletMode();
    
    // Tablet mode toggle should be active
    await expect(tabletToggle).toHaveClass(/bg-modules-production/);
    
    // Disable tablet mode
    await tabletToggle.click();
    
    // Tablet mode toggle should be inactive
    await expect(tabletToggle).not.toHaveClass(/bg-modules-production/);
  });

  test('should display production information in header', async ({ page }) => {
    // Navigate to a module to see the production header
    await helpers.navigateToModule('cue-notes');
    
    // Check production name is displayed
    await expect(page.locator('[data-testid="production-name"]')).toContainText('Sample Production');
    
    // Check production abbreviation is displayed
    await expect(page.locator('[data-testid="production-abbreviation"]')).toBeVisible();
    
    // Check production logo is displayed
    await expect(page.locator('[data-testid="production-logo"]')).toBeVisible();
  });

  test('should maintain navigation state on page reload', async ({ page }) => {
    // Navigate to a specific module
    await helpers.navigateToModule('work-notes');
    
    // Reload the page
    await page.reload();
    await helpers.waitForAppReady();
    
    // Should still be on the same page
    await expect(page).toHaveURL(/.*\/work-notes/);
    await helpers.expectPageTitle('Work Notes');
  });

  test.describe('Responsive Navigation', () => {
    test('should work on mobile devices', async ({ page }) => {
      await helpers.testMobileLayout();
      
      // Navigation should still work on mobile
      await helpers.navigateToModule('cue-notes');
      await helpers.expectPageTitle('Cue Notes');
      
      // Sidebar should adapt to mobile layout
      const sidebar = page.locator('[data-testid="sidebar"]');
      await expect(sidebar).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      await helpers.testTabletLayout();
      
      // Test tablet-specific features
      await helpers.enableTabletMode();
      
      // Navigation should work in tablet mode
      await helpers.navigateToModule('production-notes');
      await helpers.expectPageTitle('Production Notes');
    });

    test('should work on desktop', async ({ page }) => {
      await helpers.testDesktopLayout();
      
      // Full desktop navigation should work
      await helpers.navigateToModule('settings');
      await helpers.expectPageTitle('Settings');
      
      // Sidebar should be fully expanded on desktop
      const sidebar = page.locator('[data-testid="sidebar"]');
      await expect(sidebar).toHaveClass(/w-64/);
    });
  });

  test('should handle deep links correctly', async ({ page }) => {
    // Navigate directly to a deep link
    await page.goto('/settings');
    await helpers.waitForAppReady();
    
    // Should show the correct page
    await helpers.expectPageTitle('Settings');
    await expect(page).toHaveURL(/.*\/settings/);
    
    // Navigation should still work
    await helpers.navigateToModule('cue-notes');
    await helpers.expectPageTitle('Cue Notes');
  });

  test('should not have console errors during navigation', async ({ page }) => {
    const errors = await helpers.collectConsoleErrors();
    
    // Navigate between all modules
    await helpers.navigateToModule('cue-notes');
    await helpers.navigateToModule('work-notes');
    await helpers.navigateToModule('production-notes');
    await helpers.navigateToModule('settings');
    
    // Should have no console errors
    expect(errors).toHaveLength(0);
  });

  test('should handle back button navigation', async ({ page }) => {
    // Navigate through multiple pages
    await helpers.navigateToModule('cue-notes');
    await helpers.navigateToModule('work-notes');
    
    // Use browser back button
    await page.goBack();
    
    // Should be back on cue notes
    await expect(page).toHaveURL(/.*\/cue-notes/);
    await helpers.expectPageTitle('Cue Notes');
    
    // Forward button should work too
    await page.goForward();
    await expect(page).toHaveURL(/.*\/work-notes/);
    await helpers.expectPageTitle('Work Notes');
  });
});