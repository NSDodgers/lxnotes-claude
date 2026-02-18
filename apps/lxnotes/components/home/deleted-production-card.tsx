'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Loader2, RotateCcw } from 'lucide-react'
import { DEFAULT_PRODUCTION_LOGO } from '@/lib/stores/production-store'

interface DeletedProduction {
  id: string
  name: string
  abbreviation: string
  logo?: string
  description?: string
  deletedAt: Date
}

interface DeletedProductionCardProps {
  production: DeletedProduction
  onRestore: () => void
}

export function DeletedProductionCard({ production, onRestore }: DeletedProductionCardProps) {
  const [isRestoring, setIsRestoring] = useState(false)

  const deletedDaysAgo = Math.floor(
    (Date.now() - production.deletedAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysRemaining = Math.max(0, 30 - deletedDaysAgo)

  const handleRestore = async () => {
    try {
      setIsRestoring(true)

      const response = await fetch(`/api/productions/${production.id}/restore`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to restore production')
      }

      onRestore()
    } catch (err) {
      console.error('Failed to restore production:', err)
      setIsRestoring(false)
    }
  }

  return (
    <div className="p-4 bg-bg-secondary rounded-lg border border-border opacity-75">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="shrink-0 w-12 h-12 bg-bg-tertiary rounded-lg overflow-hidden flex items-center justify-center text-xl grayscale">
          {(() => {
            const displayLogo = production.logo || DEFAULT_PRODUCTION_LOGO
            return displayLogo.startsWith('data:') || displayLogo.startsWith('/') || displayLogo.startsWith('http') ? (
              <div className="relative w-full h-full">
                <Image
                  src={displayLogo}
                  alt={`${production.name} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <span className="text-text-muted">{displayLogo}</span>
            )
          })()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary truncate">
            {production.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="font-mono bg-bg-tertiary px-1.5 py-0.5 rounded text-xs">
              {production.abbreviation}
            </span>
          </div>
        </div>

        {/* Deletion info */}
        <div className="shrink-0 text-right">
          <p className="text-xs text-text-muted">
            Deleted {deletedDaysAgo === 0 ? 'today' : `${deletedDaysAgo}d ago`}
          </p>
          <p className="text-xs text-red-400">
            Auto-deletes in {daysRemaining}d
          </p>
        </div>

        {/* Restore button */}
        <div className="shrink-0">
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
          >
            {isRestoring ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Restore
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
