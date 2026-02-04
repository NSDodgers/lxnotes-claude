import { createClient } from '@/lib/supabase/server'
import { getInvitationByToken } from '@/lib/services/invitations'
import { isProductionMember } from '@/lib/services/production-members'
import { AcceptInvitationButton } from '@/components/production/accept-invitation-button'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // 1. Look up invitation by token
  const invitation = await getInvitationByToken(token)

  // Handle invalid token
  if (!invitation || !invitation.found) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg-primary text-text-primary">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Invalid Invitation</h1>
          <p className="text-text-secondary">
            This invitation link is invalid or the production no longer exists.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Handle expired invitation
  if (invitation.status === 'expired' || invitation.is_expired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg-primary text-text-primary">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Invitation Expired</h1>
          <p className="text-text-secondary">
            This invitation has expired. Please ask {invitation.inviter?.full_name || invitation.inviter?.email || 'the inviter'} to send you a new invitation.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Handle cancelled invitation
  if (invitation.status === 'cancelled') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg-primary text-text-primary">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Invitation Cancelled</h1>
          <p className="text-text-secondary">
            This invitation has been cancelled. Please contact the production admin if you believe this is an error.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  // 2. Check Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login with return URL (use relative path for all environments)
    redirect(`/auth/login?next=${encodeURIComponent(`/invite/${token}`)}`)
  }

  // Handle already accepted invitation
  if (invitation.status === 'accepted') {
    // Check if this user is a member
    const isMember = invitation.production?.id
      ? await isProductionMember(invitation.production.id, user.id)
      : false

    if (isMember && invitation.production?.id) {
      // Redirect to the production
      redirect(`/production/${invitation.production.id}/cue-notes`)
    }

    // Invitation was accepted by someone else
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg-primary text-text-primary">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Invitation Already Used</h1>
          <p className="text-text-secondary">
            This invitation has already been accepted. If you need access to this production, please ask the admin to send you a new invitation.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  // 3. Check if user is already a member (joined via different path)
  if (invitation.production?.id) {
    const isMember = await isProductionMember(invitation.production.id, user.id)
    if (isMember) {
      redirect(`/production/${invitation.production.id}/cue-notes`)
    }
  }

  // 4. Show Accept Page
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg-primary text-text-primary">
      <div className="w-full max-w-md space-y-8 text-center p-8 rounded-xl bg-bg-secondary border border-bg-tertiary shadow-lg">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Accept Invitation</h1>
          <p className="text-text-secondary">
            You&apos;ve been invited to join
          </p>
          <div className="py-4">
            <div className="text-xl font-semibold text-primary">
              {invitation.production?.name}
            </div>
            <div className="text-sm text-text-muted mt-2">
              Invited by {invitation.inviter?.full_name || invitation.inviter?.email}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <AcceptInvitationButton
            token={token}
            productionName={invitation.production?.name || 'Production'}
            role={invitation.role || 'member'}
          />
        </div>

        <div className="pt-4 border-t border-bg-tertiary">
          <p className="text-xs text-text-muted">
            Logged in as {user.email}
          </p>
          <Button variant="link" size="sm" asChild className="text-text-secondary hover:text-text-primary">
            <Link href="/auth/signout">Not you? Sign out</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
