import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember, isProductionAdmin } from '@/lib/services/production-members'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * GET /api/productions/[id]/snapshots
 * List snapshots for a production (metadata only, not full snapshot_data)
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

    // Any member can list snapshots
    const isMember = await isProductionMember(id, user.id)
    if (!isMember) {
      return NextResponse.json(
        { error: 'Not a member of this production' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('production_snapshots')
      .select('id, trigger_reason, entity_counts, created_at, created_by, note')
      .eq('production_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error listing snapshots:', error)
      return NextResponse.json(
        { error: 'Failed to list snapshots' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error listing snapshots:', error)
    return NextResponse.json(
      { error: 'Failed to list snapshots' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/productions/[id]/snapshots
 * Create a manual checkpoint snapshot (admin only)
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

    // Only admins can create checkpoints
    const admin = await isProductionAdmin(id, user.id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Only production admins can create checkpoints' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const note = body.note || null

    const { data: snapshotId, error } = await supabase.rpc('create_production_snapshot', {
      p_production_id: id,
      p_trigger_reason: 'manual',
      p_created_by: user.id,
      p_note: note,
    })

    if (error) {
      console.error('Error creating checkpoint:', error)
      return NextResponse.json(
        { error: 'Failed to create checkpoint' },
        { status: 500 }
      )
    }

    return NextResponse.json({ id: snapshotId, success: true })
  } catch (error) {
    console.error('Error creating checkpoint:', error)
    return NextResponse.json(
      { error: 'Failed to create checkpoint' },
      { status: 500 }
    )
  }
}
