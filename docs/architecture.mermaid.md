# LX Notes Architecture - Mermaid Diagrams

> Reference documentation for the LX Notes codebase architecture.
> Keep this file up to date when making architectural changes.
> Last updated: 2026-02-25

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Route Structure](#route-structure)
3. [Provider & State Hierarchy](#provider--state-hierarchy)
4. [Data Flow - Production Load](#data-flow---production-load)
5. [Data Flow - Preset Updates](#data-flow---preset-updates)
6. [Data Flow - Notes CRUD](#data-flow---notes-crud)
7. [Offline Operation Queue](#offline-operation-queue)
8. [Zustand Store Map](#zustand-store-map)
9. [Component Architecture](#component-architecture)
10. [API Routes](#api-routes)
11. [Module System](#module-system)
12. [Realtime Sync](#realtime-sync)

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Client["Client (Next.js App Router)"]
        Pages["Pages<br/>(dashboard, demo, auth)"]
        Components["Components<br/>(notes-table, pdf, presets, settings)"]
        Providers["Providers<br/>(Auth, Production, Notes, Keyboard)"]
        Stores["Zustand Stores<br/>(17 stores)"]
        Hooks["Hooks<br/>(production-aware, storage)"]
    end

    subgraph Server["Next.js API Routes"]
        ProductionAPI["Production API"]
        PresetAPI["Preset APIs"]
        EmailAPI["Email API"]
        CronAPI["Cron Jobs"]
        SnapshotAPI["Snapshot API"]
    end

    subgraph Supabase["Supabase"]
        Auth["Auth (Google OAuth)"]
        DB["PostgreSQL<br/>(productions, notes, members)"]
        Realtime["Realtime<br/>(postgres_changes)"]
        RPC["RPC Functions<br/>(upsert_jsonb_preset)"]
    end

    Pages --> Components
    Components --> Hooks
    Hooks --> Stores
    Hooks --> Providers
    Providers --> Server
    Server --> Supabase
    Realtime -->|"broadcasts"| Providers
    Stores -->|"localStorage/sessionStorage"| Stores
```

## Route Structure

```mermaid
graph LR
    subgraph App["app/"]
        Root["/ (home)"]

        subgraph AuthRoutes["auth/"]
            Login["login"]
            AuthError["auth-code-error"]
        end

        subgraph Dashboard["(dashboard)/"]
            CueNotes["cue-notes"]
            WorkNotes["work-notes"]
            ProdNotes["production-notes"]
            Positions["positions"]
            ManageScript["manage-script"]
            Settings["settings"]
        end

        subgraph ProdRoutes["production/[id]/(dashboard)/"]
            PCue["cue-notes"]
            PWork["work-notes"]
            PProd["production-notes"]
            PPos["positions"]
            PScript["manage-script"]
            PSettings["settings"]
        end

        subgraph DemoRoutes["demo/(dashboard)/"]
            DCue["cue-notes"]
            DWork["work-notes"]
            DProd["production-notes"]
            DPos["positions"]
            DScript["manage-script"]
            DSettings["settings"]
        end

        subgraph Misc["Other Routes"]
            Join["p/[code] (join)"]
            Invite["invite/[token]"]
            Admin["settings/admin"]
            Policies["policies/*"]
        end
    end

    Root -->|"authenticated"| Dashboard
    Root -->|"production selected"| ProdRoutes
    Root -->|"demo mode"| DemoRoutes
```

## Provider & State Hierarchy

```mermaid
graph TD
    subgraph RootProviders["RootProviders (providers.tsx)"]
        AuthProvider["AuthProvider<br/>user, session, isAuthenticated"]
        QCP["QueryClientProvider"]
        NotesProvider["NotesProvider<br/>notes state & CRUD"]
        KSP["KeyboardShortcutsProvider"]
    end

    subgraph ProductionScope["Production Scope (layout)"]
        ProductionProvider["ProductionProvider<br/>production, presets, configs"]
    end

    AuthProvider --> QCP --> NotesProvider --> KSP
    KSP --> ProductionScope

    subgraph Hydration["Client Hydration (skipHydration stores)"]
        H1["filterSortPresetsStore"]
        H2["pageStylePresetsStore"]
        H3["emailMessagePresetsStore"]
        H4["customPrioritiesStore"]
        H5["customTypesStore"]
    end

    RootProviders -->|"rehydrate on mount"| Hydration

    subgraph ProductionHooks["Production-Aware Hooks"]
        EPH["useProductionEmailPresets"]
        FSPH["useProductionFilterSortPresets"]
        CTH["useProductionCustomTypes"]
        CPH["useProductionCustomPriorities"]
        PPH["useProductionPrintPresets"]
        PSPH["useProductionPageStylePresets"]
    end

    ProductionProvider --> ProductionHooks
    ProductionHooks -->|"fallback if no production"| Hydration
```

## Data Flow - Production Load

```mermaid
sequenceDiagram
    participant UI as Page Component
    participant PP as ProductionProvider
    participant SA as StorageAdapter
    participant SB as Supabase
    participant Stores as Zustand Stores
    participant RT as Realtime

    UI->>PP: mount with productionId
    PP->>SA: getProduction(id)
    SA->>SB: SELECT * FROM productions WHERE id = ?
    SB-->>SA: production row (with JSONB columns)
    SA-->>PP: Production object

    PP->>Stores: customTypesStore.loadFromProduction(config)
    PP->>Stores: customPrioritiesStore.loadFromProduction(config)
    PP->>Stores: scriptStore.setScriptData(pages, scenes, songs)
    PP->>Stores: positionStore.clearOrder()

    PP->>RT: subscribeToProductionChanges(id)
    PP->>RT: subscribeToNoteChanges(id)

    RT-->>PP: channel ready
    PP-->>UI: production context available
```

## Data Flow - Preset Updates

```mermaid
sequenceDiagram
    participant C as Component
    participant Hook as useProductionXPresets
    participant PP as ProductionProvider
    participant API as API Route
    participant SB as Supabase RPC
    participant RT as Realtime

    C->>Hook: savePreset(preset)

    alt Production Mode
        Hook->>PP: updateXPreset(preset)
        PP->>API: PUT /api/productions/[id]/x-presets
        API->>SB: upsert_jsonb_preset RPC
        SB-->>API: updated JSONB
        API-->>PP: success
        SB->>RT: broadcast change
        RT-->>PP: production updated
        PP->>PP: refetch & update context
        PP-->>C: re-render with new presets
    else Demo Mode
        Hook->>Hook: store.addPreset() or updatePreset()
        Hook-->>C: localStorage persisted
    end
```

## Data Flow - Notes CRUD

```mermaid
sequenceDiagram
    participant UI as NotesTable
    participant NP as NotesProvider
    participant SA as StorageAdapter
    participant SB as Supabase
    participant OQ as OperationQueue
    participant Undo as UndoStore
    participant RT as Realtime

    UI->>NP: updateNote(id, changes)

    alt Online
        NP->>Undo: push(UndoableCommand)
        NP->>SA: notes.update(id, changes)
        SA->>SB: UPDATE notes SET ... WHERE id = ?
        SB-->>SA: updated note
        SA-->>NP: Note
        SB->>RT: broadcast INSERT/UPDATE
        RT-->>NP: onNoteUpdate (deduped)
    else Offline
        NP->>Undo: push(UndoableCommand)
        NP->>OQ: enqueue({type: 'update', noteId, changes})
        OQ-->>OQ: persist to localStorage
        Note over OQ: When online...
        OQ->>SA: processQueue()
        SA->>SB: execute pending ops
        OQ->>OQ: markNoteAsSynced(id)
    end

    UI->>Undo: Ctrl+Z
    Undo-->>UI: peekUndo() → command
    UI->>NP: rollback to previousState
    UI->>Undo: commitUndo()
```

## Offline Operation Queue

```mermaid
stateDiagram-v2
    [*] --> Online: App starts

    Online --> Offline: navigator.onLine = false
    Offline --> Online: navigator.onLine = true

    state Online {
        [*] --> DirectAPI: User action
        DirectAPI --> Success: API responds
        DirectAPI --> Enqueue: API fails
        Success --> [*]
    }

    state Offline {
        [*] --> Enqueue: User action
        Enqueue --> Queued: Save to localStorage
        Queued --> Queued: More actions
    }

    Online --> ProcessQueue: Check for pending ops
    state ProcessQueue {
        [*] --> Execute: For each op
        Execute --> RetryOp: Failure (max 3)
        Execute --> Remove: Success
        RetryOp --> Execute: Backoff (1s, 2s, 4s)
        RetryOp --> Failed: Max retries
        Remove --> [*]
        Failed --> [*]
    }

    note right of Queued: 2-hour TTL on operations
    note right of ProcessQueue: wasRecentlySynced() prevents\nrealtime duplication
```

## Zustand Store Map

```mermaid
graph TB
    subgraph CoreData["Core Data Stores"]
        ProdStore["production-store<br/>name, abbreviation, logo<br/>(localStorage)"]
        ScriptStore["script-store<br/>pages, scenes, songs<br/>(in-memory)"]
        FixtureStore["fixture-store<br/>fixtures, workNoteLinks<br/>(localStorage)"]
        MockStore["mock-notes-store<br/>notes per module<br/>(in-memory, demo only)"]
    end

    subgraph PresetStores["Preset Stores (system + user pattern)"]
        FSP["filter-sort-presets-store<br/>dynamic system presets<br/>(localStorage, v1)"]
        PP["print-presets-store<br/>depends on filter presets<br/>(localStorage, v2)"]
        EMP["email-message-presets-store<br/>depends on filter presets<br/>(localStorage, v3)"]
        PSP["page-style-presets-store<br/>3 hardcoded defaults<br/>(localStorage, v1)"]
    end

    subgraph ConfigStores["Configuration Stores"]
        CT["custom-types-store<br/>types per module + overrides<br/>(localStorage, skipHydration)"]
        CP["custom-priorities-store<br/>priorities per module + overrides<br/>(localStorage, skipHydration)"]
    end

    subgraph UIStores["UI State Stores"]
        CL["column-layout-store<br/>column widths per module<br/>(localStorage, v1)"]
        SB["sidebar-store<br/>collapsed state<br/>(localStorage, skipHydration)"]
        TM["tablet-mode-store<br/>tablet mode toggle<br/>(localStorage)"]
        NF["notes-filter-store<br/>filter/sort/search state<br/>(in-memory)"]
    end

    subgraph AdvancedStores["Advanced State Stores"]
        OQ["operation-queue-store<br/>offline queue, sync tracking<br/>(localStorage, 2hr TTL)"]
        US["undo-store<br/>undo/redo stack (max 50)<br/>(session only)"]
        PS["position-store<br/>stage position ordering<br/>(localStorage, v1)"]
    end

    FSP -->|"system presets depend on"| CT
    FSP -->|"system presets depend on"| CP
    PP -->|"depends on"| FSP
    EMP -->|"depends on"| FSP
```

## Component Architecture

```mermaid
graph TD
    subgraph Layout["Layout Layer"]
        DashLayout["(dashboard)/layout.tsx<br/>Sidebar + Main Content"]
        ProdLayout["production/[id]/layout.tsx<br/>ProductionProvider wrapper"]
    end

    subgraph NotesTables["Notes Tables (per module)"]
        CueTable["cue-notes-table.tsx"]
        WorkTable["work-notes-table.tsx"]
        ProdTable["production-notes-table.tsx"]
        PreviewTable["notes-preview-table.tsx"]
    end

    subgraph Cells["Table Cells"]
        PriorityCell["priority-cell"]
        TypeCell["type-cell"]
        ScriptLookup["script-lookup-cell"]
        FixtureAgg["fixture-aggregate-cell"]
    end

    subgraph Columns["Column Definitions"]
        CueCols["cue-columns.tsx"]
        WorkCols["work-columns.tsx"]
        ProdCols["production-columns.tsx"]
        FixCols["fixture-columns.tsx"]
    end

    subgraph Sidebars["Action Sidebars"]
        PrintSB["print-notes-sidebar"]
        EmailSB["email-notes-sidebar"]
        HookupSB["hookup-import-sidebar"]
    end

    subgraph Presets["Preset Management"]
        PresetWizard["preset-wizard.tsx"]
        PresetCard["preset-card.tsx"]
        PresetGrid["preset-card-grid.tsx"]
        FSManager["filter-sort-presets-manager"]
        PrintManager["print-presets-manager"]
        PSManager["page-style-presets-manager"]
    end

    subgraph PDF["PDF Generation"]
        CuePDF["CueNotesPDF"]
        WorkPDF["WorkNotesPDF"]
        ProdPDF["ProductionNotesPDF"]
        PDFShared["shared/ (Header, Footer, Table, styles)"]
    end

    subgraph Settings["Settings Components"]
        TypesMgr["types-manager"]
        PriorMgr["priorities-manager"]
        PosMgr["position-manager"]
    end

    DashLayout --> NotesTables
    ProdLayout --> DashLayout
    NotesTables --> Cells
    NotesTables --> Columns
    NotesTables --> Sidebars
    Sidebars --> Presets
    Sidebars --> PDF
    PDF --> PDFShared
```

## API Routes

```mermaid
graph LR
    subgraph ProductionMgmt["Production Management"]
        GetProd["GET /productions/[id]"]
        PutProd["PUT /productions/[id]"]
        DelProd["POST /productions/[id]/delete"]
        RestProd["POST /productions/[id]/restore"]
        JoinProd["POST /productions/join"]
        AdminDel["DELETE /admin/productions/[id]/permanent"]
    end

    subgraph PresetAPIs["Preset APIs (GET/PUT/DELETE each)"]
        Email["/productions/[id]/email-presets"]
        Filter["/productions/[id]/filter-sort-presets"]
        Print["/productions/[id]/print-presets"]
        PageStyle["/productions/[id]/page-style-presets"]
    end

    subgraph ConfigAPIs["Config APIs (GET/PUT)"]
        Types["/productions/[id]/custom-types-config"]
        Priorities["/productions/[id]/custom-priorities-config"]
    end

    subgraph SnapshotAPIs["Snapshot APIs"]
        CreateSnap["POST /productions/[id]/snapshot"]
        ListSnap["GET /productions/[id]/snapshots"]
        GetSnap["GET .../snapshots/[snapshotId]"]
        DiffSnap["GET .../snapshots/[snapshotId]/diff"]
        DelSnap["DELETE .../snapshots/[snapshotId]"]
    end

    subgraph UtilAPIs["Utility APIs"]
        SendEmail["POST /email/send"]
        BugReport["POST /bug-report"]
        Invitations["POST /invitations"]
        AcceptInv["POST /invitations/accept"]
        Import["POST /productions/import"]
    end

    subgraph CronAPIs["Cron Jobs"]
        KeepAlive["POST /cron/keep-alive"]
        CleanProd["POST /cron/cleanup-productions"]
        CleanSnap["POST /cron/cleanup-snapshots"]
    end

    PresetAPIs -->|"upsert_jsonb_preset RPC"| SB["Supabase"]
    ConfigAPIs -->|"direct UPDATE"| SB
    ProductionMgmt --> SB
    SnapshotAPIs --> SB
```

## Module System

```mermaid
graph TB
    subgraph Modules["Module Types"]
        Cue["Cue Notes<br/>color: purple<br/>ModuleType: 'cue'"]
        Work["Work Notes<br/>color: blue<br/>ModuleType: 'work'"]
        Prod["Production Notes<br/>color: cyan<br/>ModuleType: 'production'"]
        Actor["Actor<br/>ModuleType: 'actor'"]
    end

    subgraph PerModule["Per-Module Configuration"]
        CustomTypes["Custom Types<br/>cue: 10-12 system defaults<br/>work: 10-12 system defaults<br/>production: 10-12 system defaults"]
        CustomPrio["Custom Priorities<br/>cue/prod: 1-5 scale<br/>work: 1-9 scale"]
        ColLayout["Column Layouts<br/>per module per profile"]
        FilterPresets["Filter/Sort Presets<br/>system presets depend on<br/>visible types & priorities"]
    end

    subgraph StatusColors["Status Colors"]
        Todo["Todo = blue"]
        Complete["Complete = green"]
        Cancelled["Cancelled = gray"]
    end

    subgraph PriorityColors["Priority Colors"]
        High["High = red"]
        Medium["Medium = orange"]
        Low["Low = green"]
    end

    Modules --> PerModule
```

## Realtime Sync

```mermaid
sequenceDiagram
    participant SB as Supabase DB
    participant RT as Realtime Channel
    participant PP as ProductionProvider
    participant NP as NotesProvider
    participant OQ as OperationQueue
    participant UI as Components

    Note over RT: Channel: production-{id}

    SB->>RT: postgres_changes (notes table)

    alt INSERT
        RT->>NP: onNoteInsert(note)
        NP->>OQ: wasRecentlySynced(noteId)?
        alt Not recently synced
            NP->>UI: add note to state
        else Recently synced (our own change)
            NP->>NP: skip (prevent duplication)
        end
    end

    alt UPDATE
        RT->>NP: onNoteUpdate(note)
        NP->>UI: update note in state
    end

    alt DELETE
        RT->>NP: onNoteDelete(noteId)
        NP->>UI: remove note from state
    end

    SB->>RT: postgres_changes (productions table)
    RT->>PP: production config changed
    PP->>PP: refetch()
    PP->>UI: new presets/configs via context

    Note over RT: Retry: 3 attempts<br/>Backoff: 1s, 2s, 4s
```

---

## Key Patterns Reference

### System vs Custom Pattern
- System defaults: hardcoded or dynamically generated (prefixed `sys-`)
- Custom: user-defined, stored in JSONB
- Overrides: modify system default label/color/hidden
- Final list = merge(system + custom + overrides)

### Production Config JSONB Pattern
1. Migration: add JSONB column to `productions` table
2. API Route: `app/api/productions/[id]/<config>/route.ts`
3. Storage Adapter: map column in `getProduction()`
4. Production Provider: add to interface, context, sync
5. Hook: `lib/hooks/use-production-<feature>.ts`
6. Zustand Store: `loadFromProduction()` + `getConfig()`

### Demo Mode Fallback
- Production context = null → hooks use local Zustand stores
- Stores persist to localStorage/sessionStorage
- No API calls; mock data via mock-notes-store

### Auth Flow
All API routes: `supabase.auth.getUser()` → `isProductionMember()` or `isProductionAdmin()`
