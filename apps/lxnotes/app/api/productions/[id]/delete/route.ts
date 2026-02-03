import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionAdmin } from '@/lib/services/production-members'

/**
 * POST /api/productions/[id]/delete
 * Soft-delete a production (move to trash) - production admin only
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin of this production
    const isAdmin = await isProductionAdmin(id, user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - only production admins can delete' }, { status: 403 })
    }

    // Soft-delete: set deleted_at and deleted_by
    const { error } = await supabase
      .from('productions')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error soft-deleting production:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
