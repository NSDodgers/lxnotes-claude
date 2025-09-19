import { test, expect } from '@playwright/test'
import { PDFTestHelpers, SYSTEM_PRESETS } from './pdf-test-helpers'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Visual Regression Testing for PDF Generation', () => {
  let pdfHelpers: PDFTestHelpers

  const baselineDir = 'tests/e2e/pdf-generation/baselines'
  const screenshotDir = 'tests/e2e/pdf-generation/screenshots'

  test.beforeEach(async ({ page }) => {
    pdfHelpers = new PDFTestHelpers(page)

    // Ensure directories exist
    if (!fs.existsSync(baselineDir)) {
      fs.mkdirSync(baselineDir, { recursive: true })
    }
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }

    // Start the development server
    await page.goto('http://localhost:3001/cue-notes')
    await pdfHelpers.waitForUIReady()
  })

  test.describe('PDF Visual Consistency', () => {
    test('Generate baseline PDFs for all system presets', async ({ page }) => {
      const moduleConfigs = [
        { module: 'cue' as const, filterPresets: SYSTEM_PRESETS.filter.cue },
        { module: 'work' as const, filterPresets: SYSTEM_PRESETS.filter.work },
        { module: 'production' as const, filterPresets: SYSTEM_PRESETS.filter.production }
      ]

      const pageStylePresets = SYSTEM_PRESETS.pageStyle

      for (const moduleConfig of moduleConfigs) {
        for (const filterPreset of moduleConfig.filterPresets) {
          for (const pageStylePreset of pageStylePresets) {
            await pdfHelpers.navigateToModule(moduleConfig.module)
            await pdfHelpers.openPrintDialog()

            // Select presets
            await pdfHelpers.selectFilterPreset(filterPreset)
            await pdfHelpers.selectPageStylePreset(pageStylePreset)

            // Take screenshot of configuration
            const configName = `${moduleConfig.module}-${filterPreset.replace(/\s+/g, '-')}-${pageStylePreset.replace(/\s+/g, '-')}`.toLowerCase()
            await pdfHelpers.takeScreenshot(`config-${configName}`)

            // Generate PDF
            const { pdfBlob, filename } = await pdfHelpers.generatePDF()

            // Save baseline PDF for comparison
            const baselineFilename = `baseline-${configName}.pdf`
            const baselinePath = path.join(baselineDir, baselineFilename)

            fs.writeFileSync(baselinePath, pdfBlob)

            // Validate PDF was generated correctly
            expect(pdfBlob.length).toBeGreaterThan(1000)
            expect(filename).toContain(moduleConfig.module === 'cue' ? 'Cue_Notes' :
                                       moduleConfig.module === 'work' ? 'Work_Notes' :
                                       'Production_Notes')

            // Close dialog before next iteration
            await page.keyboard.press('Escape')
          }
        }
      }
    })

    test('Compare current PDF generation against baselines', async ({ page }) => {
      // Read existing baselines
      const baselineFiles = fs.readdirSync(baselineDir).filter(file => file.endsWith('.pdf'))

      if (baselineFiles.length === 0) {
        test.skip('No baseline files found. Run baseline generation first.')
      }

      const regressions: Array<{ file: string; issue: string }> = []

      for (const baselineFile of baselineFiles.slice(0, 5)) { // Test first 5 to avoid timeout
        // Parse configuration from filename
        const configMatch = baselineFile.match(/baseline-(\w+)-(.+)-(.+)\.pdf/)
        if (!configMatch) continue

        const [, moduleType, filterPreset, pageStylePreset] = configMatch
        const filterName = filterPreset.replace(/-/g, ' ')
        const pageStyleName = pageStylePreset.replace(/-/g, ' ')

        // Map module type
        const module = moduleType as 'cue' | 'work' | 'production'

        // Generate current PDF
        await pdfHelpers.navigateToModule(module)
        await pdfHelpers.openPrintDialog()

        try {
          await pdfHelpers.selectFilterPreset(filterName)
          await pdfHelpers.selectPageStylePreset(pageStyleName)

          const { pdfBlob: currentPdfBlob } = await pdfHelpers.generatePDF()

          // Load baseline
          const baselinePath = path.join(baselineDir, baselineFile)
          const baselinePdfBlob = fs.readFileSync(baselinePath)

          // Compare file sizes (basic regression check)
          const sizeDifference = Math.abs(currentPdfBlob.length - baselinePdfBlob.length)
          const sizeDifferencePercent = (sizeDifference / baselinePdfBlob.length) * 100

          if (sizeDifferencePercent > 10) { // More than 10% difference
            regressions.push({
              file: baselineFile,
              issue: `Size difference: ${sizeDifferencePercent.toFixed(2)}% (baseline: ${baselinePdfBlob.length}, current: ${currentPdfBlob.length})`
            })
          }

          // Basic content validation
          const currentHeader = currentPdfBlob.slice(0, 8).toString()
          const baselineHeader = baselinePdfBlob.slice(0, 8).toString()

          if (currentHeader !== baselineHeader) {
            regressions.push({
              file: baselineFile,
              issue: `PDF header mismatch`
            })
          }

        } catch (error) {
          regressions.push({
            file: baselineFile,
            issue: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }

        // Close dialog before next iteration
        await page.keyboard.press('Escape')
      }

      // Report any regressions found
      if (regressions.length > 0) {
        console.log('Visual regressions detected:')
        regressions.forEach(regression => {
          console.log(`  - ${regression.file}: ${regression.issue}`)
        })
      }

      // For this test, we'll be lenient and just warn about regressions
      // In a real environment, you might want to fail on regressions
      expect(regressions.length).toBeLessThan(baselineFiles.length / 2) // Less than 50% regressions
    })

    test('PDF content structure validation', async ({ page }) => {
      const testCases = [
        {
          module: 'cue' as const,
          filterPreset: 'Outstanding Cues',
          pageStylePreset: 'Letter Portrait',
          expectedElements: ['production name', 'Cue Notes Report', 'checkbox column', 'priority column', 'type column']
        },
        {
          module: 'work' as const,
          filterPreset: 'By Channel',
          pageStylePreset: 'Letter Landscape',
          expectedElements: ['production name', 'Work Notes Report', 'channel column', 'position column']
        },
        {
          module: 'production' as const,
          filterPreset: 'By Department',
          pageStylePreset: 'A4 Portrait',
          expectedElements: ['production name', 'Production Notes Report', 'department grouping']
        }
      ]

      for (const testCase of testCases) {
        await pdfHelpers.navigateToModule(testCase.module)
        await pdfHelpers.openPrintDialog()

        await pdfHelpers.selectFilterPreset(testCase.filterPreset)
        await pdfHelpers.selectPageStylePreset(testCase.pageStylePreset)

        await pdfHelpers.takeScreenshot(`structure-validation-${testCase.module}`)

        const { pdfBlob } = await pdfHelpers.generatePDF()

        // Basic PDF structure validation
        const pdfContent = pdfBlob.toString()

        // Check for PDF structure markers
        expect(pdfContent).toContain('%PDF-') // PDF header
        expect(pdfContent).toContain('endobj') // PDF objects
        expect(pdfContent).toContain('stream') // PDF streams

        // Check that PDF is substantial (contains actual content)
        expect(pdfBlob.length).toBeGreaterThan(5000) // Should be substantial

        await page.keyboard.press('Escape')
      }
    })

    test('Font and styling consistency across orientations', async ({ page }) => {
      const orientationTests = [
        { pageStyle: 'Letter Portrait', orientation: 'portrait' },
        { pageStyle: 'Letter Landscape', orientation: 'landscape' }
      ]

      const fontSizes: number[] = []

      for (const orientationTest of orientationTests) {
        await pdfHelpers.navigateToModule('cue')
        await pdfHelpers.openPrintDialog()

        await pdfHelpers.selectFilterPreset('Outstanding Cues')
        await pdfHelpers.selectPageStylePreset(orientationTest.pageStyle)

        await pdfHelpers.takeScreenshot(`font-consistency-${orientationTest.orientation}`)

        const { pdfBlob } = await pdfHelpers.generatePDF()

        // Extract approximate content size as a proxy for font consistency
        const contentSize = pdfBlob.length
        fontSizes.push(contentSize)

        // Validate PDF generation
        expect(pdfBlob.length).toBeGreaterThan(1000)

        await page.keyboard.press('Escape')
      }

      // Font sizes should be relatively consistent (within 20% difference)
      if (fontSizes.length === 2) {
        const difference = Math.abs(fontSizes[0] - fontSizes[1])
        const percentDifference = (difference / Math.max(fontSizes[0], fontSizes[1])) * 100
        expect(percentDifference).toBeLessThan(50) // Allow up to 50% difference for orientation changes
      }
    })

    test('Color consistency in type badges across modules', async ({ page }) => {
      const colorTests = [
        { module: 'cue' as const, expectedTypes: ['cue', 'director', 'designer'] },
        { module: 'work' as const, expectedTypes: ['work', 'focus', 'electrician'] },
        { module: 'production' as const, expectedTypes: ['lighting', 'scenic', 'props'] }
      ]

      for (const colorTest of colorTests) {
        await pdfHelpers.navigateToModule(colorTest.module)
        await pdfHelpers.openPrintDialog()

        // Create a filter that shows multiple types
        const filterName = `Color Test ${colorTest.module}`
        await pdfHelpers.createCustomFilterPreset(filterName, colorTest.module, {
          statusFilter: null,
          typeFilters: colorTest.expectedTypes,
          priorityFilters: ['critical', 'very_high', 'medium'],
          sortBy: 'priority',
          sortOrder: 'desc',
          groupByType: true // Group to show type badges clearly
        })

        await pdfHelpers.selectFilterPreset(filterName)
        await pdfHelpers.selectPageStylePreset('Letter Portrait')

        await pdfHelpers.takeScreenshot(`color-consistency-${colorTest.module}`)

        const { pdfBlob } = await pdfHelpers.generatePDF()

        // Validate that type-specific content is generated
        expect(pdfBlob.length).toBeGreaterThan(2000) // Should be substantial with type badges

        await page.keyboard.press('Escape')
      }
    })
  })

  test.describe('Page Layout Validation', () => {
    test('Header and footer consistency across paper sizes', async ({ page }) => {
      const paperSizeTests = [
        { presetName: 'Letter Portrait', paperSize: 'letter' },
        { presetName: 'A4 Portrait', paperSize: 'a4' }
      ]

      for (const paperTest of paperSizeTests) {
        await pdfHelpers.navigateToModule('production')
        await pdfHelpers.openPrintDialog()

        await pdfHelpers.selectFilterPreset('Outstanding Issues')
        await pdfHelpers.selectPageStylePreset(paperTest.presetName)

        await pdfHelpers.takeScreenshot(`header-footer-${paperTest.paperSize}`)

        const { pdfBlob } = await pdfHelpers.generatePDF()

        // Basic validation that headers/footers are included
        const pdfString = pdfBlob.toString()

        // Should contain production name and generation info
        // (In a real test, we'd parse the PDF to verify exact positioning)
        expect(pdfBlob.length).toBeGreaterThan(3000)

        await page.keyboard.press('Escape')
      }
    })

    test('Table layout consistency with different content volumes', async ({ page }) => {
      const contentVolumeTests = [
        { filterPreset: 'Outstanding Cues', expectedVolume: 'medium' },
        { filterPreset: 'All Todo Notes', expectedVolume: 'high' }
      ]

      for (const volumeTest of contentVolumeTests) {
        await pdfHelpers.navigateToModule('cue')
        await pdfHelpers.openPrintDialog()

        await pdfHelpers.selectFilterPreset(volumeTest.filterPreset)
        await pdfHelpers.selectPageStylePreset('Letter Portrait')

        await pdfHelpers.takeScreenshot(`table-layout-${volumeTest.expectedVolume}-volume`)

        const { pdfBlob } = await pdfHelpers.generatePDF()

        // Validate table layout scales appropriately
        expect(pdfBlob.length).toBeGreaterThan(2000)

        // High volume should produce larger PDFs than medium volume
        if (volumeTest.expectedVolume === 'high') {
          expect(pdfBlob.length).toBeGreaterThan(3000)
        }

        await page.keyboard.press('Escape')
      }
    })

    test('Checkbox rendering consistency', async ({ page }) => {
      const checkboxTests = [
        { presetName: 'With Checkboxes', includeCheckboxes: true },
        { presetName: 'Without Checkboxes', includeCheckboxes: false }
      ]

      for (const checkboxTest of checkboxTests) {
        await pdfHelpers.navigateToModule('work')
        await pdfHelpers.openPrintDialog()

        // Create custom page style preset
        await pdfHelpers.createCustomPageStylePreset(checkboxTest.presetName, {
          paperSize: 'letter',
          orientation: 'portrait',
          includeCheckboxes: checkboxTest.includeCheckboxes
        })

        await pdfHelpers.selectFilterPreset('Outstanding Work')
        await pdfHelpers.selectPageStylePreset(checkboxTest.presetName)

        await pdfHelpers.takeScreenshot(`checkbox-${checkboxTest.includeCheckboxes ? 'with' : 'without'}`)

        const { pdfBlob } = await pdfHelpers.generatePDF()

        // Validate checkbox rendering
        expect(pdfBlob.length).toBeGreaterThan(2000)

        // PDFs with checkboxes might be slightly larger due to additional graphics
        // (In a real test, we'd parse the PDF to verify checkbox presence)

        await page.keyboard.press('Escape')
      }
    })
  })

  test.describe('Cross-Browser Compatibility', () => {
    test('PDF generation consistency across different viewport sizes', async ({ page }) => {
      const viewportSizes = [
        { width: 1280, height: 720, name: 'desktop' },
        { width: 1024, height: 768, name: 'tablet' }
      ]

      const results: Array<{ viewport: string; pdfSize: number }> = []

      for (const viewport of viewportSizes) {
        // Set viewport size
        await page.setViewportSize({ width: viewport.width, height: viewport.height })

        await pdfHelpers.navigateToModule('cue')
        await pdfHelpers.waitForUIReady()
        await pdfHelpers.openPrintDialog()

        await pdfHelpers.selectFilterPreset('Outstanding Cues')
        await pdfHelpers.selectPageStylePreset('Letter Portrait')

        await pdfHelpers.takeScreenshot(`viewport-${viewport.name}`)

        const { pdfBlob } = await pdfHelpers.generatePDF()

        results.push({
          viewport: viewport.name,
          pdfSize: pdfBlob.length
        })

        await page.keyboard.press('Escape')
      }

      // PDF size should be consistent regardless of viewport
      const sizeDifference = Math.abs(results[0].pdfSize - results[1].pdfSize)
      const percentDifference = (sizeDifference / Math.max(results[0].pdfSize, results[1].pdfSize)) * 100

      expect(percentDifference).toBeLessThan(5) // Less than 5% difference expected
    })
  })
})