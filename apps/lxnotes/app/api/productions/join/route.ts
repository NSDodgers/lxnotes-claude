import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addProductionMember, isProductionMember } from '@/lib/services/production-members'

/**
 * POST /api/productions/join
 * Join a production as a member
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productionId } = body

    // Validate required fields
    if (!productionId) {
      return NextResponse.json(
        { error: 'Missing required field: productionId' },
        { status: 400 }
      )
    }

    // Check if production exists
    const { data: production, error: prodError } = await supabase
      .from('productions')
      .select('id, name')
      .eq('id', productionId)
      .is('deleted_at', null)
      .single()

    if (prodError || !production) {
      return NextResponse.json(
        { error: 'Production not found' },
        { status: 404 }
      )
    }

    // Check if already a member
    const isMember = await isProductionMember(productionId, user.id)
    if (isMember) {
      return NextResponse.json(
        { error: 'You are already a member of this production' },
        { status: 409 }
      )
    }

    // Add user as member
    const member = await addProductionMember(productionId, user.id, 'member')

    return NextResponse.json({
      success: true,
      member,
      productionId: production.id,
      productionName: production.name,
    }, { status: 201 })
  } catch (error) {
    console.error('Error joining production:', error)
    return NextResponse.json(
      { error: 'Failed to join production' },
      { status: 500 }
    )
  }
}
