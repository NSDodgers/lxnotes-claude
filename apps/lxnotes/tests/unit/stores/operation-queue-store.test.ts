import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useOperationQueueStore, markNoteAsSynced, wasRecentlySynced, addPendingCreation, removePendingCreation, getPendingCreationTempId } from '@/lib/stores/operation-queue-store'

describe('Operation Queue Store', () => {
  beforeEach(() => {
    useOperationQueueStore.getState().clear()
    useOperationQueueStore.getState().setOnline(true)
  })

  describe('enqueue', () => {
    it('should add an operation to the queue', () => {
      useOperationQueueStore.getState().enqueue({
        type: 'create',
        noteId: 'note-1',
        moduleType: 'cue',
        productionId: 'prod-1',
        payload: { data: { description: 'Test' } },
      })

      expect(useOperationQueueStore.getState().queue).toHaveLength(1)
      expect(useOperationQueueStore.getState().queue[0].type).toBe('create')
      expect(useOperationQueueStore.getState().queue[0].status).toBe('pending')
      expect(useOperationQueueStore.getState().queue[0].retryCount).toBe(0)
    })

    it('should assign unique IDs to each operation', () => {
      useOperationQueueStore.getState().enqueue({
        type: 'create',
        noteId: 'note-1',
        moduleType: 'cue',
        productionId: 'prod-1',
        payload: { data: {} },
      })
      useOperationQueueStore.getState().enqueue({
        type: 'update',
        noteId: 'note-2',
        moduleType: 'work',
        productionId: 'prod-1',
        payload: { data: {} },
      })

      const [op1, op2] = useOperationQueueStore.getState().queue
      expect(op1.id).not.toBe(op2.id)
    })
  })

  describe('processQueue', () => {
    it('should execute pending operations in order', async () => {
      const executed: string[] = []
      const executor = vi.fn(async (op) => {
        executed.push(op.noteId)
      })
      const onFailure = vi.fn()

      useOperationQueueStore.getState().enqueue({
        type: 'create',
        noteId: 'note-1',
        moduleType: 'cue',
        productionId: 'prod-1',
        payload: { data: {} },
      })
      useOperationQueueStore.getState().enqueue({
        type: 'update',
        noteId: 'note-2',
        moduleType: 'cue',
        productionId: 'prod-1',
        payload: { data: {} },
      })

      await useOperationQueueStore.getState().processQueue(executor, onFailure)

      expect(executed).toEqual(['note-1', 'note-2'])
      expect(useOperationQueueStore.getState().queue).toHaveLength(0)
    })

    it('should not process when offline', async () => {
      useOperationQueueStore.getState().setOnline(false)
      const executor = vi.fn()
      const onFailure = vi.fn()

      useOperationQueueStore.getState().enqueue({
        type: 'create',
        noteId: 'note-1',
        moduleType: 'cue',
        productionId: 'prod-1',
        payload: { data: {} },
      })

      await useOperationQueueStore.getState().processQueue(executor, onFailure)

      expect(executor).not.toHaveBeenCalled()
      expect(useOperationQueueStore.getState().queue).toHaveLength(1)
    })

    it('should mark operation as failed after MAX_RETRIES and call onFailure', async () => {
      vi.useFakeTimers()
      const executor = vi.fn(async () => {
        throw new Error('Network error')
      })
      const onFailure = vi.fn()

      useOperationQueueStore.getState().enqueue({
        type: 'create',
        noteId: 'note-1',
        moduleType: 'cue',
        productionId: 'prod-1',
        payload: { data: {} },
      })

      // First processQueue: fails once, retryCount goes to 1, status back to pending
      await useOperationQueueStore.getState().processQueue(executor, onFailure)
      expect(useOperationQueueStore.getState().queue).toHaveLength(1)
      expect(useOperationQueueStore.getState().queue[0].retryCount).toBe(1)

      // Process retry rounds via the scheduled timeout
      await vi.advanceTimersByTimeAsync(1000)
      expect(useOperationQueueStore.getState().queue[0]?.retryCount).toBe(2)

      await vi.advanceTimersByTimeAsync(1000)
      // After 3rd failure: onFailure called and operation removed
      expect(onFailure).toHaveBeenCalledTimes(1)
      expect(useOperationQueueStore.getState().queue).toHaveLength(0)

      vi.useRealTimers()
    })

    it('should not process when already syncing', async () => {
      const executor = vi.fn()
      const onFailure = vi.fn()

      useOperationQueueStore.getState().enqueue({
        type: 'create',
        noteId: 'note-1',
        moduleType: 'cue',
        productionId: 'prod-1',
        payload: { data: {} },
      })

      // Simulate syncing state
      useOperationQueueStore.setState({ isSyncing: true })
      await useOperationQueueStore.getState().processQueue(executor, onFailure)

      expect(executor).not.toHaveBeenCalled()
    })
  })

  describe('setProductionId', () => {
    it('should clear queue when switching productions', () => {
      useOperationQueueStore.getState().setProductionId('prod-1')
      useOperationQueueStore.getState().enqueue({
        type: 'create',
        noteId: 'note-1',
        moduleType: 'cue',
        productionId: 'prod-1',
        payload: { data: {} },
      })

      useOperationQueueStore.getState().setProductionId('prod-2')
      expect(useOperationQueueStore.getState().queue).toHaveLength(0)
    })

    it('should not clear queue when setting same production', () => {
      useOperationQueueStore.getState().setProductionId('prod-1')
      useOperationQueueStore.getState().enqueue({
        type: 'create',
        noteId: 'note-1',
        moduleType: 'cue',
        productionId: 'prod-1',
        payload: { data: {} },
      })

      useOperationQueueStore.getState().setProductionId('prod-1')
      expect(useOperationQueueStore.getState().queue).toHaveLength(1)
    })
  })

  describe('selectors', () => {
    it('getPendingCount should count pending and processing ops', () => {
      useOperationQueueStore.getState().enqueue({
        type: 'create',
        noteId: 'note-1',
        moduleType: 'cue',
        productionId: 'prod-1',
        payload: { data: {} },
      })
      useOperationQueueStore.getState().enqueue({
        type: 'update',
        noteId: 'note-2',
        moduleType: 'cue',
        productionId: 'prod-1',
        payload: { data: {} },
      })

      expect(useOperationQueueStore.getState().getPendingCount()).toBe(2)
    })

    it('hasOperations should reflect queue state', () => {
      expect(useOperationQueueStore.getState().hasOperations()).toBe(false)

      useOperationQueueStore.getState().enqueue({
        type: 'create',
        noteId: 'note-1',
        moduleType: 'cue',
        productionId: 'prod-1',
        payload: { data: {} },
      })

      expect(useOperationQueueStore.getState().hasOperations()).toBe(true)
    })
  })
})

describe('Realtime Deduplication Helpers', () => {
  describe('markNoteAsSynced / wasRecentlySynced', () => {
    it('should mark a note as recently synced', () => {
      markNoteAsSynced('note-1')
      expect(wasRecentlySynced('note-1')).toBe(true)
    })

    it('should return false for unsynced notes', () => {
      expect(wasRecentlySynced('note-unknown')).toBe(false)
    })

    it('should expire after TTL', async () => {
      vi.useFakeTimers()
      markNoteAsSynced('note-ttl')
      expect(wasRecentlySynced('note-ttl')).toBe(true)

      // Advance past TTL (5 seconds)
      vi.advanceTimersByTime(6000)
      expect(wasRecentlySynced('note-ttl')).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('addPendingCreation / removePendingCreation / getPendingCreationTempId', () => {
    beforeEach(() => {
      // Clean up any lingering pending creations
      const tempId = getPendingCreationTempId('cue')
      if (tempId) removePendingCreation(tempId)
      const workTempId = getPendingCreationTempId('work')
      if (workTempId) removePendingCreation(workTempId)
    })

    it('should track pending creation by module type', () => {
      addPendingCreation('temp-1', 'cue')
      expect(getPendingCreationTempId('cue')).toBe('temp-1')
      expect(getPendingCreationTempId('work')).toBeUndefined()
    })

    it('should remove pending creation', () => {
      addPendingCreation('temp-1', 'cue')
      removePendingCreation('temp-1')
      expect(getPendingCreationTempId('cue')).toBeUndefined()
    })

    it('should return the first matching temp ID for a module', () => {
      addPendingCreation('temp-1', 'cue')
      addPendingCreation('temp-2', 'cue')
      // Should return the first one found
      const result = getPendingCreationTempId('cue')
      expect(result).toBe('temp-1')

      // Cleanup
      removePendingCreation('temp-1')
      removePendingCreation('temp-2')
    })
  })
})
