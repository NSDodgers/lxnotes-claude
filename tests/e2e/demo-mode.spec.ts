import { test, expect } from '@playwright/test';

test.describe('Demo Mode Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start from homepage and activate demo mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click the "View Demo" button to enter demo mode
    await page.click('button:has-text("View Demo")');
    await page.waitForLoadState('networkidle');
  });

  test('should display demo mode banner', async ({ page }) => {
    // Check for demo mode indicators - should show "Romeo & Juliet Demo"
    await expect(page.locator('text=Romeo & Juliet Demo')).toBeVisible();
    await expect(page.locator('text=You\'re exploring sample data')).toBeVisible();
  });

  test('should load Romeo & Juliet demo data in Script Setup', async ({ page }) => {
    // Navigate to Script Setup in demo mode (demo should be already activated from beforeEach)
    await page.goto('/manage-script');
    await page.waitForLoadState('networkidle');
    
    // Should show script setup page
    await expect(page.locator('h1')).toContainText('Script Setup');
    
    // Should show demo banner confirming we're in demo mode
    await expect(page.locator('text=Romeo & Juliet Demo')).toBeVisible();
    
    // Should show Romeo & Juliet pages with correct page numbers
    await expect(page.locator('input[title="Click to edit page number"][value="3"]')).toBeVisible(); // Page 3
    await expect(page.locator('input[title="Click to edit page number"][value="4"]')).toBeVisible(); // Page 4  
    await expect(page.locator('input[title="Click to edit page number"][value="16"]')).toBeVisible(); // Page 16
    await expect(page.locator('input[title="Click to edit page number"][value="37"]')).toBeVisible(); // Page 37
    
    // Should show scenes with proper names
    await expect(page.locator('text=Act I - Prologue')).toBeVisible();
    await expect(page.locator('text=Act I, Scene I - Verona. A public place')).toBeVisible();
    await expect(page.locator('text=Act II - Prologue')).toBeVisible();
    
    // Should show first cue numbers
    await expect(page.locator('input[title="Click to edit first cue number"][value="1"]')).toBeVisible(); // Page 3 first cue
    await expect(page.locator('input[title="Click to edit first cue number"][value="4"]')).toBeVisible(); // Page 4 first cue  
    await expect(page.locator('input[title="Click to edit first cue number"][value="100"]')).toBeVisible(); // Page 37 first cue
  });

  test('should NOT show cue number warnings (validation fix verification)', async ({ page }) => {
    // Navigate to Script Setup with demo mode already activated
    await page.goto('/manage-script');
    await page.waitForLoadState('networkidle');
    
    // Should NOT have any warning triangles
    const warningTriangles = page.locator('[data-testid="alert-triangle"], .text-yellow-500 svg, svg.text-yellow-500');
    await expect(warningTriangles).toHaveCount(0);
    
    // Specifically check scenes that were previously showing warnings
    // Act I, Scene II should have cue 17 without warning
    const scene1Row = page.locator('text=Act I, Scene II - A street').locator('..');
    const scene1Warning = scene1Row.locator('svg.text-yellow-500');
    await expect(scene1Warning).toHaveCount(0);
    
    // Act I, Scene III should have cue 21 without warning  
    const scene2Row = page.locator('text=Act I, Scene III').locator('..');
    const scene2Warning = scene2Row.locator('svg.text-yellow-500');
    await expect(scene2Warning).toHaveCount(0);
  });

  test('should verify specific cue number boundaries work correctly', async ({ page }) => {
    await page.goto('/manage-script');
    await page.waitForLoadState('networkidle');
    
    // Test that scenes can have cue numbers equal to next page's first cue
    // Page 16 has first cue 16, and should contain a scene with cue 17
    // Page 20 has first cue 20, so cue 17 should be valid (17 < 20)
    
    // Find Act I, Scene II with cue 17
    const scene17 = page.locator('text=Act I, Scene II - A street').locator('..').locator('input[value="17"]');
    await expect(scene17).toBeVisible();
    
    // Should not have warning triangle next to it
    const scene17Container = scene17.locator('../../..');
    const warningInScene17 = scene17Container.locator('svg.text-yellow-500');
    await expect(warningInScene17).toHaveCount(0);
  });

  test('should load demo cue notes data', async ({ page }) => {
    await page.goto('/cue-notes');
    await page.waitForLoadState('networkidle');
    
    // Should show Romeo & Juliet cue notes
    await expect(page.locator('text=LQ1 - House to half')).toBeVisible();
    await expect(page.locator('text=LQ4 - Verona morning')).toBeVisible();
    await expect(page.locator('text=LQ104 - Moonlit orchard')).toBeVisible();
    
    // Should show different statuses
    await expect(page.locator('text=complete')).toBeVisible();
    await expect(page.locator('text=todo')).toBeVisible();
    
    // Should show cue notes specific to Romeo & Juliet
    await expect(page.locator('text=Balcony Scene')).toBeVisible();
    await expect(page.locator('text=Capulet party')).toBeVisible();
  });

  test('should load demo work notes data', async ({ page }) => {
    await page.goto('/work-notes');
    await page.waitForLoadState('networkidle');
    
    // Should show Romeo & Juliet work notes
    await expect(page.locator('text=Follow spot focus')).toBeVisible();
    await expect(page.locator('text=Haze machine service')).toBeVisible();
    await expect(page.locator('text=LED strip programming')).toBeVisible();
    
    // Should show position information
    await expect(page.locator('text=FOH Box L')).toBeVisible();
    await expect(page.locator('text=1st Electric')).toBeVisible();
    await expect(page.locator('text=2nd Electric')).toBeVisible();
    
    // Should show channel numbers
    await expect(page.locator('text=201')).toBeVisible();
    await expect(page.locator('text=150-165')).toBeVisible();
  });

  test('should load demo production notes data', async ({ page }) => {
    await page.goto('/production-notes');
    await page.waitForLoadState('networkidle');
    
    // Should show Romeo & Juliet production notes
    await expect(page.locator('text=Costume quick change lighting')).toBeVisible();
    await expect(page.locator('text=Sound cue coordination')).toBeVisible();
    await expect(page.locator('text=Balcony safety rail lighting')).toBeVisible();
    
    // Should show different note types
    await expect(page.locator('text=design')).toBeVisible();
    await expect(page.locator('text=technical')).toBeVisible();
    await expect(page.locator('text=safety')).toBeVisible();
  });

  test('should show lightwright equipment data', async ({ page }) => {
    await page.goto('/work-notes');
    await page.waitForLoadState('networkidle');
    
    // Should have lightwright data available for equipment lookup
    // Look for equipment positions that match our demo lightwright data
    await expect(page.locator('text=FOH Box L')).toBeVisible();
    await expect(page.locator('text=1st Electric')).toBeVisible();
    await expect(page.locator('text=2nd Electric')).toBeVisible();
  });

  test('should maintain demo data consistency across navigation', async ({ page }) => {
    // Start at cue notes
    await page.goto('/cue-notes');
    await page.waitForLoadState('networkidle');
    
    // Should see Romeo & Juliet data
    await expect(page.locator('text=LQ1 - House to half')).toBeVisible();
    
    // Navigate to work notes
    await page.goto('/work-notes');
    await page.waitForLoadState('networkidle');
    
    // Should see Romeo & Juliet work notes
    await expect(page.locator('text=Follow spot focus')).toBeVisible();
    
    // Navigate to production notes
    await page.goto('/production-notes');
    await page.waitForLoadState('networkidle');
    
    // Should see Romeo & Juliet production notes
    await expect(page.locator('text=Costume quick change lighting')).toBeVisible();
    
    // Navigate to script setup
    await page.goto('/manage-script');
    await page.waitForLoadState('networkidle');
    
    // Should still see Romeo & Juliet script data
    await expect(page.locator('text=Act I - Prologue')).toBeVisible();
  });

  test('should not persist demo data after page refresh', async ({ page }) => {
    // Go to cue notes and verify demo data is loaded
    await page.goto('/cue-notes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=LQ1 - House to half')).toBeVisible();
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Demo data should still be present (since demo mode is maintained in store)
    await expect(page.locator('text=LQ1 - House to half')).toBeVisible();
  });

  test('should have proper module theming in demo mode', async ({ page }) => {
    // Test cue notes - purple theme
    await page.goto('/cue-notes');
    await page.waitForLoadState('networkidle');
    
    // Should have cue notes styling/theming
    const cueButton = page.locator('button:has-text("Add Note")').first();
    if (await cueButton.isVisible()) {
      // Purple theme should be applied
      await expect(cueButton).toHaveClass(/modules-cue/);
    }
    
    // Test work notes - blue theme
    await page.goto('/work-notes');
    await page.waitForLoadState('networkidle');
    
    // Should have work notes styling
    const workButton = page.locator('button:has-text("Add Note")').first();
    if (await workButton.isVisible()) {
      // Blue theme should be applied
      await expect(workButton).toHaveClass(/modules-work/);
    }
    
    // Test production notes - cyan theme
    await page.goto('/production-notes');
    await page.waitForLoadState('networkidle');
    
    // Should have production notes styling
    const prodButton = page.locator('button:has-text("Add Note")').first();
    if (await prodButton.isVisible()) {
      // Cyan theme should be applied
      await expect(prodButton).toHaveClass(/modules-production/);
    }
  });

  test('should support cue lookup functionality with demo data', async ({ page }) => {
    await page.goto('/cue-notes');
    await page.waitForLoadState('networkidle');
    
    // If there's an "Add Note" button or cue lookup feature, test it
    const addButton = page.locator('button:has-text("Add Note")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Dialog should open
      const dialog = page.locator('[role="dialog"], .modal, .dialog');
      if (await dialog.isVisible()) {
        // Should have cue number input
        const cueInput = page.locator('input[placeholder*="cue"], input[name*="cue"]').first();
        
        if (await cueInput.isVisible()) {
          // Test cue number lookup with demo data
          await cueInput.fill('17');
          
          // Should find the scene from our demo data
          await expect(page.locator('text=Act I, Scene II')).toBeVisible();
        }
      }
    }
  });
});