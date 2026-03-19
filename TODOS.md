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
