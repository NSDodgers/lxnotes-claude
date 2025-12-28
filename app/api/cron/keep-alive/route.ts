import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/cron/keep-alive
 * Ping the database to prevent Supabase from pausing due to inactivity
 *
 * This endpoint is called by GitHub Actions every 3 days
 * Supabase free tier pauses after 7 days of inactivity
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

    // Simple query to keep the database active
    const { error } = await supabase
      .from('productions')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Keep-alive query failed:', error)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    console.log('Keep-alive ping successful')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in keep-alive cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
