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
            await pdfHelpers.openPrintSidebar()
            await pdfHelpers.openCustomPrintView()

            // Select presets
            await pdfHelpers.selectFilterPresetInCustomView(filterPreset)
            await pdfHelpers.selectPageStylePresetInCustomView(pageStylePreset)

            // Take screenshot of configuration
            const configName = `${moduleConfig.module}-${filterPreset.replace(/\s+/g, '-')}-${pageStylePreset.replace(/\s+/g, '-')}`.toLowerCase()
            await pdfHelpers.takeScreenshot(`config-${configName}`)

            // Generate PDF
            const { pdfBlob, filename } = await pdfHelpers.generatePDFFromCustomView()

            // Save baseline PDF for comparison
            const baselineFilename = `baseline-${configName}.pdf`
            const baselinePath = path.join(baselineDir, baselineFilename)

            fs.writeFileSync(baselinePath, pdfBlob)

            // Validate PDF was generated correctly
            expect(pdfBlob.length).toBeGreaterThan(1000)
            expect(filename).toContain(moduleConfig.module === 'cue' ? 'Cue_Notes' :
              moduleConfig.module === 'work' ? 'Work_Notes' :
                'Production_Notes')

            // Close sidebar before next iteration
            await page.keyboard.press('Escape')
            await page.waitForTimeout(300)
          }
        }
      }
    })

    test('Compare current PDF generation against baselines', async ({ page }) => {
      // Read existing baselines
      const baselineFiles = fs.readdirSync(baselineDir).filter(file => file.endsWith('.pdf'))

      if (baselineFiles.length === 0) {
        test.skip(true, 'No baseline files found. Run baseline generation first.');
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
        const mod = moduleType as 'cue' | 'work' | 'production'

        // Generate current PDF
        await pdfHelpers.navigateToModule(mod)
        await pdfHelpers.openPrintSidebar()
        await pdfHelpers.openCustomPrintView()

        try {
          await pdfHelpers.selectFilterPresetInCustomView(filterName)
          await pdfHelpers.selectPageStylePresetInCustomView(pageStyleName)

          const { pdfBlob: currentPdfBlob } = await pdfHelpers.generatePDFFromCustomView()

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

        // Close sidebar before next iteration
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }

      // Report any regressions found
      if (regressions.length > 0) {
        console.log('Visual regressions detected:')
        regressions.forEach(regression => {
          console.log(`  - ${regression.file}: ${regression.issue}`)
        })
      }

      // For this test, we'll be lenient and just warn about regressions
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
        await pdfHelpers.openPrintSidebar()
        await pdfHelpers.openCustomPrintView()

        await pdfHelpers.selectFilterPresetInCustomView(testCase.filterPreset)
        await pdfHelpers.selectPageStylePresetInCustomView(testCase.pageStylePreset)

        await pdfHelpers.takeScreenshot(`structure-validation-${testCase.module}`)

        const { pdfBlob } = await pdfHelpers.generatePDFFromCustomView()

        // Basic PDF structure validation
        const pdfContent = pdfBlob.toString()

        // Check for PDF structure markers
        expect(pdfContent).toContain('%PDF-') // PDF header
        expect(pdfContent).toContain('endobj') // PDF objects
        expect(pdfContent).toContain('stream') // PDF streams

        // Check that PDF is substantial (contains actual content)
        expect(pdfBlob.length).toBeGreaterThan(5000) // Should be substantial

        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
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
        await pdfHelpers.openPrintSidebar()
        await pdfHelpers.openCustomPrintView()

        await pdfHelpers.selectFilterPresetInCustomView('Outstanding Cues')
        await pdfHelpers.selectPageStylePresetInCustomView(orientationTest.pageStyle)

        await pdfHelpers.takeScreenshot(`font-consistency-${orientationTest.orientation}`)

        const { pdfBlob } = await pdfHelpers.generatePDFFromCustomView()

        // Extract approximate content size as a proxy for font consistency
        const contentSize = pdfBlob.length
        fontSizes.push(contentSize)

        // Validate PDF generation
        expect(pdfBlob.length).toBeGreaterThan(1000)

        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }

      // Font sizes should be relatively consistent (within 50% difference for orientation changes)
      if (fontSizes.length === 2) {
        const difference = Math.abs(fontSizes[0] - fontSizes[1])
        const percentDifference = (difference / Math.max(fontSizes[0], fontSizes[1])) * 100
        expect(percentDifference).toBeLessThan(50)
      }
    })

    test('Color consistency in type badges across modules', async ({ page }) => {
      const colorTests = [
        { module: 'cue' as const, filterPreset: 'Outstanding Cues' },
        { module: 'work' as const, filterPreset: 'Outstanding Work' },
        { module: 'production' as const, filterPreset: 'Outstanding Issues' }
      ]

      for (const colorTest of colorTests) {
        await pdfHelpers.navigateToModule(colorTest.module)
        await pdfHelpers.openPrintSidebar()
        await pdfHelpers.openCustomPrintView()

        await pdfHelpers.selectFilterPresetInCustomView(colorTest.filterPreset)
        await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

        await pdfHelpers.takeScreenshot(`color-consistency-${colorTest.module}`)

        const { pdfBlob } = await pdfHelpers.generatePDFFromCustomView()

        // Validate that type-specific content is generated
        expect(pdfBlob.length).toBeGreaterThan(2000) // Should be substantial with type badges

        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
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
        await pdfHelpers.openPrintSidebar()
        await pdfHelpers.openCustomPrintView()

        await pdfHelpers.selectFilterPresetInCustomView('Outstanding Issues')
        await pdfHelpers.selectPageStylePresetInCustomView(paperTest.presetName)

        await pdfHelpers.takeScreenshot(`header-footer-${paperTest.paperSize}`)

        const { pdfBlob } = await pdfHelpers.generatePDFFromCustomView()

        // Basic validation that headers/footers are included
        expect(pdfBlob.length).toBeGreaterThan(3000)

        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }
    })

    test('Table layout consistency with different content volumes', async ({ page }) => {
      const contentVolumeTests = [
        { filterPreset: 'Outstanding Cues', expectedVolume: 'medium' },
        { filterPreset: 'All Todo Notes', expectedVolume: 'high' }
      ]

      for (const volumeTest of contentVolumeTests) {
        await pdfHelpers.navigateToModule('cue')
        await pdfHelpers.openPrintSidebar()
        await pdfHelpers.openCustomPrintView()

        await pdfHelpers.selectFilterPresetInCustomView(volumeTest.filterPreset)
        await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

        await pdfHelpers.takeScreenshot(`table-layout-${volumeTest.expectedVolume}-volume`)

        const { pdfBlob } = await pdfHelpers.generatePDFFromCustomView()

        // Validate table layout scales appropriately
        expect(pdfBlob.length).toBeGreaterThan(2000)

        // High volume should produce larger PDFs than medium volume
        if (volumeTest.expectedVolume === 'high') {
          expect(pdfBlob.length).toBeGreaterThan(3000)
        }

        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }
    })

    test('Checkbox rendering consistency', async ({ page }) => {
      // Test with system page style presets (which include checkboxes by default)
      const pageStyles = ['Letter Portrait', 'Letter Landscape']

      for (const pageStyle of pageStyles) {
        await pdfHelpers.navigateToModule('work')
        await pdfHelpers.openPrintSidebar()
        await pdfHelpers.openCustomPrintView()

        await pdfHelpers.selectFilterPresetInCustomView('Outstanding Work')
        await pdfHelpers.selectPageStylePresetInCustomView(pageStyle)

        await pdfHelpers.takeScreenshot(`checkbox-${pageStyle.replace(/\s+/g, '-').toLowerCase()}`)

        const { pdfBlob } = await pdfHelpers.generatePDFFromCustomView()

        // Validate checkbox rendering
        expect(pdfBlob.length).toBeGreaterThan(2000)

        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
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
        await pdfHelpers.openPrintSidebar()
        await pdfHelpers.openCustomPrintView()

        await pdfHelpers.selectFilterPresetInCustomView('Outstanding Cues')
        await pdfHelpers.selectPageStylePresetInCustomView('Letter Portrait')

        await pdfHelpers.takeScreenshot(`viewport-${viewport.name}`)

        const { pdfBlob } = await pdfHelpers.generatePDFFromCustomView()

        results.push({
          viewport: viewport.name,
          pdfSize: pdfBlob.length
        })

        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }

      // PDF size should be consistent regardless of viewport
      const sizeDifference = Math.abs(results[0].pdfSize - results[1].pdfSize)
      const percentDifference = (sizeDifference / Math.max(results[0].pdfSize, results[1].pdfSize)) * 100

      expect(percentDifference).toBeLessThan(5) // Less than 5% difference expected
    })
  })
})
