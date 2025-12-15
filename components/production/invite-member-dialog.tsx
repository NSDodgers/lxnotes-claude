'use client'

import { useState } from 'react'
import { X, Mail, Shield, User, Loader2 } from 'lucide-react'
import { ProductionInvitation } from '@/lib/services/invitations'

interface InviteMemberDialogProps {
  productionId: string
  onClose: () => void
  onInvitationSent: (invitation: ProductionInvitation) => void
}

export function InviteMemberDialog({
  productionId,
  onClose,
  onInvitationSent,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionId,
          email: email.trim().toLowerCase(),
          role,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send invitation')
      }

      const invitation = await response.json()
      onInvitationSent(invitation)
      onClose()
    } catch (err) {
      console.error('Error sending invitation:', err)
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-bg-primary border border-bg-tertiary rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-bg-tertiary">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-modules-production" />
            <h2 className="text-lg font-semibold text-text-primary">Invite Team Member</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-tertiary rounded transition-colors"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-modules-production"
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-text-muted mt-1">
              An invitation email will be sent to this address
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('member')}
                disabled={isSubmitting}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                  role === 'member'
                    ? 'border-modules-production bg-modules-production/10 text-text-primary'
                    : 'border-bg-tertiary bg-bg-secondary text-text-secondary hover:border-bg-hover'
                }`}
              >
                <User className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Member</div>
                  <div className="text-xs text-text-muted">View & edit notes</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                disabled={isSubmitting}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                  role === 'admin'
                    ? 'border-modules-production bg-modules-production/10 text-text-primary'
                    : 'border-bg-tertiary bg-bg-secondary text-text-secondary hover:border-bg-hover'
                }`}
              >
                <Shield className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Admin</div>
                  <div className="text-xs text-text-muted">Manage team</div>
                </div>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-bg-tertiary text-text-secondary rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-modules-production text-white rounded-lg hover:bg-modules-production/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
