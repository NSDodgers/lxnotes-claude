import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { acceptInvitationByToken } from '@/lib/services/invitations'

/**
 * POST /api/invitations/accept
 * Accept an invitation by token (token-based flow without email matching)
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
    const { token } = body

    // Validate token format (must be a valid UUID)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!token || typeof token !== 'string' || !UUID_REGEX.test(token)) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 400 }
      )
    }

    // Accept the invitation
    const result = await acceptInvitationByToken(token, user.id)

    if (!result.success) {
      // Map errors to appropriate status codes and messages
      const errorMessages: Record<string, { message: string; status: number }> = {
        invalid_token: { message: 'This invitation link is invalid', status: 404 },
        already_accepted: { message: 'This invitation has already been used', status: 409 },
        cancelled: { message: 'This invitation has been cancelled', status: 410 },
        expired: { message: 'This invitation has expired', status: 410 },
      }

      const errorInfo = errorMessages[result.error || 'invalid_token'] || errorMessages.invalid_token

      return NextResponse.json(
        {
          error: errorInfo.message,
          code: result.error,
          // Include production_id and is_member for already_accepted case
          // so UI can redirect if the user is already a member
          productionId: result.production_id,
          isMember: result.is_member,
        },
        { status: errorInfo.status }
      )
    }

    return NextResponse.json({
      success: true,
      productionId: result.production_id,
      role: result.role,
      alreadyMember: result.already_member,
    }, { status: 200 })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
