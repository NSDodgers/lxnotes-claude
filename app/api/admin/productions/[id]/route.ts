import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth'

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

    const { data, error } = await supabase
      .from('productions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Production not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      abbreviation: data.abbreviation,
      logo: data.logo ?? undefined,
      description: data.description ?? undefined,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      createdAt: new Date(data.created_at!),
      updatedAt: new Date(data.updated_at!),
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined,
      deletedBy: data.deleted_by ?? undefined,
    })
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

    // Build update object
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (abbreviation !== undefined) updates.abbreviation = abbreviation
    if (logo !== undefined) updates.logo = logo || null
    if (description !== undefined) updates.description = description || null
    if (startDate !== undefined) updates.start_date = startDate ? new Date(startDate).toISOString().split('T')[0] : null
    if (endDate !== undefined) updates.end_date = endDate ? new Date(endDate).toISOString().split('T')[0] : null

    const { data, error } = await supabase
      .from('productions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      id: data.id,
      name: data.name,
      abbreviation: data.abbreviation,
      logo: data.logo ?? undefined,
      description: data.description ?? undefined,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      createdAt: new Date(data.created_at!),
      updatedAt: new Date(data.updated_at!),
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined,
      deletedBy: data.deleted_by ?? undefined,
    })
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
