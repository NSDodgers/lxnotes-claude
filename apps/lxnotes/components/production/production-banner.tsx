'use client'

import Link from 'next/link'
import { useProduction } from './production-provider'

export function ProductionBanner() {
  const { production, isLoading } = useProduction()

  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 h-9 bg-emerald-900/90 backdrop-blur-sm border-b border-emerald-700/50 flex items-center justify-center">
        <span className="text-emerald-200 text-sm">Loading production...</span>
      </div>
    )
  }

  if (!production) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-9 bg-emerald-900/90 backdrop-blur-sm border-b border-emerald-700/50 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="text-emerald-200 text-sm font-medium">
          {production.name}
        </span>
        <span className="text-emerald-400 text-xs bg-emerald-800/50 px-2 py-0.5 rounded">
          {production.abbreviation}
        </span>
      </div>

      <Link
        href="/"
        className="text-emerald-300 hover:text-emerald-100 text-sm transition-colors flex items-center gap-1"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Exit
      </Link>
    </div>
  )
}
