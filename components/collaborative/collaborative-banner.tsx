'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, RefreshCw, X, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { useSyncStore } from '@/lib/github/sync-manager'
import { resetCollaborativeSession } from '@/lib/collaborative-data'

export function CollaborativeBanner() {
  const {
    lastSyncTime,
    isSyncing,
    syncError,
    isOnline,
    syncNow,
    clearError,
  } = useSyncStore()

  const [timeSinceSync, setTimeSinceSync] = useState<string | null>(null)

  // Update time since sync every second
  useEffect(() => {
    const updateTime = () => {
      if (!lastSyncTime) {
        setTimeSinceSync(null)
        return
      }

      const seconds = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000)

      if (seconds < 5) {
        setTimeSinceSync('just now')
      } else if (seconds < 60) {
        setTimeSinceSync(`${seconds}s ago`)
      } else if (seconds < 3600) {
        setTimeSinceSync(`${Math.floor(seconds / 60)}m ago`)
      } else {
        setTimeSinceSync(`${Math.floor(seconds / 3600)}h ago`)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [lastSyncTime])

  const handleReset = async () => {
    if (
      confirm(
        'Reset Romeo & Juliet to original data? All changes will be lost. This will reload the page.'
      )
    ) {
      await resetCollaborativeSession()
      window.location.reload()
    }
  }

  const handleSync = async () => {
    clearError()
    await syncNow()
  }

  return (
    <div className="bg-rose-900 border-b border-rose-700 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          {/* Left: Mode indicator */}
          <div className="flex items-center gap-2 text-rose-100">
            <Users className="w-4 h-4" />
            <span className="font-medium">Collaborative Mode</span>
            <span className="hidden sm:inline text-rose-300">
              - Romeo and Juliet
            </span>
          </div>

          {/* Center: Sync status */}
          <div className="flex items-center gap-2 text-rose-200">
            {!isOnline ? (
              <>
                <WifiOff className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400 text-xs">Offline</span>
              </>
            ) : syncError ? (
              <>
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400 text-xs hidden sm:inline">
                  Sync error
                </span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="text-xs hidden sm:inline">Syncing...</span>
              </>
            ) : timeSinceSync ? (
              <>
                <Wifi className="w-3 h-3 text-green-400" />
                <span className="text-xs hidden sm:inline">
                  Synced {timeSinceSync}
                </span>
              </>
            ) : null}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing || !isOnline}
              className="flex items-center gap-1.5 px-2 py-1 bg-rose-800 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-rose-100 transition-colors text-xs"
              title="Sync now"
            >
              <RefreshCw
                className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2 py-1 bg-rose-800 hover:bg-rose-700 rounded text-rose-100 transition-colors text-xs"
              title="Reset to original data"
            >
              <span className="hidden sm:inline">Reset</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-2 py-1 bg-rose-700 hover:bg-rose-600 rounded text-white transition-colors text-xs"
              title="Exit collaborative mode"
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
