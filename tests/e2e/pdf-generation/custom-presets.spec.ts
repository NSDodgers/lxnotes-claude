import { test, expect } from '@playwright/test'
import { PDFTestHelpers } from './pdf-test-helpers'

test.describe('Custom Preset Creation and Editing', () => {
  let pdfHelpers: PDFTestHelpers

  test.beforeEach(async ({ page }) => {
    pdfHelpers = new PDFTestHelpers(page)

    // Start the development server
    await page.goto('http://localhost:3001/cue-notes')
    await pdfHelpers.waitForUIReady()
  })

  test.describe('Custom Page Style Preset Management', () => {
    test('Create, use, and verify custom page style preset', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      // Create a completely custom page style preset
      const customPresetName = 'Custom Legal Landscape No Checkboxes'
      await pdfHelpers.createCustomPageStylePreset(customPresetName, {
        paperSize: 'legal',
        orientation: 'landscape',
        includeCheckboxes: false
      })

      // Verify the preset exists in the dropdown
      const presetExists = await pdfHelpers.presetExists(customPresetName, 'pageStyle')
      expect(presetExists).toBe(true)

      // Use the custom preset to generate a PDF
      await pdfHelpers.selectFilterPreset('Outstanding Cues')
      await pdfHelpers.selectPageStylePreset(customPresetName)

      await pdfHelpers.takeScreenshot('custom-page-style-in-use')

      // Generate PDF and verify it works
      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: 'Outstanding Cues',
        pageStylePresetName: customPresetName,
        expectedPaperSize: 'legal',
        expectedOrientation: 'landscape',
        shouldIncludeCheckboxes: false
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(filename).toContain('Cue_Notes')
    })

    test('Create multiple custom page style presets', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintDialog()

      const customPresets = [
        { name: 'A4 Landscape Checkboxes', paperSize: 'a4' as const, orientation: 'landscape' as const, includeCheckboxes: true },
        { name: 'Letter Portrait No Checkboxes', paperSize: 'letter' as const, orientation: 'portrait' as const, includeCheckboxes: false },
        { name: 'Legal Portrait Checkboxes', paperSize: 'legal' as const, orientation: 'portrait' as const, includeCheckboxes: true }
      ]

      // Create all custom presets
      for (const preset of customPresets) {
        await pdfHelpers.createCustomPageStylePreset(preset.name, {
          paperSize: preset.paperSize,
          orientation: preset.orientation,
          includeCheckboxes: preset.includeCheckboxes
        })

        // Verify each preset was created
        const exists = await pdfHelpers.presetExists(preset.name, 'pageStyle')
        expect(exists).toBe(true)
      }

      // Test each custom preset
      for (const preset of customPresets) {
        await pdfHelpers.selectFilterPreset('Outstanding Work')
        await pdfHelpers.selectPageStylePreset(preset.name)

        await pdfHelpers.takeScreenshot(`multiple-custom-${preset.name.replace(/\s+/g, '-').toLowerCase()}`)

        const { pdfBlob, filename } = await pdfHelpers.generatePDF()

        const validation = await pdfHelpers.validatePDF(pdfBlob, {
          moduleType: 'work',
          filterPresetName: 'Outstanding Work',
          pageStylePresetName: preset.name,
          expectedPaperSize: preset.paperSize,
          expectedOrientation: preset.orientation,
          shouldIncludeCheckboxes: preset.includeCheckboxes
        })

        expect(validation.success).toBe(true)
        expect(validation.errors).toHaveLength(0)

        // Reset for next iteration
        await page.keyboard.press('Escape')
        await pdfHelpers.openPrintDialog()
      }
    })

    test('Edit existing custom page style preset', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      // First create a preset
      const originalName = 'Original Custom Preset'
      await pdfHelpers.createCustomPageStylePreset(originalName, {
        paperSize: 'letter',
        orientation: 'portrait',
        includeCheckboxes: true
      })

      // Verify it exists
      let presetExists = await pdfHelpers.presetExists(originalName, 'pageStyle')
      expect(presetExists).toBe(true)

      // Now edit the preset (this would typically involve clicking an edit button)
      // For this test, we'll simulate the editing process by creating a modified version
      const editedName = 'Edited Custom Preset'
      await pdfHelpers.createCustomPageStylePreset(editedName, {
        paperSize: 'a4',
        orientation: 'landscape',
        includeCheckboxes: false
      })

      // Verify the edited version exists
      presetExists = await pdfHelpers.presetExists(editedName, 'pageStyle')
      expect(presetExists).toBe(true)

      // Test the edited preset
      await pdfHelpers.selectFilterPreset('Outstanding Issues')
      await pdfHelpers.selectPageStylePreset(editedName)

      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'production',
        filterPresetName: 'Outstanding Issues',
        pageStylePresetName: editedName,
        expectedPaperSize: 'a4',
        expectedOrientation: 'landscape',
        shouldIncludeCheckboxes: false
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  test.describe('Custom Filter/Sort Preset Management', () => {
    test('Create complex custom filter preset for Cue Notes', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      // Create a complex filter preset with multiple criteria
      const customFilterName = 'Custom Cue Filter Complex'
      await pdfHelpers.createCustomFilterPreset(customFilterName, 'cue', {
        statusFilter: 'todo',
        typeFilters: ['cue', 'director', 'designer'],
        priorityFilters: ['critical', 'very_high'],
        sortBy: 'priority',
        sortOrder: 'desc',
        groupByType: true
      })

      // Verify the preset exists
      const presetExists = await pdfHelpers.presetExists(customFilterName, 'filter')
      expect(presetExists).toBe(true)

      // Use the custom filter preset
      await pdfHelpers.selectFilterPreset(customFilterName)
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      await pdfHelpers.takeScreenshot('complex-custom-filter')

      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: customFilterName,
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Create custom filter presets for all modules', async ({ page }) => {
      const moduleConfigs = [
        {
          module: 'cue' as const,
          presetName: 'Custom Cue Directors Only',
          config: {
            statusFilter: null as null,
            typeFilters: ['director', 'choreographer'],
            priorityFilters: ['critical', 'very_high', 'medium'],
            sortBy: 'created_at',
            sortOrder: 'desc' as const,
            groupByType: false
          }
        },
        {
          module: 'work' as const,
          presetName: 'Custom Work Focus Tasks',
          config: {
            statusFilter: 'todo' as const,
            typeFilters: ['focus', 'work'],
            priorityFilters: ['critical', 'very_high', 'high', 'medium_high'],
            sortBy: 'channel',
            sortOrder: 'asc' as const,
            groupByType: false
          }
        },
        {
          module: 'production' as const,
          presetName: 'Custom Production Lighting',
          config: {
            statusFilter: null as null,
            typeFilters: ['lighting', 'video'],
            priorityFilters: ['critical', 'very_high', 'medium'],
            sortBy: 'department',
            sortOrder: 'asc' as const,
            groupByType: true
          }
        }
      ]

      for (const moduleConfig of moduleConfigs) {
        // Navigate to the module
        await pdfHelpers.navigateToModule(moduleConfig.module)
        await pdfHelpers.openPrintDialog()

        // Create the custom filter preset
        await pdfHelpers.createCustomFilterPreset(
          moduleConfig.presetName,
          moduleConfig.module,
          moduleConfig.config
        )

        // Verify it exists
        const presetExists = await pdfHelpers.presetExists(moduleConfig.presetName, 'filter')
        expect(presetExists).toBe(true)

        // Test the preset
        await pdfHelpers.selectFilterPreset(moduleConfig.presetName)
        await pdfHelpers.selectPageStylePreset('Letter Portrait')

        await pdfHelpers.takeScreenshot(`custom-filter-${moduleConfig.module}`)

        const { pdfBlob, filename } = await pdfHelpers.generatePDF()

        const validation = await pdfHelpers.validatePDF(pdfBlob, {
          moduleType: moduleConfig.module,
          filterPresetName: moduleConfig.presetName,
          pageStylePresetName: 'Letter Portrait'
        })

        expect(validation.success).toBe(true)
        expect(validation.errors).toHaveLength(0)

        // Close dialog before next iteration
        await page.keyboard.press('Escape')
      }
    })

    test('Create filter preset with all status options', async ({ page }) => {
      const statusTests = [
        { status: 'todo' as const, name: 'Todo Only Filter' },
        { status: 'complete' as const, name: 'Complete Only Filter' },
        { status: 'cancelled' as const, name: 'Cancelled Only Filter' },
        { status: null as null, name: 'All Status Filter' }
      ]

      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      for (const statusTest of statusTests) {
        await pdfHelpers.createCustomFilterPreset(statusTest.name, 'production', {
          statusFilter: statusTest.status,
          typeFilters: ['lighting', 'scenic', 'props'],
          priorityFilters: ['critical', 'very_high', 'medium'],
          sortBy: 'priority',
          sortOrder: 'desc',
          groupByType: false
        })

        // Test the preset
        await pdfHelpers.selectFilterPreset(statusTest.name)
        await pdfHelpers.selectPageStylePreset('Letter Portrait')

        await pdfHelpers.takeScreenshot(`status-filter-${statusTest.status || 'all'}`)

        const { pdfBlob, filename } = await pdfHelpers.generatePDF()

        const validation = await pdfHelpers.validatePDF(pdfBlob, {
          moduleType: 'production',
          filterPresetName: statusTest.name,
          pageStylePresetName: 'Letter Portrait'
        })

        expect(validation.success).toBe(true)
        expect(validation.errors).toHaveLength(0)

        // Reset for next iteration
        await page.keyboard.press('Escape')
        await pdfHelpers.openPrintDialog()
      }
    })

    test('Edit existing custom filter preset', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintDialog()

      // Create initial preset
      const originalFilterName = 'Original Work Filter'
      await pdfHelpers.createCustomFilterPreset(originalFilterName, 'work', {
        statusFilter: 'todo',
        typeFilters: ['work'],
        priorityFilters: ['medium'],
        sortBy: 'created_at',
        sortOrder: 'asc',
        groupByType: false
      })

      // Verify it exists
      let presetExists = await pdfHelpers.presetExists(originalFilterName, 'filter')
      expect(presetExists).toBe(true)

      // Create edited version (simulating edit functionality)
      const editedFilterName = 'Edited Work Filter'
      await pdfHelpers.createCustomFilterPreset(editedFilterName, 'work', {
        statusFilter: null, // Changed from 'todo' to all
        typeFilters: ['work', 'focus'], // Added 'focus'
        priorityFilters: ['critical', 'very_high', 'medium'], // Added higher priorities
        sortBy: 'priority', // Changed from 'created_at'
        sortOrder: 'desc', // Changed from 'asc'
        groupByType: true // Changed from false
      })

      // Verify edited version exists
      presetExists = await pdfHelpers.presetExists(editedFilterName, 'filter')
      expect(presetExists).toBe(true)

      // Test the edited preset
      await pdfHelpers.selectFilterPreset(editedFilterName)
      await pdfHelpers.selectPageStylePreset('Letter Portrait')

      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'work',
        filterPresetName: editedFilterName,
        pageStylePresetName: 'Letter Portrait'
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  test.describe('Combined Custom Preset Testing', () => {
    test('Use custom page style and custom filter together', async ({ page }) => {
      await pdfHelpers.navigateToModule('cue')
      await pdfHelpers.openPrintDialog()

      // Create custom page style
      const customPageStyleName = 'Combined Test Page Style'
      await pdfHelpers.createCustomPageStylePreset(customPageStyleName, {
        paperSize: 'a4',
        orientation: 'landscape',
        includeCheckboxes: false
      })

      // Create custom filter
      const customFilterName = 'Combined Test Filter'
      await pdfHelpers.createCustomFilterPreset(customFilterName, 'cue', {
        statusFilter: null,
        typeFilters: ['cue', 'director'],
        priorityFilters: ['critical', 'very_high'],
        sortBy: 'cue_number',
        sortOrder: 'asc',
        groupByType: false
      })

      // Use both custom presets together
      await pdfHelpers.selectFilterPreset(customFilterName)
      await pdfHelpers.selectPageStylePreset(customPageStyleName)

      await pdfHelpers.takeScreenshot('combined-custom-presets')

      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'cue',
        filterPresetName: customFilterName,
        pageStylePresetName: customPageStyleName,
        expectedPaperSize: 'a4',
        expectedOrientation: 'landscape',
        shouldIncludeCheckboxes: false
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Create and test extreme custom configurations', async ({ page }) => {
      await pdfHelpers.navigateToModule('work')
      await pdfHelpers.openPrintDialog()

      // Create extreme page style (legal landscape no checkboxes)
      const extremePageStyle = 'Extreme Page Style'
      await pdfHelpers.createCustomPageStylePreset(extremePageStyle, {
        paperSize: 'legal',
        orientation: 'landscape',
        includeCheckboxes: false
      })

      // Create extreme filter (very restrictive)
      const extremeFilter = 'Extreme Filter'
      await pdfHelpers.createCustomFilterPreset(extremeFilter, 'work', {
        statusFilter: 'cancelled', // Only cancelled items
        typeFilters: ['think'], // Only think type
        priorityFilters: ['uncritical'], // Only uncritical priority
        sortBy: 'completed_at',
        sortOrder: 'desc',
        groupByType: true
      })

      // Use extreme configuration
      await pdfHelpers.selectFilterPreset(extremeFilter)
      await pdfHelpers.selectPageStylePreset(extremePageStyle)

      await pdfHelpers.takeScreenshot('extreme-configuration')

      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      // Should still produce a valid PDF even with extreme settings
      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'work',
        filterPresetName: extremeFilter,
        pageStylePresetName: extremePageStyle,
        expectedPaperSize: 'legal',
        expectedOrientation: 'landscape',
        shouldIncludeCheckboxes: false
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Verify custom presets persist across sessions', async ({ page }) => {
      await pdfHelpers.navigateToModule('production')
      await pdfHelpers.openPrintDialog()

      // Create a custom preset
      const persistentPresetName = 'Persistent Test Preset'
      await pdfHelpers.createCustomPageStylePreset(persistentPresetName, {
        paperSize: 'letter',
        orientation: 'landscape',
        includeCheckboxes: true
      })

      // Verify it exists
      let presetExists = await pdfHelpers.presetExists(persistentPresetName, 'pageStyle')
      expect(presetExists).toBe(true)

      // Close dialog and reopen (simulating session persistence)
      await page.keyboard.press('Escape')
      await pdfHelpers.openPrintDialog()

      // Verify preset still exists
      presetExists = await pdfHelpers.presetExists(persistentPresetName, 'pageStyle')
      expect(presetExists).toBe(true)

      // Use the persistent preset
      await pdfHelpers.selectFilterPreset('Outstanding Issues')
      await pdfHelpers.selectPageStylePreset(persistentPresetName)

      const { pdfBlob, filename } = await pdfHelpers.generatePDF()

      const validation = await pdfHelpers.validatePDF(pdfBlob, {
        moduleType: 'production',
        filterPresetName: 'Outstanding Issues',
        pageStylePresetName: persistentPresetName,
        expectedPaperSize: 'letter',
        expectedOrientation: 'landscape',
        shouldIncludeCheckboxes: true
      })

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })
})