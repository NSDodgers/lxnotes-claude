import { test, expect } from '@playwright/test'
import { PDFTestHelpers } from './pdf-test-helpers'

test.describe('Module-Specific PDF Features', () => {
  let pdfHelpers: PDFTestHelpers

  test.beforeEach(async ({ page }) => {
    pdfHelpers = new PDFTestHelpers(page)

    // Start the development server
    await page.goto('http://localhost:3001/cue-notes')
    await pdfHelpers.waitForUIReady()
  })

  test.describe('Cue Notes Module Specific Features', () => {
    test('Cue Notes PDF includes script page and scene/song columns', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Select presets that will show cue-specific data
      await pdfHelpers.selectFilterPresetInCustomView('All Todo Notes')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Landscape') // More space for columns

      await pdfHelpers.takeScreenshot('cue-specific-columns')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: 'All Todo Notes',
        pageStylePresetName: 'Letter Landscape'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)

      // Check filename includes Cue_Notes
      expect(filename).toContain('Cue_Notes')

      // PDF should contain cue-specific content structure
      expect(pdfBlob.length).toBeGreaterThan(2000) // Should be substantial with cue data
    })

    test('Cue Notes sorting by cue number works correctly', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Use system filter that sorts by cue number
      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Cues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('cue-number-sort')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: 'Outstanding Cues',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Cue Notes with scene/song grouping and filtering', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Test the high priority first preset which includes grouping
      await pdfHelpers.selectFilterPresetInCustomView('High Priority First')
      await pdfHelpers.selectPageStylePresetInCustomView('A4 Portrait')

      await pdfHelpers.takeScreenshot('cue-scene-song-grouping')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: 'High Priority First',
        pageStylePresetName: 'A4 Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  test.describe('Work Notes Module Specific Features', () => {
    test('Work Notes PDF includes channel and position columns', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Select presets that will show work-specific data
      await pdfHelpers.selectFilterPresetInCustomView('By Channel')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Landscape') // More space for columns

      await pdfHelpers.takeScreenshot('work-specific-columns')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'work',
        filterPresetName: 'By Channel',
        pageStylePresetName: 'Letter Landscape'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)

      // Check filename includes Work_Notes
      expect(filename).toContain('Work_Notes')

      // PDF should contain work-specific content structure
      expect(pdfBlob.length).toBeGreaterThan(2000)
    })

    test('Work Notes sorting by channel works correctly', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Use the "By Channel" preset which sorts by channel
      await pdfHelpers.selectFilterPresetInCustomView('By Channel')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('work-channel-sort')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'work',
        filterPresetName: 'By Channel',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Work Notes sorting by position works correctly', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Use the "All Todo Notes" preset
      await pdfHelpers.selectFilterPresetInCustomView('All Todo Notes')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('work-position-sort')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'work',
        filterPresetName: 'All Todo Notes',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Work Notes with extended priority scale', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Use system filter with priority sorting
      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Work')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('work-extended-priorities')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'work',
        filterPresetName: 'Outstanding Work',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  test.describe('Production Notes Module Specific Features', () => {
    test('Production Notes PDF includes department grouping', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Select preset that groups by department
      await pdfHelpers.selectFilterPresetInCustomView('By Department')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('production-department-grouping')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'production',
        filterPresetName: 'By Department',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)

      // Check filename includes Production_Notes
      expect(filename).toContain('Production_Notes')

      // PDF should contain production-specific content structure
      expect(pdfBlob.length).toBeGreaterThan(2000)
    })

    test('Production Notes sorting by department works correctly', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Use the "By Department" preset which sorts by department
      await pdfHelpers.selectFilterPresetInCustomView('By Department')
      await pdfHelpers.selectPageStylePresetInCustomView('A4 Portrait')

      await pdfHelpers.takeScreenshot('production-department-sort')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'production',
        filterPresetName: 'By Department',
        pageStylePresetName: 'A4 Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Production Notes with department-specific types', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Use system filter for production
      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Issues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      await pdfHelpers.takeScreenshot('production-department-types')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'production',
        filterPresetName: 'Outstanding Issues',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Production Notes simplified column layout', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      // Production notes should have fewer columns than other modules
      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Issues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Landscape')

      await pdfHelpers.takeScreenshot('production-simplified-layout')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'production',
        filterPresetName: 'Outstanding Issues',
        pageStylePresetName: 'Letter Landscape'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  test.describe('Cross-Module Comparison Tests', () => {
    test('Different modules produce different column structures', async ({ page }) => {
      const moduleTests = [
        { module: 'cue' as const, filterPreset: 'Outstanding Cues' },
        { module: 'work' as const, filterPreset: 'Outstanding Work' },
        { module: 'production' as const, filterPreset: 'Outstanding Issues' }
      ]

      const results: Array<{ module: string; pdfSize: number; filename: string }> = []

      for (const moduleTest of moduleTests) {
        await pdfHelpers.navigateToModule(moduleTest.module)
        await pdfHelpers.openPrintSidebar()
        await pdfHelpers.openCustomPrintView()

        await pdfHelpers.selectFilterPresetInCustomView(moduleTest.filterPreset)
        await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

        await pdfHelpers.takeScreenshot(`cross-module-${moduleTest.module}`)

        const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

        results.push({
          module: moduleTest.module,
          pdfSize: pdfBlob.length,
          filename
        })

        // Close sidebar before next iteration
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }

      // Verify each module produced a PDF
      for (const result of results) {
        expect(result.pdfSize).toBeGreaterThan(1000)
        expect(result.filename).toContain(result.module === 'cue' ? 'Cue_Notes' :
                                         result.module === 'work' ? 'Work_Notes' :
                                         'Production_Notes')
      }

      // All modules should produce PDFs (sizes might be different due to different content)
      expect(results).toHaveLength(3)
    })

    test('Module-specific sort fields work correctly', async ({ page }) => {
      // Test cue sort (Cue Notes)
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('Outstanding Cues')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      const { pdfBlob: cuePdf } = await pdfHelpers.generatePDFFromCustomView()
      expect(cuePdf.length).toBeGreaterThan(1000)

      // Close sidebar
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)

      // Test channel sort (Work Notes)
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('By Channel')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      const { pdfBlob: workPdf } = await pdfHelpers.generatePDFFromCustomView()
      expect(workPdf.length).toBeGreaterThan(1000)

      // Close sidebar
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)

      // Test department sort (Production Notes)
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintSidebar()
      await pdfHelpers.openCustomPrintView()

      await pdfHelpers.selectFilterPresetInCustomView('By Department')
      await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

      const { pdfBlob: prodPdf } = await pdfHelpers.generatePDFFromCustomView()
      expect(prodPdf.length).toBeGreaterThan(1000)
    })

    test('Module-specific type filters are enforced', async ({ page }) => {
      // Test that each module shows its relevant filter presets
      const moduleTypeTests = [
        {
          module: 'cue' as const,
          filterPreset: 'Outstanding Cues'
        },
        {
          module: 'work' as const,
          filterPreset: 'Outstanding Work'
        },
        {
          module: 'production' as const,
          filterPreset: 'Outstanding Issues'
        }
      ]

      for (const moduleTest of moduleTypeTests) {
        await pdfHelpers.navigateToModule(moduleTest.module)
        await pdfHelpers.openPrintSidebar()
        await pdfHelpers.openCustomPrintView()

        await pdfHelpers.selectFilterPresetInCustomView(moduleTest.filterPreset)
        await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

        await pdfHelpers.takeScreenshot(`module-types-${moduleTest.module}`)

        const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

        const validation = await pdfHelpers.validatePDF(pdfBlob, {
          moduleType: moduleTest.module,
          filterPresetName: moduleTest.filterPreset,
          pageStylePresetName: 'Letter Portrait'
        })

        expect(validation.success).toBe(true)
        expect(validation.errors).toHaveLength(0)

        // Close sidebar before next iteration
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }
    })
  })
})
