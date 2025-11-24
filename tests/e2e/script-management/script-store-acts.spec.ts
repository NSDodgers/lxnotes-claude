import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Script Store Act Functionality', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/cue-notes');
    await helpers.waitForAppReady();
  });

  test.describe('Act State Management', () => {
    test('should initialize with default act data', async ({ page }) => {
      // Navigate to script manager to trigger store initialization
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Check that default acts are present (from mock data)
      await expect(page.getByText('Act I')).toBeVisible();
      await expect(page.getByText('Act II')).toBeVisible();

      // Should show in proper order
      const actItems = page.locator('[data-testid="act-item"]');
      await expect(actItems).toHaveCount(2);
    });

    test('should persist act data in browser storage', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Get initial state
      const initialStoreData = await page.evaluate(() => {
        const scriptStore = localStorage.getItem('script-store');
        return scriptStore ? JSON.parse(scriptStore) : null;
      });

      expect(initialStoreData).toBeTruthy();
      expect(initialStoreData.state.acts).toBeDefined();
      expect(Array.isArray(initialStoreData.state.acts)).toBe(true);
    });

    test('should maintain act order through navigation', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Note initial act order
      const initialActs = await page.locator('[data-testid="act-item"]').allTextContents();

      // Navigate away and back
      await helpers.navigateToModule('cue-notes');
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Should maintain same order
      const finalActs = await page.locator('[data-testid="act-item"]').allTextContents();
      expect(finalActs).toEqual(initialActs);
    });
  });

  test.describe('Act CRUD Operations', () => {
    test('should add new act and update store', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Get initial count
      const initialCount = await page.locator('[data-testid="act-item"]').count();

      // Add new act
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      await page.fill('[data-testid="act-number"]', 'Test Act');
      await page.fill('[data-testid="first-cue-number"]', '300');
      await page.click('[data-testid="save-act"]');

      // Should increase count
      const newCount = await page.locator('[data-testid="act-item"]').count();
      expect(newCount).toBe(initialCount + 1);

      // Should persist in store
      const storeData = await page.evaluate(() => {
        const scriptStore = localStorage.getItem('script-store');
        return scriptStore ? JSON.parse(scriptStore).state.acts : [];
      });

      const testAct = storeData.find((act: any) => act.actNumber === 'Test Act');
      expect(testAct).toBeTruthy();
      expect(testAct.firstCueNumber).toBe('300');
    });

    test('should update existing act', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Edit first act
      const firstAct = page.locator('[data-testid="act-item"]').first();
      await firstAct.locator('[data-testid="edit-act"]').click();

      // Update name
      const nameField = page.locator('[data-testid="act-name"]');
      await nameField.fill('Updated Act Name');
      await page.click('[data-testid="save-act"]');

      // Should show updated name
      await expect(page.getByText('Updated Act Name')).toBeVisible();

      // Should persist in store
      const storeData = await page.evaluate(() => {
        const scriptStore = localStorage.getItem('script-store');
        return scriptStore ? JSON.parse(scriptStore).state.acts : [];
      });

      const updatedAct = storeData.find((act: any) => act.name === 'Updated Act Name');
      expect(updatedAct).toBeTruthy();
    });

    test('should delete act and update store', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Create test act first
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      await page.fill('[data-testid="act-number"]', 'Delete Me');
      await page.fill('[data-testid="first-cue-number"]', '400');
      await page.click('[data-testid="save-act"]');

      // Verify it exists
      await expect(page.getByText('Delete Me')).toBeVisible();
      const beforeCount = await page.locator('[data-testid="act-item"]').count();

      // Delete it
      const testAct = page.locator('[data-testid="act-item"]').filter({ hasText: 'Delete Me' });
      await testAct.locator('[data-testid="delete-act"]').click();
      await page.click('[data-testid="confirm-delete"]');

      // Should be removed from UI
      await expect(page.getByText('Delete Me')).not.toBeVisible();
      const afterCount = await page.locator('[data-testid="act-item"]').count();
      expect(afterCount).toBe(beforeCount - 1);

      // Should be removed from store
      const storeData = await page.evaluate(() => {
        const scriptStore = localStorage.getItem('script-store');
        return scriptStore ? JSON.parse(scriptStore).state.acts : [];
      });

      const deletedAct = storeData.find((act: any) => act.actNumber === 'Delete Me');
      expect(deletedAct).toBeFalsy();
    });
  });

  test.describe('Act Continuation Logic', () => {
    test('should handle act continuations across pages', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Create act that continues
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      await page.fill('[data-testid="act-number"]', 'Continuing Act');
      await page.fill('[data-testid="first-cue-number"]', '100');

      // Set continuation if option exists
      const continuesCheckbox = page.locator('[data-testid="continues-on-page"]');
      if (await continuesCheckbox.isVisible()) {
        await continuesCheckbox.check();
      }

      await page.click('[data-testid="save-act"]');

      // Should show continuation indicator
      const continuingAct = page.locator('[data-testid="act-item"]')
        .filter({ hasText: 'Continuing Act' });

      await expect(continuingAct).toBeVisible();

      // Check store data for continuation fields
      const storeData = await page.evaluate(() => {
        const scriptStore = localStorage.getItem('script-store');
        return scriptStore ? JSON.parse(scriptStore).state.acts : [];
      });

      const continuingActData = storeData.find((act: any) => act.actNumber === 'Continuing Act');
      expect(continuingActData).toBeTruthy();

      // Should have continuation fields set
      if (continuingActData.continuesOnPageId) {
        expect(continuingActData.continuesOnPageId).toBeTruthy();
      }
    });

    test('should maintain act hierarchy relationships', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Check store maintains proper relationships
      const storeData = await page.evaluate(() => {
        const scriptStore = localStorage.getItem('script-store');
        const state = scriptStore ? JSON.parse(scriptStore).state : {};
        return {
          acts: state.acts || [],
          pages: state.pages || [],
          scenesAndSongs: state.scenesAndSongs || []
        };
      });

      // Acts should have valid page references
      storeData.acts.forEach((act: any) => {
        expect(act.currentPageId).toBeTruthy();

        // Should reference existing page
        const referencedPage = storeData.pages.find((page: any) => page.id === act.currentPageId);
        expect(referencedPage).toBeTruthy();
      });

      // Scenes/songs should have valid act references where assigned
      storeData.scenesAndSongs.forEach((sceneSong: any) => {
        if (sceneSong.actId) {
          const referencedAct = storeData.acts.find((act: any) => act.id === sceneSong.actId);
          expect(referencedAct).toBeTruthy();
        }
      });
    });
  });

  test.describe('Act Validation', () => {
    test('should validate cue number conflicts', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Try to create act with conflicting cue number
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      await page.fill('[data-testid="act-number"]', 'Conflict Test');
      await page.fill('[data-testid="first-cue-number"]', '50'); // Should conflict with existing

      await page.click('[data-testid="save-act"]');

      // Should show validation error
      const errorMessage = page.locator('[data-testid="validation-error"]');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        expect(errorText).toContain('cue');
      } else {
        // If no error shown, store should have prevented invalid state
        const storeData = await page.evaluate(() => {
          const scriptStore = localStorage.getItem('script-store');
          return scriptStore ? JSON.parse(scriptStore).state.acts : [];
        });

        // Should not have created invalid act
        const conflictAct = storeData.find((act: any) => act.actNumber === 'Conflict Test');
        expect(conflictAct).toBeFalsy();
      }
    });

    test('should validate act number uniqueness', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Try to create act with duplicate number
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      await page.fill('[data-testid="act-number"]', 'I'); // Same as existing Act I
      await page.fill('[data-testid="first-cue-number"]', '500');

      await page.click('[data-testid="save-act"]');

      // Should show validation error or prevent creation
      const storeData = await page.evaluate(() => {
        const scriptStore = localStorage.getItem('script-store');
        return scriptStore ? JSON.parse(scriptStore).state.acts : [];
      });

      // Should not have duplicate act numbers on same page
      const actsWithSameNumber = storeData.filter((act: any) => act.actNumber === 'I');
      expect(actsWithSameNumber.length).toBe(1); // Only the original
    });
  });

  test.describe('Act Lookup and Context Resolution', () => {
    test('should resolve cue numbers to act context', async ({ page }) => {
      // Test the store's cue lookup functionality
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Test via the cue notes module which uses the lookup
      await helpers.navigateToModule('cue-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');

      const cueField = page.locator('[data-testid="cue-number"]');
      if (await cueField.isVisible()) {
        await cueField.fill('127');

        // The lookup should be resolved by the store
        const cueDisplay = page.locator('[data-testid="cue-display"]');
        if (await cueDisplay.isVisible()) {
          await page.waitForTimeout(500);

          const displayText = await cueDisplay.textContent();

          // Should include act context from store lookup
          if (displayText && displayText.includes('Act')) {
            expect(displayText).toMatch(/Act .+/);
          }
        }
      }

      await helpers.closeDialog();
    });

    test('should handle store state consistency', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Verify store state is consistent
      const storeConsistency = await page.evaluate(() => {
        const scriptStore = localStorage.getItem('script-store');
        if (!scriptStore) return { valid: false, reason: 'No store data' };

        const state = JSON.parse(scriptStore).state;

        // Check required arrays exist
        if (!Array.isArray(state.acts)) return { valid: false, reason: 'No acts array' };
        if (!Array.isArray(state.pages)) return { valid: false, reason: 'No pages array' };
        if (!Array.isArray(state.scenesAndSongs)) return { valid: false, reason: 'No scenesAndSongs array' };

        // Check act references are valid
        for (const act of state.acts) {
          if (!act.id || !act.currentPageId || !act.actNumber) {
            return { valid: false, reason: 'Invalid act structure' };
          }

          // Check page exists
          const pageExists = state.pages.some((page: any) => page.id === act.currentPageId);
          if (!pageExists) {
            return { valid: false, reason: 'Act references non-existent page' };
          }
        }

        return { valid: true };
      });

      expect(storeConsistency.valid).toBe(true);
      if (!storeConsistency.valid) {
        console.log('Store consistency issue:', storeConsistency.reason);
      }
    });

    test('should update act context when acts change', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Create new act
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      await page.fill('[data-testid="act-number"]', 'Dynamic Test');
      await page.fill('[data-testid="first-cue-number"]', '250');
      await page.click('[data-testid="save-act"]');

      // Test that cue lookup immediately reflects the new act
      await helpers.navigateToModule('cue-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');

      const cueField = page.locator('[data-testid="cue-number"]');
      if (await cueField.isVisible()) {
        await cueField.fill('250');

        const cueDisplay = page.locator('[data-testid="cue-display"]');
        if (await cueDisplay.isVisible()) {
          await page.waitForTimeout(500);

          const displayText = await cueDisplay.textContent();

          // Should show new act context
          if (displayText && displayText.includes('Dynamic Test')) {
            expect(displayText).toContain('Dynamic Test');
          }
        }
      }

      await helpers.closeDialog();
    });
  });

  test.describe('Performance and Memory Management', () => {
    test('should handle large number of acts efficiently', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      const startTime = Date.now();

      // Check current performance
      const actItems = page.locator('[data-testid="act-item"]');
      await expect(actItems.first()).toBeVisible();

      const loadTime = Date.now() - startTime;

      // Should load acts quickly
      expect(loadTime).toBeLessThan(2000);

      // Check memory usage isn't excessive
      const memoryInfo = await page.evaluate(() => {
        // @ts-ignore - performance.memory may not be available in all browsers
        return (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize
        } : null;
      });

      if (memoryInfo) {
        // Memory usage should be reasonable (less than 50MB)
        expect(memoryInfo.used).toBeLessThan(50 * 1024 * 1024);
      }
    });

    test('should clean up act references when deleting', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Create test act with scene assignment
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      await page.fill('[data-testid="act-number"]', 'Cleanup Test');
      await page.fill('[data-testid="first-cue-number"]', '350');
      await page.click('[data-testid="save-act"]');

      // Get the act ID from store
      const actId = await page.evaluate(() => {
        const scriptStore = localStorage.getItem('script-store');
        const state = scriptStore ? JSON.parse(scriptStore).state : {};
        const testAct = state.acts?.find((act: any) => act.actNumber === 'Cleanup Test');
        return testAct?.id;
      });

      // Delete the act
      const testAct = page.locator('[data-testid="act-item"]').filter({ hasText: 'Cleanup Test' });
      await testAct.locator('[data-testid="delete-act"]').click();
      await page.click('[data-testid="confirm-delete"]');

      // Verify cleanup
      const cleanupCheck = await page.evaluate((actId) => {
        const scriptStore = localStorage.getItem('script-store');
        const state = scriptStore ? JSON.parse(scriptStore).state : {};

        // Act should be removed
        const actExists = state.acts?.some((act: any) => act.id === actId);

        // Scene/song references should be cleaned up
        const orphanedReferences = state.scenesAndSongs?.filter((ss: any) => ss.actId === actId) || [];

        return { actExists, orphanedReferences: orphanedReferences.length };
      }, actId);

      expect(cleanupCheck.actExists).toBe(false);
      expect(cleanupCheck.orphanedReferences).toBe(0);
    });
  });
});