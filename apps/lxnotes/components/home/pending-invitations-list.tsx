'use client'

import { PendingInvitationCard } from './pending-invitation-card'

interface Invitation {
  id: string
  token: string
  role: 'admin' | 'member'
  production?: {
    id: string
    name: string
  }
  inviter?: {
    id: string
    email: string
    fullName: string | null
  }
}

interface PendingInvitationsListProps {
  invitations: Invitation[]
}

export function PendingInvitationsList({ invitations }: PendingInvitationsListProps) {
  if (invitations.length === 0) {
    return null
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-text-primary">
          {invitations.length === 1
            ? 'You have a pending invitation'
            : `You have ${invitations.length} pending invitations`}
        </h3>
        <p className="text-sm text-text-muted mt-1">
          Click to review and accept
        </p>
      </div>

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <PendingInvitationCard key={invitation.id} invitation={invitation} />
        ))}
      </div>
    </div>
  )
}
