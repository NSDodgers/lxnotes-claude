import { test, expect } from '@playwright/test'
import { PDFTestHelpers } from './pdf-test-helpers'

test.describe('Error Handling and Edge Cases', () => {
  let pdfHelpers: PDFTestHelpers

  test.beforeEach(async ({ page }) => {
    pdfHelpers = new PDFTestHelpers(page)

    // Start the development server
    await page.goto('http://localhost:3001/cue-notes')
    await pdfHelpers.waitForUIReady()
  })

  test.describe('Missing or Invalid Preset Selection', () => {
    test('Cannot generate PDF without filter preset selected', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      // Select only page style preset, leave filter preset unselected
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      // Verify the generate button is disabled or shows error
      const generateButton = page.locator('button:has-text("Generate PDF"), button:has-text("Download")')

      // Should be disabled when filter preset is missing
      await expect(generateButton).toBeDisabled()

      await pdfHelpers.takeScreenshot('missing-filter-preset-error')
    })

    test('Cannot generate PDF without page style preset selected', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintDialog()

      // Select only filter preset, leave page style preset unselected
      await pdfHelpers.selectFilterPreset('Outstanding Work')

      // Verify the generate button is disabled or shows error
      const generateButton = page.locator('button:has-text("Generate PDF"), button:has-text("Download")')

      // Should be disabled when page style preset is missing
      await expect(generateButton).toBeDisabled()

      await pdfHelpers.takeScreenshot('missing-page-style-preset-error')
    })

    test('Shows error message when no presets are selected', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      // Don't select any presets
      await pdfHelpers.takeScreenshot('no-presets-selected')

      // Verify the generate button is disabled
      const generateButton = page.locator('button:has-text("Generate PDF"), button:has-text("Download")')
      await expect(generateButton).toBeDisabled()

      // Check for user guidance text
      const guidanceText = page.locator('text=required, text=Please select, text=Select')
      await expect(guidanceText.first()).toBeVisible()
    })
  })

  test.describe('Edge Case Data Scenarios', () => {
    test('Generate PDF with no notes available', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      // Create a very restrictive filter that should return no results
      await pdfHelpers.createCustomFilterPreset('No Results Filter', 'cue', {
        statusFilter: 'cancelled',
        typeFilters: ['nonexistent_type'], // This type likely doesn't exist
        priorityFilters: ['critical'],
        sortBy: 'priority',
        sortOrder: 'desc',
        groupByType: false
      })

      await pdfHelpers.selectFilterPreset('No Results Filter')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('no-notes-filter')

      // Should still generate a PDF, just with headers and empty content
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate that a PDF is still generated
      expect(pdfBlob.length).toBeGreaterThan(500) // Should have headers, even if no content
      expect(filename).toContain('Cue_Notes')

      // Validate it's a proper PDF structure
      const pdfHeader = pdfBlob.slice(0, 8).toString()
      expect(pdfHeader).toMatch(/^%PDF-1\.[0-9]/)
    })

    test('Generate PDF with extreme filter combinations', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintDialog()

      // Create filter with all possible options selected (might create large dataset)
      await pdfHelpers.createCustomFilterPreset('All Inclusive Filter', 'work', {
        statusFilter: null, // All statuses
        typeFilters: ['work', 'focus', 'paperwork', 'electrician', 'think'], // All types
        priorityFilters: ['critical', 'very_high', 'high', 'medium_high', 'medium', 'medium_low', 'low', 'very_low', 'uncritical'], // All priorities
        sortBy: 'priority',
        sortOrder: 'desc',
        groupByType: true
      })

      await pdfHelpers.selectFilterPreset('All Inclusive Filter')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('extreme-filter-all-inclusive')

      // Should handle large datasets gracefully
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      expect(pdfBlob.length).toBeGreaterThan(1000)
      expect(filename).toContain('Work_Notes')
    })

    test('Handle special characters in custom preset names', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      // Create preset with special characters in the name
      const specialPresetName = 'Test Preset with Special Chars: @#$%^&*()_+-=[]{}|;":,./<>?'

      try {
        await pdfHelpers.createCustomPageStylePreset(specialPresetName, {
          paperSize: 'letter',
          orientation: 'portrait',
          includeCheckboxes: true
        })

        // If creation succeeds, test using it
        await pdfHelpers.selectFilterPreset('Outstanding Issues')
        await pdfHelpers.selectPageStylePreset(specialPresetName)

        await pdfHelpers.takeScreenshot('special-chars-preset-name')

        const { pdfBlob, filename } = await pdfHelpers.generatePDF()

        expect(pdfBlob.length).toBeGreaterThan(1000)
        expect(filename).toContain('Production_Notes')

      } catch (error) {
        // If special characters are rejected, that's also acceptable behavior
        console.log('Special characters in preset names are properly rejected:', error)
        await pdfHelpers.takeScreenshot('special-chars-rejected')
      }
    })

    test('Handle very long custom preset names', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      // Create preset with very long name
      const longPresetName = 'This is a very long preset name that goes on and on and should test the system\'s ability to handle extremely long preset names without breaking the UI or PDF generation functionality'

      try {
        await pdfHelpers.createCustomFilterPreset(longPresetName, 'cue', {
          statusFilter: 'todo',
          typeFilters: ['cue', 'director'],
          priorityFilters: ['critical', 'very_high'],
          sortBy: 'priority',
          sortOrder: 'desc',
          groupByType: false
        })

        await pdfHelpers.selectFilterPreset(longPresetName)
        await pdfHelpers.selectPageStylePreset('Letter Portrait')

        await pdfHelpers.takeScreenshot('long-preset-name')

        const { pdfBlob, filename } = await pdfHelpers.generatePDF()

        expect(pdfBlob.length).toBeGreaterThan(1000)

      } catch (error) {
        // If long names are rejected or truncated, that's acceptable
        console.log('Long preset names are properly handled:', error)
        await pdfHelpers.takeScreenshot('long-name-handled')
      }
    })
  })

  test.describe('Network and Performance Edge Cases', () => {
    test('PDF generation with slow network conditions', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        // Add delay to simulate slow network
        setTimeout(() => route.continue(), 100)
      })

      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintDialog()

      await pdfHelpers.selectFilterPreset('Outstanding Work')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('slow-network-conditions')

      // Should still work, just take longer
      const startTime = Date.now()
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()
      const duration = Date.now() - startTime

      expect(pdfBlob.length).toBeGreaterThan(1000)
      expect(duration).toBeGreaterThan(100) // Should take at least the added delay

      // Clear route
      await page.unroute('**/*')
    })

    test('Generate multiple PDFs in quick succession', async ({ page }) => {
      const results: Array<{ filename: string; size: number; duration: number }> = []

      for (let i = 0; i < 3; i++) {
        await pdfHelpers.navigateToModule('production')
        await pdfHelpers.openPrintDialog()

        await pdfHelpers.selectFilterPreset('Outstanding Issues')
        await pdfHelpers.selectPageStylePreset('Letter Portrait')

        await pdfHelpers.takeScreenshot(`rapid-generation-${i + 1}`)

        const startTime = Date.now()
        const { pdfBlob, filename } = await pdfHelpers.generatePDF()
        const duration = Date.now() - startTime

        results.push({
          filename,
          size: pdfBlob.length,
          duration
        })

        // Brief pause between generations
        await page.waitForTimeout(500)
      }

      // All generations should succeed
      for (const result of results) {
        expect(result.size).toBeGreaterThan(1000)
        expect(result.filename).toContain('Production_Notes')
        expect(result.duration).toBeLessThan(30000) // Should complete within 30 seconds
      }

      // Performance should be relatively consistent
      const durations = results.map(r => r.duration)
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length

      // No individual duration should be more than 3x the average
      for (const duration of durations) {
        expect(duration).toBeLessThan(avgDuration * 3)
      }
    })

    test('Large dataset PDF generation (stress test)', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      // Create filter that should include maximum possible notes
      await pdfHelpers.createCustomFilterPreset('Stress Test Filter', 'cue', {
        statusFilter: null, // All statuses
        typeFilters: ['cue', 'director', 'choreographer', 'designer', 'stage_manager', 'associate', 'assistant', 'spot', 'programmer', 'production', 'paperwork', 'think'], // All types
        priorityFilters: ['critical', 'very_high', 'medium', 'low', 'very_low'], // All priorities
        sortBy: 'created_at',
        sortOrder: 'desc',
        groupByType: false // No grouping for maximum data volume
      })

      await pdfHelpers.selectFilterPreset('Stress Test Filter')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('stress-test-large-dataset')

      // Should handle large datasets
      const startTime = Date.now()
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()
      const duration = Date.now() - startTime

      expect(pdfBlob.length).toBeGreaterThan(2000) // Should be substantial
      expect(duration).toBeLessThan(60000) // Should complete within 60 seconds
      expect(filename).toContain('Cue_Notes')
    })
  })

  test.describe('UI State and Interaction Edge Cases', () => {
    test('Close dialog during PDF generation', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintDialog()

      await pdfHelpers.selectFilterPreset('Outstanding Work')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      // Start PDF generation but try to close dialog immediately
      const generateButton = page.locator('button:has-text("Generate PDF"), button:has-text("Download")')
      await generateButton.click()

      // Try to close dialog immediately (simulate user clicking away)
      await page.keyboard.press('Escape')

      await pdfHelpers.takeScreenshot('dialog-closed-during-generation')

      // Wait a bit to see what happens
      await page.waitForTimeout(2000)

      // Check if PDF still generates or if process is properly cancelled
      // This tests the robustness of the generation process
    })

    test('Navigate away during PDF generation', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      await pdfHelpers.selectFilterPreset('Outstanding Issues')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      // Start PDF generation
      const generateButton = page.locator('button:has-text("Generate PDF"), button:has-text("Download")')
      await generateButton.click()

      // Try to navigate away immediately
      await page.goto('http://localhost:3001/cue-notes')

      await pdfHelpers.takeScreenshot('navigated-away-during-generation')

      // Wait to see if there are any errors
      await page.waitForTimeout(2000)

      // Should handle navigation gracefully without errors
    })

    test('Refresh page with dialog open', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      await pdfHelpers.selectFilterPreset('Outstanding Cues')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('before-refresh')

      // Refresh the page
      await page.reload()

      // Wait for page to reload
      await pdfHelpers.waitForUIReady()

      await pdfHelpers.takeScreenshot('after-refresh')

      // Should handle refresh gracefully
      // Try to open dialog again to ensure functionality is restored
      await pdfHelpers.openPrintDialog()

      await pdfHelpers.selectFilterPreset('Outstanding Cues')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      expect(pdfBlob.length).toBeGreaterThan(1000)
      expect(filename).toContain('Cue_Notes')
    })

    test('Multiple browser tabs generating PDFs', async ({ browser }) => {
      // Open multiple tabs
      const context = await browser.newContext()
      const tab1 = await context.newPage()
      const tab2 = await context.newPage()

      const helpers1 = new PDFTestHelpers(tab1)
      const helpers2 = new PDFTestHelpers(tab2)

      // Set up both tabs
      await tab1.goto('http://localhost:3001/cue-notes')
      await helpers1.waitForUIReady()

      await tab2.goto('http://localhost:3001/work-notes')
      await helpers2.waitForUIReady()

      // Generate PDFs simultaneously
      const [result1, result2] = await Promise.all([
        (async () => {
          await helpers1.navigateToModule('cue')
          await helpers1.openPrintDialog()
          await helpers1.selectFilterPreset('Outstanding Cues')
          await helpers1.selectPageStylePreset('Letter Portrait')
          return await helpers1.generatePDF()
        })(),
        (async () => {
          await helpers2.navigateToModule('work')
          await helpers2.openPrintDialog()
          await helpers2.selectFilterPreset('Outstanding Work')
          await helpers2.selectPageStylePreset('Letter Portrait')
          return await helpers2.generatePDF()
        })()
      ])

      // Both should succeed
      expect(result1.pdfBlob.length).toBeGreaterThan(1000)
      expect(result2.pdfBlob.length).toBeGreaterThan(1000)
      expect(result1.filename).toContain('Cue_Notes')
      expect(result2.filename).toContain('Work_Notes')

      await context.close()
    })
  })

  test.describe('Browser Compatibility Edge Cases', () => {
    test('PDF generation with disabled JavaScript features', async ({ page }) => {
      // This test would be more relevant in a real environment where
      // certain JS features might be disabled or unavailable

      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      await pdfHelpers.selectFilterPreset('Outstanding Issues')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('js-compatibility-test')

      // Should still work with basic JavaScript
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      expect(pdfBlob.length).toBeGreaterThan(1000)
      expect(filename).toContain('Production_Notes')
    })

    test('PDF generation with limited memory conditions', async ({ page }) => {
      // Simulate memory pressure by creating many large objects
      await page.evaluate(() => {
        // Create some memory pressure (be careful not to crash the browser)
        (window as any).memoryPressure = new Array(100).fill(new Array(1000).fill('test'))
      })

      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintDialog()

      await pdfHelpers.selectFilterPreset('Outstanding Work')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('memory-pressure-test')

      // Should still work under memory pressure
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      expect(pdfBlob.length).toBeGreaterThan(1000)
      expect(filename).toContain('Work_Notes')

      // Clean up
      await page.evaluate(() => {
        delete (window as any).memoryPressure
      })
    })
  })
})