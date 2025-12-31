import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for PDF generation testing
 * Run with: npx playwright test tests/e2e/pdf-generation
 */
export default defineConfig({
  testDir: '.',
  /* Run tests in files in parallel */
  fullyParallel: false, // Keep false for PDF tests to avoid conflicts
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 2, // Limited workers for PDF generation
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'tests/e2e/pdf-generation/test-results' }],
    ['json', { outputFile: 'tests/e2e/pdf-generation/test-results/results.json' }],
    ['list']
  ],
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Take screenshot on test failure */
    screenshot: 'only-on-failure',

    /* Record video on test failure */
    video: 'retain-on-failure',

    /* Timeout for each action */
    actionTimeout: 30000,

    /* Timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Specific settings for PDF generation testing
        viewport: { width: 1280, height: 800 },
        // Enable downloads for PDF testing
        acceptDownloads: true,
      },
    },

    // Uncomment to test in Firefox (PDFs might behave differently)
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     viewport: { width: 1280, height: 800 },
    //     acceptDownloads: true,
    //   },
    // },

    // Uncomment to test in Safari (if on macOS)
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     viewport: { width: 1280, height: 800 },
    //     acceptDownloads: true,
    //   },
    // },
  ],

  /* Test timeout */
  timeout: 60000, // 60 seconds per test (PDF generation can take time)

  /* Global timeout */
  globalTimeout: 600000, // 10 minutes for entire test suite

  /* Expect timeout */
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },

  /* Output directory for test artifacts */
  outputDir: 'tests/e2e/pdf-generation/test-artifacts',
})