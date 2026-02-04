'use client'

/**
 * Sync Status Indicator
 *
 * Displays the current sync status in the header near undo/redo buttons.
 * Shows different states: offline with pending, syncing, failed, or offline only.
 * Hidden when online and fully synced.
 */

import { CloudOff, Loader2, AlertCircle } from 'lucide-react'
import { useOperationQueueState } from '@/lib/stores/operation-queue-store'

export function SyncStatusIndicator() {
  const { isOnline, isSyncing, pendingCount, failedCount } =
    useOperationQueueState()

  // Nothing to show - all synced and online
  if (isOnline && pendingCount === 0 && failedCount === 0) {
    return null
  }

  // Syncing in progress
  if (isSyncing && pendingCount > 0) {
    return (
      <div
        className="flex items-center gap-1.5 text-blue-400 px-2 py-1 rounded-md bg-blue-400/10"
        title={`Syncing ${pendingCount} change${pendingCount !== 1 ? 's' : ''}...`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs font-medium">{pendingCount}</span>
      </div>
    )
  }

  // Failed operations exist
  if (failedCount > 0) {
    return (
      <div
        className="flex items-center gap-1.5 text-red-400 px-2 py-1 rounded-md bg-red-400/10"
        title={`${failedCount} change${failedCount !== 1 ? 's' : ''} failed to sync`}
      >
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs font-medium">{failedCount}</span>
      </div>
    )
  }

  // Offline with pending operations
  if (!isOnline && pendingCount > 0) {
    return (
      <div
        className="flex items-center gap-1.5 text-yellow-500 px-2 py-1 rounded-md bg-yellow-500/10"
        title={`Offline - ${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending`}
      >
        <CloudOff className="h-4 w-4" />
        <span className="text-xs font-medium">{pendingCount}</span>
      </div>
    )
  }

  // Offline but no pending (just show offline status)
  if (!isOnline) {
    return (
      <div
        className="text-yellow-500 px-2 py-1 rounded-md bg-yellow-500/10"
        title="You are offline"
      >
        <CloudOff className="h-4 w-4" />
      </div>
    )
  }

  return null
}
