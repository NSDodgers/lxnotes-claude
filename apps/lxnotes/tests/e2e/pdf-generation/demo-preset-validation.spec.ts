import { test, expect } from '@playwright/test'
import { PDFTestHelpers } from './pdf-test-helpers'

test.describe('PDF Preset System Validation', () => {
  let pdfHelpers: PDFTestHelpers

  test.beforeEach(async ({ page }) => {
    pdfHelpers = new PDFTestHelpers(page)
    await page.goto('http://localhost:3001/cue-notes')
    await pdfHelpers.waitForUIReady()
  })

  test('Card grid displays preset cards for each module', async ({ page }) => {
    const modules = ['cue', 'work', 'production'] as const

    for (const mod of modules) {
      await pdfHelpers.navigateToModule(mod)
      await pdfHelpers.openPrintSidebar()

      // Card grid should be visible
      await expect(page.locator('[data-testid="preset-card-grid"]')).toBeVisible()

      // Should have create-new and custom-one-off cards
      await expect(page.locator('[data-testid="preset-card-create-new"]')).toBeVisible()
      await expect(page.locator('[data-testid="preset-card-custom-one-off"]')).toBeVisible()

      // Should show at least one system print preset card
      const presetCards = page.locator('[data-testid^="preset-card-"]:not([data-testid="preset-card-create-new"]):not([data-testid="preset-card-custom-one-off"])')
      const cardCount = await presetCards.count()
      expect(cardCount).toBeGreaterThanOrEqual(1)

      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }
  })

  test('Custom one-off flow shows filter and page style selectors', async ({ page }) => {
    await pdfHelpers.navigateToModule('cue')
    await pdfHelpers.openPrintSidebar()
    await pdfHelpers.openCustomPrintView()

    // Should show filter and page style labels
    await expect(page.locator('text=Filter & Sort Preset')).toBeVisible()
    await expect(page.locator('text=Page Style Preset')).toBeVisible()

    // Generate button should be disabled without selections
    const generateButton = page.locator('button:has-text("Generate PDF")')
    await expect(generateButton).toBeDisabled()

    // Back button returns to cards
    await page.locator('button:has-text("Back")').click()
    await expect(page.locator('[data-testid="preset-card-grid"]')).toBeVisible()
  })

  test('Wizard flow opens from create-new card', async ({ page }) => {
    await pdfHelpers.navigateToModule('work')
    await pdfHelpers.openPrintSidebar()
    await pdfHelpers.openPrintWizard()

    // Wizard should be visible with step 1
    await expect(page.locator('[data-testid="preset-wizard"]')).toBeVisible()
    await expect(page.locator('[data-testid="wizard-step-what-to-send"]')).toBeVisible()
  })

  test('Confirm panel shows preset details', async ({ page }) => {
    await pdfHelpers.navigateToModule('production')
    await pdfHelpers.openPrintSidebar()

    const presetCard = page.locator('[data-testid^="preset-card-"]:not([data-testid="preset-card-create-new"]):not([data-testid="preset-card-custom-one-off"])').first()

    if (await presetCard.count() > 0) {
      await presetCard.click()

      const confirmPanel = page.locator('[data-testid="confirm-send-panel"]')
      await expect(confirmPanel).toBeVisible()

      // Should show details about the preset
      await expect(confirmPanel).toContainText('Filter')

      // Should have submit and back buttons
      await expect(page.locator('[data-testid="confirm-panel-submit"]')).toBeVisible()
      await expect(page.locator('[data-testid="confirm-panel-back"]')).toBeVisible()
    }
  })

  test('Module-specific presets are scoped correctly', async ({ page }) => {
    // Each module should show its own system print presets
    const moduleNames = {
      cue: 'Cue',
      work: 'Work',
      production: 'Production'
    } as const

    for (const [mod, name] of Object.entries(moduleNames)) {
      await pdfHelpers.navigateToModule(mod as 'cue' | 'work' | 'production')
      await pdfHelpers.openPrintSidebar()

      // Preset cards should contain the module name
      const presetCards = page.locator('[data-testid^="preset-card-"]:not([data-testid="preset-card-create-new"]):not([data-testid="preset-card-custom-one-off"])')
      if (await presetCards.count() > 0) {
        const firstCardText = await presetCards.first().textContent()
        expect(firstCardText).toContain(name)
      }

      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }
  })
})
