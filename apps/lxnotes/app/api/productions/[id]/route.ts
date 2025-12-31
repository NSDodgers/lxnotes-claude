import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember } from '@/lib/services/production-members'

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
      .select('id, name, abbreviation, short_code, app_id')
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
    })
  } catch (error) {
    console.error('Error fetching production:', error)
    return NextResponse.json(
      { error: 'Failed to fetch production' },
      { status: 500 }
    )
  }
}
