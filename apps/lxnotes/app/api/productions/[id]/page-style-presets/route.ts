import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember } from '@/lib/services/production-members'
import type { PageStylePreset } from '@/types'

// Type helper for Supabase client with new columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * GET /api/productions/[id]/page-style-presets
 * Get all page style presets for a production
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

    // Fetch production page style presets
    const { data: production, error: prodError } = await supabase
      .from('productions')
      .select('page_style_presets')
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
      pageStylePresets: production.page_style_presets || [],
    })
  } catch (error) {
    console.error('Error fetching page style presets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page style presets' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/productions/[id]/page-style-presets
 * Create or update a page style preset for a production
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

    // Check if user is a member of this production
    const isMember = await isProductionMember(id, user.id)
    if (!isMember) {
      return NextResponse.json(
        { error: 'Not a member of this production' },
        { status: 403 }
      )
    }

    const preset: PageStylePreset = await request.json()

    // Validate preset structure
    if (!preset.id || !preset.name || !preset.type || preset.type !== 'page_style') {
      return NextResponse.json(
        { error: 'Invalid preset structure' },
        { status: 400 }
      )
    }

    // Atomic upsert via RPC (prevents read-modify-write race conditions)
    const presetWithTimestamps = {
      ...preset,
      productionId: id,
      updatedAt: new Date(),
      createdAt: preset.createdAt || new Date(),
    }

    const { data: updatedPresets, error: updateError } = await supabase.rpc('upsert_jsonb_preset', {
      p_production_id: id,
      p_column_name: 'page_style_presets',
      p_preset: presetWithTimestamps,
    })

    if (updateError) {
      console.error('Error updating page style presets:', updateError)
      return NextResponse.json(
        { error: 'Failed to update page style preset' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      pageStylePresets: updatedPresets || [],
    })
  } catch (error) {
    console.error('Error updating page style preset:', error)
    return NextResponse.json(
      { error: 'Failed to update page style preset' },
      { status: 500 }
    )
  }
}
