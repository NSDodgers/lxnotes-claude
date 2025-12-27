import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth'
import { getAllProductionsForAdmin } from '@/lib/supabase/supabase-storage-adapter'

/**
 * GET /api/admin/productions
 * Get all productions including deleted (super admin only)
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

    const productions = await getAllProductionsForAdmin()
    return NextResponse.json(productions)
  } catch (error) {
    console.error('Error fetching productions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
