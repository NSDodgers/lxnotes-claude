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

**Context:** LXNotes has 5+ module/accent colors with no formal color system. The sidebar customization feature added teal (#2dd4bf) for combined views without a documented system to validate against. At 5 colors it's manageable, at 10+ it gets inconsistent.

**Depends on:** Nothing.
