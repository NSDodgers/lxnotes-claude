import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

/**
 * POST /api/productions/import
 * Clone a new production from a snapshot (any authenticated user)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient() as SupabaseAny

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { snapshot } = body

    if (!snapshot || snapshot.version !== 1) {
      return NextResponse.json(
        { error: 'Invalid snapshot: missing or unsupported version' },
        { status: 400 }
      )
    }

    // Call import RPC in clone mode (p_production_id is null for clone)
    const { data: result, error: importError } = await supabase.rpc(
      'import_production_snapshot',
      {
        p_production_id: null,
        p_snapshot: snapshot,
        p_mode: 'clone',
        p_user_id: user.id,
      }
    )

    if (importError) {
      console.error('Error cloning production from snapshot:', importError)
      return NextResponse.json(
        { error: `Failed to clone production from snapshot: ${importError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error cloning production from snapshot:', error)
    return NextResponse.json(
      { error: `Failed to clone production from snapshot: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
