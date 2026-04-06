# Email PDF Filter Guard & Root Cause Fix

**Branch:** `fix/email-pdf-filter-guard`
**Date:** 2026-04-06
**Severity:** High — silent data leak (sending unintended notes to recipients)
**Reporter:** Nick (Schmigadoon production)

---

## The Bug

User clicked "Send stage manager notes" in the email sidebar on the Schmigadoon Cue Notes module. Expected: a PDF containing only `type = stage_manager` todo notes. Got: a PDF labeled "All notes • 116 notes" containing every cue, associate, and stage manager note in the production, emailed to external recipients.

This is a silent data leak. The filter label said "All notes" so the UI didn't lie — but the user invoked a preset named for a specific filter, got a silent downgrade, and the email went out before they could catch it.

Evidence: `/Users/nicksolyom/Downloads/Cue_Notes_2026-04-05.pdf` — 9 pages, header reads "Generated: Apr 4, 26 at 11:11 PM • All notes • 116 notes", contents span Cue/Stage Manager/Associate types across all scenes.

## Root Cause Analysis

Two independent failures stacked to produce the leak.

### Failure 1: Missing guard in email send path

`apps/lxnotes/components/email-notes-sidebar.tsx:173-179`

```ts
const filterPreset = filterPresetId
  ? getFilterPreset(filterPresetId)
  : null
const customPriorities = getPriorities(moduleType)
const filteredNotes = filterPreset
  ? filterAndSortNotes(notes, filterPreset, customPriorities)
  : notes  // ← silent fallthrough
```

When `getFilterPreset(filterPresetId)` returns `undefined`, `filteredNotes` becomes the full `notes` array. The PDF service is then called with `filterPreset: filterPreset || undefined` (line 198) and the unfiltered `notes` (line 200), so the PDF is generated from everything, labeled "All notes" by `PDFGenerationService` (which uses `request.filterPreset?.name || 'All notes'`).

**Compare the print flow**, `apps/lxnotes/components/print-notes-sidebar.tsx:117-120`:

```ts
if (!filterPreset) {
  setGenerateError('Filter preset is required')
  return
}
```

Print refuses to generate a PDF with a missing filter. Email silently falls through. Same data path, different safety posture. The email sidebar was simply written without the guard.

### Failure 2: `getPreset` doesn't fall back to local store in production mode

`apps/lxnotes/lib/hooks/use-production-filter-sort-presets.ts:61-72`

```ts
const getPreset = useCallback((id: string): FilterSortPreset | undefined => {
  if (productionContext?.production) {
    const prodPreset = productionPresets.find(p => p.id === id)
    if (prodPreset) return prodPreset
    return systemPresets.find(p => p.id === id)
    // ← never checks store.getPreset(id) — local user presets are invisible in production mode
  } else {
    return store.getPreset(id)
  }
}, [...])
```

In production mode, the lookup checks:
1. `productionPresets` — filter presets synced to `production.filterSortPresets` via Supabase
2. `systemPresets` — dynamically generated from module defaults (`sys-filter-<module>-<suffix>`)

It does NOT check `store.getPreset(id)`, which is the Zustand-persisted local store. A filter preset id referencing a user-created local preset (created in demo mode, created before a production was linked, created by another device and not synced, or orphaned by a production migration) will return `undefined` even though the preset technically exists somewhere on the user's machine.

Commit `ae3315a` fixed a sibling case ("use production-aware hook for email PDF filter preset lookup") but the hook itself has this residual blind spot.

### Why the two failures stack

The guard failure (Failure 1) is the difference between "clear error to the user" and "silent data leak". The lookup failure (Failure 2) is *why* the guard is needed in the first place. Fixing only Failure 1 prevents the leak but still blocks users whose presets resolve to `undefined` from sending. Fixing only Failure 2 may work today but leaves the silent-fallthrough pattern in place for the next resolver bug.

Both must be fixed.

---

## Reproduction Plan

We never actually reproduced the lookup failure locally. Reproduction is part of the fix, not an afterthought, because:
- It confirms which of several hypotheses about Failure 2 is correct
- It gives us a regression test that wouldn't exist otherwise
- It verifies the guard fires before shipping

### Hypotheses (to be narrowed during repro)

- **H1: Orphaned local preset.** The email preset's `filterAndSortPresetId` points to a filter preset that lives only in `store.presets` (local) and was never synced to `production.filterSortPresets`.
- **H2: Stale system preset id.** The filter preset was a system preset (`sys-filter-cue-type-stage_manager`), but the local `customTypesStore` for this production doesn't have `stage_manager` visible at the moment `computeSystemPresets` runs, so the generated id doesn't appear in `systemPresets`.
- **H3: Race condition.** `production.filterSortPresets` hadn't finished loading from Supabase when the user clicked send.
- **H4: Cross-production contamination.** The email preset was created under Production A, the user is now in Production B, and B doesn't have the referenced filter preset.

### Repro steps (dev mode)

1. `NEXT_PUBLIC_DEV_MODE=true npm run dev`
2. Create a cue notes filter preset locally (not synced), e.g. "My SM only"
3. Create an email preset that references it by id via the preset wizard
4. Simulate production context switch (navigate to a different production / clear local filter presets but keep the email preset)
5. Trigger send → observe the unfiltered PDF behavior
6. Apply the guard → observe the clear error instead

### Regression test (eng review will specify exact location)

- **Unit test** in `tests/unit/hooks/use-production-filter-sort-presets.test.ts` (new file): assert `getPreset` returns a local preset when in production mode and the id is not in production/system lists.
- **Integration test** in `tests/e2e/presets/email-message-presets.spec.ts`: simulate email send with a broken `filterAndSortPresetId`, assert the error banner appears and no network call to `/api/email/send` is made.

---

## Proposed Fix

### Part A — Defensive guard in email send path (the floor)

`apps/lxnotes/components/email-notes-sidebar.tsx`, inside `doSend`, immediately after the `filterPreset` resolution:

```ts
if (filterPresetId && !filterPreset) {
  setSendError(
    'Filter preset referenced by this email preset is missing. ' +
    'Open the email preset, re-select the filter, and save.'
  )
  setIsSending(false)
  return
}
```

Rules:
- Abort ONLY when the preset declares a `filterPresetId` but resolution failed. A null `filterPresetId` is a legitimate "send all" case (custom one-off sends, unfiltered presets) and must continue to work.
- The error surfaces via the existing `sendError` state and existing error UI. No new UX components.
- No PDF is generated, no network call is made, no email goes out.

### Part B — DROPPED after adversarial review

Original proposal: extend `useProductionFilterSortPresets.getPreset` to fall back to `store.getPreset(id)` (local Zustand store) as a third tier in production mode.

**Why dropped:** `useFilterSortPresetsStore` uses a single global localStorage key (`filter-sort-presets-storage`) that is NOT scoped by production. A user-created preset from Production A persists across all productions on the same browser. Falling back to it from Production B would silently surface a Production-A preset, causing exactly the kind of cross-tenant filter behavior this bug is about — just in a different direction. The fix would be a leak.

**Decision:** Part A's guard is sufficient. Users hitting a missing reference will get a clear error and can re-select the filter in the email preset editor. If we later see this error fire often in production telemetry (see Observability below), the right next step is a one-time data migration that re-resolves orphaned `filterAndSortPresetId` values, NOT a runtime fallback that crosses tenant boundaries.

**Tradeoff acknowledged:** users with broken email presets will hit a clear error instead of "it just works". That is the correct behavior for a silent-data-leak prevention check.

### Part C — Defense in depth in PDF service call

`apps/lxnotes/components/email-notes-sidebar.tsx:200`, change the PDF service call to pass `filteredNotes` instead of raw `notes`:

```ts
const result = await pdfService.generatePDF({
  moduleType: pdfModuleType,
  filterPreset: filterPreset || undefined,
  pageStyle,
  notes: filteredNotes,  // ← was: notes
  ...
})
```

`PDFGenerationService.generatePDF` already filters internally (`PDFGenerationService.ts:62-64`), so this is belt-and-suspenders. But with Part A in place, if `filterPreset` is non-null then `filteredNotes` is the correctly filtered subset, so passing it can never produce a wider result than the service would compute on its own. If a future bug breaks the service's internal filtering, this layer still protects.

### Part D — Observability

In Part A's guard branch and at the start of `doSend`, add a structured console.error so future occurrences are debuggable from the browser console (Sentry can pick this up via its console integration):

```ts
console.error('[Email PDF] Filter preset lookup failed', {
  filterPresetId,
  moduleType,
  productionId: productionContext?.productionId ?? null,
  emailPresetId: selectedPreset?.id ?? null,
})
```

Place inside the guard branch only — never in the success path.

### Part E — Consistency: print sidebar already has the pattern

No code change here. Part A ports the existing print-sidebar guard pattern to email. Note in CLAUDE.md or a test comment: "Email and print PDF flows must both refuse to generate when a declared filter preset fails to resolve."

### What is NOT in scope

- Rewriting email/print preset resolution into a unified service. That's a refactor, not a fix. Flagged for TODOS.md.
- Migrating local-only filter presets to production on first production load. User-data migration is a separate, larger project.
- Adding a validation step at email-preset-save time to reject broken filter references. Belongs in the preset editor, not this fix.
- Fixing the `useCustomTypesStore` reading stale types in production mode (H2). That's a different class of bug and affects more than this flow.

---

## Files to Change

| File | Change | Why |
|---|---|---|
| `apps/lxnotes/components/email-notes-sidebar.tsx` | Add `if (filterPresetId && !filterPreset)` guard inside `doSend`; change line 200 to pass `filteredNotes`; add `console.error` in guard branch | Parts A, C, D |
| `apps/lxnotes/tests/e2e/presets/email-message-presets.spec.ts` | Add 2 test cases: (1) broken `filterAndSortPresetId` → error + no API call, (2) valid filter → assert `noteStats.total` matches filtered count in request payload | Regression for Parts A and C |

Blast radius: 1 source file + 1 test file. ~25 lines of source changes, ~60 lines of test code.

**Sibling pattern audit (done before plan finalized):**
- `grep "filterPreset || undefined"` → only `email-notes-sidebar.tsx:198`
- `grep "getFilterPreset("` → 7 sites; only the 2 SEND paths matter:
  - `print-notes-sidebar.tsx:117-120` — already guarded with `if (!filterPreset)` abort
  - `email-notes-sidebar.tsx:173-179` — buggy, fix in this plan
- The other 5 sites (`preset-editor`, `preset-wizard-steps/name-and-save-step`, `confirm-send-panel`, `preset-card-grid`) only USE the lookup for display, not for sending. They can show "All notes" if a reference is broken; that's a UX improvement, not a data leak. Out of scope.

## Test Plan

- E2E (broken-reference path): create an email preset whose `filterAndSortPresetId` points to a deleted/missing id, click send, assert (1) error banner with the "filter preset is missing" message appears, (2) no POST to `/api/email/send` is made (intercept network call), (3) console.error was logged with the diagnostic payload
- E2E (happy path — the test the original tests were missing): create an email preset with a valid filter (e.g. cue stage manager todo), click send, intercept the POST to `/api/email/send`, assert `noteStats.total` equals the count of notes matching the filter (not the count of all notes). This is the test that would have caught the original bug.
- Manual: reproduce the Schmigadoon scenario in dev mode by deliberately desyncing a preset, confirm guard fires before generation

## Rollout

- PR to `main` via `/ship`
- No migration required
- No env var changes
- No feature flag — the guard is an unconditional safety check
- Monitor `/api/email/send` logs for the next 48 hours for any spike in user-reported "missing filter preset" errors — that would indicate H2/H3/H4 is common and warrants a follow-up

## Success Criteria

1. Reproduction of the Schmigadoon scenario in dev mode produces the clear error banner instead of an unfiltered PDF
2. Unit and E2E regression tests pass and assert the correct behavior
3. No existing email-send tests break
4. After shipping, the bug does not recur in the next month of production usage

---

## Cross-References

- Previous sibling fix: `ae3315a` — "fix: use production-aware hook for email PDF filter preset lookup"
- Previous pattern this mirrors: `print-notes-sidebar.tsx:117-120` (existing guard)
- PDF rendering: `apps/lxnotes/lib/services/pdf/PDFGenerationService.ts:57-74`
