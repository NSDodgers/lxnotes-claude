/**
 * Sync Manager
 *
 * Manages real-time synchronization with GitHub for collaborative mode.
 * Uses polling to check for updates every 5 seconds and provides
 * UI state for sync status indicators.
 */

import { create } from 'zustand'
import { gitHubStorageAdapter } from './github-storage-adapter'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'

// Polling interval (5 seconds for near real-time)
const POLL_INTERVAL = 5000

// Maximum retries on error before stopping polling
const MAX_RETRIES = 3

interface SyncState {
  // Status
  lastSyncTime: Date | null
  isSyncing: boolean
  syncError: string | null
  isOnline: boolean
  isInitialized: boolean

  // Polling control
  pollIntervalId: NodeJS.Timeout | null
  retryCount: number

  // Actions
  startPolling: () => void
  stopPolling: () => void
  syncNow: () => Promise<void>
  setOnline: (online: boolean) => void
  setInitialized: (initialized: boolean) => void
  clearError: () => void
}

export const useSyncStore = create<SyncState>((set, get) => ({
  // Initial state
  lastSyncTime: null,
  isSyncing: false,
  syncError: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isInitialized: false,
  pollIntervalId: null,
  retryCount: 0,

  /**
   * Start polling for updates
   */
  startPolling: () => {
    const { pollIntervalId, syncNow } = get()

    // Don't start if already polling
    if (pollIntervalId) {
      console.log('Sync: Polling already active')
      return
    }

    console.log('Sync: Starting polling')

    // Initial sync
    syncNow()

    // Set up polling interval
    const intervalId = setInterval(() => {
      const { isOnline, isSyncing } = get()

      // Skip if offline or already syncing
      if (!isOnline || isSyncing) {
        return
      }

      syncNow()
    }, POLL_INTERVAL)

    set({ pollIntervalId: intervalId })

    // Set up online/offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Sync: Back online')
        set({ isOnline: true, syncError: null, retryCount: 0 })
        syncNow()
      })

      window.addEventListener('offline', () => {
        console.log('Sync: Went offline')
        set({ isOnline: false })
      })

      // Sync when tab becomes visible
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          const { isOnline, isSyncing } = get()
          if (isOnline && !isSyncing) {
            syncNow()
          }
        }
      })
    }
  },

  /**
   * Stop polling
   */
  stopPolling: () => {
    const { pollIntervalId } = get()

    if (pollIntervalId) {
      console.log('Sync: Stopping polling')
      clearInterval(pollIntervalId)
      set({ pollIntervalId: null })
    }
  },

  /**
   * Perform a sync operation
   */
  syncNow: async () => {
    const { isOnline, isSyncing, retryCount } = get()

    // Skip if offline
    if (!isOnline) {
      set({ syncError: 'You are offline' })
      return
    }

    // Skip if already syncing
    if (isSyncing) {
      return
    }

    set({ isSyncing: true })

    try {
      // Refresh all data from GitHub
      await gitHubStorageAdapter.refreshAll()

      // Update Zustand stores with fresh data
      const notesData = gitHubStorageAdapter.getCachedNotes()

      if (notesData) {
        const notesStore = useMockNotesStore.getState()
        notesStore.setNotes('cue', notesData.cue || [])
        notesStore.setNotes('work', notesData.work || [])
        notesStore.setNotes('production', notesData.production || [])
      }

      set({
        lastSyncTime: new Date(),
        syncError: null,
        retryCount: 0,
        isSyncing: false,
      })
    } catch (error) {
      console.error('Sync error:', error)

      const newRetryCount = retryCount + 1
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sync with GitHub'

      set({
        syncError: errorMessage,
        retryCount: newRetryCount,
        isSyncing: false,
      })

      // Stop polling after max retries
      if (newRetryCount >= MAX_RETRIES) {
        console.error('Sync: Max retries reached, stopping polling')
        get().stopPolling()
      }
    }
  },

  /**
   * Set online status
   */
  setOnline: (online: boolean) => {
    set({ isOnline: online })
  },

  /**
   * Set initialization status
   */
  setInitialized: (initialized: boolean) => {
    set({ isInitialized: initialized })
  },

  /**
   * Clear sync error
   */
  clearError: () => {
    set({ syncError: null, retryCount: 0 })
  },
}))

/**
 * Hook to get formatted time since last sync
 */
export function useTimeSinceSync(): string | null {
  const lastSyncTime = useSyncStore((state) => state.lastSyncTime)

  if (!lastSyncTime) return null

  const seconds = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000)

  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

/**
 * Check if collaborative mode is active based on URL
 */
export function isCollaborativeMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/romeo-juliet')
}
