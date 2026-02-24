import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth'

/**
 * GET /api/admin/email-settings
 * Get MailerSend settings (super admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check super admin
    if (!await isSuperAdmin(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'mailersend')
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error fetching email settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Return settings (mask API key for security)
    const settings = data?.value as Record<string, unknown> | null
    if (settings?.apiKey) {
      const apiKey = settings.apiKey as string
      settings.apiKey = apiKey.slice(0, 8) + '...' + apiKey.slice(-4)
      settings.apiKeySet = true
    } else {
      settings && (settings.apiKeySet = false)
    }

    return NextResponse.json(settings || { apiKeySet: false })
  } catch (error) {
    console.error('Error in email settings GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/email-settings
 * Update MailerSend settings (super admin only)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check super admin
    if (!await isSuperAdmin(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { apiKey, fromEmail, fromName, templateId, notesDistributionTemplateId } = body

    // Validate required fields
    if (!fromEmail || !fromName) {
      return NextResponse.json(
        { error: 'From email and name are required' },
        { status: 400 }
      )
    }

    // Get existing settings to preserve API key if not provided
    let finalApiKey = apiKey
    if (!apiKey || apiKey.includes('...')) {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'mailersend')
        .single()

      if (existing?.value) {
        finalApiKey = (existing.value as Record<string, unknown>).apiKey
      }
    }

    const settings = {
      apiKey: finalApiKey,
      fromEmail,
      fromName,
      templateId: templateId || null,
      notesDistributionTemplateId: notesDistributionTemplateId || null,
    }

    // Upsert settings
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key: 'mailersend', value: settings, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('Error saving email settings:', error)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in email settings POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/email-settings/test
 * Send a test email (super admin only)
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check super admin
    if (!await isSuperAdmin(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { testEmail } = body

    if (!testEmail) {
      return NextResponse.json({ error: 'Test email is required' }, { status: 400 })
    }

    // Get settings
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'mailersend')
      .single()

    if (error || !data?.value) {
      return NextResponse.json(
        { error: 'MailerSend is not configured' },
        { status: 400 }
      )
    }

    const settings = data.value as {
      apiKey: string
      fromEmail: string
      fromName: string
    }

    if (!settings.apiKey) {
      return NextResponse.json(
        { error: 'MailerSend API key is not set' },
        { status: 400 }
      )
    }

    // Send test email
    const { sendTestEmail } = await import('@/lib/services/mailersend')
    await sendTestEmail(settings, testEmail)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test email' },
      { status: 500 }
    )
  }
}
