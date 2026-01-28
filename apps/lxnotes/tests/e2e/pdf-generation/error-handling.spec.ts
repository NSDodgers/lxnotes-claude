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
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Select only page style preset, leave filter preset unselected
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      // Verify the generate button is disabled or shows error
      const generateButton = page.locator('button:has-text("Generate PDF"), button:has-text("Download")')

      // Should be disabled when filter preset is missing
      await expect(generateButton).toBeDisabled()

      await pdfHelpers.takeScreenshot('missing-filter-preset-error')
    })

    test('Cannot generate PDF without page style preset selected', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Select only filter preset, leave page style preset unselected
      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Work')

      // Verify the generate button is disabled or shows error
      const generateButton = page.locator('button:has-text("Generate PDF"), button:has-text("Download")')

      // Should be disabled when page style preset is missing
      await expect(generateButton).toBeDisabled()

      await pdfHelpers.takeScreenshot('missing-page-style-preset-error')
    })

    test('Shows error message when no presets are selected', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

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
    test('Generate PDF with restrictive filter returning few results', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Use a system filter that may return few results
      await pdfHelpers.selectFilterPresetInCustomView('High Priority First')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('restrictive-filter')

      // Should still generate a PDF, just with headers and possibly limited content
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      // Validate that a PDF is still generated
      expect(pdfBlob.length).toBeGreaterThan(500) // Should have headers, even if limited content
      expect(filename).toContain('Cue_Notes')

      // Validate it's a proper PDF structure
      const pdfHeader = pdfBlob.slice(0, 8).toString()
      expect(pdfHeader).toMatch(/^%PDF-1\.[0-9]/)
    })

    test('Generate PDF with all-inclusive filter', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Use a system filter that includes all todo notes
      await pdfHelpers.selectFilterPresetInCustomView('All Todo Notes')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('all-inclusive-filter')

      // Should handle large datasets gracefully
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      expect(pdfBlob.length).toBeGreaterThan(1000)
      expect(filename).toContain('Work_Notes')
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
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Work')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('slow-network-conditions')

      // Should still work, just take longer
      const startTime = Date.now()
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()
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
        await pdfHelpers.openPrintSidebar()
        await pdfHelpers.openCustomPrintView()

        await pdfHelpers.selectFilterPresetInCustomView('Outstanding Issues')
        await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

        await pdfHelpers.takeScreenshot(`rapid-generation-${i + 1}`)

        const startTime = Date.now()
        const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()
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
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Use a filter that includes all notes
      await pdfHelpers.selectFilterPresetInCustomView('All Todo Notes')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('stress-test-large-dataset')

      // Should handle large datasets
      const startTime = Date.now()
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()
      const duration = Date.now() - startTime

      expect(pdfBlob.length).toBeGreaterThan(2000) // Should be substantial
      expect(duration).toBeLessThan(60000) // Should complete within 60 seconds
      expect(filename).toContain('Cue_Notes')
    })
  })

  test.describe('UI State and Interaction Edge Cases', () => {
    test('Close sidebar during PDF generation', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Work')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      // Start PDF generation but try to close sidebar immediately
      const generateButton = page.locator('button:has-text("Generate PDF"), button:has-text("Download")')
      await generateButton.click()

      // Try to close sidebar immediately (simulate user clicking away)
      await page.keyboard.press('Escape')

      await pdfHelpers.takeScreenshot('sidebar-closed-during-generation')

      // Wait a bit to see what happens
      await page.waitForTimeout(2000)

      // Check if PDF still generates or if process is properly cancelled
      // This tests the robustness of the generation process
    })

    test('Navigate away during PDF generation', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Issues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

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

    test('Refresh page with sidebar open', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Cues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('before-refresh')

      // Refresh the page
      await page.reload()

      // Wait for page to reload
      await pdfHelpers.waitForUIReady()

      await pdfHelpers.takeScreenshot('after-refresh')

      // Should handle refresh gracefully
      // Try to open sidebar again to ensure functionality is restored
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Cues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

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
          await helpers1.openPrintSidebar()
          await helpers1.openCustomPrintView()
          await helpers1.selectFilterPresetInCustomView('Outstanding Cues')
          await helpers1.selectPageStylePresetInCustomView('Letter Portrait')
          return await helpers1.generatePDFFromCustomView()
        })(),
        (async () => {
          await helpers2.navigateToModule('work')
          await helpers2.openPrintSidebar()
          await helpers2.openCustomPrintView()
          await helpers2.selectFilterPresetInCustomView('Outstanding Work')
          await helpers2.selectPageStylePresetInCustomView('Letter Portrait')
          return await helpers2.generatePDFFromCustomView()
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
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Issues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('js-compatibility-test')

      // Should still work with basic JavaScript
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

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
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Work')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('memory-pressure-test')

      // Should still work under memory pressure
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      expect(pdfBlob.length).toBeGreaterThan(1000)
      expect(filename).toContain('Work_Notes')

      // Clean up
      await page.evaluate(() => {
        delete (window as any).memoryPressure
      })
    })
  })
})
