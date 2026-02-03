import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember } from '@/lib/services/production-members'
import type { PageStylePreset } from '@/types'

// Type helper for Supabase client with new columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * DELETE /api/productions/[id]/page-style-presets/[presetId]
 * Delete a page style preset from a production
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; presetId: string }> }
) {
  try {
    const { id, presetId } = await params
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

    // Get current presets
    const { data: production, error: fetchError } = await supabase
      .from('productions')
      .select('page_style_presets')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !production) {
      return NextResponse.json(
        { error: 'Production not found' },
        { status: 404 }
      )
    }

    const currentPresets: PageStylePreset[] = production.page_style_presets || []

    // Filter out the preset to delete
    const updatedPresets = currentPresets.filter(p => p.id !== presetId)

    // If nothing was removed, preset wasn't found
    if (updatedPresets.length === currentPresets.length) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    // Update the production
    const { error: updateError } = await supabase
      .from('productions')
      .update({ page_style_presets: updatedPresets })
      .eq('id', id)
      .is('deleted_at', null)

    if (updateError) {
      console.error('Error deleting page style preset:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete page style preset' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      pageStylePresets: updatedPresets,
    })
  } catch (error) {
    console.error('Error deleting page style preset:', error)
    return NextResponse.json(
      { error: 'Failed to delete page style preset' },
      { status: 500 }
    )
  }
}
