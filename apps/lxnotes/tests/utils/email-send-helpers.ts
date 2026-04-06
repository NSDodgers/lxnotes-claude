import { Page, Request, expect } from '@playwright/test'

/**
 * Helpers for testing the email send flow in apps/lxnotes/components/email-notes-sidebar.tsx.
 *
 * The email send flow has historically been hard to test because:
 *   1. Email/filter presets are persisted in zustand stores with skipHydration: true,
 *      so addInitScript is the only reliable way to seed state before the app boots.
 *   2. The doSend() function is a closure inside a React component, so we cannot
 *      unit-test it directly — only e2e tests exercise the real path.
 *   3. The send path makes a real POST to /api/email/send and we never want tests
 *      to actually email anyone, so we must intercept and assert on the request.
 *   4. A third-party cookie consent script loads from gettermscmp.com on every page
 *      and can interfere with click flows. We block it by route.
 *
 * These helpers provide a small, focused API for the regression and happy-path
 * tests around the silent-data-leak guard added in
 * docs/plans/2026-04-06-email-pdf-filter-guard.md.
 */

// ---------------------------------------------------------------------------
// Types — minimal shapes that match the persisted store format. Kept inline
// rather than importing from @/types to avoid coupling test scaffolding to
// app type churn.
// ---------------------------------------------------------------------------

type ModuleType = 'cue' | 'work' | 'production' | 'electrician' | 'combined-work-electrician'

export interface SeedFilterPreset {
  id: string
  moduleType: ModuleType
  name: string
  /** Filter criteria. Defaults match a "stage manager todo" filter on cue notes. */
  config?: {
    statusFilter?: string
    typeFilters?: string[]
    priorityFilters?: string[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    groupByType?: boolean
  }
}

export interface SeedEmailPreset {
  id: string
  moduleType: ModuleType
  name: string
  /** Filter preset id this email preset references. Set to a non-existent id to test the guard. */
  filterAndSortPresetId: string | null
  recipients?: string
  subject?: string
  message?: string
  attachPdf?: boolean
  includeNotesInBody?: boolean
}

// ---------------------------------------------------------------------------
// Cookie consent + third-party script blocking
// ---------------------------------------------------------------------------

/**
 * Block the gettermscmp cookie consent script and any other third-party
 * trackers that could interfere with click flows. Call BEFORE page.goto.
 */
export async function blockThirdPartyScripts(page: Page) {
  await page.route(/gettermscmp\.com|googletagmanager\.com|google-analytics\.com/, (route) => {
    route.abort()
  })
}

// ---------------------------------------------------------------------------
// Store seeding via addInitScript
// ---------------------------------------------------------------------------

/**
 * Seed a filter/sort preset and an email preset that references it into
 * localStorage BEFORE the app boots, so the zustand stores hydrate with them.
 *
 * Pass null filterPreset to seed only the email preset (used to test the guard:
 * the email preset references a filterAndSortPresetId that does not exist).
 *
 * Must be called BEFORE page.goto. The injected script runs in every new
 * document context (including reloads).
 */
export async function seedPresets(
  page: Page,
  options: {
    emailPreset: SeedEmailPreset
    filterPreset?: SeedFilterPreset | null
  },
) {
  const { emailPreset, filterPreset } = options

  await page.addInitScript(({ emailPreset, filterPreset }) => {
    const now = new Date().toISOString()

    // ---- Filter/sort preset (optional) ----
    if (filterPreset) {
      const fullFilter = {
        id: filterPreset.id,
        productionId: 'test',
        type: 'filter_sort',
        moduleType: filterPreset.moduleType,
        name: filterPreset.name,
        config: {
          statusFilter: filterPreset.config?.statusFilter ?? 'todo',
          typeFilters: filterPreset.config?.typeFilters ?? ['stage_manager'],
          priorityFilters: filterPreset.config?.priorityFilters ?? ['critical', 'very_high', 'high', 'medium', 'low'],
          sortBy: filterPreset.config?.sortBy ?? 'cue_number',
          sortOrder: filterPreset.config?.sortOrder ?? 'asc',
          groupByType: filterPreset.config?.groupByType ?? false,
        },
        isDefault: false,
        createdBy: 'test',
        createdAt: now,
        updatedAt: now,
      }
      const filterPayload = {
        state: { presets: [fullFilter], loading: false },
        version: 1,
      }
      try {
        window.localStorage.setItem('filter-sort-presets-storage', JSON.stringify(filterPayload))
      } catch {
        // ignore
      }
    }

    // ---- Email preset ----
    const fullEmail = {
      id: emailPreset.id,
      productionId: 'test',
      type: 'email_message',
      moduleType: emailPreset.moduleType,
      name: emailPreset.name,
      config: {
        recipients: emailPreset.recipients ?? 'test@example.com',
        subject: emailPreset.subject ?? 'Test Subject',
        message: emailPreset.message ?? 'Test body',
        filterAndSortPresetId: emailPreset.filterAndSortPresetId,
        pageStyle: { paperSize: 'letter', orientation: 'landscape', includeCheckboxes: true },
        includeNotesInBody: emailPreset.includeNotesInBody ?? false,
        attachPdf: emailPreset.attachPdf ?? true,
      },
      isDefault: false,
      createdBy: 'test',
      createdAt: now,
      updatedAt: now,
    }
    const emailPayload = {
      state: { presets: [fullEmail], loading: false },
      version: 3,
    }
    try {
      window.localStorage.setItem('email-message-presets-storage', JSON.stringify(emailPayload))
    } catch {
      // ignore
    }
  }, { emailPreset, filterPreset: filterPreset ?? null })
}

// ---------------------------------------------------------------------------
// /api/email/send interceptor
// ---------------------------------------------------------------------------

export interface EmailSendCall {
  url: string
  method: string
  body: unknown
}

/**
 * Intercept POSTs to /api/email/send. Returns a getter that yields all captured
 * calls so the test can assert (a) whether any call was made and (b) what the
 * payload looked like (especially noteStats.total).
 *
 * The interceptor responds with a fake 200 success so the UI proceeds to its
 * success handler — we never actually hit the real route.
 *
 * Call BEFORE the action that would trigger the send.
 */
export async function interceptEmailSend(page: Page): Promise<{
  calls: () => EmailSendCall[]
  expectNoCalls: () => void
  expectOneCall: () => EmailSendCall
}> {
  const captured: EmailSendCall[] = []

  await page.route('**/api/email/send', async (route) => {
    const request: Request = route.request()
    let body: unknown = null
    try {
      body = request.postDataJSON()
    } catch {
      body = request.postData()
    }
    captured.push({
      url: request.url(),
      method: request.method(),
      body,
    })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ recipientCount: 1, success: true }),
    })
  })

  return {
    calls: () => [...captured],
    expectNoCalls: () => {
      expect(
        captured,
        'Expected /api/email/send to NOT be called (the guard should have aborted).',
      ).toHaveLength(0)
    },
    expectOneCall: () => {
      expect(
        captured,
        'Expected exactly one POST to /api/email/send.',
      ).toHaveLength(1)
      return captured[0]
    },
  }
}
