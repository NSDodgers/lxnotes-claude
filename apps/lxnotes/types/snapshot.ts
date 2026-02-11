/**
 * Production Snapshot Types
 *
 * Defines the shape of production snapshots used for backup, restore, and clone operations.
 * Snapshot data uses raw DB column names (snake_case) for lossless round-trip.
 */

export interface ProductionSnapshotMember {
  userId: string
  email: string
  fullName: string | null
  role: 'admin' | 'member'
}

export interface ProductionSnapshotCounts {
  notes: number
  activeNotes: number
  deletedNotes: number
  fixtures: number
  scriptPages: number
  scenesSongs: number
  workNoteFixtureLinks: number
  departments: number
  members: number
}

export interface ProductionSnapshot {
  version: 1
  exportedAt: string
  exportedBy?: string
  productionId: string
  productionName: string
  production: {
    name: string
    abbreviation: string
    logo: string | null
    description: string | null
    startDate: string | null
    endDate: string | null
    shortCode: string | null
    emailPresets: Record<string, unknown>[]
    filterSortPresets: Record<string, unknown>[]
    pageStylePresets: Record<string, unknown>[]
    printPresets: Record<string, unknown>[]
    customTypesConfig: Record<string, unknown>
    customPrioritiesConfig: Record<string, unknown>
  }
  notes: Record<string, unknown>[]
  scriptPages: Record<string, unknown>[]
  scenesSongs: Record<string, unknown>[]
  fixtures: Record<string, unknown>[]
  workNoteFixtureLinks: Record<string, unknown>[]
  positionOrders: Record<string, unknown>[]
  departments: Record<string, unknown>[]
  departmentMembers: Record<string, unknown>[]
  members: ProductionSnapshotMember[]
  counts: ProductionSnapshotCounts
}

export type SnapshotTriggerReason = 'manual' | 'before_restore' | 'before_fixture_import' | 'before_script_replace'

export interface SnapshotListItem {
  id: string
  trigger_reason: SnapshotTriggerReason
  entity_counts: ProductionSnapshotCounts | null
  created_at: string
  created_by: string | null
  note: string | null
}

// ─── Snapshot Diff Types ──────────────────────────────────────────────────────

export interface DiffEntry {
  label: string
  detail?: string
  changes?: string[] // for modified items: ["status: todo → complete", "priority: low → high"]
}

export interface DiffSection {
  key: string
  label: string
  added: DiffEntry[]    // in current, not in snapshot (would be lost on restore)
  removed: DiffEntry[]  // in snapshot, not in current (would return on restore)
  modified: DiffEntry[]  // in both, key fields changed (would revert on restore)
  totalAdded: number    // full count before truncation
  totalRemoved: number
  totalModified: number
}

export interface SnapshotDiff {
  currentCounts: ProductionSnapshotCounts
  snapshotCounts: ProductionSnapshotCounts
  sections: DiffSection[]
}
