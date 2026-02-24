import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth'
import { getTemplates } from '@/lib/services/mailersend'

/**
 * GET /api/admin/email-settings/templates
 * Fetch available MailerSend templates (super admin only)
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

    // Get API key from settings
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

    const settings = data.value as { apiKey: string }
    if (!settings.apiKey) {
      return NextResponse.json(
        { error: 'MailerSend API key is not set' },
        { status: 400 }
      )
    }

    // Fetch templates from MailerSend
    const templates = await getTemplates(settings.apiKey)

    // Return simplified template list with just id and name
    const simplifiedTemplates = templates.map((t: { id: string; name: string }) => ({
      id: t.id,
      name: t.name,
    }))

    return NextResponse.json({ templates: simplifiedTemplates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}
