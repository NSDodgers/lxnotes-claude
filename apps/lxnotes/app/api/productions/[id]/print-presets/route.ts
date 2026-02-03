import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember } from '@/lib/services/production-members'
import type { PrintPreset } from '@/types'

// Type helper for Supabase client with new columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * GET /api/productions/[id]/print-presets
 * Get all print presets for a production
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

    // Fetch production print presets
    const { data: production, error: prodError } = await supabase
      .from('productions')
      .select('print_presets')
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
      printPresets: production.print_presets || [],
    })
  } catch (error) {
    console.error('Error fetching print presets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch print presets' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/productions/[id]/print-presets
 * Create or update a print preset for a production
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

    const preset: PrintPreset = await request.json()

    // Validate preset structure
    if (!preset.id || !preset.name || !preset.type || preset.type !== 'print') {
      return NextResponse.json(
        { error: 'Invalid preset structure' },
        { status: 400 }
      )
    }

    // Get current presets
    const { data: production, error: fetchError } = await supabase
      .from('productions')
      .select('print_presets')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !production) {
      return NextResponse.json(
        { error: 'Production not found' },
        { status: 404 }
      )
    }

    const currentPresets: PrintPreset[] = production.print_presets || []

    // Update existing preset or add new one
    const existingIndex = currentPresets.findIndex(p => p.id === preset.id)
    let updatedPresets: PrintPreset[]

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
      .update({ print_presets: updatedPresets })
      .eq('id', id)
      .is('deleted_at', null)

    if (updateError) {
      console.error('Error updating print presets:', updateError)
      return NextResponse.json(
        { error: 'Failed to update print preset' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      printPresets: updatedPresets,
    })
  } catch (error) {
    console.error('Error updating print preset:', error)
    return NextResponse.json(
      { error: 'Failed to update print preset' },
      { status: 500 }
    )
  }
}
