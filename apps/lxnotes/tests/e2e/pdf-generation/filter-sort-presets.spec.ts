import { test, expect } from '@playwright/test'
import { PDFTestHelpers, SYSTEM_PRESETS } from './pdf-test-helpers'

test.describe('Filter/Sort Preset PDF Generation', () => {
  let pdfHelpers: PDFTestHelpers

  test.beforeEach(async ({ page }) => {
    pdfHelpers = new PDFTestHelpers(page)
    await page.goto('http://localhost:3001/cue-notes')
    await pdfHelpers.waitForUIReady()
  })

  test.describe('Cue Notes Filter Presets', () => {
    test('Outstanding Cues filter generates correct content', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Cues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('cue-outstanding-filter')

      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: 'Outstanding Cues',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(pdfBlob.length).toBeGreaterThan(1000)
    })

    test('High Priority First filter with grouping', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('High Priority First')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      const { pdfBlob } = await pdfHelpers.generatePDFFromCustomView()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: 'High Priority First',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('All Todo Notes sorted by cue number', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('All Todo Notes')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      const { pdfBlob } = await pdfHelpers.generatePDFFromCustomView()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: 'All Todo Notes',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  test.describe('Work Notes Filter Presets', () => {
    test('Outstanding Work filter generates correct content', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Work')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'work',
        filterPresetName: 'Outstanding Work',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(filename).toContain('Work_Notes')
    })

    test('By Channel filter with channel sorting', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('By Channel')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      const { pdfBlob } = await pdfHelpers.generatePDFFromCustomView()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'work',
        filterPresetName: 'By Channel',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  test.describe('Production Notes Filter Presets', () => {
    test('Outstanding Issues filter generates correct content', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Issues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'production',
        filterPresetName: 'Outstanding Issues',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(filename).toContain('Production_Notes')
    })

    test('By Department filter with grouping', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('By Department')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      const { pdfBlob } = await pdfHelpers.generatePDFFromCustomView()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'production',
        filterPresetName: 'By Department',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  test.describe('Print Preset Card Flow', () => {
    test('should show print preset cards in sidebar', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()

      // Should show card grid with system print presets
      await expect(page.locator('[data-testid="preset-card-grid"]')).toBeVisible()
      await expect(page.locator('[data-testid="preset-card-create-new"]')).toBeVisible()
      await expect(page.locator('[data-testid="preset-card-custom-one-off"]')).toBeVisible()
    })

    test('should select print preset card and generate PDF', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()

      // Click a system print preset card
      const presetCard = page.locator('[data-testid^="preset-card-"]:not([data-testid="preset-card-create-new"]):not([data-testid="preset-card-custom-one-off"])').first()

      if (await presetCard.count() > 0) {
        await presetCard.click()

        // Should show confirm panel
        await expect(page.locator('[data-testid="confirm-send-panel"]')).toBeVisible()

        // Generate PDF from confirm panel
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
        await page.locator('[data-testid="confirm-panel-submit"]').click()

        const download = await downloadPromise
        expect(download.suggestedFilename()).toMatch(/\.pdf$/)
        expect(download.suggestedFilename()).toContain('Cue_Notes')
      }
    })
  })

  test.describe('All System Presets Comprehensive Test', () => {
    const testCases = [
      { module: 'cue' as const, presets: SYSTEM_PRESETS.filter.cue },
      { module: 'work' as const, presets: SYSTEM_PRESETS.filter.work },
      { module: 'production' as const, presets: SYSTEM_PRESETS.filter.production }
    ]

    for (const testCase of testCases) {
      for (const presetName of testCase.presets) {
        test(`${testCase.module} module with ${presetName} filter via custom flow`, async ({ page }) => {
          await pdfHelpers.navigateToModule(testCase.module)
          await pdfHelpers.openPrintSidebar()
          await pdfHelpers.openCustomPrintView()

          await pdfHelpers.selectFilterPresetInCustomView(presetName)
          await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

          const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

          const validation = await pdfHelpers.validatePDF(pdfBlob, {
            moduleType: testCase.module,
            filterPresetName: presetName,
            pageStylePresetName: 'Letter Portrait'
          })

          expect(validation.success).toBe(true)
          expect(validation.errors).toHaveLength(0)

          const moduleNames = {
            cue: 'Cue_Notes',
            work: 'Work_Notes',
            production: 'Production_Notes'
          }
          expect(filename).toContain(moduleNames[testCase.module])
        })
      }
    }
  })
})
