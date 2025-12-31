'use client'

import { useState, useEffect } from 'react'
import { Share2, Copy, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProductionOptional } from '@/components/production/production-provider'

/**
 * Production Share Code Section
 * Shows the production's short code for sharing with team members.
 *
 * Future: When Director Notes is built, this will be expanded to support
 * cross-app production linking.
 */
export function ProductionLinkingSection() {
  const productionContext = useProductionOptional()
  const productionId = productionContext?.productionId

  const [shortCode, setShortCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)

  // Fetch production short code
  useEffect(() => {
    async function fetchData() {
      if (!productionId) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/productions/${productionId}`)
        if (response.ok) {
          const data = await response.json()
          setShortCode(data.shortCode || '')
        }
      } catch (err) {
        console.error('Error fetching production data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [productionId])

  const handleCopyCode = async () => {
    if (!shortCode) return
    try {
      await navigator.clipboard.writeText(shortCode)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyLink = async () => {
    if (!shortCode) return
    try {
      const link = `${window.location.origin}/p/${shortCode}`
      await navigator.clipboard.writeText(link)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-bg-secondary p-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="h-5 w-5 text-text-secondary" />
          <h2 className="text-lg font-semibold text-text-primary">Share Production</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-bg-secondary p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">Share Production</h2>
      </div>

      <p className="text-sm text-text-secondary">
        Share this code or link with team members so they can join your production.
      </p>

      {/* Share Code */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-secondary">
          Share Code
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-bg-tertiary border border-bg-hover px-4 py-3 font-mono text-lg text-text-primary tracking-wider">
            {shortCode || '------'}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyCode}
            disabled={!shortCode}
            className="h-12 w-12"
            title="Copy code"
          >
            {isCopied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Copy Link Button */}
      <Button
        variant="outline"
        onClick={handleCopyLink}
        disabled={!shortCode}
        className="w-full"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Copy Join Link
      </Button>

      <p className="text-xs text-text-muted">
        Team members can visit the link or enter the code to request access to this production.
      </p>
    </div>
  )
}
