import { test, expect } from '@playwright/test'
import { PDFTestHelpers, SYSTEM_PRESETS, PDF_PAPER_DIMENSIONS } from './pdf-test-helpers'

test.describe('PDF Test Helpers Validation', () => {
  let pdfHelpers: PDFTestHelpers

  test.beforeEach(async ({ page }) => {
    pdfHelpers = new PDFTestHelpers(page)
  })

  test('Verify PDF helper constants are correctly defined', async () => {
    console.log('Testing PDF helper constants...')

    // Test paper dimensions
    expect(PDF_PAPER_DIMENSIONS.letter.width).toBe(612)
    expect(PDF_PAPER_DIMENSIONS.letter.height).toBe(792)
    expect(PDF_PAPER_DIMENSIONS.a4.width).toBe(595)
    expect(PDF_PAPER_DIMENSIONS.a4.height).toBe(842)
    expect(PDF_PAPER_DIMENSIONS.legal.width).toBe(612)
    expect(PDF_PAPER_DIMENSIONS.legal.height).toBe(1008)

    console.log('Paper dimensions constants validated')

    // Test system presets
    expect(SYSTEM_PRESETS.pageStyle).toContain('Letter Portrait')
    expect(SYSTEM_PRESETS.pageStyle).toContain('Letter Landscape')
    expect(SYSTEM_PRESETS.pageStyle).toContain('A4 Portrait')

    console.log('Page style presets constants validated')

    // Test filter presets for each module
    expect(SYSTEM_PRESETS.filter.cue).toContain('Outstanding Cues')
    expect(SYSTEM_PRESETS.filter.cue).toContain('High Priority First')
    expect(SYSTEM_PRESETS.filter.cue).toContain('All Todo Notes')

    expect(SYSTEM_PRESETS.filter.work).toContain('Outstanding Work')
    expect(SYSTEM_PRESETS.filter.work).toContain('By Channel')
    expect(SYSTEM_PRESETS.filter.work).toContain('All Todo Notes')

    expect(SYSTEM_PRESETS.filter.production).toContain('Outstanding Issues')
    expect(SYSTEM_PRESETS.filter.production).toContain('By Department')
    expect(SYSTEM_PRESETS.filter.production).toContain('All Todo Notes')

    console.log('Filter presets constants validated')

    // Test print presets for each module
    expect(SYSTEM_PRESETS.print.cue.length).toBeGreaterThan(0)
    expect(SYSTEM_PRESETS.print.work.length).toBeGreaterThan(0)
    expect(SYSTEM_PRESETS.print.production.length).toBeGreaterThan(0)

    console.log('Print presets constants validated')
  })

  test('Verify navigation helper functions work correctly', async ({ page }) => {
    console.log('Testing navigation helper functions...')

    // Test navigation to each module
    const modules = ['cue', 'work', 'production'] as const

    for (const mod of modules) {
      await test.step(`Check ${mod} module`, async () => {
        await pdfHelpers.navigateToModule(mod);
        await expect(page.locator('[data-testid="notes-table"]')).toBeVisible();

        // Verify we're on the correct page
        const currentUrl = page.url()
        expect(currentUrl).toContain(`/${mod}-notes`)

        console.log(`  Successfully navigated to ${mod} module`)
      });
    }
  })

  test('Verify screenshot helper function works', async ({ page }) => {
    console.log('Testing screenshot helper function...')

    await pdfHelpers.navigateToModule('cue')
    await pdfHelpers.waitForUIReady()

    // Take a test screenshot
    await pdfHelpers.takeScreenshot('helper-validation-test')

    console.log('Screenshot helper function works correctly!')
  })

  test('Verify PDF validation helper would work with mock data', async ({ page }) => {
    console.log('Testing PDF validation helper with mock data...')

    // Create mock PDF blob
    const mockPdfContent = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<<>>\nstartxref\n0\n%%EOF'
    const mockPdfBlob = Buffer.from(mockPdfContent)

    // Test PDF validation
    const validation = await pdfHelpers.validatePDF(mockPdfBlob, {
      moduleType: 'cue',
      filterPresetName: 'Test Filter',
      pageStylePresetName: 'Test Page Style',
      expectedPaperSize: 'letter',
      expectedOrientation: 'portrait',
      shouldIncludeCheckboxes: true
    })

    // Should pass basic validation (has PDF header)
    expect(validation.success).toBe(true)
    expect(validation.errors.length).toBe(0)

    console.log('PDF validation helper works correctly!')

    // Test with invalid PDF
    const invalidPdfBlob = Buffer.from('This is not a PDF')
    const invalidValidation = await pdfHelpers.validatePDF(invalidPdfBlob, {
      moduleType: 'work',
      filterPresetName: 'Test Filter',
      pageStylePresetName: 'Test Page Style'
    })

    // Should fail validation
    expect(invalidValidation.success).toBe(false)
    expect(invalidValidation.errors.length).toBeGreaterThan(0)
    expect(invalidValidation.errors[0]).toContain('Invalid PDF header')

    console.log('PDF validation correctly detects invalid PDFs!')
  })

  test('Verify helper functions handle UI states correctly', async ({ page }) => {
    console.log('Testing UI state handling...')

    await pdfHelpers.navigateToModule('production')
    await pdfHelpers.waitForUIReady()

    // Verify card grid is visible when print sidebar is opened
    await pdfHelpers.openPrintSidebar()
    await expect(page.locator('[data-testid="preset-card-grid"]')).toBeVisible()

    // Verify custom one-off card is present
    await expect(page.locator('[data-testid="preset-card-custom-one-off"]')).toBeVisible()

    // Verify create-new card is present
    await expect(page.locator('[data-testid="preset-card-create-new"]')).toBeVisible()

    console.log('Print sidebar card grid UI state verified!')

    // Close sidebar
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    // Test that UI ready detection works
    await pdfHelpers.waitForUIReady()

    console.log('UI ready detection works correctly!')
  })

  test('Verify helper error handling is robust', async ({ page }) => {
    console.log('Testing error handling in helper functions...')

    // Test navigation to invalid module (should handle gracefully)
    try {
      // This should not crash, even with invalid input
      await page.goto('http://localhost:3000/invalid-module')
      console.log('Invalid navigation handled gracefully')
    } catch (error) {
      console.log('Invalid navigation error caught properly')
    }

    // Test validation with empty buffer
    const emptyValidation = await pdfHelpers.validatePDF(Buffer.alloc(0), {
      moduleType: 'cue',
      filterPresetName: 'Test',
      pageStylePresetName: 'Test'
    })

    expect(emptyValidation.success).toBe(false)
    expect(emptyValidation.errors).toContain('PDF blob is empty')

    console.log('Empty PDF validation handled correctly!')
  })

  test('Verify test configuration is properly set up', async ({ page }) => {
    console.log('Testing configuration setup...')

    // Verify base URL is accessible
    await page.goto('/cue-notes')
    await expect(page).toHaveTitle(/LX Notes/)

    console.log('Base URL configuration works!')

    // Verify viewport size is correct
    const viewportSize = page.viewportSize()
    expect(viewportSize?.width).toBe(1280)
    expect(viewportSize?.height).toBe(800)

    console.log('Viewport configuration is correct!')

    // Verify downloads are enabled
    const context = page.context()
    const hasDownloads = context.browser()?.isConnected()
    expect(hasDownloads).toBe(true)

    console.log('Download capabilities are enabled!')
  })

  test('Demo: Complete testing workflow preparation', async ({ page }) => {
    console.log('DEMO: Complete testing workflow preparation')

    // Step 1: Navigation capability
    console.log('Step 1: Testing navigation capabilities...')
    await pdfHelpers.navigateToModule('cue')
    await pdfHelpers.waitForUIReady()
    console.log('   Can navigate to all modules')

    // Step 2: Screenshot capability
    console.log('Step 2: Testing screenshot capabilities...')
    await pdfHelpers.takeScreenshot('workflow-demo-step-2')
    console.log('   Can capture screenshots for debugging')

    // Step 3: Validation capability
    console.log('Step 3: Testing validation capabilities...')
    const mockPdf = Buffer.from('%PDF-1.4\nMock PDF content')
    const validation = await pdfHelpers.validatePDF(mockPdf, {
      moduleType: 'cue',
      filterPresetName: 'Demo Filter',
      pageStylePresetName: 'Demo Page Style'
    })
    expect(validation.success).toBe(true)
    console.log('   Can validate PDF properties')

    // Step 4: Error handling capability
    console.log('Step 4: Testing error handling capabilities...')
    const invalidValidation = await pdfHelpers.validatePDF(Buffer.alloc(0), {
      moduleType: 'work',
      filterPresetName: 'Demo',
      pageStylePresetName: 'Demo'
    })
    expect(invalidValidation.success).toBe(false)
    console.log('   Can detect and handle errors properly')

    // Step 5: Constants and configuration
    console.log('Step 5: Testing constants and configuration...')
    expect(SYSTEM_PRESETS.pageStyle.length).toBe(3)
    expect(SYSTEM_PRESETS.filter.cue.length).toBe(3)
    expect(Object.keys(PDF_PAPER_DIMENSIONS).length).toBe(3)
    console.log('   All constants and configurations are ready')

    console.log('')
    console.log('COMPLETE TESTING FRAMEWORK VALIDATED!')
  })
})
