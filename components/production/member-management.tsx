'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Users, Shield, User, MoreVertical, Trash2, UserCog, Mail, Clock } from 'lucide-react'
import { useAuthContext } from '@/components/auth/auth-provider'
import { useProductionOptional } from './production-provider'
import {
  ProductionMember,
  getProductionMembersClient,
  updateMemberRoleClient,
  removeProductionMemberClient,
} from '@/lib/services/production-members.client'
import {
  ProductionInvitation,
  getPendingInvitationsClient,
  cancelInvitationClient,
} from '@/lib/services/invitations.client'
import { InviteMemberDialog } from './invite-member-dialog'
import { SUPER_ADMIN_EMAIL } from '@/lib/auth/constants'
import { cn } from '@/lib/utils'

export function MemberManagement() {
  const { user, isSuperAdmin } = useAuthContext()
  const productionContext = useProductionOptional()
  const productionId = productionContext?.productionId

  const [members, setMembers] = useState<ProductionMember[]>([])
  const [invitations, setInvitations] = useState<ProductionInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  // Determine if current user is an admin for this production
  const isAdmin = isSuperAdmin || members.some(m => m.userId === user?.id && m.role === 'admin')

  useEffect(() => {
    if (!productionId) return

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [membersData, invitationsData] = await Promise.all([
          getProductionMembersClient(productionId),
          getPendingInvitationsClient(productionId),
        ])
        setMembers(membersData)
        setInvitations(invitationsData)
      } catch (err) {
        console.error('Error fetching members:', err)
        setError('Failed to load team members')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [productionId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      await updateMemberRoleClient(memberId, newRole)
      setMembers(prev =>
        prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
      )
      setOpenDropdown(null)
    } catch (err) {
      console.error('Error updating role:', err)
      setError('Failed to update member role')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      await removeProductionMemberClient(memberId)
      setMembers(prev => prev.filter(m => m.id !== memberId))
      setOpenDropdown(null)
    } catch (err) {
      console.error('Error removing member:', err)
      setError('Failed to remove member')
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return

    try {
      await cancelInvitationClient(invitationId)
      setInvitations(prev => prev.filter(i => i.id !== invitationId))
    } catch (err) {
      console.error('Error cancelling invitation:', err)
      setError('Failed to cancel invitation')
    }
  }

  const handleInvitationSent = (invitation: ProductionInvitation) => {
    setInvitations(prev => [invitation, ...prev])
  }

  if (!productionId) {
    return (
      <div className="text-center py-8 text-text-muted">
        <p>Member management is only available within a production</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-bg-tertiary rounded-lg animate-pulse" />
        <div className="h-16 bg-bg-tertiary rounded-lg animate-pulse" />
        <div className="h-16 bg-bg-tertiary rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-text-secondary" />
          <h3 className="text-lg font-semibold text-text-primary">Team Members</h3>
          <span className="text-sm text-text-muted">({members.length})</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInviteDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-modules-production text-white rounded-lg hover:bg-modules-production/90 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Invite Member
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2">
        {members.map((member) => {
          const isSelf = member.userId === user?.id
          const isMemberSuperAdmin = member.user?.email === SUPER_ADMIN_EMAIL
          const canModify = isAdmin && !isSelf && !isMemberSuperAdmin

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
            >
              <div className="flex items-center gap-3">
                {member.user?.avatarUrl ? (
                  <Image
                    src={member.user.avatarUrl}
                    alt={member.user.fullName || member.user.email}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                    {(member.user?.fullName || member.user?.email || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">
                      {member.user?.fullName || member.user?.email || 'Unknown'}
                    </span>
                    {isSelf && (
                      <span className="text-xs px-2 py-0.5 bg-bg-tertiary text-text-muted rounded">
                        You
                      </span>
                    )}
                    {isMemberSuperAdmin && (
                      <span title="Super Admin">
                      <Shield className="h-4 w-4 text-yellow-500" />
                    </span>
                    )}
                  </div>
                  <span className="text-sm text-text-muted">{member.user?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    member.role === 'admin'
                      ? 'bg-modules-production/20 text-modules-production'
                      : 'bg-bg-tertiary text-text-secondary'
                  )}
                >
                  {member.role === 'admin' ? (
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Admin
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> Member
                    </span>
                  )}
                </span>

                {canModify && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenDropdown(openDropdown === member.id ? null : member.id)
                      }}
                      className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-text-secondary" />
                    </button>

                    {openDropdown === member.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-lg py-1 z-50">
                        <button
                          onClick={() =>
                            handleRoleChange(member.id, member.role === 'admin' ? 'member' : 'admin')
                          }
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
                        >
                          <UserCog className="h-4 w-4" />
                          {member.role === 'admin' ? 'Change to Member' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-bg-tertiary transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove from Production
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-3 mt-8">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-text-secondary" />
            <h4 className="text-md font-medium text-text-primary">Pending Invitations</h4>
            <span className="text-sm text-text-muted">({invitations.length})</span>
          </div>

          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 bg-bg-secondary/50 rounded-lg border border-dashed border-bg-tertiary"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-medium text-text-primary">{invitation.email}</span>
                    <div className="text-sm text-text-muted">
                      Invited as {invitation.role} &bull; Expires{' '}
                      {invitation.expiresAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="p-2 text-text-muted hover:text-red-400 hover:bg-bg-tertiary rounded transition-colors"
                    title="Cancel invitation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      {showInviteDialog && productionId && (
        <InviteMemberDialog
          productionId={productionId}
          onClose={() => setShowInviteDialog(false)}
          onInvitationSent={handleInvitationSent}
        />
      )}
    </div>
  )
}
