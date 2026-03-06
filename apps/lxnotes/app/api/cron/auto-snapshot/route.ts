import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadSnapshotToStorage } from '@/lib/supabase/snapshot-storage'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * GET /api/cron/auto-snapshot
 * Creates scheduled auto-snapshots for all active productions.
 *
 * This endpoint is called by Vercel Cron
 * Schedule: Every 6 hours
 */
export async function GET(request: Request) {
  try {
    // Verify the cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET is not configured')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient() as SupabaseAny

    const { data, error } = await supabase.rpc('create_scheduled_snapshots')

    if (error) {
      console.error('Error creating scheduled snapshots:', error)
      return NextResponse.json({ error: 'Failed to create scheduled snapshots' }, { status: 500 })
    }

    // Handle both old (integer) and new (JSONB) return formats
    const isJsonb = typeof data === 'object' && data !== null
    const created = isJsonb ? data.created : (data || 0)
    const errors = isJsonb ? data.errors : 0
    const snapshotIds: string[] = isJsonb ? (data.snapshot_ids || []) : []

    console.log(`Created ${created} scheduled snapshots (${errors} errors)`)

    // Upload each new snapshot to storage (best-effort)
    let storageUploads = 0
    if (snapshotIds.length > 0) {
      // Fetch the newly created snapshots to get production_id and snapshot_data
      const { data: snapshots, error: fetchError } = await supabase
        .from('production_snapshots')
        .select('id, production_id, snapshot_data')
        .in('id', snapshotIds)

      if (fetchError) {
        console.error('Error fetching snapshots for storage upload:', fetchError)
      } else if (snapshots) {
        const results = await Promise.allSettled(
          snapshots.map((s: { id: string; production_id: string; snapshot_data: unknown }) =>
            uploadSnapshotToStorage(s.production_id, s.id, s.snapshot_data)
          )
        )

        storageUploads = results.filter(
          (r) => r.status === 'fulfilled' && r.value !== null
        ).length
        console.log(`Uploaded ${storageUploads}/${snapshotIds.length} snapshots to storage`)
      }
    }

    return NextResponse.json({
      success: true,
      created,
      errors,
      storageUploads,
    })
  } catch (error) {
    console.error('Error in auto-snapshot cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
