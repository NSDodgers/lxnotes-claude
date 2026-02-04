/**
 * Operation Queue Store
 *
 * Zustand store that manages queued operations for offline graceful degradation.
 * Operations are queued when offline and auto-synced when connection is restored.
 *
 * Key features:
 * - Persisted to localStorage with 2-hour expiry (prevents stale data syncing)
 * - Auto-processes queue when coming back online
 * - 3 retries per operation before marking as failed
 * - Sequential processing to maintain operation order
 * - Clears when switching productions
 * - Tracks recently synced IDs to prevent realtime duplication
 */

import { create } from 'zustand'
import { subscribeWithSelector, persist } from 'zustand/middleware'
import type { Note, ModuleType } from '@/types'

/** How long queued operations remain valid (2 hours in ms) */
const OPERATION_EXPIRY_MS = 2 * 60 * 60 * 1000

/** How long to track recently synced IDs (5 seconds) */
const RECENTLY_SYNCED_TTL_MS = 5000

/**
 * Module-level Set to track note IDs that were recently synced.
 * Used to prevent realtime subscriptions from adding duplicate notes.
 * This is outside React state for synchronous access during realtime callbacks.
 */
const recentlySyncedNoteIds = new Set<string>()

/**
 * Mark a note ID as recently synced. It will be automatically removed after TTL.
 */
export function markNoteAsSynced(noteId: string): void {
  recentlySyncedNoteIds.add(noteId)
  setTimeout(() => {
    recentlySyncedNoteIds.delete(noteId)
  }, RECENTLY_SYNCED_TTL_MS)
}

/**
 * Check if a note ID was recently synced (to avoid realtime duplication).
 */
export function wasRecentlySynced(noteId: string): boolean {
  return recentlySyncedNoteIds.has(noteId)
}

export interface QueuedOperation {
  /** Unique ID for tracking */
  id: string
  /** Operation type */
  type: 'create' | 'update' | 'delete'
  /** The note being operated on */
  noteId: string
  /** Module type for the note */
  moduleType: ModuleType
  /** Production this operation belongs to */
  productionId: string
  /** Operation payload with rollback data */
  payload: {
    /** The change being made */
    data: Partial<Note>
    /** For updates: state before change (for rollback) */
    previousState?: Note
    /** For deletes: complete note (for rollback) */
    fullNote?: Note
  }
  /** When the operation was queued */
  timestamp: number
  /** Number of retry attempts */
  retryCount: number
  /** Current status */
  status: 'pending' | 'processing' | 'failed'
}

/** Callback for executing operations against the server */
export type OperationExecutor = (op: QueuedOperation) => Promise<Note | void>

/** Callback for handling failed operations (rollback) */
export type FailureHandler = (op: QueuedOperation) => void

interface OperationQueueState {
  /** Queue of pending operations */
  queue: QueuedOperation[]
  /** Whether we believe we're online */
  isOnline: boolean
  /** Whether we're currently processing the queue */
  isSyncing: boolean
  /** Current production ID */
  productionId: string | null

  // Actions
  /** Add an operation to the queue */
  enqueue: (op: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>) => void
  /** Process all pending operations */
  processQueue: (executor: OperationExecutor, onFailure: FailureHandler) => Promise<void>
  /** Update online status */
  setOnline: (online: boolean) => void
  /** Set production ID (clears queue if changed) */
  setProductionId: (id: string | null) => void
  /** Remove a specific operation from queue */
  removeOperation: (id: string) => void
  /** Clear all failed operations */
  clearFailed: () => void
  /** Clear entire queue */
  clear: () => void

  // Selectors
  /** Get count of pending operations */
  getPendingCount: () => number
  /** Get count of failed operations */
  getFailedCount: () => number
  /** Check if queue has any operations */
  hasOperations: () => boolean
}

const MAX_RETRIES = 3

/**
 * Filter out expired operations from the queue.
 * Operations older than OPERATION_EXPIRY_MS are removed.
 */
function filterExpiredOperations(queue: QueuedOperation[]): QueuedOperation[] {
  const now = Date.now()
  return queue.filter(op => (now - op.timestamp) < OPERATION_EXPIRY_MS)
}

/** Type for the persisted subset of state */
type PersistedState = Pick<OperationQueueState, 'queue' | 'productionId'>

export const useOperationQueueStore = create<OperationQueueState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      queue: [],
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,
      productionId: null,

      enqueue: (op) => {
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...op,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              retryCount: 0,
              status: 'pending' as const,
            },
          ],
        }))
      },

      processQueue: async (executor, onFailure) => {
        const state = get()
        if (state.isSyncing || state.queue.length === 0 || !state.isOnline) {
          return
        }

        set({ isSyncing: true })

        // Get pending operations in order
        const pendingOps = state.queue.filter((o) => o.status === 'pending')

        for (const op of pendingOps) {
          // Mark as processing
          set((s) => ({
            queue: s.queue.map((o) =>
              o.id === op.id ? { ...o, status: 'processing' as const } : o
            ),
          }))

          try {
            await executor(op)

            // Success: remove from queue
            set((s) => ({
              queue: s.queue.filter((o) => o.id !== op.id),
            }))
          } catch (err) {
            console.error(`[OperationQueue] Operation ${op.id} failed:`, err)

            const newRetryCount = op.retryCount + 1

            if (newRetryCount >= MAX_RETRIES) {
              // Max retries reached - mark as failed and trigger rollback
              set((s) => ({
                queue: s.queue.map((o) =>
                  o.id === op.id
                    ? { ...o, status: 'failed' as const, retryCount: newRetryCount }
                    : o
                ),
              }))

              // Trigger rollback callback
              onFailure(op)

              // Remove from queue after rollback
              set((s) => ({
                queue: s.queue.filter((o) => o.id !== op.id),
              }))
            } else {
              // Reset to pending for retry
              set((s) => ({
                queue: s.queue.map((o) =>
                  o.id === op.id
                    ? { ...o, status: 'pending' as const, retryCount: newRetryCount }
                    : o
                ),
              }))
            }
          }
        }

        set({ isSyncing: false })

        // Check if there are still pending operations (from retries)
        const remaining = get().queue.filter((o) => o.status === 'pending')
        if (remaining.length > 0 && get().isOnline) {
          // Schedule another processing round after a delay
          setTimeout(() => {
            get().processQueue(executor, onFailure)
          }, 1000)
        }
      },

      setOnline: (online) => {
        set({ isOnline: online })
      },

      setProductionId: (id) => {
        const state = get()
        if (state.productionId !== id) {
          // Clear queue when switching productions
          set({ productionId: id, queue: [] })
        }
      },

      removeOperation: (id) => {
        set((s) => ({
          queue: s.queue.filter((o) => o.id !== id),
        }))
      },

      clearFailed: () => {
        set((s) => ({
          queue: s.queue.filter((o) => o.status !== 'failed'),
        }))
      },

      clear: () => {
        set({ queue: [] })
      },

      getPendingCount: () => {
        return get().queue.filter(
          (o) => o.status === 'pending' || o.status === 'processing'
        ).length
      },

      getFailedCount: () => {
        return get().queue.filter((o) => o.status === 'failed').length
      },

      hasOperations: () => {
        return get().queue.length > 0
      },
    })),
    {
      name: 'lxnotes-operation-queue',
      // Only persist queue and productionId - not runtime state like isOnline/isSyncing
      partialize: (state): PersistedState => ({
        queue: state.queue,
        productionId: state.productionId,
      }),
      // Filter expired operations when rehydrating from storage
      onRehydrateStorage: () => (state) => {
        if (state) {
          const validOps = filterExpiredOperations(state.queue)
          const expiredCount = state.queue.length - validOps.length
          if (expiredCount > 0) {
            console.log(`[OperationQueue] Filtered ${expiredCount} expired operations`)
            state.queue = validOps
          }
        }
      },
    }
  )
)

// Set up browser online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOperationQueueStore.getState().setOnline(true)
  })

  window.addEventListener('offline', () => {
    useOperationQueueStore.getState().setOnline(false)
  })
}

/**
 * Hook to get reactive queue state for UI
 */
export function useOperationQueueState() {
  const isOnline = useOperationQueueStore((state) => state.isOnline)
  const isSyncing = useOperationQueueStore((state) => state.isSyncing)
  const pendingCount = useOperationQueueStore(
    (state) =>
      state.queue.filter(
        (o) => o.status === 'pending' || o.status === 'processing'
      ).length
  )
  const failedCount = useOperationQueueStore(
    (state) => state.queue.filter((o) => o.status === 'failed').length
  )

  return {
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    hasOperations: pendingCount > 0 || failedCount > 0,
  }
}
