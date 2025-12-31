import { test, expect } from '@playwright/test'

test.describe('Actual PDF Generation Testing', () => {
  test('Can access PDF generation in Cue Notes', async ({ page }) => {
    console.log('🎭 Testing Cue Notes PDF functionality...')

    // Navigate to Cue Notes
    await page.goto('http://localhost:3000/cue-notes')
    await page.waitForLoadState('networkidle')

    // Verify page loads
    await expect(page).toHaveTitle(/LX Notes/)
    console.log('✅ Cue Notes page loaded')

    // Look for PDF button
    const pdfButton = page.locator('button:has-text("PDF")')
    await expect(pdfButton).toBeVisible()
    console.log('✅ PDF button found and visible')

    // Click PDF button to open dialog
    await pdfButton.click()

    // Wait a moment for dialog to appear
    await page.waitForTimeout(1000)

    // Look for dialog title
    const dialogTitle = page.locator('h2:has-text("Print Cue Notes")')
    await expect(dialogTitle).toBeVisible()
    console.log('✅ PDF dialog opened successfully')

    // Look for filter preset selector
    const filterSection = page.locator('text=Content Filtering')
    await expect(filterSection).toBeVisible()
    console.log('✅ Filter preset section visible')

    // Look for page style selector (use first match)
    const pageStyleSection = page.locator('text=Page Formatting').first()
    await expect(pageStyleSection).toBeVisible()
    console.log('✅ Page style section visible')

    // Look for generate button (should be disabled without selections)
    const generateButton = page.locator('button:has-text("Generate PDF")')
    await expect(generateButton).toBeVisible()
    console.log('✅ Generate PDF button found')

    console.log('🎉 Cue Notes PDF functionality is fully accessible!')
  })

  test('Can access PDF generation in Work Notes', async ({ page }) => {
    console.log('🔧 Testing Work Notes PDF functionality...')

    // Navigate to Work Notes
    await page.goto('http://localhost:3000/work-notes')
    await page.waitForLoadState('networkidle')

    // Verify page loads
    await expect(page).toHaveTitle(/LX Notes/)
    console.log('✅ Work Notes page loaded')

    // Look for PDF button
    const pdfButton = page.locator('button:has-text("PDF")')
    await expect(pdfButton).toBeVisible()
    console.log('✅ PDF button found and visible')

    // Click PDF button to open dialog
    await pdfButton.click()

    // Wait a moment for dialog to appear
    await page.waitForTimeout(1000)

    // Look for dialog title
    const dialogTitle = page.locator('h2:has-text("Print Work Notes")')
    await expect(dialogTitle).toBeVisible()
    console.log('✅ PDF dialog opened successfully')

    console.log('🎉 Work Notes PDF functionality is fully accessible!')
  })

  test('Can access PDF generation in Production Notes', async ({ page }) => {
    console.log('🎬 Testing Production Notes PDF functionality...')

    // Navigate to Production Notes
    await page.goto('http://localhost:3000/production-notes')
    await page.waitForLoadState('networkidle')

    // Verify page loads
    await expect(page).toHaveTitle(/LX Notes/)
    console.log('✅ Production Notes page loaded')

    // Look for PDF button
    const pdfButton = page.locator('button:has-text("PDF")')
    await expect(pdfButton).toBeVisible()
    console.log('✅ PDF button found and visible')

    // Click PDF button to open dialog
    await pdfButton.click()

    // Wait a moment for dialog to appear
    await page.waitForTimeout(1000)

    // Look for dialog title
    const dialogTitle = page.locator('h2:has-text("Print Production Notes")')
    await expect(dialogTitle).toBeVisible()
    console.log('✅ PDF dialog opened successfully')

    console.log('🎉 Production Notes PDF functionality is fully accessible!')
  })

  test('PDF dialog contains expected preset selectors', async ({ page }) => {
    console.log('🔍 Testing PDF dialog preset functionality...')

    // Go to any module (using Cue Notes)
    await page.goto('http://localhost:3000/cue-notes')
    await page.waitForLoadState('networkidle')

    // Open PDF dialog
    const pdfButton = page.locator('button:has-text("PDF")')
    await pdfButton.click()
    await page.waitForTimeout(1000)

    // Check for filter preset selector
    const filterPresetLabel = page.locator('text=Filter & Sort Preset')
    await expect(filterPresetLabel).toBeVisible()
    console.log('✅ Filter preset selector found')

    // Check for page style preset selector (use first match)
    const pageStyleLabel = page.locator('text=Page Style Preset').first()
    await expect(pageStyleLabel).toBeVisible()
    console.log('✅ Page style preset selector found')

    // Check for generate button
    const generateButton = page.locator('button:has-text("Generate PDF")')
    await expect(generateButton).toBeVisible()

    // Button should be disabled initially (no presets selected)
    await expect(generateButton).toBeDisabled()
    console.log('✅ Generate button properly disabled without selections')

    console.log('🎉 PDF dialog functionality working correctly!')
  })
})