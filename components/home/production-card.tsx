'use client'

import Link from 'next/link'
import Image from 'next/image'

interface ProductionCardProps {
  production: {
    id: string
    name: string
    abbreviation: string
    logo?: string
    description?: string
    updatedAt: Date
  }
}

export function ProductionCard({ production }: ProductionCardProps) {
  const timeAgo = getTimeAgo(production.updatedAt)

  return (
    <Link
      href={`/production/${production.id}/cue-notes`}
      className="block p-4 bg-bg-secondary rounded-lg border border-border hover:border-emerald-500/50 transition-all hover:shadow-lg group"
    >
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex-shrink-0 w-12 h-12 bg-bg-tertiary rounded-lg overflow-hidden flex items-center justify-center text-xl">
          {production.logo && (production.logo.startsWith('data:') || production.logo.startsWith('/') || production.logo.startsWith('http')) ? (
            <div className="relative w-full h-full">
              <Image
                src={production.logo}
                alt={`${production.name} logo`}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <span className="text-text-muted">{production.abbreviation.charAt(0)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary group-hover:text-emerald-400 transition-colors truncate">
            {production.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="font-mono bg-bg-tertiary px-1.5 py-0.5 rounded text-xs">
              {production.abbreviation}
            </span>
            {production.description && (
              <span className="truncate">{production.description}</span>
            )}
          </div>
        </div>

        {/* Time */}
        <div className="flex-shrink-0 text-right">
          <span className="text-xs text-text-muted">{timeAgo}</span>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 text-text-muted group-hover:text-emerald-400 transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
