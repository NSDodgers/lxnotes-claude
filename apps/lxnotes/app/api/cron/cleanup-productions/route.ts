import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/cron/cleanup-productions
 * Permanently delete productions that have been in trash for 30+ days
 *
 * This endpoint is called by Vercel Cron
 * Schedule: Daily at midnight UTC
 */
export async function GET(request: Request) {
  try {
    // Verify the cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // In production, verify the cron secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Calculate the cutoff date (30 days ago)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30)

    // Delete productions that have been in trash for 30+ days
    const { data, error } = await supabase
      .from('productions')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate.toISOString())
      .select('id, name')

    if (error) {
      console.error('Error cleaning up productions:', error)
      return NextResponse.json({ error: 'Failed to clean up productions' }, { status: 500 })
    }

    const deletedCount = data?.length || 0
    console.log(`Cleaned up ${deletedCount} productions that were in trash for 30+ days`)

    return NextResponse.json({
      success: true,
      deletedCount,
      deletedProductions: data?.map(p => ({ id: p.id, name: p.name })) || [],
    })
  } catch (error) {
    console.error('Error in cleanup-productions cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
