import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember, isProductionAdmin } from '@/lib/services/production-members'

// Type helper for Supabase client with new tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * GET /api/productions/[id]
 * Get production details including short code
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

    // Check if user is a member of this production
    const isMember = await isProductionMember(id, user.id)
    if (!isMember) {
      return NextResponse.json(
        { error: 'Not a member of this production' },
        { status: 403 }
      )
    }

    // Fetch production details
    const { data: production, error: prodError } = await supabase
      .from('productions')
      .select('id, name, abbreviation, short_code, app_id, saved_recipients')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (prodError || !production) {
      return NextResponse.json(
        { error: 'Production not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: production.id,
      name: production.name,
      abbreviation: production.abbreviation,
      shortCode: production.short_code ?? '',
      appId: production.app_id,
      savedRecipients: production.saved_recipients || [],
    })
  } catch (error) {
    console.error('Error fetching production:', error)
    return NextResponse.json(
      { error: 'Failed to fetch production' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/productions/[id]
 * Update production settings (e.g., saved recipients)
 */
export async function PATCH(
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

    // Check if user is a member of this production
    const isMember = await isProductionMember(id, user.id)
    if (!isMember) {
      return NextResponse.json(
        { error: 'Not a member of this production' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { savedRecipients } = body

    // Build update object
    const updates: Record<string, unknown> = {}

    if (savedRecipients !== undefined) {
      // Validate that it's an array of strings (emails)
      if (!Array.isArray(savedRecipients) || !savedRecipients.every(r => typeof r === 'string')) {
        return NextResponse.json(
          { error: 'savedRecipients must be an array of strings' },
          { status: 400 }
        )
      }
      updates.saved_recipients = savedRecipients
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update the production
    const { data: production, error: updateError } = await supabase
      .from('productions')
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
      .select('id, saved_recipients')
      .single()

    if (updateError) {
      console.error('Error updating production:', updateError)
      return NextResponse.json(
        { error: 'Failed to update production' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: production.id,
      savedRecipients: production.saved_recipients || [],
    })
  } catch (error) {
    console.error('Error updating production:', error)
    return NextResponse.json(
      { error: 'Failed to update production' },
      { status: 500 }
    )
  }
}
