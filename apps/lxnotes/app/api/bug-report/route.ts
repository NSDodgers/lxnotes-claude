import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isDiscordWebhookConfigured, submitBugReport } from '@/lib/services/discord'

// Allow up to 6MB request bodies for screenshot payloads
export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isDiscordWebhookConfigured()) {
      return NextResponse.json(
        { error: 'Bug reporting is not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { title, description, severity, route, module, browser, os, timestamp, screenshotBase64 } = body

    // Validate required fields
    if (!title || typeof title !== 'string' || title.length > 200) {
      return NextResponse.json({ error: 'Title is required (max 200 chars)' }, { status: 400 })
    }
    if (!description || typeof description !== 'string' || description.length > 4000) {
      return NextResponse.json({ error: 'Description is required (max 4000 chars)' }, { status: 400 })
    }
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json({ error: 'Invalid severity' }, { status: 400 })
    }

    // Validate screenshot size (5MB base64 ~ 6.67MB string)
    if (screenshotBase64 && (typeof screenshotBase64 !== 'string' || screenshotBase64.length > 7_000_000)) {
      return NextResponse.json({ error: 'Screenshot too large (max 5MB)' }, { status: 400 })
    }

    // Enrich with server-side user info (don't trust client for identity)
    const reporterEmail = user.email || 'unknown'
    const reporterName = user.user_metadata?.full_name || user.user_metadata?.name || ''

    await submitBugReport({
      title: title.trim(),
      description: description.trim(),
      severity,
      route: typeof route === 'string' ? route : '/',
      module: typeof module === 'string' ? module : 'Unknown',
      browser: typeof browser === 'string' ? browser : 'Unknown',
      os: typeof os === 'string' ? os : 'Unknown',
      timestamp: typeof timestamp === 'string' ? timestamp : new Date().toISOString(),
      reporterEmail,
      reporterName,
      screenshotBase64,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bug report submission failed:', error)
    return NextResponse.json(
      { error: 'Failed to submit bug report' },
      { status: 500 }
    )
  }
}
