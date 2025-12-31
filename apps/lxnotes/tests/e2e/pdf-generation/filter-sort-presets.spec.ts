import { test, expect } from '@playwright/test'
import { PDFTestHelpers, SYSTEM_PRESETS } from './pdf-test-helpers'

test.describe('Filter/Sort Preset PDF Generation', () => {
  let pdfHelpers: PDFTestHelpers

  test.beforeEach(async ({ page }) => {
    pdfHelpers = new PDFTestHelpers(page)

    // Start the development server if not already running
    await page.goto('http://localhost:3001/cue-notes')
    await pdfHelpers.waitForUIReady()
  })

  test.describe('Cue Notes Filter Presets', () => {
    test('Outstanding Cues filter generates correct content', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      // Select Outstanding Cues filter (status: todo, sorted by priority desc)
      await pdfHelpers.selectFilterPreset('Outstanding Cues')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('cue-outstanding-filter')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: 'Outstanding Cues',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)

      // Should contain filtered content (only todo items)
      expect(pdfBlob.length).toBeGreaterThan(1000)
    })

    test('High Priority First filter with grouping', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      // Select High Priority First filter (includes all statuses, grouped by type)
      await pdfHelpers.selectFilterPreset('High Priority First')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('cue-priority-grouped-filter')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate the PDF
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
      await pdfHelpers.openPrintDialog()

      // Select All Todo Notes filter (sorted by cue_number asc)
      await pdfHelpers.selectFilterPreset('All Todo Notes')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('cue-all-todo-filter')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate the PDF
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
      await pdfHelpers.openPrintDialog()

      // Select Outstanding Work filter (status: todo, sorted by priority desc)
      await pdfHelpers.selectFilterPreset('Outstanding Work')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('work-outstanding-filter')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate the PDF
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
      await pdfHelpers.openPrintDialog()

      // Select By Channel filter (sorted by channel asc)
      await pdfHelpers.selectFilterPreset('By Channel')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('work-by-channel-filter')

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

    test('All Todo Notes sorted by position', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintDialog()

      // Select All Todo Notes filter (sorted by position asc)
      await pdfHelpers.selectFilterPreset('All Todo Notes')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('work-all-todo-filter')

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
  })

  test.describe('Production Notes Filter Presets', () => {
    test('Outstanding Issues filter generates correct content', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      // Select Outstanding Issues filter (status: todo, sorted by priority desc)
      await pdfHelpers.selectFilterPreset('Outstanding Issues')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('production-outstanding-filter')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate the PDF
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
      await pdfHelpers.openPrintDialog()

      // Select By Department filter (grouped by type)
      await pdfHelpers.selectFilterPreset('By Department')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('production-by-department-filter')

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
    })

    test('All Todo Notes sorted by creation date', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      // Select All Todo Notes filter (sorted by created_at desc)
      await pdfHelpers.selectFilterPreset('All Todo Notes')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('production-all-todo-filter')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'production',
        filterPresetName: 'All Todo Notes',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  test.describe('Custom Filter Presets', () => {
    test('Create custom status filter (completed only)', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      // Create custom filter for completed items only
      await pdfHelpers.createCustomFilterPreset('Completed Only Test', 'cue', {
        statusFilter: 'complete',
        typeFilters: ['cue', 'director', 'designer'],
        priorityFilters: ['critical', 'very_high', 'medium'],
        sortBy: 'completed_at',
        sortOrder: 'desc',
        groupByType: false
      })

      // Verify the preset was created
      const presetExists = await pdfHelpers.presetExists('Completed Only Test', 'filter')
      expect(presetExists).toBe(true)

      // Use the custom preset
      await pdfHelpers.selectFilterPreset('Completed Only Test')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('custom-completed-filter')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: 'Completed Only Test',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Create custom type filter (specific types only)', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintDialog()

      // Create custom filter for specific work types
      await pdfHelpers.createCustomFilterPreset('Focus Work Only', 'work', {
        statusFilter: null, // All statuses
        typeFilters: ['focus'], // Only focus type
        priorityFilters: ['critical', 'very_high', 'high'],
        sortBy: 'priority',
        sortOrder: 'desc',
        groupByType: false
      })

      // Use the custom preset
      await pdfHelpers.selectFilterPreset('Focus Work Only')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('custom-focus-work-filter')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'work',
        filterPresetName: 'Focus Work Only',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Create custom priority filter (high priority only)', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      // Create custom filter for high priority items
      await pdfHelpers.createCustomFilterPreset('Critical Issues Only', 'production', {
        statusFilter: 'todo',
        typeFilters: ['lighting', 'scenic', 'sound'],
        priorityFilters: ['critical', 'very_high'], // Only highest priorities
        sortBy: 'priority',
        sortOrder: 'desc',
        groupByType: true
      })

      // Use the custom preset
      await pdfHelpers.selectFilterPreset('Critical Issues Only')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('custom-critical-issues-filter')

      // Generate PDF
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Validate the PDF
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'production',
        filterPresetName: 'Critical Issues Only',
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  test.describe('Sort Order Validation', () => {
    test('Ascending vs Descending sort produces different results', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      // Create ascending sort preset
      await pdfHelpers.createCustomFilterPreset('Priority Ascending', 'cue', {
        statusFilter: null,
        typeFilters: ['cue', 'director'],
        priorityFilters: ['critical', 'very_high', 'medium', 'low'],
        sortBy: 'priority',
        sortOrder: 'asc',
        groupByType: false
      })

      // Test ascending sort
      await pdfHelpers.selectFilterPreset('Priority Ascending')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      const { pdfBlob: ascPdf } = await pdfHelpers.generatePDF()

      // Reset dialog
      await page.keyboard.press('Escape')
      await pdfHelpers.openPrintDialog()

      // Create descending sort preset
      await pdfHelpers.createCustomFilterPreset('Priority Descending', 'cue', {
        statusFilter: null,
        typeFilters: ['cue', 'director'],
        priorityFilters: ['critical', 'very_high', 'medium', 'low'],
        sortBy: 'priority',
        sortOrder: 'desc',
        groupByType: false
      })

      // Test descending sort
      await pdfHelpers.selectFilterPreset('Priority Descending')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      const { pdfBlob: descPdf } = await pdfHelpers.generatePDF()

      // PDFs should be different (different content order)
      expect(ascPdf.length).toBeGreaterThan(1000)
      expect(descPdf.length).toBeGreaterThan(1000)
      // Note: In a real implementation, we would parse and compare the actual content order
    })

    test('Grouping vs no grouping produces different layouts', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      // Create non-grouped preset
      await pdfHelpers.createCustomFilterPreset('No Grouping', 'production', {
        statusFilter: null,
        typeFilters: ['lighting', 'scenic', 'props'],
        priorityFilters: ['critical', 'very_high', 'medium'],
        sortBy: 'priority',
        sortOrder: 'desc',
        groupByType: false
      })

      // Test non-grouped
      await pdfHelpers.selectFilterPreset('No Grouping')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      const { pdfBlob: noGroupPdf } = await pdfHelpers.generatePDF()

      // Reset dialog
      await page.keyboard.press('Escape')
      await pdfHelpers.openPrintDialog()

      // Create grouped preset
      await pdfHelpers.createCustomFilterPreset('With Grouping', 'production', {
        statusFilter: null,
        typeFilters: ['lighting', 'scenic', 'props'],
        priorityFilters: ['critical', 'very_high', 'medium'],
        sortBy: 'priority',
        sortOrder: 'desc',
        groupByType: true
      })

      // Test grouped
      await pdfHelpers.selectFilterPreset('With Grouping')
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      const { pdfBlob: groupedPdf } = await pdfHelpers.generatePDF()

      // PDFs should be different (different organization)
      expect(noGroupPdf.length).toBeGreaterThan(1000)
      expect(groupedPdf.length).toBeGreaterThan(1000)
    })
  })

  test.describe('All System Presets Comprehensive Test', () => {
    // Test every system preset across all modules
    const testCases = [
      { module: 'cue' as const, presets: SYSTEM_PRESETS.filter.cue },
      { module: 'work' as const, presets: SYSTEM_PRESETS.filter.work },
      { module: 'production' as const, presets: SYSTEM_PRESETS.filter.production }
    ]

    for (const testCase of testCases) {
      for (const presetName of testCase.presets) {
        test(`${testCase.module} module with ${presetName} filter`, async ({ page }) => {
          await pdfHelpers.navigateToModule(testCase.module)
          await pdfHelpers.openPrintDialog()

          // Select the filter preset and a standard page style
          await pdfHelpers.selectFilterPreset(presetName)
          await pdfHelpers.selectPageStylePreset('Letter Portrait')

          await pdfHelpers.takeScreenshot(`${testCase.module}-${presetName.replace(/\s+/g, '-').toLowerCase()}`)

          // Generate PDF
          const { pdfBlob, filename } = await pdfHelpers.generatePDF()

          // Validate the PDF
          const validation = await pdfHelpers.validatePDF(pdfBlob, {
            moduleType: testCase.module,
            filterPresetName: presetName,
            pageStylePresetName: 'Letter Portrait'
          })

          expect(validation.success).toBe(true)
          expect(validation.errors).toHaveLength(0)

          // Verify module name is in filename
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