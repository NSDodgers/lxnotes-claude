import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth'
import { restoreProduction } from '@/lib/supabase/supabase-storage-adapter'

/**
 * POST /api/admin/productions/[id]/restore
 * Restore a production from trash (super admin only)
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

    // Check super admin
    if (!await isSuperAdmin(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await restoreProduction(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error restoring production:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
