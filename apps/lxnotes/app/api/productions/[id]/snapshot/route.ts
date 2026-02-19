import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember, isProductionAdmin } from '@/lib/services/production-members'
import { MAX_SNAPSHOT_SIZE } from '@/lib/constants/snapshot'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * GET /api/productions/[id]/snapshot
 * Export a full production snapshot as JSON
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient() as SupabaseAny

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Any member can export
    const isMember = await isProductionMember(id, user.id)
    if (!isMember) {
      return NextResponse.json(
        { error: 'Not a member of this production' },
        { status: 403 }
      )
    }

    // Call RPC to export snapshot
    const { data, error } = await supabase.rpc('export_production_snapshot', {
      p_production_id: id,
    })

    if (error) {
      console.error('Error exporting production snapshot:', error)
      return NextResponse.json(
        { error: 'Failed to export production snapshot' },
        { status: 500 }
      )
    }

    // Add exportedBy to the snapshot
    const snapshot = { ...data, exportedBy: user.id }

    return NextResponse.json(snapshot)
  } catch (error) {
    console.error('Error exporting production snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to export production snapshot' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/productions/[id]/snapshot
 * Restore a production from a snapshot (admin only)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient() as SupabaseAny

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can restore
    const admin = await isProductionAdmin(id, user.id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Only production admins can restore snapshots' },
        { status: 403 }
      )
    }

    // Check Content-Length before reading body
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10)
    if (contentLength > MAX_SNAPSHOT_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      )
    }

    const body = await request.json()
    const { snapshot } = body

    if (!snapshot || snapshot.version !== 1) {
      return NextResponse.json(
        { error: 'Invalid snapshot: missing or unsupported version' },
        { status: 400 }
      )
    }

    // Warn if restoring a snapshot from a different production
    if (snapshot.productionId && snapshot.productionId !== id) {
      return NextResponse.json(
        { error: 'Snapshot was exported from a different production. Use clone mode to create a new production instead.' },
        { status: 400 }
      )
    }

    // Export current state for the response (client-side download)
    const { data: preRestoreSnapshot, error: exportError } = await supabase.rpc(
      'export_production_snapshot',
      { p_production_id: id }
    )

    if (exportError) {
      console.error('Error exporting pre-restore snapshot:', exportError)
      return NextResponse.json(
        { error: 'Failed to create pre-restore backup. Restore cancelled.' },
        { status: 500 }
      )
    }

    // Store the pre-restore snapshot server-side — blocks restore if this fails
    const { error: serverSnapshotError } = await supabase.rpc('create_production_snapshot', {
      p_production_id: id,
      p_trigger_reason: 'before_restore',
      p_created_by: user.id,
    })

    if (serverSnapshotError) {
      console.error('Pre-restore server-side snapshot failed:', serverSnapshotError)
      return NextResponse.json(
        { error: 'Failed to save pre-restore backup. Restore cancelled for safety.' },
        { status: 500 }
      )
    }

    // Call import RPC in restore mode
    const { data: result, error: importError } = await supabase.rpc(
      'import_production_snapshot',
      {
        p_production_id: id,
        p_snapshot: snapshot,
        p_mode: 'restore',
        p_user_id: user.id,
      }
    )

    if (importError) {
      console.error('Error restoring production snapshot:', importError)
      return NextResponse.json(
        { error: 'Failed to restore production snapshot' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...result,
      preRestoreSnapshot: { ...preRestoreSnapshot, exportedBy: user.id },
    })
  } catch (error) {
    console.error('Error restoring production snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to restore production snapshot' },
      { status: 500 }
    )
  }
}
