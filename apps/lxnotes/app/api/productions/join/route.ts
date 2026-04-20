import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Result type for join_production_by_short_code RPC */
interface JoinByShortCodeResult {
  success: boolean
  error?: 'invalid_code'
  production_id?: string
  production_name?: string
  role?: 'admin' | 'member'
  already_member?: boolean
}

/**
 * POST /api/productions/join
 * Join a production via its share short_code. Scoping by code (not raw
 * productionId) prevents a caller from auto-joining any production whose
 * UUID they happen to know.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: code' },
        { status: 400 }
      )
    }

    const { createAdminClient } = await import('@/lib/supabase/admin')
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch {
      console.error('Could not create admin client for join')
      return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient.rpc as any)('join_production_by_short_code', {
      p_code: code,
      p_user_id: user.id,
    }) as { data: JoinByShortCodeResult | null; error: Error | null }

    if (error || !data) {
      console.error('Error joining production:', error)
      return NextResponse.json({ error: 'Failed to join production' }, { status: 500 })
    }

    if (!data.success) {
      if (data.error === 'invalid_code') {
        return NextResponse.json({ error: 'Production not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to join production' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      productionId: data.production_id,
      productionName: data.production_name,
      role: data.role,
      alreadyMember: data.already_member ?? false,
    }, { status: 201 })
  } catch (error) {
    console.error('Error joining production:', error)
    return NextResponse.json(
      { error: 'Failed to join production' },
      { status: 500 }
    )
  }
}
