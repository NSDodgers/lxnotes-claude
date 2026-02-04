'use client'

import Link from 'next/link'
import { Mail, UserPlus } from 'lucide-react'

interface PendingInvitationCardProps {
  invitation: {
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
}

export function PendingInvitationCard({ invitation }: PendingInvitationCardProps) {
  const inviterName = invitation.inviter?.fullName || invitation.inviter?.email || 'Someone'

  return (
    <Link
      href={`/invite/${invitation.token}`}
      className="block p-4 bg-bg-secondary rounded-lg border border-primary/30 hover:border-primary/60 transition-all hover:shadow-lg group"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Mail className="w-6 h-6 text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
            {invitation.production?.name || 'Unknown Production'}
          </h3>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Invited by {inviterName}</span>
            <span className="text-text-muted/50">·</span>
            <span className="capitalize">{invitation.role}</span>
          </div>
        </div>

        {/* Accept indicator */}
        <div className="flex-shrink-0 flex items-center gap-2 text-primary group-hover:text-primary/80 transition-colors">
          <span className="text-sm font-medium hidden sm:inline">Accept</span>
          <UserPlus className="w-5 h-5" />
        </div>
      </div>
    </Link>
  )
}
