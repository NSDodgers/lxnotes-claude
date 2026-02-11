import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * GET /api/cron/cleanup-snapshots
 * Tiered snapshot retention across all productions:
 *   0-14 days:  keep all snapshots
 *   15-90 days: thin to 1/day (manual snapshots exempt)
 *   90+ days:   delete
 *
 * This endpoint is called by Vercel Cron
 * Schedule: Daily at 1am UTC
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

    const supabase = await createClient() as SupabaseAny

    const { data: deletedCount, error } = await supabase.rpc('cleanup_old_snapshots')

    if (error) {
      console.error('Error cleaning up snapshots:', error)
      return NextResponse.json({ error: 'Failed to clean up snapshots' }, { status: 500 })
    }

    console.log(`Cleaned up ${deletedCount || 0} old snapshots`)

    return NextResponse.json({
      success: true,
      deletedCount: deletedCount || 0,
    })
  } catch (error) {
    console.error('Error in cleanup-snapshots cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
