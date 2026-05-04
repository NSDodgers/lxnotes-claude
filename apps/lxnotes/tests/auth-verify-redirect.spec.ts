import { test, expect } from '@playwright/test'

/**
 * Verifies the bare-route redirect fix from PR #116.
 *
 * For each bare dashboard route (/cue-notes, /work-notes, etc.), assert that
 * a signed-in user is server-redirected to /production/<uuid>/<route> rather
 * than rendering mock notes from mock-notes-store.ts.
 *
 * Requires storage state from `npm run test:auth:setup` (saved to
 * tests/.auth/<account>.json).
 *
 * Env vars:
 *   LXNOTES_TEST_BASE_URL — defaults to https://www.lxnotes.app
 */

const baseURL = process.env.LXNOTES_TEST_BASE_URL ?? 'https://www.lxnotes.app'

const bareRoutes = [
  'cue-notes',
  'work-notes',
  'production-notes',
  'electrician-notes',
  'settings',
  'positions',
  'order-list',
  'combined/work-electrician',
] as const

const productionScopedPattern = (sub: string) =>
  new RegExp(
    `^${baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/production/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/${sub.replace('/', '\\/')}/?$`,
  )

const mockNoteSignatures = [
  'How Do You Solve a Problem',
  'My Favorite Things',
  'Lonely Goatherd',
  'HPL 575W burnt out',
  'Car headlights reading too cool',
  'Rain effect not triggering',
]

for (const sub of bareRoutes) {
  test(`bare /${sub} redirects to a production-scoped URL`, async ({ page }) => {
    const response = await page.goto(`${baseURL}/${sub}`)

    expect(response, `expected a response from /${sub}`).not.toBeNull()

    // Wait for any client-side navigation to settle.
    await page.waitForLoadState('networkidle')

    const finalUrl = page.url()

    // Either we land at /production/<uuid>/<sub> (1 production), or at / (0 or 2+).
    // Both are acceptable post-fix outcomes; what's NOT acceptable is staying at /<sub>.
    expect(
      finalUrl,
      `expected redirect away from /${sub}; got: ${finalUrl}`,
    ).not.toMatch(new RegExp(`/${sub.replace('/', '\\/')}/?$`))

    // If we got a production-scoped URL, it should match the expected shape.
    if (finalUrl.includes('/production/')) {
      expect(finalUrl).toMatch(productionScopedPattern(sub))
    }

    // Verify mock-data signatures are absent from the rendered page.
    // (False positives are possible if the user genuinely has these strings in
    // their real notes; in that case the test will need a tighter selector.)
    const bodyText = await page.locator('body').innerText()
    for (const sig of mockNoteSignatures) {
      expect(
        bodyText,
        `mock-note signature "${sig}" should not appear after redirect`,
      ).not.toContain(sig)
    }
  })
}
