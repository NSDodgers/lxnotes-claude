'use client'

import Link from 'next/link'
import { PlayCircle, RefreshCw, X } from 'lucide-react'
import { resetDemoData } from '@/lib/demo-data'

export function DemoBanner() {
  const handleReset = async () => {
    if (confirm('Reset demo to original Pirates of Penzance data? This will reload the page.')) {
      await resetDemoData()
      window.location.reload()
    }
  }

  return (
    <div className="bg-purple-900 border-b border-purple-700 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 py-2">
        <div className="flex items-center justify-between text-sm">

          {/* Left: Demo indicator */}
          <div className="flex items-center gap-2 text-purple-100">
            <PlayCircle className="w-4 h-4" />
            <span className="font-medium">Demo Mode</span>
            <span className="hidden sm:inline text-purple-300">
              - Exploring Pirates of Penzance
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1 bg-purple-800 hover:bg-purple-700 rounded text-purple-100 transition-colors text-xs"
              title="Reset demo data"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1 bg-purple-700 hover:bg-purple-600 rounded text-white transition-colors text-xs"
              title="Exit demo mode"
            >
              <span className="hidden sm:inline">Exit</span>
              <X className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}