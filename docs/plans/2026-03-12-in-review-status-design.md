# "In Review" Status — Work Notes Only

## Summary

Add a fourth note status, **"In Review"**, available exclusively in the work notes module. This status represents work that is complete but pending design team sign-off. It sits between "Todo" and "Complete" in the workflow progression.

- **Internal value:** `'review'`
- **Display label:** "In Review"
- **Color:** Amber (`#f59e0b`)
- **PDF symbol:** Filled circle `●` (amber)

## Data Layer

### NoteStatus Type

The shared type gains a fourth value:

```typescript
export type NoteStatus = 'todo' | 'review' | 'complete' | 'cancelled'
```

All modules can technically store `'review'`, but only work notes UI exposes it. This avoids module-specific type branching.

### Database Migration

Add `'review'` to the CHECK constraint on the `notes` table:

```sql
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_status_check;
ALTER TABLE notes ADD CONSTRAINT notes_status_check
  CHECK (status IN ('todo', 'review', 'complete', 'cancelled'));
```

### Validation

Update the Zod enum in `lib/validation/preset-schemas.ts`:

```typescript
statusFilter: z.enum(['todo', 'review', 'complete', 'cancelled']).nullable()
```

## UI — Action Cell

### New Button

Work notes get a third action button — an **Eye** icon (Lucide `Eye`) — positioned between the Complete and Cancel buttons. It uses the existing button variant pattern with amber styling.

The review button only renders when `moduleType === 'work'`.

### Toggle Behavior

Follows the existing toggle pattern:

| Current Status | Click Review | Click Complete | Click Cancel |
|---------------|-------------|---------------|-------------|
| `todo` | -> `review` | -> `complete` | -> `cancelled` |
| `review` | -> `todo` | -> `complete` | -> `cancelled` |
| `complete` | — | -> `todo` | — |
| `cancelled` | — | — | -> `todo` |

### Row Styling

Notes with `review` status get amber background treatment, matching how `complete` and `cancelled` rows are styled with their respective colors.

## Design Tokens & Styling

### CSS Variable

`globals.css` — reuse or replace the existing unused `--color-status-inProgress`:

```css
--color-status-review: #f59e0b;
```

### Button Variant

`button.tsx` — add `review` variant following the existing pattern:

```typescript
review: "bg-transparent border border-status-review/30 text-status-review hover:bg-status-review/10 ..."
```

## Preset System

### Status Filter Step

`status-filter-step.tsx` — conditionally include "In Review Only" when `moduleType === 'work'`:

```
All Statuses | Todo Only | In Review Only | Complete Only | Cancelled Only
```

Other modules see the existing 4 options unchanged.

### System Filter Presets

`generate-dynamic-presets.ts` — for work notes only, add a 5th standard preset:

```typescript
// Only for work notes
if (moduleType === 'work') {
  presets.push({
    id: generateFilterPresetId(moduleType, 'all-in-review'),
    name: 'All In Review (by Priority)',
    config: {
      statusFilter: 'review',
      typeFilters: [ALL_TYPES_SENTINEL],
      priorityFilters: allPriorityValues,
      sortBy: 'priority',
      sortOrder: 'desc',
      groupByType: false,
    },
    // ... standard system preset fields
  })
}
```

### Print & Email Presets

Print and email presets are generated 1:1 from filter presets automatically via `generateSystemPrintPresets()` and `generateSystemEmailPresets()`. The new "All In Review" filter preset will cascade into matching print and email presets with no additional logic.

Work notes will get these system presets:
- **All To-Do** (filter + print + email)
- **All To-Do Grouped** (filter + print + email)
- **All In Review** (filter + print + email) — NEW
- **All Complete** (filter + print + email)
- **All Cancelled** (filter + print + email)
- **[Type] To-Do** per visible type (filter + print + email)

### Filter Logic

`filter-sort-notes.ts` — no changes needed. The generic `note.status !== filterPreset.config.statusFilter` check works with any status value.

### Existing User Presets

No migration needed. Presets with `statusFilter: null` (all statuses) will automatically include "In Review" notes. Presets filtered to a specific status are unaffected.

## Email Output

### Status Counts

`email-notes-sidebar.tsx` — add review count:

```typescript
const noteStats = {
  total: filteredNotes.length,
  todo: filteredNotes.filter(n => n.status === 'todo').length,
  review: filteredNotes.filter(n => n.status === 'review').length,
  complete: filteredNotes.filter(n => n.status === 'complete').length,
  cancelled: filteredNotes.filter(n => n.status === 'cancelled').length,
}
```

### Send Route & Types

`app/api/email/send/route.ts` and `lib/utils/placeholders.ts` — add `review: number` to `noteStats` interface and `reviewCount` placeholder.

### Summary Card

`emails/components/summary-card.tsx` — add amber "in review" count between todo and complete. Only display when the count is relevant (work notes distribution or `reviewCount > 0`):

```
3 todo • 2 in review • 1 complete • 0 cancelled
```

## PDF Output

### Checkbox Symbol

`components/pdf/shared/PDFTable.tsx` — add a branch for `'review'` status:

```typescript
{status === 'review' && (
  <View style={commonStyles.checkbox}>
    <Text style={styles.reviewmark}>●</Text>  {/* Amber filled circle */}
  </View>
)}
```

### PDF Styles

`components/pdf/shared/styles.ts` — add amber color for the review mark.

## Change Summary

| Area | Files | Complexity |
|------|-------|------------|
| Types & validation | `types/index.ts`, `preset-schemas.ts` | Trivial |
| Database | 1 new migration | Trivial |
| CSS & button variant | `globals.css`, `button.tsx` | Small |
| Action cell | `action-cell.tsx` | Small |
| Preset wizard | `status-filter-step.tsx` | Small |
| Preset generation | `generate-dynamic-presets.ts` | Small |
| Email stats & template | `email-notes-sidebar.tsx`, `summary-card.tsx`, `placeholders.ts`, `email/send/route.ts` | Small |
| PDF rendering & styles | `PDFTable.tsx`, `styles.ts` | Trivial |
| **Total** | **~13 files** | **Medium** |
