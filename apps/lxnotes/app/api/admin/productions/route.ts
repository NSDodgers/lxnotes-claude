import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth'

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

    // Get all productions (including deleted) using server-side client
    const { data, error } = await supabase
      .from('productions')
      .select('*')
      .eq('is_demo', false)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching productions:', error)
      return NextResponse.json({ error: 'Failed to fetch productions' }, { status: 500 })
    }

    // Map to frontend format
    const productions = (data || []).map(row => ({
      id: row.id,
      name: row.name,
      abbreviation: row.abbreviation,
      logo: row.logo ?? undefined,
      description: row.description ?? undefined,
      startDate: row.start_date ? new Date(row.start_date) : undefined,
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      createdAt: new Date(row.created_at!),
      updatedAt: new Date(row.updated_at!),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      deletedBy: row.deleted_by ?? undefined,
    }))

    return NextResponse.json(productions)
  } catch (error) {
    console.error('Error fetching productions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
