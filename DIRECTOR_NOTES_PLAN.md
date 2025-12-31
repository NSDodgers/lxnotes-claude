# Director Notes: Future Implementation Plan

This document outlines the architecture and implementation plan for **Director Notes**, a companion app to LX Notes that enables directors to manage actor notes and communicate with lighting departments.

## Overview

Director Notes will be a separate application sharing the same database and codebase infrastructure as LX Notes. Directors can send notes directly to the Lighting Department, which appear in LX Notes as incoming work items.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Shared Database** | Single Supabase instance for both apps. Simpler than API integration, enables realtime sync, single source of truth. |
| **Copy-on-Send Model** | When director sends a note, it's copied to LX Notes as a new note. Original marked as "sent" (done). No status sync back. |
| **Department-Level Targeting** | Notes sent to "Lighting Department", not specific users. Handles role changes gracefully. |
| **No Status Sync Back** | Sending = done for director. What LD does with the note is their business. Keeps apps independent. |
| **Monorepo Structure** | Maximum code sharing via `packages/shared`. Single GitHub repo, two Vercel deployments. |

## How Cross-App Communication Works

```
Director Notes                          LX Notes
┌─────────────────┐                    ┌─────────────────┐
│ Director writes │                    │                 │
│ "Fix spot timing│───── SEND ────────▶│ Copy appears in │
│  in Act 2"      │                    │ Work/Production │
│                 │                    │ Notes module    │
│ Status: SENT ✓  │                    │                 │
│ (Director done) │                    │ LD works on it  │
└─────────────────┘                    │ independently   │
                                       └─────────────────┘
```

### Workflow
1. Director creates note in Director Notes app
2. Director clicks "Send to Lighting"
3. Note is **copied** into LX Notes (new note, linked via `note_transfers` table)
4. Original note marked with `transferred_at` timestamp (director is done)
5. LD sees incoming note in LX Notes and handles independently
6. No status flows back to director

### Bidirectional
LD can also send notes to Director using same mechanism (copy to "Direction" department).

## Database Architecture (Already Implemented)

The following tables were added in migration `20251231000000_cross_app_departments.sql`:

### New Tables

**`departments`** - Defines departments per production
```sql
- id, production_id, name, slug, app_id, color, is_active
- Example: { name: "Lighting", slug: "lighting", app_id: "lxnotes" }
```

**`department_members`** - Links users to departments
```sql
- id, department_id, user_id, role ('head' | 'member')
```

**`note_transfers`** - Audit trail for cross-app notes
```sql
- source_note_id, source_app_id, source_department_id
- target_note_id, target_app_id, target_department_id
- sent_by, sent_at, in_reply_to_id (for reply chains)
```

### Modified Tables

**`notes`** - Added columns:
- `app_id` - Which app owns this note ('lxnotes' | 'director_notes')
- `source_department_id` - Department that created this note
- `is_transferred` - Whether note was sent to another app
- `transferred_at` - When note was sent (NULL = not sent)
- `module_type` - Extended to include 'actor'

## Director Notes App Features

### Modules
1. **Actor Notes** - Notes about specific actors/performers
2. **Production Notes** - Cross-department production notes (shared with LX Notes)

### Core Features (Same as LX Notes)
- Note creation with types and priorities
- Filter/Sort presets
- PDF generation with page style presets
- Email notes functionality
- Script page/scene linking

### New Features
- **Send to Department** - Send notes to Lighting (or other departments)
- **Sent Notes View** - See all notes that were sent
- **Incoming Notes** (for replies from LD)

## Repository Structure

```
lxnotes-monorepo/
├── apps/
│   ├── lxnotes/              # LXNotes.app (current)
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── ...
│   └── director-notes/       # DirectorNotes.app (future)
│       ├── app/
│       ├── components/       # App-specific components
│       └── ...
├── packages/
│   └── shared/               # Shared code between apps
│       ├── components/       # Shared UI components
│       ├── lib/              # Supabase client, utils, stores
│       └── types/            # Shared TypeScript types
├── turbo.json
└── package.json
```

## Deployment Architecture

| App | Domain | Vercel Project | Root Directory |
|-----|--------|----------------|----------------|
| LX Notes | lxnotes.app | `lxnotes` | `apps/lxnotes` |
| Director Notes | directornotes.app | `director-notes` | `apps/director-notes` |

Both apps:
- Connect to same GitHub repo
- Use same Supabase instance
- Share environment variables (except `NEXT_PUBLIC_APP_ID`)

## Implementation Phases

### Phase 1: Database Preparation ✅ COMPLETE
- [x] Create `departments` table
- [x] Create `department_members` table
- [x] Create `note_transfers` table
- [x] Add cross-app columns to `notes` table
- [x] Add 'actor' to `module_type` enum
- [x] RLS policies for all new tables

### Phase 2: Monorepo Conversion ✅ COMPLETE
- [x] Install Turborepo
- [x] Move code to `apps/lxnotes`
- [x] Create `packages/shared` structure
- [x] Update Vercel deployment settings

### Phase 3: Extract Shared Code (Future)
- [ ] Move shared components to `packages/shared/components`
  - UI primitives (button, dialog, input, etc.)
  - Notes table components
  - PDF generation components
  - Preset management components
- [ ] Move shared lib to `packages/shared/lib`
  - Supabase client
  - Storage adapters
  - Utility functions
- [ ] Move shared types to `packages/shared/types`
- [ ] Update imports in `apps/lxnotes`

### Phase 4: LX Notes Enhancements (Future)
- [ ] Auto-create "Lighting" department per production
- [ ] Add "Incoming Notes" inbox view
- [ ] Department member management UI
- [ ] Handle incoming notes from Director Notes

### Phase 5: Director Notes App (Future)
- [ ] Create `apps/director-notes` scaffold
- [ ] Configure new Vercel project for directornotes.app
- [ ] Implement Actor Notes module
- [ ] Implement Production Notes module (can share with LX Notes)
- [ ] Implement "Send to Department" functionality
- [ ] Auto-create "Direction" department per production
- [ ] PDF/Email functionality (reuse shared components)

### Phase 6: Cross-App Integration (Future)
- [ ] Note transfer API/service
- [ ] Realtime notifications for incoming notes
- [ ] Reply chain support
- [ ] Department management UI in both apps

## Environment Variables

### LX Notes
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_APP_ID=lxnotes
```

### Director Notes
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_APP_ID=director_notes
```

## Migration Safety Notes

All database changes were designed to be backwards-compatible:
- New columns have default values
- New tables start empty
- Existing LX Notes functionality unchanged
- RLS policies use existing helper functions

## Related Files

- `apps/lxnotes/supabase/migrations/20251231000000_cross_app_departments.sql` - Database migration
- `apps/lxnotes/types/index.ts` - TypeScript types including `Department`, `DepartmentMember`, `NoteTransfer`
- `turbo.json` - Turborepo configuration
- `package.json` - Workspace root configuration
