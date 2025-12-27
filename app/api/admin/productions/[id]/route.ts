import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth'
import { updateProduction, softDeleteProduction, getProduction } from '@/lib/supabase/supabase-storage-adapter'

/**
 * GET /api/admin/productions/[id]
 * Get a single production (super admin only)
 */
export async function GET(
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

    const production = await getProduction(id)
    if (!production) {
      return NextResponse.json({ error: 'Production not found' }, { status: 404 })
    }

    return NextResponse.json(production)
  } catch (error) {
    console.error('Error fetching production:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/productions/[id]
 * Update a production (super admin only)
 */
export async function PUT(
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

    const body = await request.json()
    const { name, abbreviation, logo, description, startDate, endDate } = body

    // Validate required fields
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (abbreviation !== undefined && !abbreviation.trim()) {
      return NextResponse.json({ error: 'Abbreviation is required' }, { status: 400 })
    }

    const production = await updateProduction(id, {
      name,
      abbreviation,
      logo,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    })

    return NextResponse.json(production)
  } catch (error) {
    console.error('Error updating production:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/productions/[id]
 * Soft-delete a production (move to trash) (super admin only)
 */
export async function DELETE(
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

    await softDeleteProduction(id, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error soft-deleting production:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
