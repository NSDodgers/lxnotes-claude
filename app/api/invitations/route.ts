import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createInvitation, getPendingInvitations } from '@/lib/services/invitations'
import { isProductionAdmin } from '@/lib/services/production-members'
import { isSuperAdmin } from '@/lib/auth'

/**
 * POST /api/invitations
 * Create a new invitation for a production
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
    const { productionId, email, role } = body

    // Validate required fields
    if (!productionId || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: productionId, email, role' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "member"' },
        { status: 400 }
      )
    }

    // Check if user has permission to invite (must be production admin or super admin)
    const [isAdmin, isSuperAdminUser] = await Promise.all([
      isProductionAdmin(productionId, user.id),
      isSuperAdmin(user.id),
    ])

    if (!isAdmin && !isSuperAdminUser) {
      return NextResponse.json(
        { error: 'You do not have permission to invite members to this production' },
        { status: 403 }
      )
    }

    // Create the invitation
    const invitation = await createInvitation(productionId, email, role, user.id)

    // Try to send email via MailerSend if configured
    let emailWarning: string | undefined

    try {
      // Get MailerSend settings from app_settings
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'mailersend')
        .single()

      if (settingsData?.value) {
        const { sendInvitationEmail } = await import('@/lib/services/mailersend')
        const settings = settingsData.value as {
          apiKey: string
          fromEmail: string
          fromName: string
          templateId?: string
        }

        if (settings.apiKey && settings.fromEmail) {
          // Get production name for the email
          const { data: production } = await supabase
            .from('productions')
            .select('name')
            .eq('id', productionId)
            .single()

          // Get inviter name
          const { data: inviter } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
          // Point to home page where user can sign in with Google
          // After sign-in, auth/callback will auto-accept pending invitations
          const inviteUrl = baseUrl

          await sendInvitationEmail(settings, {
            recipientEmail: email,
            productionName: production?.name || 'Production',
            inviterName: inviter?.full_name || inviter?.email || 'A team member',
            role,
            inviteUrl,
            expiresAt: invitation.expiresAt,
          })
        }
      }
    } catch (emailError) {
      // Log and set warning
      console.error('Failed to send invitation email:', emailError)
      emailWarning = 'Invitation created, but failed to send email. Please verify MailerSend settings.'
    }

    return NextResponse.json({ ...invitation, warning: emailWarning }, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)

    // Check for duplicate invitation error
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/invitations?productionId=xxx
 * Get pending invitations for a production
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productionId = searchParams.get('productionId')

    if (!productionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: productionId' },
        { status: 400 }
      )
    }

    // Check if user has permission to view invitations
    const [isAdmin, isSuperAdminUser] = await Promise.all([
      isProductionAdmin(productionId, user.id),
      isSuperAdmin(user.id),
    ])

    if (!isAdmin && !isSuperAdminUser) {
      return NextResponse.json(
        { error: 'You do not have permission to view invitations for this production' },
        { status: 403 }
      )
    }

    const invitations = await getPendingInvitations(productionId)

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}
