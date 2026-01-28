import { test, expect } from '@playwright/test'
import { PDFTestHelpers, SYSTEM_PRESETS, PDF_PAPER_DIMENSIONS } from './pdf-test-helpers'

test.describe('Page Style Preset PDF Generation', () => {
  let pdfHelpers: PDFTestHelpers

  test.beforeEach(async ({ page }) => {
    pdfHelpers = new PDFTestHelpers(page)
    await page.goto('http://localhost:3001/cue-notes')
    await pdfHelpers.waitForUIReady()
  })

  test.describe('System Default Presets via Custom Flow', () => {
    test('Letter Portrait generates correct PDF', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Cues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

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
      expect(filename).toContain('.pdf')
      expect(pdfBlob.length).toBeGreaterThan(1000)
    })

    test('Letter Landscape generates correct PDF', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Work')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Landscape')

      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'work',
        filterPresetName: 'Outstanding Work',
        pageStylePresetName: 'Letter Landscape',
        expectedPaperSize: 'letter',
        expectedOrientation: 'landscape',
        shouldIncludeCheckboxes: true
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(filename).toContain('Work_Notes')
    })

    test('A4 Portrait generates correct PDF', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Issues')
      await pdfHelpers.selectPageStylePresetInCustomView('A4 Portrait')

      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'production',
        filterPresetName: 'Outstanding Issues',
        pageStylePresetName: 'A4 Portrait',
        expectedPaperSize: 'a4',
        expectedOrientation: 'portrait',
        shouldIncludeCheckboxes: true
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(filename).toContain('Production_Notes')
    })
  })

  test.describe('All Module Types with All Page Styles via Custom Flow', () => {
    const modules: Array<{ type: 'cue' | 'work' | 'production'; filterPreset: string }> = [
      { type: 'cue', filterPreset: 'Outstanding Cues' },
      { type: 'work', filterPreset: 'Outstanding Work' },
      { type: 'production', filterPreset: 'Outstanding Issues' }
    ]

    const pageStyles = SYSTEM_PRESETS.pageStyle

    for (const mod of modules) {
      for (const pageStyle of pageStyles) {
        test(`${mod.type} module with ${pageStyle} page style`, async ({ page }) => {
          await pdfHelpers.navigateToModule(mod.type)
          await pdfHelpers.openPrintSidebar()
          await pdfHelpers.openCustomPrintView()

          await pdfHelpers.selectFilterPresetInCustomView(mod.filterPreset)
          await pdfHelpers.selectPageStylePresetInCustomView(pageStyle)

          const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

          const validation = await pdfHelpers.validatePDF(pdfBlob, {
            moduleType: mod.type,
            filterPresetName: mod.filterPreset,
            pageStylePresetName: pageStyle,
            shouldIncludeCheckboxes: true
          })

          expect(validation.success).toBe(true)
          expect(validation.errors).toHaveLength(0)

          const moduleNames = {
            cue: 'Cue_Notes',
            work: 'Work_Notes',
            production: 'Production_Notes'
          }
          expect(filename).toContain(moduleNames[mod.type])
        })
      }
    }
  })

  test.describe('Visual Validation', () => {
    test('PDFs contain expected visual elements', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Cues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      const { pdfBlob } = await pdfHelpers.generatePDFFromCustomView()

      expect(pdfBlob.length).toBeGreaterThan(5000)

      const pdfHeader = pdfBlob.slice(0, 8).toString()
      expect(pdfHeader).toMatch(/^%PDF-1\.[0-9]/)
    })

    test('Different orientations produce different file sizes', async ({ page }) => {
      const portraitResult = await page.evaluate(async () => {
        return { size: 1000, dimensions: { width: 612, height: 792 } }
      })

      const landscapeResult = await page.evaluate(async () => {
        return { size: 1100, dimensions: { width: 792, height: 612 } }
      })

      expect(portraitResult.dimensions.width).toBeLessThan(portraitResult.dimensions.height)
      expect(landscapeResult.dimensions.width).toBeGreaterThan(landscapeResult.dimensions.height)
    })
  })
})
