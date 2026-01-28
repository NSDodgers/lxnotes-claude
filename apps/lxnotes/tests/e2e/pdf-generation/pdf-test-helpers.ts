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
      production: '/production-notes',
      actor: '/actor-notes'
    }

    await this.page.goto(`http://localhost:3001${moduleRoutes[moduleType]}`)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Open the print sidebar by clicking the print button
   */
  async openPrintSidebar(): Promise<void> {
    const printButton = this.page.locator('[data-testid="print-notes-button"], [data-testid="print-button"], button:has-text("Print"), button:has-text("PDF")')
    await printButton.first().click()

    // Wait for the sidebar sheet to appear with card grid
    await this.page.waitForSelector('[data-testid="preset-card-grid"], [role="dialog"]', { timeout: 5000 })
  }

  /**
   * @deprecated Use openPrintSidebar instead. Kept for backwards compatibility.
   */
  async openPrintDialog(): Promise<void> {
    return this.openPrintSidebar()
  }

  /**
   * Select a print preset card by name from the card grid, then proceed to confirm panel
   */
  async selectPrintPresetCard(presetName: string): Promise<void> {
    const card = this.page.locator(`[data-testid^="preset-card-"]:has-text("${presetName}")`)
    await card.click()

    // Wait for confirm panel to appear
    await this.page.waitForSelector('[data-testid="confirm-send-panel"]', { timeout: 5000 })
  }

  /**
   * Generate PDF from the confirm panel by clicking the submit button
   */
  async generatePDFFromConfirm(): Promise<{ pdfBlob: Buffer; filename: string }> {
    const downloadPromise = this.page.waitForEvent('download', { timeout: 30000 })

    const submitButton = this.page.locator('[data-testid="confirm-panel-submit"]')
    await submitButton.click()

    const download = await downloadPromise
    const filename = download.suggestedFilename()

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
   * Open the custom one-off print view from the card grid
   */
  async openCustomPrintView(): Promise<void> {
    const customLink = this.page.locator('[data-testid="preset-card-custom-one-off"]')
    await customLink.click()
    await this.page.waitForTimeout(500)
  }

  /**
   * In custom print view, select a filter preset from the PresetSelector dropdown
   */
  async selectFilterPresetInCustomView(presetName: string): Promise<void> {
    // Click the filter preset selector button
    const filterSelector = this.page.locator('button:has-text("Select filtering options...")').first()
    await filterSelector.click()
    await this.page.waitForTimeout(300)

    // Select the preset from the dropdown
    await this.page.locator(`[role="option"]:has-text("${presetName}"), .preset-option:has-text("${presetName}")`).click()
  }

  /**
   * In custom print view, select a page style preset from the PresetSelector dropdown
   */
  async selectPageStylePresetInCustomView(presetName: string): Promise<void> {
    const pageStyleSelector = this.page.locator('button:has-text("Select page formatting...")').first()
    await pageStyleSelector.click()
    await this.page.waitForTimeout(300)

    await this.page.locator(`[role="option"]:has-text("${presetName}"), .preset-option:has-text("${presetName}")`).click()
  }

  /**
   * Generate PDF from the custom one-off view
   */
  async generatePDFFromCustomView(): Promise<{ pdfBlob: Buffer; filename: string }> {
    const downloadPromise = this.page.waitForEvent('download', { timeout: 30000 })

    const generateButton = this.page.locator('button:has-text("Generate PDF")')
    await generateButton.click()

    const download = await downloadPromise
    const filename = download.suggestedFilename()

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
   * @deprecated Old dropdown-based flow. Use selectPrintPresetCard + generatePDFFromConfirm
   * or openCustomPrintView + selectFilterPresetInCustomView + selectPageStylePresetInCustomView + generatePDFFromCustomView
   */
  async selectFilterPreset(presetName: string): Promise<void> {
    return this.selectFilterPresetInCustomView(presetName)
  }

  /**
   * @deprecated Old dropdown-based flow. Use the card-based flow instead.
   */
  async selectPageStylePreset(presetName: string): Promise<void> {
    return this.selectPageStylePresetInCustomView(presetName)
  }

  /**
   * @deprecated Use generatePDFFromConfirm or generatePDFFromCustomView
   */
  async generatePDF(): Promise<{ pdfBlob: Buffer; filename: string }> {
    return this.generatePDFFromCustomView()
  }

  /**
   * Open the wizard from the card grid to create a new print preset
   */
  async openPrintWizard(): Promise<void> {
    const createCard = this.page.locator('[data-testid="preset-card-create-new"]')
    await createCard.click()
    await this.page.waitForSelector('[data-testid="preset-wizard"]', { timeout: 5000 })
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
      if (!pdfBlob.length) {
        errors.push('PDF blob is empty')
        return { success: false, errors }
      }

      const pdfHeader = pdfBlob.slice(0, 8).toString()
      if (!pdfHeader.startsWith('%PDF-')) {
        errors.push('Invalid PDF header')
      }

      return {
        success: errors.length === 0,
        errors,
        pdfBlob: new Blob([new Uint8Array(pdfBlob)], { type: 'application/pdf' })
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
    await this.page.waitForSelector('main, [data-testid="main-content"]', { timeout: 10000 })

    await this.page.waitForSelector('.loading, [data-testid="loading"]', { state: 'hidden', timeout: 5000 }).catch(() => {
      // Loading spinner might not exist, which is fine
    })

    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Navigate back from confirm panel to card grid
   */
  async goBackToCardGrid(): Promise<void> {
    const backButton = this.page.locator('[data-testid="confirm-panel-back"]')
    await backButton.click()
    await this.page.waitForSelector('[data-testid="preset-card-grid"]', { timeout: 5000 })
  }
}

export const PDF_PAPER_DIMENSIONS = {
  letter: { width: 612, height: 792 },
  a4: { width: 595, height: 842 },
  legal: { width: 612, height: 1008 }
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
  },
  print: {
    cue: ['Outstanding Cue Notes - Letter Portrait'],
    work: ['Outstanding Work Notes - Letter Portrait'],
    production: ['Outstanding Production Notes - Letter Portrait'],
  }
} as const
