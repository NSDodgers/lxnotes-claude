import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember } from '@/lib/services/production-members'
import type { EmailMessagePreset } from '@/types'

// Type helper for Supabase client with new columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * GET /api/productions/[id]/email-presets
 * Get all email presets for a production
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

    // Fetch production email presets
    const { data: production, error: prodError } = await supabase
      .from('productions')
      .select('email_presets')
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
      emailPresets: production.email_presets || [],
    })
  } catch (error) {
    console.error('Error fetching email presets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email presets' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/productions/[id]/email-presets
 * Create or update an email preset for a production
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

    const preset: EmailMessagePreset = await request.json()

    // Validate preset structure
    if (!preset.id || !preset.name || !preset.type || preset.type !== 'email_message') {
      return NextResponse.json(
        { error: 'Invalid preset structure' },
        { status: 400 }
      )
    }

    // Get current presets
    const { data: production, error: fetchError } = await supabase
      .from('productions')
      .select('email_presets')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !production) {
      return NextResponse.json(
        { error: 'Production not found' },
        { status: 404 }
      )
    }

    const currentPresets: EmailMessagePreset[] = production.email_presets || []

    // Update existing preset or add new one
    const existingIndex = currentPresets.findIndex(p => p.id === preset.id)
    let updatedPresets: EmailMessagePreset[]

    if (existingIndex >= 0) {
      // Update existing preset
      updatedPresets = [...currentPresets]
      updatedPresets[existingIndex] = {
        ...preset,
        updatedAt: new Date(),
      }
    } else {
      // Add new preset
      updatedPresets = [
        ...currentPresets,
        {
          ...preset,
          productionId: id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
    }

    // Update the production
    const { error: updateError } = await supabase
      .from('productions')
      .update({ email_presets: updatedPresets })
      .eq('id', id)
      .is('deleted_at', null)

    if (updateError) {
      console.error('Error updating email presets:', updateError)
      return NextResponse.json(
        { error: 'Failed to update email preset' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      emailPresets: updatedPresets,
    })
  } catch (error) {
    console.error('Error updating email preset:', error)
    return NextResponse.json(
      { error: 'Failed to update email preset' },
      { status: 500 }
    )
  }
}
