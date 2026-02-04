'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, UserPlus, AlertCircle } from 'lucide-react'

interface AcceptInvitationButtonProps {
  token: string
  productionName: string
  role: string
}

export function AcceptInvitationButton({
  token,
  productionName,
  role
}: AcceptInvitationButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If already accepted and user is a member, redirect them
        if (data.code === 'already_accepted' && data.isMember && data.productionId) {
          router.push(`/production/${data.productionId}/cue-notes`)
          router.refresh()
          return
        }
        throw new Error(data.error || 'Failed to accept invitation')
      }

      // Success - redirect to the production
      router.push(`/production/${data.productionId}/cue-notes`)
      router.refresh()
    } catch (err) {
      console.error('Error accepting invitation:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 w-full max-w-sm">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={handleAccept}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Joining...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Join as {role}
          </>
        )}
      </Button>

      <p className="text-xs text-text-muted text-center">
        You will join &ldquo;{productionName}&rdquo; as {role === 'admin' ? 'an admin' : 'a member'}
      </p>
    </div>
  )
}
