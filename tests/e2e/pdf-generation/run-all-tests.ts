#!/usr/bin/env node

/**
 * Complete PDF Generation Test Suite Runner
 *
 * This script runs all PDF generation tests in a specific order to ensure
 * comprehensive validation of the preset systems and PDF generation functionality.
 *
 * Usage:
 *   npm run test:pdf-generation
 *   or
 *   npx ts-node tests/e2e/pdf-generation/run-all-tests.ts
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// Test configuration
const TEST_CONFIG = {
  testDir: 'tests/e2e/pdf-generation',
  outputDir: 'tests/e2e/pdf-generation/test-results',
  screenshotDir: 'tests/e2e/pdf-generation/screenshots',
  baselineDir: 'tests/e2e/pdf-generation/baselines',
  playwrightConfig: 'tests/e2e/pdf-generation/playwright.config.ts'
}

// Test execution order (dependencies and logical flow)
const TEST_EXECUTION_ORDER = [
  {
    name: 'PDF Test Helpers Validation',
    file: 'pdf-test-helpers.spec.ts',
    description: 'Validate helper functions and utilities'
  },
  {
    name: 'Page Style Presets',
    file: 'page-style-presets.spec.ts',
    description: 'Test all page style configurations and paper sizes'
  },
  {
    name: 'Filter/Sort Presets',
    file: 'filter-sort-presets.spec.ts',
    description: 'Test content filtering and sorting functionality'
  },
  {
    name: 'Module-Specific Features',
    file: 'module-specific.spec.ts',
    description: 'Test unique features for each module type'
  },
  {
    name: 'Custom Presets',
    file: 'custom-presets.spec.ts',
    description: 'Test custom preset creation and editing'
  },
  {
    name: 'Visual Regression',
    file: 'visual-regression.spec.ts',
    description: 'Test visual consistency and regression detection'
  },
  {
    name: 'Error Handling',
    file: 'error-handling.spec.ts',
    description: 'Test edge cases and error scenarios'
  }
]

class TestRunner {
  private results: Array<{
    testSuite: string
    status: 'passed' | 'failed' | 'skipped'
    duration: number
    errors?: string[]
  }> = []

  constructor() {
    this.ensureDirectories()
  }

  private ensureDirectories(): void {
    const dirs = [
      TEST_CONFIG.outputDir,
      TEST_CONFIG.screenshotDir,
      TEST_CONFIG.baselineDir,
      path.join(TEST_CONFIG.outputDir, 'individual-results')
    ]

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`✓ Created directory: ${dir}`)
      }
    })
  }

  private async runSingleTestSuite(testFile: string, testName: string): Promise<boolean> {
    console.log(`\n🧪 Running: ${testName}`)
    console.log(`   File: ${testFile}`)
    console.log(`   Time: ${new Date().toLocaleTimeString()}`)

    const startTime = Date.now()

    try {
      const command = `npx playwright test "${testFile}" --config="${TEST_CONFIG.playwrightConfig}" --reporter=json`

      const output = execSync(command, {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      })

      const duration = Date.now() - startTime

      // Save individual test results
      const resultFile = path.join(TEST_CONFIG.outputDir, 'individual-results', `${testFile.replace('.spec.ts', '')}-result.json`)
      fs.writeFileSync(resultFile, output)

      this.results.push({
        testSuite: testName,
        status: 'passed',
        duration
      })

      console.log(`   ✅ PASSED (${duration}ms)`)
      return true

    } catch (error: any) {
      const duration = Date.now() - startTime
      const errorMessage = error.message || 'Unknown error'

      this.results.push({
        testSuite: testName,
        status: 'failed',
        duration,
        errors: [errorMessage]
      })

      console.log(`   ❌ FAILED (${duration}ms)`)
      console.log(`   Error: ${errorMessage}`)
      return false
    }
  }

  private generateSummaryReport(): void {
    const summary = {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'passed').length,
      failed: this.results.filter(r => r.status === 'failed').length,
      skipped: this.results.filter(r => r.status === 'skipped').length,
      totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
      results: this.results,
      generatedAt: new Date().toISOString()
    }

    // Save summary
    const summaryFile = path.join(TEST_CONFIG.outputDir, 'test-suite-summary.json')
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))

    // Generate human-readable report
    const reportLines = [
      '='.repeat(80),
      'PDF GENERATION TEST SUITE SUMMARY',
      '='.repeat(80),
      '',
      `Total Test Suites: ${summary.totalTests}`,
      `✅ Passed: ${summary.passed}`,
      `❌ Failed: ${summary.failed}`,
      `⏭️  Skipped: ${summary.skipped}`,
      `⏱️  Total Duration: ${(summary.totalDuration / 1000).toFixed(2)}s`,
      '',
      'DETAILED RESULTS:',
      '-'.repeat(40)
    ]

    this.results.forEach(result => {
      const status = result.status === 'passed' ? '✅' :
                    result.status === 'failed' ? '❌' : '⏭️'
      const duration = `${(result.duration / 1000).toFixed(2)}s`

      reportLines.push(`${status} ${result.testSuite.padEnd(35)} ${duration.padStart(8)}`)

      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          reportLines.push(`    Error: ${error}`)
        })
      }
    })

    reportLines.push('')
    reportLines.push(`Report generated: ${new Date().toLocaleString()}`)
    reportLines.push('='.repeat(80))

    const reportContent = reportLines.join('\n')
    const reportFile = path.join(TEST_CONFIG.outputDir, 'test-suite-report.txt')
    fs.writeFileSync(reportFile, reportContent)

    console.log('\n' + reportContent)
  }

  public async runAllTests(): Promise<boolean> {
    console.log('🚀 Starting PDF Generation Test Suite')
    console.log(`📁 Output directory: ${TEST_CONFIG.outputDir}`)
    console.log(`📸 Screenshots: ${TEST_CONFIG.screenshotDir}`)
    console.log(`📄 Test files: ${TEST_EXECUTION_ORDER.length}`)

    const startTime = Date.now()
    let allPassed = true

    // Check if dev server is running
    try {
      execSync('curl -f http://localhost:3000 > /dev/null 2>&1', { stdio: 'ignore' })
      console.log('✅ Development server is running')
    } catch {
      console.log('⚠️  Starting development server...')
      // The playwright config will start the server automatically
    }

    // Run tests in order
    for (const test of TEST_EXECUTION_ORDER) {
      const testFilePath = path.join(TEST_CONFIG.testDir, test.file)

      if (!fs.existsSync(testFilePath)) {
        console.log(`⚠️  Test file not found: ${test.file} - SKIPPING`)
        this.results.push({
          testSuite: test.name,
          status: 'skipped',
          duration: 0,
          errors: ['Test file not found']
        })
        continue
      }

      const passed = await this.runSingleTestSuite(test.file, test.name)
      if (!passed) {
        allPassed = false
        // Continue running other tests even if one fails
      }

      // Brief pause between test suites
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const totalDuration = Date.now() - startTime

    console.log(`\n🏁 Test Suite Completed in ${(totalDuration / 1000).toFixed(2)}s`)

    this.generateSummaryReport()

    if (allPassed) {
      console.log('🎉 All tests passed!')
    } else {
      console.log('⚠️  Some tests failed. Check the detailed report above.')
    }

    return allPassed
  }
}

// Create test validation script
function createHelperValidationTest(): void {
  const helperTestPath = path.join(TEST_CONFIG.testDir, 'pdf-test-helpers.spec.ts')

  if (!fs.existsSync(helperTestPath)) {
    const helperTestContent = `
import { test, expect } from '@playwright/test'
import { PDFTestHelpers } from './pdf-test-helpers'

test.describe('PDF Test Helpers Validation', () => {
  test('Helper utilities are properly initialized', async ({ page }) => {
    const helpers = new PDFTestHelpers(page)

    // Basic connectivity test
    await page.goto('http://localhost:3000')
    await helpers.waitForUIReady()

    // Verify page loads
    await expect(page).toHaveTitle(/LX Notes/)

    console.log('✅ PDF Test Helpers validated successfully')
  })
})
`
    fs.writeFileSync(helperTestPath, helperTestContent)
    console.log('✓ Created helper validation test')
  }
}

// Main execution
async function main() {
  createHelperValidationTest()

  const runner = new TestRunner()
  const success = await runner.runAllTests()

  process.exit(success ? 0 : 1)
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { TestRunner, TEST_EXECUTION_ORDER }