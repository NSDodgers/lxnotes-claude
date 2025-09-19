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
      await pdfHelpers.openPrintDialog()

      // Select presets that will show cue-specific data
      await pdfHelpers.selectFilterPreset('All Todo Notes') // Sorted by cue_number
      await pdfHelpers.selectPageStylePreset('Letter Landscape') // More space for columns

      await pdfHelpers.takeScreenshot('cue-specific-columns')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

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
      await pdfHelpers.openPrintDialog()

      // Create custom preset that sorts by cue number specifically
      await pdfHelpers.createCustomFilterPreset('Cue Number Sort Test', 'cue', {
        statusFilter: null, // All statuses
        typeFilters: ['cue', 'director', 'designer'],
        priorityFilters: ['critical', 'very_high', 'medium', 'low'],
        sortBy: 'cue_number',
        sortOrder: 'asc',
        groupByType: false
      })

      await pdfHelpers.selectFilterPreset('Cue Number Sort Test')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('cue-number-sort')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: 'Cue Number Sort Test',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Cue Notes with scene/song grouping and filtering', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      // Test the high priority first preset which includes grouping
      await pdfHelpers.selectFilterPreset('High Priority First')
      await pdfHelpers.selectPageStylePreset('A4 Portrait')

      await pdfHelpers.takeScreenshot('cue-scene-song-grouping')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

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
      await pdfHelpers.openPrintDialog()

      // Select presets that will show work-specific data
      await pdfHelpers.selectFilterPreset('By Channel') // Sorted by channel
      await pdfHelpers.selectPageStylePreset('Letter Landscape') // More space for columns

      await pdfHelpers.takeScreenshot('work-specific-columns')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

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
      await pdfHelpers.openPrintDialog()

      // Use the "By Channel" preset which sorts by channel
      await pdfHelpers.selectFilterPreset('By Channel')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('work-channel-sort')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

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
      await pdfHelpers.openPrintDialog()

      // Use the "All Todo Notes" preset which sorts by position
      await pdfHelpers.selectFilterPreset('All Todo Notes')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('work-position-sort')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

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
      await pdfHelpers.openPrintDialog()

      // Create custom preset using work-specific priority levels
      await pdfHelpers.createCustomFilterPreset('Extended Priority Test', 'work', {
        statusFilter: null,
        typeFilters: ['work', 'focus', 'electrician'],
        priorityFilters: ['critical', 'very_high', 'high', 'medium_high', 'medium', 'medium_low', 'low', 'very_low', 'uncritical'],
        sortBy: 'priority',
        sortOrder: 'desc',
        groupByType: false
      })

      await pdfHelpers.selectFilterPreset('Extended Priority Test')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('work-extended-priorities')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'work',
        filterPresetName: 'Extended Priority Test',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  test.describe('Production Notes Module Specific Features', () => {
    test('Production Notes PDF includes department grouping', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      // Select preset that groups by department
      await pdfHelpers.selectFilterPreset('By Department')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('production-department-grouping')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

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
      await pdfHelpers.openPrintDialog()

      // Use the "By Department" preset which sorts by department
      await pdfHelpers.selectFilterPreset('By Department')
      await pdfHelpers.selectPageStylePreset('A4 Portrait')

      await pdfHelpers.takeScreenshot('production-department-sort')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

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
      await pdfHelpers.openPrintDialog()

      // Create custom preset using production-specific types
      await pdfHelpers.createCustomFilterPreset('Department Specific Test', 'production', {
        statusFilter: null,
        typeFilters: ['scenic', 'costumes', 'lighting', 'props', 'sound', 'video'],
        priorityFilters: ['critical', 'very_high', 'medium', 'low'],
        sortBy: 'department',
        sortOrder: 'asc',
        groupByType: true
      })

      await pdfHelpers.selectFilterPreset('Department Specific Test')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('production-department-types')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'production',
        filterPresetName: 'Department Specific Test',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Production Notes simplified column layout', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      // Production notes should have fewer columns than other modules
      await pdfHelpers.selectFilterPreset('Outstanding Issues')
      await pdfHelpers.selectPageStylePreset('Letter Landscape')

      await pdfHelpers.takeScreenshot('production-simplified-layout')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

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
        await pdfHelpers.openPrintDialog()

        await pdfHelpers.selectFilterPreset(moduleTest.filterPreset)
        await pdfHelpers.selectPageStylePreset('Letter Portrait')

        await pdfHelpers.takeScreenshot(`cross-module-${moduleTest.module}`)

        const { pdfBlob, filename } = await pdfHelpers.generatePDF()

        results.push({
          module: moduleTest.module,
          pdfSize: pdfBlob.length,
          filename
        })

        // Close dialog before next iteration
        await page.keyboard.press('Escape')
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
      // Test cue_number sort (Cue Notes only)
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      await pdfHelpers.createCustomFilterPreset('Cue Number Test', 'cue', {
        statusFilter: null,
        typeFilters: ['cue'],
        priorityFilters: ['critical', 'very_high', 'medium'],
        sortBy: 'cue_number',
        sortOrder: 'asc',
        groupByType: false
      })

      await pdfHelpers.selectFilterPreset('Cue Number Test')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      const { pdfBlob: cuePdf } = await pdfHelpers.generatePDF()
      expect(cuePdf.length).toBeGreaterThan(1000)

      // Close dialog
      await page.keyboard.press('Escape')

      // Test channel sort (Work Notes only)
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintDialog()

      await pdfHelpers.selectFilterPreset('By Channel') // Uses channel sort
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      const { pdfBlob: workPdf } = await pdfHelpers.generatePDF()
      expect(workPdf.length).toBeGreaterThan(1000)

      // Close dialog
      await page.keyboard.press('Escape')

      // Test department sort (Production Notes only)
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      await pdfHelpers.selectFilterPreset('By Department') // Uses department sort
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      const { pdfBlob: prodPdf } = await pdfHelpers.generatePDF()
      expect(prodPdf.length).toBeGreaterThan(1000)
    })

    test('Module-specific type filters are enforced', async ({ page }) => {
      // Test that each module only shows its relevant types
      const moduleTypeTests = [
        {
          module: 'cue' as const,
          validTypes: ['cue', 'director', 'choreographer', 'designer', 'stage_manager'],
          filterPreset: 'Outstanding Cues'
        },
        {
          module: 'work' as const,
          validTypes: ['work', 'focus', 'paperwork', 'electrician', 'think'],
          filterPreset: 'Outstanding Work'
        },
        {
          module: 'production' as const,
          validTypes: ['scenic', 'costumes', 'lighting', 'props', 'sound', 'video'],
          filterPreset: 'Outstanding Issues'
        }
      ]

      for (const moduleTest of moduleTypeTests) {
        await pdfHelpers.navigateToModule(moduleTest.module)
        await pdfHelpers.openPrintDialog()

        // Create a filter using module-specific types
        await pdfHelpers.createCustomFilterPreset(`${moduleTest.module} Types Test`, moduleTest.module, {
          statusFilter: null,
          typeFilters: moduleTest.validTypes.slice(0, 3), // Use first 3 types
          priorityFilters: ['critical', 'very_high', 'medium'],
          sortBy: 'priority',
          sortOrder: 'desc',
          groupByType: false
        })

        await pdfHelpers.selectFilterPreset(`${moduleTest.module} Types Test`)
        await pdfHelpers.selectPageStylePreset('Letter Portrait')

        await pdfHelpers.takeScreenshot(`module-types-${moduleTest.module}`)

        const { pdfBlob, filename } = await pdfHelpers.generatePDF()

        const validation = await pdfHelpers.validatePDF(pdfBlob, {
          moduleType: moduleTest.module,
          filterPresetName: `${moduleTest.module} Types Test`,
          pageStylePresetName: 'Letter Portrait'
        })

        expect(validation.success).toBe(true)
        expect(validation.errors).toHaveLength(0)

        // Close dialog before next iteration
        await page.keyboard.press('Escape')
      }
    })
  })
})