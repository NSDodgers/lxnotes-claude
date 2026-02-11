import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember } from '@/lib/services/production-members'
import type { DiffEntry, DiffSection, ProductionSnapshotCounts } from '@/types/snapshot'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SnapshotRecord = Record<string, any>

// ─── Field comparison helpers ─────────────────────────────────────────────────

function compareNoteFields(snap: SnapshotRecord, curr: SnapshotRecord): string[] {
  const changes: string[] = []
  if (snap.title !== curr.title) changes.push('title')
  if (snap.description !== curr.description) changes.push('description')
  if (snap.status !== curr.status) changes.push(`status: ${snap.status} → ${curr.status}`)
  if (snap.priority !== curr.priority) changes.push(`priority: ${snap.priority} → ${curr.priority}`)
  if (snap.type !== curr.type) changes.push(`type: ${snap.type} → ${curr.type}`)
  if (snap.cue_number !== curr.cue_number) changes.push('cue number')
  if (snap.assigned_to !== curr.assigned_to) changes.push('assignee')
  return changes
}

function compareFixtureFields(snap: SnapshotRecord, curr: SnapshotRecord): string[] {
  const changes: string[] = []
  if (snap.channel !== curr.channel) changes.push(`ch: ${snap.channel} → ${curr.channel}`)
  if (snap.position !== curr.position) changes.push(`position: ${snap.position} → ${curr.position}`)
  if (snap.unit_number !== curr.unit_number) changes.push('unit number')
  if (snap.fixture_type !== curr.fixture_type) changes.push('fixture type')
  if (snap.purpose !== curr.purpose) changes.push('purpose')
  if (String(snap.is_active) !== String(curr.is_active)) changes.push('active status')
  return changes
}

function compareSceneSongFields(snap: SnapshotRecord, curr: SnapshotRecord): string[] {
  const changes: string[] = []
  if (snap.name !== curr.name) changes.push('name')
  if (snap.type !== curr.type) changes.push(`type: ${snap.type} → ${curr.type}`)
  if (snap.first_cue_number !== curr.first_cue_number) changes.push('first cue number')
  if (snap.order_index !== curr.order_index) changes.push('order')
  return changes
}

// ─── Label formatters ─────────────────────────────────────────────────────────

function noteLabel(n: SnapshotRecord): string {
  const title = n.title || 'Untitled'
  if (n.module_type === 'cue' && n.cue_number) return `Cue ${n.cue_number} — ${title}`
  return title
}

function noteDetail(n: SnapshotRecord): string {
  const parts: string[] = []
  if (n.status) parts.push(n.status)
  if (n.priority) parts.push(n.priority)
  return parts.join(', ')
}

function fixtureLabel(f: SnapshotRecord): string {
  const parts: string[] = []
  if (f.channel != null) parts.push(`Ch ${f.channel}`)
  if (f.position) parts.push(`@ ${f.position}`)
  if (f.unit_number) parts.push(`#${f.unit_number}`)
  return parts.join(' ') || 'Unknown fixture'
}

function sceneSongLabel(s: SnapshotRecord): string {
  return s.name || 'Untitled'
}

// ─── Diff computation ─────────────────────────────────────────────────────────

const MAX_ENTRIES = 25

function diffRecords(
  snapshotRecords: SnapshotRecord[],
  currentRecords: SnapshotRecord[],
  labelFn: (r: SnapshotRecord) => string,
  detailFn: (r: SnapshotRecord) => string | undefined,
  compareFn: (snap: SnapshotRecord, curr: SnapshotRecord) => string[],
): { added: DiffEntry[]; removed: DiffEntry[]; modified: DiffEntry[]; totalAdded: number; totalRemoved: number; totalModified: number } {
  const snapMap = new Map(snapshotRecords.map(r => [r.id, r]))
  const currMap = new Map(currentRecords.map(r => [r.id, r]))

  const added: DiffEntry[] = []
  const removed: DiffEntry[] = []
  const modified: DiffEntry[] = []

  // Items in current but not in snapshot → added since snapshot
  for (const [id, curr] of currMap) {
    if (!snapMap.has(id)) {
      added.push({ label: labelFn(curr), detail: detailFn(curr) })
    } else {
      const snap = snapMap.get(id)!
      const changes = compareFn(snap, curr)
      if (changes.length > 0) {
        modified.push({ label: labelFn(curr), detail: detailFn(curr), changes })
      }
    }
  }

  // Items in snapshot but not in current → removed since snapshot
  for (const [id, snap] of snapMap) {
    if (!currMap.has(id)) {
      removed.push({ label: labelFn(snap), detail: detailFn(snap) })
    }
  }

  return {
    added: added.slice(0, MAX_ENTRIES),
    removed: removed.slice(0, MAX_ENTRIES),
    modified: modified.slice(0, MAX_ENTRIES),
    totalAdded: added.length,
    totalRemoved: removed.length,
    totalModified: modified.length,
  }
}

/**
 * GET /api/productions/[id]/snapshots/[snapshotId]/diff
 * Compare a stored snapshot against the current production state
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  try {
    const { id, snapshotId } = await params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isMember = await isProductionMember(id, user.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Not a member of this production' }, { status: 403 })
    }

    // Fetch snapshot data and current state in parallel
    const [snapshotResult, currentResult] = await Promise.all([
      supabase
        .from('production_snapshots')
        .select('snapshot_data, entity_counts')
        .eq('id', snapshotId)
        .eq('production_id', id)
        .single(),
      supabase.rpc('export_production_snapshot', { p_production_id: id }),
    ])

    if (snapshotResult.error || !snapshotResult.data) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
    }
    if (currentResult.error) {
      console.error('Error exporting current state for diff:', currentResult.error)
      return NextResponse.json({ error: 'Failed to load current production state' }, { status: 500 })
    }

    const snap = snapshotResult.data.snapshot_data
    const curr = currentResult.data
    const snapshotCounts: ProductionSnapshotCounts = snapshotResult.data.entity_counts || snap.counts
    const currentCounts: ProductionSnapshotCounts = curr.counts

    // Filter notes by active status (deleted_at IS NULL) for meaningful comparison
    const snapActiveNotes = (snap.notes || []).filter((n: SnapshotRecord) => !n.deleted_at)
    const currActiveNotes = (curr.notes || []).filter((n: SnapshotRecord) => !n.deleted_at)

    // Diff notes by module type
    const cueSnap = snapActiveNotes.filter((n: SnapshotRecord) => n.module_type === 'cue')
    const cueCurr = currActiveNotes.filter((n: SnapshotRecord) => n.module_type === 'cue')
    const workSnap = snapActiveNotes.filter((n: SnapshotRecord) => n.module_type === 'work')
    const workCurr = currActiveNotes.filter((n: SnapshotRecord) => n.module_type === 'work')
    const prodSnap = snapActiveNotes.filter((n: SnapshotRecord) => n.module_type === 'production')
    const prodCurr = currActiveNotes.filter((n: SnapshotRecord) => n.module_type === 'production')

    const cueDiff = diffRecords(cueSnap, cueCurr, noteLabel, noteDetail, compareNoteFields)
    const workDiff = diffRecords(workSnap, workCurr, noteLabel, noteDetail, compareNoteFields)
    const prodDiff = diffRecords(prodSnap, prodCurr, noteLabel, noteDetail, compareNoteFields)

    // Diff fixtures
    const fixtureDiff = diffRecords(
      snap.fixtures || [], curr.fixtures || [],
      fixtureLabel,
      (f: SnapshotRecord) => f.fixture_type || undefined,
      compareFixtureFields,
    )

    // Diff scenes/songs
    const sceneDiff = diffRecords(
      snap.scenesSongs || [], curr.scenesSongs || [],
      sceneSongLabel,
      (s: SnapshotRecord) => s.type || undefined,
      compareSceneSongFields,
    )

    // Script pages — just counts (no meaningful label beyond page number)
    const snapPageIds = new Set((snap.scriptPages || []).map((p: SnapshotRecord) => p.id))
    const currPageIds = new Set((curr.scriptPages || []).map((p: SnapshotRecord) => p.id))
    const allPagesAdded = (curr.scriptPages || [])
      .filter((p: SnapshotRecord) => !snapPageIds.has(p.id))
      .map((p: SnapshotRecord) => ({ label: `Page ${p.page_number}` }))
    const allPagesRemoved = (snap.scriptPages || [])
      .filter((p: SnapshotRecord) => !currPageIds.has(p.id))
      .map((p: SnapshotRecord) => ({ label: `Page ${p.page_number}` }))

    // Departments
    const deptDiff = diffRecords(
      snap.departments || [], curr.departments || [],
      (d: SnapshotRecord) => d.name || 'Unnamed',
      (d: SnapshotRecord) => d.color || undefined,
      (s: SnapshotRecord, c: SnapshotRecord) => {
        const changes: string[] = []
        if (s.name !== c.name) changes.push('name')
        if (String(s.is_active) !== String(c.is_active)) changes.push('active status')
        return changes
      },
    )

    // Build sections, only include non-empty ones
    const allSections: DiffSection[] = [
      { key: 'cueNotes', label: 'Cue Notes', ...cueDiff },
      { key: 'workNotes', label: 'Work Notes', ...workDiff },
      { key: 'productionNotes', label: 'Production Notes', ...prodDiff },
      { key: 'fixtures', label: 'Fixtures', ...fixtureDiff },
      { key: 'scriptPages', label: 'Script Pages', added: allPagesAdded.slice(0, MAX_ENTRIES), removed: allPagesRemoved.slice(0, MAX_ENTRIES), modified: [], totalAdded: allPagesAdded.length, totalRemoved: allPagesRemoved.length, totalModified: 0 },
      { key: 'scenesSongs', label: 'Scenes & Songs', ...sceneDiff },
      { key: 'departments', label: 'Departments', ...deptDiff },
    ]

    const sections = allSections.filter(
      s => s.added.length > 0 || s.removed.length > 0 || s.modified.length > 0
    )

    return NextResponse.json({ currentCounts, snapshotCounts, sections })
  } catch (error) {
    console.error('Error computing snapshot diff:', error)
    return NextResponse.json({ error: 'Failed to compute diff' }, { status: 500 })
  }
}
