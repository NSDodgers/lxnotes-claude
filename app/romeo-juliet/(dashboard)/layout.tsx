/**
 * Collaborative Dashboard Layout
 *
 * Initializes the collaborative session and starts sync polling
 */
'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useEffect, useState } from 'react'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { initializeCollaborativeSession } from '@/lib/collaborative-data'
import { useSyncStore } from '@/lib/github/sync-manager'
import { Loader2, AlertCircle } from 'lucide-react'

export default function CollaborativeDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { startPolling, stopPolling } = useSyncStore()

  // Rehydrate sidebar store on mount
  useEffect(() => {
    useSidebarStore.persist.rehydrate()
  }, [])

  // Initialize collaborative session and start polling
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeCollaborativeSession()
        startPolling()
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to initialize collaborative session:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to connect to collaborative session'
        )
        setIsLoading(false)
      }
    }

    initialize()

    // Stop polling when leaving collaborative mode
    return () => {
      stopPolling()
    }
  }, [startPolling, stopPolling])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
          <p className="text-text-secondary">
            Connecting to Romeo & Juliet collaborative session...
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
          <AlertCircle className="h-12 w-12 text-rose-500" />
          <h2 className="text-xl font-semibold text-text-primary">
            Connection Error
          </h2>
          <p className="text-text-secondary">{error}</p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded-lg transition-colors"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
