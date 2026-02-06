import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember } from '@/lib/services/production-members'
import type { CustomPrioritiesConfig } from '@/types'

// Type helper for Supabase client with new columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * GET /api/productions/[id]/custom-priorities-config
 * Get the custom priorities config for a production
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

    // Fetch production custom priorities config
    const { data: production, error: prodError } = await supabase
      .from('productions')
      .select('custom_priorities_config')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (prodError || !production) {
      return NextResponse.json(
        { error: 'Production not found' },
        { status: 404 }
      )
    }

    const defaultConfig: CustomPrioritiesConfig = {
      customPriorities: { cue: [], work: [], production: [], actor: [] },
      systemOverrides: [],
    }

    return NextResponse.json({
      customPrioritiesConfig: production.custom_priorities_config || defaultConfig,
    })
  } catch (error) {
    console.error('Error fetching custom priorities config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom priorities config' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/productions/[id]/custom-priorities-config
 * Replace the entire custom priorities config for a production
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

    const config: CustomPrioritiesConfig = await request.json()

    // Validate config structure
    if (!config.customPriorities || !config.systemOverrides) {
      return NextResponse.json(
        { error: 'Invalid config structure: must include customPriorities and systemOverrides' },
        { status: 400 }
      )
    }

    // Update the production
    const { error: updateError } = await supabase
      .from('productions')
      .update({ custom_priorities_config: config })
      .eq('id', id)
      .is('deleted_at', null)

    if (updateError) {
      console.error('Error updating custom priorities config:', updateError)
      return NextResponse.json(
        { error: 'Failed to update custom priorities config' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      customPrioritiesConfig: config,
    })
  } catch (error) {
    console.error('Error updating custom priorities config:', error)
    return NextResponse.json(
      { error: 'Failed to update custom priorities config' },
      { status: 500 }
    )
  }
}
