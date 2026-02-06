import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember } from '@/lib/services/production-members'
import type { CustomTypesConfig } from '@/types'

// Type helper for Supabase client with new columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * GET /api/productions/[id]/custom-types-config
 * Get the custom types config for a production
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

    // Fetch production custom types config
    const { data: production, error: prodError } = await supabase
      .from('productions')
      .select('custom_types_config')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (prodError || !production) {
      return NextResponse.json(
        { error: 'Production not found' },
        { status: 404 }
      )
    }

    const defaultConfig: CustomTypesConfig = {
      customTypes: { cue: [], work: [], production: [], actor: [] },
      systemOverrides: [],
    }

    return NextResponse.json({
      customTypesConfig: production.custom_types_config || defaultConfig,
    })
  } catch (error) {
    console.error('Error fetching custom types config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom types config' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/productions/[id]/custom-types-config
 * Replace the entire custom types config for a production
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

    const config: CustomTypesConfig = await request.json()

    // Validate config structure
    if (!config.customTypes || !config.systemOverrides) {
      return NextResponse.json(
        { error: 'Invalid config structure: must include customTypes and systemOverrides' },
        { status: 400 }
      )
    }

    // Update the production
    const { error: updateError } = await supabase
      .from('productions')
      .update({ custom_types_config: config })
      .eq('id', id)
      .is('deleted_at', null)

    if (updateError) {
      console.error('Error updating custom types config:', updateError)
      return NextResponse.json(
        { error: 'Failed to update custom types config' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      customTypesConfig: config,
    })
  } catch (error) {
    console.error('Error updating custom types config:', error)
    return NextResponse.json(
      { error: 'Failed to update custom types config' },
      { status: 500 }
    )
  }
}
