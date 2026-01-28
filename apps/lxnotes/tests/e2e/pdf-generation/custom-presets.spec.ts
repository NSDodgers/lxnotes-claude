import { test, expect } from '@playwright/test'
import { PDFTestHelpers } from './pdf-test-helpers'

test.describe('Custom Preset Creation and PDF Generation', () => {
  let pdfHelpers: PDFTestHelpers

  test.beforeEach(async ({ page }) => {
    pdfHelpers = new PDFTestHelpers(page)
    await page.goto('http://localhost:3001/cue-notes')
    await pdfHelpers.waitForUIReady()
  })

  test.describe('Custom One-Off PDF Generation', () => {
    test('Generate PDF with custom filter and page style selection', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Cues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('custom-one-off-cue')

      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: 'Outstanding Cues',
        pageStylePresetName: 'Letter Portrait',
        expectedPaperSize: 'letter',
        expectedOrientation: 'portrait',
        shouldIncludeCheckboxes: true
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(filename).toContain('Cue_Notes')
    })

    test('Generate PDF with different page styles across modules', async ({ page }) => {
      const modules = [
        { type: 'cue' as const, filter: 'Outstanding Cues', expectedFilename: 'Cue_Notes' },
        { type: 'work' as const, filter: 'Outstanding Work', expectedFilename: 'Work_Notes' },
        { type: 'production' as const, filter: 'Outstanding Issues', expectedFilename: 'Production_Notes' },
      ]

      for (const mod of modules) {
        await pdfHelpers.navigateToModule(mod.type)
        await pdfHelpers.openPrintSidebar()
        await pdfHelpers.openCustomPrintView()

        await pdfHelpers.selectFilterPresetInCustomView(mod.filter)
        await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

        await pdfHelpers.takeScreenshot(`custom-${mod.type}-letter-portrait`)

        const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

        const validation = await pdfHelpers.validatePDF(pdfBlob, {
          moduleType: mod.type,
          filterPresetName: mod.filter,
          pageStylePresetName: 'Letter Portrait'
        })

        expect(validation.success).toBe(true)
        expect(validation.errors).toHaveLength(0)
        expect(filename).toContain(mod.expectedFilename)
      }
    })
  })

  test.describe('Print Preset Card Flow', () => {
    test('Select system print preset card and confirm', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()

      // Should show preset cards
      const presetCards = page.locator('[data-testid^="preset-card-"]:not([data-testid="preset-card-create-new"]):not([data-testid="preset-card-custom-one-off"])')

      if (await presetCards.count() > 0) {
        await presetCards.first().click()

        // Confirm panel should show
        await expect(page.locator('[data-testid="confirm-send-panel"]')).toBeVisible()

        // Should show filter and page style details
        await expect(page.locator('[data-testid="confirm-send-panel"]')).toContainText('Filter')
        await expect(page.locator('[data-testid="confirm-send-panel"]')).toContainText('Page Style')

        // Back button works
        await pdfHelpers.goBackToCardGrid()
        await expect(page.locator('[data-testid="preset-card-grid"]')).toBeVisible()
      }
    })

    test('Create new print preset via wizard', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintSidebar()

      // Click create new card
      await pdfHelpers.openPrintWizard()

      // Wizard should be visible
      await expect(page.locator('[data-testid="preset-wizard"]')).toBeVisible()

      // Should show step 1 (what to send/print)
      await expect(page.locator('[data-testid="wizard-step-what-to-send"]')).toBeVisible()
    })
  })

  test.describe('Custom Flow Validation', () => {
    test('Custom flow requires both filter and page style', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Generate button should be disabled without selections
      const generateButton = page.locator('button:has-text("Generate PDF")')
      await expect(generateButton).toBeDisabled()

      // Select only filter
      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Issues')

      // Still disabled (no page style)
      await expect(generateButton).toBeDisabled()
    })

    test('Verify custom presets persist across sidebar reopens', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()

      // Note preset card count
      const initialCardCount = await page.locator('[data-testid^="preset-card-"]:not([data-testid="preset-card-create-new"]):not([data-testid="preset-card-custom-one-off"])').count()

      // Close and reopen
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      await pdfHelpers.openPrintSidebar()

      // Same card count
      const reopenedCardCount = await page.locator('[data-testid^="preset-card-"]:not([data-testid="preset-card-create-new"]):not([data-testid="preset-card-custom-one-off"])').count()
      expect(reopenedCardCount).toBe(initialCardCount)
    })
  })
})
