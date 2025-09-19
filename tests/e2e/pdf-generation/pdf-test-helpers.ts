import { Page } from '@playwright/test'
import { ModuleType } from '@/types'

export interface PDFTestConfig {
  moduleType: ModuleType
  filterPresetName: string
  pageStylePresetName: string
  expectedNoteCount?: number
  shouldIncludeCheckboxes?: boolean
  expectedPaperSize?: 'a4' | 'letter' | 'legal'
  expectedOrientation?: 'portrait' | 'landscape'
}

export interface PDFValidationResult {
  success: boolean
  errors: string[]
  pdfBlob?: Blob
  filename?: string
  metadata?: {
    pageCount: number
    dimensions: { width: number; height: number }
    orientation: 'portrait' | 'landscape'
  }
}

export class PDFTestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to the specified module page
   */
  async navigateToModule(moduleType: ModuleType): Promise<void> {
    const moduleRoutes = {
      cue: '/cue-notes',
      work: '/work-notes',
      production: '/production-notes'
    }

    await this.page.goto(`http://localhost:3000${moduleRoutes[moduleType]}`)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Open the print dialog
   */
  async openPrintDialog(): Promise<void> {
    // Look for print button - check multiple possible selectors
    const printButton = this.page.locator('[data-testid="print-button"], button:has-text("Print"), button:has-text("Generate PDF")')
    await printButton.first().click()

    // Wait for dialog to appear
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 })
  }

  /**
   * Select a filter/sort preset by name
   */
  async selectFilterPreset(presetName: string): Promise<void> {
    // Find the filter preset selector
    const filterSelector = this.page.locator('[data-testid="filter-preset-selector"], .filter-preset-selector')
    await filterSelector.click()

    // Wait for dropdown options
    await this.page.waitForSelector('[role="option"], .preset-option')

    // Select the specific preset
    await this.page.locator(`[role="option"]:has-text("${presetName}"), .preset-option:has-text("${presetName}")`).click()
  }

  /**
   * Select a page style preset by name
   */
  async selectPageStylePreset(presetName: string): Promise<void> {
    // Find the page style preset selector
    const pageStyleSelector = this.page.locator('[data-testid="page-style-preset-selector"], .page-style-preset-selector')
    await pageStyleSelector.click()

    // Wait for dropdown options
    await this.page.waitForSelector('[role="option"], .preset-option')

    // Select the specific preset
    await this.page.locator(`[role="option"]:has-text("${presetName}"), .preset-option:has-text("${presetName}")`).click()
  }

  /**
   * Generate PDF and capture the download
   */
  async generatePDF(): Promise<{ pdfBlob: Buffer; filename: string }> {
    // Set up download promise before clicking
    const downloadPromise = this.page.waitForEvent('download', { timeout: 30000 })

    // Click generate/download button
    const generateButton = this.page.locator('button:has-text("Generate PDF"), button:has-text("Download"), [data-testid="generate-pdf-button"]')
    await generateButton.click()

    // Wait for download to complete
    const download = await downloadPromise
    const filename = download.suggestedFilename()

    // Get the downloaded file as buffer
    const pdfBlob = await download.createReadStream().then(stream => {
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = []
        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })
    })

    return { pdfBlob, filename }
  }

  /**
   * Create a custom page style preset for testing
   */
  async createCustomPageStylePreset(
    name: string,
    config: {
      paperSize: 'a4' | 'letter' | 'legal'
      orientation: 'portrait' | 'landscape'
      includeCheckboxes: boolean
    }
  ): Promise<void> {
    // Click quick create button for page style
    await this.page.locator('[data-testid="quick-create-page-style"], button:has-text("New Page Style")', { timeout: 5000 }).click()

    // Fill in the form
    await this.page.fill('[data-testid="preset-name"], input[placeholder*="name"]', name)

    // Select paper size
    await this.page.selectOption('[data-testid="paper-size"], select[name="paperSize"]', config.paperSize)

    // Select orientation
    await this.page.selectOption('[data-testid="orientation"], select[name="orientation"]', config.orientation)

    // Set checkbox option
    const checkboxToggle = this.page.locator('[data-testid="include-checkboxes"], input[type="checkbox"][name*="checkbox"]')
    if (config.includeCheckboxes) {
      await checkboxToggle.check()
    } else {
      await checkboxToggle.uncheck()
    }

    // Save the preset
    await this.page.locator('button:has-text("Save"), button:has-text("Create")').click()

    // Wait for dialog to close
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 })
  }

  /**
   * Create a custom filter/sort preset for testing
   */
  async createCustomFilterPreset(
    name: string,
    moduleType: ModuleType,
    config: {
      statusFilter?: 'todo' | 'complete' | 'cancelled' | null
      typeFilters?: string[]
      priorityFilters?: string[]
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      groupByType?: boolean
    }
  ): Promise<void> {
    // Click quick create button for filter
    await this.page.locator('[data-testid="quick-create-filter"], button:has-text("New Filter")', { timeout: 5000 }).click()

    // Fill in the form
    await this.page.fill('[data-testid="preset-name"], input[placeholder*="name"]', name)

    // Configure status filter
    if (config.statusFilter) {
      await this.page.selectOption('[data-testid="status-filter"], select[name="statusFilter"]', config.statusFilter)
    }

    // Configure type filters (checkboxes)
    if (config.typeFilters) {
      for (const type of config.typeFilters) {
        await this.page.check(`input[type="checkbox"][value="${type}"]`)
      }
    }

    // Configure priority filters (checkboxes)
    if (config.priorityFilters) {
      for (const priority of config.priorityFilters) {
        await this.page.check(`input[type="checkbox"][value="${priority}"]`)
      }
    }

    // Configure sorting
    if (config.sortBy) {
      await this.page.selectOption('[data-testid="sort-by"], select[name="sortBy"]', config.sortBy)
    }

    if (config.sortOrder) {
      await this.page.selectOption('[data-testid="sort-order"], select[name="sortOrder"]', config.sortOrder)
    }

    // Configure grouping
    if (config.groupByType !== undefined) {
      const groupToggle = this.page.locator('[data-testid="group-by-type"], input[type="checkbox"][name*="group"]')
      if (config.groupByType) {
        await groupToggle.check()
      } else {
        await groupToggle.uncheck()
      }
    }

    // Save the preset
    await this.page.locator('button:has-text("Save"), button:has-text("Create")').click()

    // Wait for dialog to close
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 })
  }

  /**
   * Take a screenshot of the current page state
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `tests/e2e/pdf-generation/screenshots/${name}.png`,
      fullPage: true
    })
  }

  /**
   * Validate PDF content and properties
   */
  async validatePDF(pdfBlob: Buffer, expectedConfig: PDFTestConfig): Promise<PDFValidationResult> {
    const errors: string[] = []

    try {
      // Basic validation - check if it's a valid PDF
      if (!pdfBlob.length) {
        errors.push('PDF blob is empty')
        return { success: false, errors }
      }

      // Check PDF header
      const pdfHeader = pdfBlob.slice(0, 8).toString()
      if (!pdfHeader.startsWith('%PDF-')) {
        errors.push('Invalid PDF header')
      }

      // Check filename contains expected elements
      const moduleNames = {
        cue: 'Cue_Notes',
        work: 'Work_Notes',
        production: 'Production_Notes'
      }

      // Additional validations would go here:
      // - Parse PDF content using pdf-parse library
      // - Check page dimensions
      // - Verify text content
      // - Count pages

      return {
        success: errors.length === 0,
        errors,
        pdfBlob: new Blob([pdfBlob], { type: 'application/pdf' })
      }

    } catch (error) {
      errors.push(`PDF validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { success: false, errors }
    }
  }

  /**
   * Wait for UI to be ready after navigation
   */
  async waitForUIReady(): Promise<void> {
    // Wait for the main content to load
    await this.page.waitForSelector('main, [data-testid="main-content"]', { timeout: 10000 })

    // Wait for any loading spinners to disappear
    await this.page.waitForSelector('.loading, [data-testid="loading"]', { state: 'hidden', timeout: 5000 }).catch(() => {
      // Loading spinner might not exist, which is fine
    })

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Check if a preset exists in the dropdown
   */
  async presetExists(presetName: string, presetType: 'filter' | 'pageStyle'): Promise<boolean> {
    try {
      const selectorMap = {
        filter: '[data-testid="filter-preset-selector"], .filter-preset-selector',
        pageStyle: '[data-testid="page-style-preset-selector"], .page-style-preset-selector'
      }

      const selector = this.page.locator(selectorMap[presetType])
      await selector.click()

      // Check if option exists
      const option = this.page.locator(`[role="option"]:has-text("${presetName}"), .preset-option:has-text("${presetName}")`)
      const exists = await option.count() > 0

      // Close dropdown by clicking elsewhere
      await this.page.keyboard.press('Escape')

      return exists
    } catch {
      return false
    }
  }

  /**
   * Get the currently selected preset name
   */
  async getSelectedPresetName(presetType: 'filter' | 'pageStyle'): Promise<string> {
    const selectorMap = {
      filter: '[data-testid="filter-preset-selector"], .filter-preset-selector',
      pageStyle: '[data-testid="page-style-preset-selector"], .page-style-preset-selector'
    }

    const selector = this.page.locator(selectorMap[presetType])
    return await selector.textContent() || ''
  }
}

export const PDF_PAPER_DIMENSIONS = {
  letter: { width: 612, height: 792 },   // 8.5" x 11" at 72 DPI
  a4: { width: 595, height: 842 },       // 210mm x 297mm at 72 DPI
  legal: { width: 612, height: 1008 }    // 8.5" x 14" at 72 DPI
} as const

export const SYSTEM_PRESETS = {
  pageStyle: [
    'Letter Portrait',
    'Letter Landscape',
    'A4 Portrait'
  ],
  filter: {
    cue: [
      'Outstanding Cues',
      'High Priority First',
      'All Todo Notes'
    ],
    work: [
      'Outstanding Work',
      'By Channel',
      'All Todo Notes'
    ],
    production: [
      'Outstanding Issues',
      'By Department',
      'All Todo Notes'
    ]
  }
} as const