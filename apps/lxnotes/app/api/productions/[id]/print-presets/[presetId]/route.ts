import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember } from '@/lib/services/production-members'

// Type helper for Supabase client with new columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * DELETE /api/productions/[id]/print-presets/[presetId]
 * Delete a print preset from a production
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

    // Atomic delete via RPC (prevents read-modify-write race conditions)
    const { data: updatedPresets, error: updateError } = await supabase.rpc('delete_jsonb_preset', {
      p_production_id: id,
      p_column_name: 'print_presets',
      p_preset_id: presetId,
    })

    if (updateError) {
      console.error('Error deleting print preset:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete print preset' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      printPresets: updatedPresets || [],
    })
  } catch (error) {
    console.error('Error deleting print preset:', error)
    return NextResponse.json(
      { error: 'Failed to delete print preset' },
      { status: 500 }
    )
  }
}
