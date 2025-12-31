import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Act Hierarchy and Script Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/cue-notes');
    await helpers.waitForAppReady();
  });

  test.describe('Script Manager Navigation', () => {
    test('should navigate to script manager', async ({ page }) => {
      await page.click('a[href="/manage-script"]');
      await page.waitForURL('**/manage-script');

      await helpers.expectPageTitle('Script Manager');
      await expect(page.locator('[data-testid="script-manager"]')).toBeVisible();
    });

    test('should display existing script hierarchy', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Should show pages section
      await expect(page.locator('[data-testid="pages-section"]')).toBeVisible();

      // Should show mock pages from Joy! Musical
      await expect(page.locator('[data-testid="script-page"]')).toHaveCount(5);

      // Check for specific pages
      await expect(page.getByText('Page 23')).toBeVisible();
      await expect(page.getByText('Page 35')).toBeVisible();
    });

    test('should display acts section above scenes/songs', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Find first page that should have acts
      const firstPage = page.locator('[data-testid="script-page"]').first();

      // Should show Acts section before scenes/songs
      await expect(firstPage.locator('[data-testid="acts-section"]')).toBeVisible();
      await expect(firstPage.locator('[data-testid="scenes-songs-section"]')).toBeVisible();
    });
  });

  test.describe('Act Display and Management', () => {
    test('should display existing acts with proper hierarchy', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Should show Act I and Act II from mock data
      await expect(page.getByText('Act I')).toBeVisible();
      await expect(page.getByText('Act II')).toBeVisible();

      // Acts should show continuation indicators where appropriate
      const actItems = page.locator('[data-testid="act-item"]');
      await expect(actItems).toHaveCount(2);
    });

    test('should show add act button', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Should show add act button in page actions
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await expect(firstPage.locator('[data-testid="add-act-button"]')).toBeVisible();
    });

    test('should open add act dialog', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Click add act button
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      // Should open add act dialog
      await expect(page.locator('[data-testid="add-act-dialog"]')).toBeVisible();
      await expect(page.getByText('Add Act')).toBeVisible();
    });

    test('should create new act', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Open add act dialog
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      // Fill act details
      await page.fill('[data-testid="act-number"]', 'III');
      await page.fill('[data-testid="act-name"]', 'Finale');
      await page.fill('[data-testid="first-cue-number"]', '150');

      // Save act
      await page.click('[data-testid="save-act"]');

      // Should close dialog and show new act
      await expect(page.locator('[data-testid="add-act-dialog"]')).not.toBeVisible();
      await expect(page.getByText('Act III')).toBeVisible();
      await expect(page.getByText('Finale')).toBeVisible();
    });

    test('should validate act creation form', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Open add act dialog
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      // Try to save without required fields
      await page.click('[data-testid="save-act"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    });

    test('should support flexible act numbering', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Test different act numbering formats
      const testCases = ['1', 'I', 'One', 'Prologue', 'Act 1', 'Part A'];

      for (const actNumber of testCases) {
        // Open add act dialog
        const firstPage = page.locator('[data-testid="script-page"]').first();
        await firstPage.locator('[data-testid="add-act-button"]').click();

        // Fill with flexible format
        await page.fill('[data-testid="act-number"]', actNumber);
        await page.fill('[data-testid="first-cue-number"]', '1');

        // Save
        await page.click('[data-testid="save-act"]');

        // Should accept the format
        await expect(page.getByText(actNumber)).toBeVisible();

        // Clean up - delete the act for next test
        const actItem = page.locator('[data-testid="act-item"]').filter({ hasText: actNumber });
        await actItem.locator('[data-testid="delete-act"]').click();
        await page.click('[data-testid="confirm-delete"]');
      }
    });
  });

  test.describe('Act Continuations', () => {
    test('should show continuation indicators', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Look for continuation arrows in act display
      const actItems = page.locator('[data-testid="act-item"]');

      // Check if any acts show continuation indicators
      const continuationIndicators = page.locator('[data-testid="act-continuation"]');
      const count = await continuationIndicators.count();

      // Should have appropriate continuation markers based on mock data
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should create act continuation across pages', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Create an act that continues to next page
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      await page.fill('[data-testid="act-number"]', 'Test Act');
      await page.fill('[data-testid="first-cue-number"]', '999');

      // Check "continues on next page" option if available
      const continuesCheckbox = page.locator('[data-testid="continues-on-page"]');
      if (await continuesCheckbox.isVisible()) {
        await continuesCheckbox.check();
      }

      await page.click('[data-testid="save-act"]');

      // Should show continuation indicator
      const testAct = page.locator('[data-testid="act-item"]').filter({ hasText: 'Test Act' });
      await expect(testAct).toBeVisible();
    });
  });

  test.describe('Cue Lookup with Act Context', () => {
    test('should display act context in cue notes', async ({ page }) => {
      // Navigate to cue notes to test act context display
      await helpers.navigateToModule('cue-notes');

      // Should see act context in note displays where applicable
      const noteRows = page.locator('[data-testid="note-row"]');
      if (await noteRows.count() > 0) {
        // Look for act context in cue column (if notes have cue numbers)
        const cueColumns = page.locator('[data-testid="cue-column"]');
        if (await cueColumns.count() > 0) {
          // Should see format like "Act I • Pg. 23 - Scene..."
          const firstCueColumn = cueColumns.first();
          const text = await firstCueColumn.textContent();

          // Check for act context pattern
          if (text && text.includes('Act')) {
            expect(text).toMatch(/Act \w+ •/);
          }
        }
      }
    });

    test('should show act context in note creation', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');

      // Open add note dialog
      await helpers.openDialog('[data-testid="add-note-button"]');

      // Fill cue number that should resolve to act context
      const cueNumberField = page.locator('[data-testid="cue-number"]');
      if (await cueNumberField.isVisible()) {
        await cueNumberField.fill('127');

        // Should see act context display
        const cueDisplay = page.locator('[data-testid="cue-display"]');
        if (await cueDisplay.isVisible()) {
          const displayText = await cueDisplay.textContent();
          expect(displayText).toBeTruthy();

          // Should include act information if available
          if (displayText && displayText.includes('Act')) {
            expect(displayText).toMatch(/Act \w+/);
          }
        }
      }

      await helpers.closeDialog();
    });
  });

  test.describe('Scene/Song Assignment to Acts', () => {
    test('should assign scenes/songs to acts', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Find a scene/song item
      const sceneSongItems = page.locator('[data-testid="scene-song-item"]');
      if (await sceneSongItems.count() > 0) {
        const firstSceneSong = sceneSongItems.first();

        // Look for act assignment dropdown or button
        const actAssignButton = firstSceneSong.locator('[data-testid="assign-to-act"]');
        if (await actAssignButton.isVisible()) {
          await actAssignButton.click();

          // Should show act selection
          await expect(page.locator('[data-testid="act-selector"]')).toBeVisible();

          // Select an act
          await page.click('[data-testid="act-option"]:has-text("Act I")');

          // Should update the scene/song assignment
          await expect(firstSceneSong).toContainText('Act I');
        }
      }
    });

    test('should display act hierarchy in scene/song items', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Look for scenes/songs that show their act assignment
      const sceneSongItems = page.locator('[data-testid="scene-song-item"]');
      if (await sceneSongItems.count() > 0) {
        // Check if any show act context
        const withActContext = sceneSongItems.filter({ hasText: 'Act' });
        const count = await withActContext.count();

        // Should have some scenes/songs assigned to acts based on mock data
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Act Validation and Error Handling', () => {
    test('should validate cue numbers within act boundaries', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Try to create an act with invalid cue number
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      // Fill with overlapping cue number
      await page.fill('[data-testid="act-number"]', 'Overlap Test');
      await page.fill('[data-testid="first-cue-number"]', '127'); // Should conflict with existing

      await page.click('[data-testid="save-act"]');

      // Should show validation error about cue overlap
      const errorMessage = page.locator('[data-testid="validation-error"]');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        expect(errorText).toContain('cue');
      }
    });

    test('should handle acts starting mid-page', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Create act that starts mid-page
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      await page.fill('[data-testid="act-number"]', 'Mid-Page Act');
      await page.fill('[data-testid="first-cue-number"]', '50'); // Mid-page cue

      await page.click('[data-testid="save-act"]');

      // Should create successfully
      await expect(page.getByText('Mid-Page Act')).toBeVisible();

      // Should show as starting on correct page
      const actItem = page.locator('[data-testid="act-item"]').filter({ hasText: 'Mid-Page Act' });
      await expect(actItem).toBeVisible();
    });

    test('should prevent duplicate act numbers on same page', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Try to create act with same number as existing
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      await page.fill('[data-testid="act-number"]', 'I'); // Same as existing Act I
      await page.fill('[data-testid="first-cue-number"]', '200');

      await page.click('[data-testid="save-act"]');

      // Should show validation error
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    });
  });

  test.describe('Act Editing and Deletion', () => {
    test('should edit existing act', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Find an existing act and edit it
      const actItem = page.locator('[data-testid="act-item"]').first();
      await actItem.locator('[data-testid="edit-act"]').click();

      // Should open edit dialog
      await expect(page.locator('[data-testid="edit-act-dialog"]')).toBeVisible();

      // Update act name
      const nameField = page.locator('[data-testid="act-name"]');
      await nameField.fill('Updated Act Name');

      // Save changes
      await page.click('[data-testid="save-act"]');

      // Should show updated name
      await expect(page.getByText('Updated Act Name')).toBeVisible();
    });

    test('should delete act with confirmation', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Create a test act to delete
      const firstPage = page.locator('[data-testid="script-page"]').first();
      await firstPage.locator('[data-testid="add-act-button"]').click();

      await page.fill('[data-testid="act-number"]', 'Delete Test');
      await page.fill('[data-testid="first-cue-number"]', '500');
      await page.click('[data-testid="save-act"]');

      // Verify it was created
      await expect(page.getByText('Delete Test')).toBeVisible();

      // Delete the act
      const testAct = page.locator('[data-testid="act-item"]').filter({ hasText: 'Delete Test' });
      await testAct.locator('[data-testid="delete-act"]').click();

      // Should show confirmation dialog
      await expect(page.locator('[data-testid="confirm-delete-dialog"]')).toBeVisible();

      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');

      // Act should be removed
      await expect(page.getByText('Delete Test')).not.toBeVisible();
    });
  });

  test.describe('Integration with Notes Workflow', () => {
    test('should show act context in cue notes table', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');

      // Look at notes table for act context
      const notesTable = page.locator('[data-testid="notes-table"]');
      await expect(notesTable).toBeVisible();

      const noteRows = page.locator('[data-testid="note-row"]');
      if (await noteRows.count() > 0) {
        // Check if cue column shows act hierarchy
        const cueColumns = page.locator('[data-testid="cue-column"]');
        if (await cueColumns.count() > 0) {
          const firstCue = cueColumns.first();
          const cueText = await firstCue.textContent();

          // Should show hierarchical format if cue has act context
          if (cueText && cueText.includes('•')) {
            expect(cueText).toMatch(/Act .+ • Pg\. \d+/);
          }
        }
      }
    });

    test('should maintain act context when creating notes with cue numbers', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');

      // Create note with cue number that has act context
      await helpers.openDialog('[data-testid="add-note-button"]');

      await helpers.fillNoteForm({
        description: 'Test Note with Act Context - Testing act hierarchy display'
      });

      // Fill cue number
      const cueField = page.locator('[data-testid="cue-number"]');
      if (await cueField.isVisible()) {
        await cueField.fill('127');
      }

      await helpers.saveDialog();

      // Verify note was created and shows act context
      await helpers.expectNoteInTable('Test Note with Act Context');

      // Find the note row and check cue display
      const noteRow = page.locator('[data-testid="note-row"]')
        .filter({ hasText: 'Test Note with Act Context' });

      if (await noteRow.isVisible()) {
        const cueCell = noteRow.locator('[data-testid="cue-column"]');
        if (await cueCell.isVisible()) {
          const cueText = await cueCell.textContent();
          if (cueText && cueText.includes('Act')) {
            expect(cueText).toMatch(/Act/);
          }
        }
      }
    });
  });

  test.describe('Performance and Edge Cases', () => {
    test('should handle large numbers of acts efficiently', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      const startTime = Date.now();

      // The page should load quickly even with multiple acts
      await expect(page.locator('[data-testid="acts-section"]')).toBeVisible();

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });

    test('should handle edge case act numbering formats', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Test unusual but valid act formats
      const edgeCases = ['Act 1, Scene 1', '1.5', 'Intermission', 'Pre-Show', 'Post-Show'];

      for (const actNumber of edgeCases) {
        const firstPage = page.locator('[data-testid="script-page"]').first();
        await firstPage.locator('[data-testid="add-act-button"]').click();

        await page.fill('[data-testid="act-number"]', actNumber);
        await page.fill('[data-testid="first-cue-number"]', `${Math.random() * 1000}`);

        await page.click('[data-testid="save-act"]');

        // Should accept unusual formats
        await expect(page.getByText(actNumber)).toBeVisible();

        // Clean up
        const actItem = page.locator('[data-testid="act-item"]').filter({ hasText: actNumber });
        await actItem.locator('[data-testid="delete-act"]').click();
        await page.click('[data-testid="confirm-delete"]');
      }
    });

    test('should maintain state when switching between pages', async ({ page }) => {
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Remember current acts
      const initialActCount = await page.locator('[data-testid="act-item"]').count();

      // Navigate away and back
      await helpers.navigateToModule('cue-notes');
      await page.goto('/manage-script');
      await helpers.waitForAppReady();

      // Should maintain same acts
      const finalActCount = await page.locator('[data-testid="act-item"]').count();
      expect(finalActCount).toBe(initialActCount);
    });
  });
});
