import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSuperAdmin } from '@/lib/auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * GET /api/admin/stats
 * Get platform-wide stats (super admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await isSuperAdmin(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient() as SupabaseAny

    // Run RPC + count queries in parallel
    const [
      rpcResult,
      productionsCount,
      activeProductionsCount,
      usersCount,
      notesCount,
      fixturesCount,
      snapshotsCount,
      scriptPagesCount,
    ] = await Promise.all([
      (supabase as SupabaseAny).rpc('admin_stats_aggregates'),
      admin.from('productions').select('*', { count: 'exact', head: true }).eq('is_demo', false),
      admin.from('productions').select('*', { count: 'exact', head: true }).eq('is_demo', false).is('deleted_at', null),
      admin.from('users').select('*', { count: 'exact', head: true }),
      admin.from('notes').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      admin.from('fixtures').select('*', { count: 'exact', head: true }).eq('is_active', true),
      admin.from('production_snapshots').select('*', { count: 'exact', head: true }),
      admin.from('script_pages').select('*', { count: 'exact', head: true }),
    ])

    if (rpcResult.error) {
      console.error('Error calling admin_stats_aggregates:', rpcResult.error)
      return NextResponse.json({ error: `RPC error: ${rpcResult.error.message}` }, { status: 500 })
    }

    const aggregated = rpcResult.data as Record<string, unknown>

    return NextResponse.json({
      ...aggregated,
      overview: {
        productions: activeProductionsCount.count ?? 0,
        productions_total: productionsCount.count ?? 0,
        productions_trashed: (productionsCount.count ?? 0) - (activeProductionsCount.count ?? 0),
        users: usersCount.count ?? 0,
        notes: notesCount.count ?? 0,
        fixtures: fixturesCount.count ?? 0,
        snapshots: snapshotsCount.count ?? 0,
        script_pages: scriptPagesCount.count ?? 0,
      },
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
