import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember, isProductionAdmin } from '@/lib/services/production-members'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * GET /api/productions/[id]/snapshots/[snapshotId]
 * Fetch a single snapshot's full data for download
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  try {
    const { id, snapshotId } = await params
    const supabase = await createClient() as SupabaseAny

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Any member can download snapshots
    const isMember = await isProductionMember(id, user.id)
    if (!isMember) {
      return NextResponse.json(
        { error: 'Not a member of this production' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('production_snapshots')
      .select('id, snapshot_data, trigger_reason, entity_counts, created_at, created_by, note')
      .eq('id', snapshotId)
      .eq('production_id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to fetch snapshot' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/productions/[id]/snapshots/[snapshotId]
 * Delete a snapshot (admin only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  try {
    const { id, snapshotId } = await params
    const supabase = await createClient() as SupabaseAny

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete snapshots
    const admin = await isProductionAdmin(id, user.id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Only production admins can delete snapshots' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('production_snapshots')
      .delete()
      .eq('id', snapshotId)
      .eq('production_id', id)

    if (error) {
      console.error('Error deleting snapshot:', error)
      return NextResponse.json(
        { error: 'Failed to delete snapshot' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to delete snapshot' },
      { status: 500 }
    )
  }
}
