# TODOS

## Realtime Conflict Detection
**Priority:** Medium | **Added:** 2026-03-18 | **Source:** /plan-eng-review

Add version counters to notes and implement proper last-write-wins with user notification when concurrent edits conflict. Currently, if two users edit the same note simultaneously, the last realtime update silently overwrites the other's changes — no merge, no warning.

**Scope:** Migration (add version column to notes), update all CRUD operations in notes-context.tsx to check version on update, add UI notification when a conflict is detected (e.g., toast with "This note was updated by another user").

**Depends on:** Race condition fix (addPendingCreation ordering) should land first.

---

## Optimize Realtime Delete Handler
**Priority:** Low | **Added:** 2026-03-18 | **Source:** /plan-eng-review

Maintain a `Map<noteId, moduleType>` index so realtime delete events don't need to scan all notes across all module types when `module_type` is missing from the Supabase payload. Currently O(N) per delete; index makes it O(1).

**Context:** Not a bottleneck at current scale (productions typically have <500 notes), but becomes relevant with larger productions. The index must stay in sync with note state (update on insert/delete).

**Depends on:** Nothing.

---

## Table Virtualization for Large Note Sets
**Priority:** Low | **Added:** 2026-03-30 | **Source:** /plan-eng-review

Add react-window or similar virtualization to the notes table component so that large note sets (1000+) don't cause rendering lag. The combined work+electrician view doubles the row count per page. Cue Notes is the most likely module to hit 1000+ notes.

**Scope:** Install react-window (or react-virtuoso), wrap the notes table rows in a virtualized container, update scroll-to-note behavior, update Playwright E2E selectors that assume all rows are in the DOM.

**Context:** Current scale is <500 notes per production. No user has reported performance issues. The table currently renders all rows in the DOM with no virtualization. At 400 rows (~40KB DOM), performance is fine. At 1000+ rows, expect jank on scroll and initial render.

**Depends on:** Nothing. Can be done independently of any other feature.

---

## Create DESIGN.md with Formal Design System
**Priority:** Medium | **Added:** 2026-03-30 | **Source:** /plan-design-review

Run /design-consultation to establish a documented design system: typography, spacing scale, color system (including module colors, status colors, accent colors), component vocabulary, dark theme specifications.

**Scope:** One session with /design-consultation to produce DESIGN.md. Should formalize the existing implicit patterns (module colors: cue=purple, work=blue, electrician=yellow, production=cyan; status colors: blue=todo, green=complete, gray=cancelled; dark theme defaults) plus any new additions (combined view teal).

**Context:** LXNotes has 5+ module/accent colors with no formal color system. The sidebar customization feature added teal (#2dd4bf) for combined views without a documented system to validate against. At 5 colors it's manageable, at 10+ it gets inconsistent. The order list page added amber (#f59e0b) as a utility page accent color.

**Depends on:** Nothing.

---

## Order List: PDF/Email Export
**Priority:** Low | **Added:** 2026-03-31 | **Source:** /autoplan

Add PDF and email export to the aggregated order list page, so an electrician can email the full order list to a supplier. Follow existing PDF/email sidebar patterns from work-notes and electrician-notes pages.

**Scope:** Add PrintNotesSidebar and EmailNotesSidebar integration to the order list page. Generate a PDF grouped by note with item checkboxes.

**Depends on:** Order list page (shipped in feature/order-list-page).

---

## Order List: Add Items Inline
**Priority:** Low | **Added:** 2026-03-31 | **Source:** /autoplan

Allow adding new order items to a note directly from the aggregated order list page, without navigating to the note's edit dialog. Currently the page is view + toggle only.

**Depends on:** Order list page (shipped in feature/order-list-page).

---

## Extract Shared Hookup Upload Logic
**Priority:** Low | **Added:** 2026-04-13 | **Source:** /plan-eng-review

Both `hookup-upload-dialog.tsx` and `hookup-import-sidebar.tsx` contain nearly identical upload logic: parse rows, upload to local fixture store, persist to Supabase, broadcast changes. Extract into a shared `useHookupUpload()` hook.

**Scope:** Create a `useHookupUpload(productionId)` hook that takes parsed rows and import options, handles local store upload, Supabase persistence, and broadcast. Both dialog and sidebar components call it instead of duplicating ~40 lines.

**Context:** The duplication was flagged during the eng review of the fixture broadcast fix. The broadcast call for the CSV-not-updating-across-users bug had to be added in two places. Any future change to the upload flow will need to be made in both files.

**Depends on:** Nothing.

---

## Add VERSION and CHANGELOG.md
**Priority:** Medium | **Added:** 2026-04-01 | **Source:** user

Add a `VERSION` file (4-digit format: `MAJOR.MINOR.PATCH.MICRO`) and `CHANGELOG.md` so gstack's `/ship` workflow can auto-bump versions and generate changelog entries on each PR. Currently `/ship` skips version and changelog steps because neither file exists.

**Scope:** Create `VERSION` with an initial version (e.g., `0.1.0.0`), create `CHANGELOG.md` with standard header and a retroactive entry covering recent features. Future `/ship` runs will auto-maintain both files.

**Depends on:** Nothing.

---

## Refactor 7 remaining `react-hooks/set-state-in-effect` Warnings
**Priority:** Low | **Added:** 2026-04-21 | **Source:** /health lint cleanup

Three files still call `setState` synchronously inside `useEffect`, triggering React 19's cascading-render warning. Each needs a per-site behavioral refactor and manual smoke testing — getting these wrong could break user-facing interactions without failing automated tests.

**Remaining sites:**
- `components/script-manager.tsx` (4 warnings, lines 76/92/952/964) — realtime script sync + persist flow. High-risk refactor, core to feature.
- `components/position-manager.tsx` (2 warnings, lines 120/135) — fixture position ordering, drag-and-drop state sync.
- `components/notes-table.tsx` (1 warning, line 326) — syncs persisted column widths from Zustand store into local state with diff-based update to avoid unnecessary re-renders.

**Scope:** One PR per file. Each should use the React 19 "adjusting state during render" pattern where possible (see PRs #98, #99, #100 for examples), or explicit `eslint-disable-next-line` with a rationale if the effect is a legitimate async-callback handler.

**Context:** Opening lint was 56 warnings. PRs #81–85 and #98–100 cleared 49 of them (mostly mechanical). The remaining 7 are the ones that touch user interaction flow. Not urgent — they're warnings, not errors, and the behavior is correct today.

**Depends on:** Nothing. Each file can be tackled independently.

---

## Smoke Test @supabase/ssr 0.9 Auth Flow
**Priority:** Low | **Added:** 2026-04-21 | **Source:** PR #44 post-merge

`@supabase/ssr` was bumped 0.8 → 0.9 in PR #44 on 2026-04-17. Build passes, typecheck is clean, 119 tests pass, but the library update touches middleware/proxy.ts auth behavior and hasn't been exercised in a browser.

**Scope:** Log in (Google OAuth + magic link), log out, leave tab open long enough for session refresh (~1 hour), confirm no unexpected redirects to `/login`. If anything breaks, roll back PR #44 and pin `@supabase/ssr` to ^0.8.0 in `apps/lxnotes/package.json`.

**Context:** No user reports since 2026-04-17, so likely fine. Low priority; flagging only to close the loop on a merge that never got browser-verified.

**Depends on:** Nothing.

---

## Introduce Central Logger Utility
**Priority:** Low | **Added:** 2026-04-21 | **Source:** PR #78 deferral

PR #78 did a surgical console.log cleanup (3 deleted, 3 gated with `isDev`). Left ~200 calls in place across cron handlers, demo data loader, realtime subscriptions, and a few context files because they're legitimate or in files that don't already have an `isDev` gate — adding one ad-hoc would mean introducing the pattern inconsistently across files.

**Scope:** Create `lib/utils/logger.ts` exporting `logger.debug()` / `logger.info()` / `logger.warn()` / `logger.error()`. Debug/info no-op when `NODE_ENV !== 'development'`. Warn/error always fire. Migrate the ~30 "audit carefully" console calls in `lib/contexts/notes-context.tsx`, `lib/supabase/realtime.ts`, `components/script-manager.tsx`, `components/production/production-provider.tsx`, `lib/stores/operation-queue-store.ts`. Leave cron and scripts alone.

**Context:** Only do this if a pattern starts repeating — right now it's one-off cleanup. The `isDev` inline guards work fine at current scale.

**Depends on:** Nothing.

---

## Re-attempt ESLint 10 Upgrade
**Priority:** Low | **Added:** 2026-04-21 | **Source:** Dependabot #38 (closed blocked)

Dependabot PR #38 (eslint 9.39.2 → 10.0.2) was closed on 2026-04-17 because `eslint-plugin-react` (bundled with `eslint-config-next`) calls `context.getFilename()`, which ESLint 10 removed in favor of `context.filename`. The lint job crashed with a `TypeError`. The block is upstream, not in our code.

**Scope:** Check `eslint-config-next` and `eslint-plugin-react` release notes periodically. When a version that supports ESLint 10 ships, re-enable Dependabot by running `gh pr comment <new-PR> --body "@dependabot unignore this major version"` or manually bump.

**Context:** We're on ESLint 9 patch bumps (merged via Dependabot #92 earlier today). No security exposure from being a major version behind.

**Depends on:** Upstream `eslint-plugin-react` ESLint 10 compatibility release.
