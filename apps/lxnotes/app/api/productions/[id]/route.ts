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
 * PUT /api/productions/[id]
 * Update production name, abbreviation, and/or logo
 */
export async function PUT(
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

    // Check if user is an admin of this production
    const admin = await isProductionAdmin(id, user.id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Only production admins can update production info' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, abbreviation, logo } = body

    // Validate: non-empty if provided
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }
    if (abbreviation !== undefined && !abbreviation.trim()) {
      return NextResponse.json({ error: 'Abbreviation cannot be empty' }, { status: 400 })
    }

    // Build partial update
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (abbreviation !== undefined) updates.abbreviation = abbreviation
    if (logo !== undefined) updates.logo = logo || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('productions')
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
      .select('id, name, abbreviation, logo')
      .single()

    if (error) {
      console.error('Error updating production:', error)
      return NextResponse.json({ error: 'Failed to update production' }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      abbreviation: data.abbreviation,
      logo: data.logo ?? undefined,
    })
  } catch (error) {
    console.error('Error updating production:', error)
    return NextResponse.json(
      { error: 'Failed to update production' },
      { status: 500 }
    )
  }
}

