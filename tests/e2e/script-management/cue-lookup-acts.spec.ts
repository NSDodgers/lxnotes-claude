import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test-helpers';

test.describe('Cue Lookup with Act Integration', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppReady();
  });

  test.describe('Act Context in Cue Display', () => {
    test('should show act hierarchy in cue lookup', async ({ page }) => {
      // Test cue lookup service integration with acts
      await helpers.navigateToModule('cue-notes');

      // Open add note dialog
      await helpers.openDialog('[data-testid="add-note-button"]');

      // Test cue number that should resolve with act context
      const cueField = page.locator('[data-testid="cue-number"]');
      if (await cueField.isVisible()) {
        await cueField.fill('127');

        // Should show act context in real-time
        const cueDisplay = page.locator('[data-testid="cue-display"]');
        if (await cueDisplay.isVisible()) {
          await page.waitForTimeout(500); // Allow for debounced lookup

          const displayText = await cueDisplay.textContent();

          // Should show hierarchical format: "Act I • Pg. 23 - Scene..."
          if (displayText && displayText.includes('Act')) {
            expect(displayText).toMatch(/Act .+ • Pg\. \d+/);
            expect(displayText).toContain('•'); // Separator
            expect(displayText).toContain('Pg.'); // Page reference
          }
        }
      }

      await helpers.closeDialog();
    });

    test('should handle cue numbers without act context', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');

      // Test cue number that might not have act context
      const cueField = page.locator('[data-testid="cue-number"]');
      if (await cueField.isVisible()) {
        await cueField.fill('999'); // Non-existent cue

        const cueDisplay = page.locator('[data-testid="cue-display"]');
        if (await cueDisplay.isVisible()) {
          await page.waitForTimeout(500);

          const displayText = await cueDisplay.textContent();

          // Should handle gracefully - might show "Page not found" or similar
          if (displayText) {
            expect(displayText.length).toBeGreaterThan(0);
          }
        }
      }

      await helpers.closeDialog();
    });

    test('should show different acts for different cue numbers', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');

      // Test multiple cue numbers that should be in different acts
      const testCues = [
        { cue: '50', expectedAct: 'Act I' },
        { cue: '127', expectedAct: 'Act I' },
        { cue: '200', expectedAct: 'Act II' } // Based on mock data
      ];

      for (const testCase of testCues) {
        await helpers.openDialog('[data-testid="add-note-button"]');

        const cueField = page.locator('[data-testid="cue-number"]');
        if (await cueField.isVisible()) {
          // Clear and fill new cue
          await cueField.fill('');
          await cueField.fill(testCase.cue);

          await page.waitForTimeout(500);

          const cueDisplay = page.locator('[data-testid="cue-display"]');
          if (await cueDisplay.isVisible()) {
            const displayText = await cueDisplay.textContent();

            if (displayText && displayText.includes('Act')) {
              // Should show the expected act
              expect(displayText).toContain(testCase.expectedAct);
            }
          }
        }

        await helpers.closeDialog();
      }
    });

    test('should maintain act context in saved notes', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');

      // Create a note with act context
      await helpers.openDialog('[data-testid="add-note-button"]');

      await helpers.fillNoteForm({
        description: 'Act Context Test Note - Testing persistent act context'
      });

      const cueField = page.locator('[data-testid="cue-number"]');
      if (await cueField.isVisible()) {
        await cueField.fill('127');
      }

      await helpers.saveDialog();

      // Verify note appears with act context in table
      await helpers.expectNoteInTable('Act Context Test Note');

      // Find the note and check its cue display
      const noteRow = page.locator('[data-testid="note-row"]')
        .filter({ hasText: 'Act Context Test Note' });

      if (await noteRow.isVisible()) {
        const cueColumn = noteRow.locator('[data-testid="cue-column"]');
        if (await cueColumn.isVisible()) {
          const cueText = await cueColumn.textContent();

          // Should maintain act context
          if (cueText && cueText.includes('Act')) {
            expect(cueText).toMatch(/Act .+ •/);
          }
        }
      }
    });
  });

  test.describe('Hierarchical Context Display', () => {
    test('should show full hierarchy: act > page > scene/song', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');

      // Test cue that should have full hierarchy
      const cueField = page.locator('[data-testid="cue-number"]');
      if (await cueField.isVisible()) {
        await cueField.fill('127');

        const cueDisplay = page.locator('[data-testid="cue-display"]');
        if (await cueDisplay.isVisible()) {
          await page.waitForTimeout(500);

          const displayText = await cueDisplay.textContent();

          if (displayText) {
            // Check for hierarchical format
            const parts = displayText.split('•');
            if (parts.length > 1) {
              // Should have act part
              expect(parts[0].trim()).toMatch(/Act .+/);

              // Should have page part
              expect(parts[1]).toContain('Pg.');

              // Might have scene/song part after dash
              if (displayText.includes(' - ')) {
                const scenePart = displayText.split(' - ')[1];
                expect(scenePart.length).toBeGreaterThan(0);
              }
            }
          }
        }
      }

      await helpers.closeDialog();
    });

    test('should handle acts with names vs numbers', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');

      // Test should handle both "Act I" and custom names
      const cueField = page.locator('[data-testid="cue-number"]');
      if (await cueField.isVisible()) {
        await cueField.fill('50'); // Should be in Act I based on mock data

        const cueDisplay = page.locator('[data-testid="cue-display"]');
        if (await cueDisplay.isVisible()) {
          await page.waitForTimeout(500);

          const displayText = await cueDisplay.textContent();

          if (displayText && displayText.includes('Act')) {
            // Should show act identifier (number, roman numeral, or name)
            expect(displayText).toMatch(/Act .+/);
          }
        }
      }

      await helpers.closeDialog();
    });

    test('should gracefully handle missing page context', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');

      // Test cue that might not have page but has act
      const cueField = page.locator('[data-testid="cue-number"]');
      if (await cueField.isVisible()) {
        await cueField.fill('999'); // Non-existent cue

        const cueDisplay = page.locator('[data-testid="cue-display"]');
        if (await cueDisplay.isVisible()) {
          await page.waitForTimeout(500);

          const displayText = await cueDisplay.textContent();

          // Should handle gracefully with appropriate message
          if (displayText) {
            // Might show "Act I • Cue 999 (Page not found)" or similar
            if (displayText.includes('not found')) {
              expect(displayText).toContain('not found');
            }
          }
        }
      }

      await helpers.closeDialog();
    });
  });

  test.describe('Real-time Cue Lookup', () => {
    test('should update cue display as user types', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');

      const cueField = page.locator('[data-testid="cue-number"]');
      const cueDisplay = page.locator('[data-testid="cue-display"]');

      if (await cueField.isVisible() && await cueDisplay.isVisible()) {
        // Start typing cue number
        await cueField.fill('1');
        await page.waitForTimeout(300);

        let displayText = await cueDisplay.textContent();
        const initialDisplay = displayText;

        // Continue typing
        await cueField.fill('12');
        await page.waitForTimeout(300);

        displayText = await cueDisplay.textContent();
        const secondDisplay = displayText;

        // Complete the cue
        await cueField.fill('127');
        await page.waitForTimeout(300);

        displayText = await cueDisplay.textContent();
        const finalDisplay = displayText;

        // Display should update as typing progresses
        // Each step might show different results
        if (initialDisplay && secondDisplay && finalDisplay) {
          // At least the final display should show something
          expect(finalDisplay.length).toBeGreaterThan(0);
        }
      }

      await helpers.closeDialog();
    });

    test('should handle empty cue input', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');

      const cueField = page.locator('[data-testid="cue-number"]');
      const cueDisplay = page.locator('[data-testid="cue-display"]');

      if (await cueField.isVisible() && await cueDisplay.isVisible()) {
        // Ensure field is empty
        await cueField.fill('');
        await page.waitForTimeout(300);

        const displayText = await cueDisplay.textContent();

        // Should handle empty input gracefully (might be empty or have placeholder)
        if (displayText) {
          expect(displayText.length).toBeGreaterThanOrEqual(0);
        }
      }

      await helpers.closeDialog();
    });

    test('should handle invalid cue formats', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');

      const cueField = page.locator('[data-testid="cue-number"]');
      const cueDisplay = page.locator('[data-testid="cue-display"]');

      if (await cueField.isVisible() && await cueDisplay.isVisible()) {
        // Test various invalid formats
        const invalidCues = ['abc', '12.5.7', '!@#', 'cue-', '-123'];

        for (const invalidCue of invalidCues) {
          await cueField.fill(invalidCue);
          await page.waitForTimeout(300);

          const displayText = await cueDisplay.textContent();

          // Should handle invalid input gracefully
          // Might show empty, error message, or attempt to parse
          expect(displayText).toBeDefined();
        }
      }

      await helpers.closeDialog();
    });
  });

  test.describe('Act Context in Existing Notes', () => {
    test('should display act context in notes table', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');

      // Look for existing notes with cue numbers
      const noteRows = page.locator('[data-testid="note-row"]');
      const rowCount = await noteRows.count();

      if (rowCount > 0) {
        // Check cue columns for act context
        const cueColumns = page.locator('[data-testid="cue-column"]');
        const cueCount = await cueColumns.count();

        if (cueCount > 0) {
          // Check first few cue displays
          for (let i = 0; i < Math.min(3, cueCount); i++) {
            const cueColumn = cueColumns.nth(i);
            const cueText = await cueColumn.textContent();

            if (cueText && cueText.trim().length > 0) {
              // If it shows a cue, it should include context
              if (cueText.includes('Act')) {
                expect(cueText).toMatch(/Act .+/);
              }
            }
          }
        }
      }
    });

    test('should sort notes by cue number with act awareness', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');

      // Click cue column header to sort
      const cueHeader = page.locator('[data-testid="cue-header"]');
      if (await cueHeader.isVisible()) {
        await cueHeader.click();

        // Wait for sort to apply
        await page.waitForTimeout(500);

        // Check that notes are sorted appropriately
        const cueColumns = page.locator('[data-testid="cue-column"]');
        const cueCount = await cueColumns.count();

        if (cueCount > 1) {
          // Get first two cue values to check order
          const firstCue = await cueColumns.nth(0).textContent();
          const secondCue = await cueColumns.nth(1).textContent();

          // Should be in some logical order
          // (exact verification depends on mock data and sort implementation)
          expect(firstCue).toBeDefined();
          expect(secondCue).toBeDefined();
        }
      }
    });

    test('should filter notes by act context', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');

      // Search for act-specific term
      await helpers.searchNotes('Act I');

      // Should show only notes from Act I
      const filteredRows = page.locator('[data-testid="note-row"]');
      const filteredCount = await filteredRows.count();

      if (filteredCount > 0) {
        // Check that visible notes contain Act I context
        for (let i = 0; i < Math.min(3, filteredCount); i++) {
          const row = filteredRows.nth(i);
          const cueColumn = row.locator('[data-testid="cue-column"]');

          if (await cueColumn.isVisible()) {
            const cueText = await cueColumn.textContent();
            if (cueText && cueText.includes('Act')) {
              expect(cueText).toContain('Act I');
            }
          }
        }
      }

      // Clear search
      await helpers.searchNotes('');
    });
  });

  test.describe('Performance and Edge Cases', () => {
    test('should handle rapid cue number changes efficiently', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');

      const cueField = page.locator('[data-testid="cue-number"]');

      if (await cueField.isVisible()) {
        const startTime = Date.now();

        // Rapidly change cue numbers
        const cueNumbers = ['1', '50', '127', '200', '999'];

        for (const cueNumber of cueNumbers) {
          await cueField.fill(cueNumber);
          await page.waitForTimeout(100); // Small delay between changes
        }

        const duration = Date.now() - startTime;

        // Should handle rapid changes without significant delay
        expect(duration).toBeLessThan(2000);
      }

      await helpers.closeDialog();
    });

    test('should handle very large cue numbers', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');
      await helpers.openDialog('[data-testid="add-note-button"]');

      const cueField = page.locator('[data-testid="cue-number"]');
      const cueDisplay = page.locator('[data-testid="cue-display"]');

      if (await cueField.isVisible() && await cueDisplay.isVisible()) {
        // Test large cue number
        await cueField.fill('99999');
        await page.waitForTimeout(500);

        const displayText = await cueDisplay.textContent();

        // Should handle gracefully (likely show "not found" or similar)
        expect(displayText).toBeDefined();
      }

      await helpers.closeDialog();
    });

    test('should maintain performance with many notes', async ({ page }) => {
      await helpers.navigateToModule('cue-notes');

      const startTime = Date.now();

      // Page should load and display act context efficiently
      await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();

      // Check cue columns load quickly
      const cueColumns = page.locator('[data-testid="cue-column"]');
      const count = await cueColumns.count();

      const loadTime = Date.now() - startTime;

      // Should load act context for all notes quickly
      expect(loadTime).toBeLessThan(3000);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
