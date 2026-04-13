/**
 * Supabase Realtime Subscriptions
 *
 * Manages real-time subscriptions to production data changes.
 * Uses Supabase Realtime postgres_changes for direct table change notifications.
 *
 * SECURITY: All productionIds are validated as UUIDs before use in filters
 * to prevent filter injection attacks.
 */

import { createClient } from './client'
import type { Database } from './database.types'

type DbNote = Database['public']['Tables']['notes']['Row']
type DbFixture = Database['public']['Tables']['fixtures']['Row']
type DbProduction = Database['public']['Tables']['productions']['Row']

/**
 * Validate that a string is a valid UUID v4
 * SECURITY: Prevents filter injection by ensuring productionId is a valid UUID
 */
const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

const isDev = process.env.NODE_ENV === 'development'

// Retry configuration for failed subscriptions
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff in ms

/**
 * Creates a subscription with retry logic
 * Returns cleanup function that cancels any pending retries
 */
function createSubscriptionWithRetry(
  channelName: string,
  setupChannel: () => ReturnType<ReturnType<typeof createClient>['channel']>,
  onError?: (error: Error) => void,
  onStatusChange?: (status: string) => void
): () => void {
  const supabase = createClient()
  let retryCount = 0
  let retryTimeout: NodeJS.Timeout | null = null
  let currentChannel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null
  let isCleanedUp = false

  const attemptSubscription = () => {
    if (isCleanedUp) return

    currentChannel = setupChannel()

    currentChannel.subscribe((status, err) => {
      if (isCleanedUp) return

      if (isDev) console.log(`[Realtime] ${channelName} status:`, status, `(attempt ${retryCount + 1}/${MAX_RETRIES + 1})`)

      if (onStatusChange) onStatusChange(status)

      if (status === 'SUBSCRIBED') {
        // Reset retry count on successful connection
        retryCount = 0
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
          retryCount++

          if (isDev) console.log(`[Realtime] ${channelName} failed, retrying in ${delay}ms...`)

          // Clean up current channel before retry
          if (currentChannel) {
            supabase.removeChannel(currentChannel)
          }

          retryTimeout = setTimeout(attemptSubscription, delay)
        } else {
          // All retries exhausted
          if (isDev) console.error(`[Realtime] ${channelName} failed after ${MAX_RETRIES + 1} attempts`)
          if (onError) {
            onError(new Error(`${channelName} connection failed after ${MAX_RETRIES + 1} attempts: ${err?.message || 'Unknown error'}`))
          }
        }
      }
    })
  }

  attemptSubscription()

  return () => {
    isCleanedUp = true
    if (retryTimeout) {
      clearTimeout(retryTimeout)
    }
    if (currentChannel) {
      if (isDev) console.log(`[Realtime] Unsubscribing from ${channelName}`)
      supabase.removeChannel(currentChannel)
    }
  }
}

export interface RealtimeCallbacks {
  onNoteInsert?: (note: DbNote) => void
  onNoteUpdate?: (note: DbNote) => void
  onNoteDelete?: (oldNote: DbNote) => void
  onProductionUpdate?: (production: DbProduction) => void
  onFixtureChange?: (fixture: DbFixture | undefined, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
  onError?: (error: Error) => void
  onStatusChange?: (status: string) => void
}

/**
 * Subscribe to real-time changes for notes
 * Includes automatic retry with exponential backoff on connection failures
 */
export function subscribeToNoteChanges(
  productionId: string,
  callbacks: Pick<RealtimeCallbacks, 'onNoteInsert' | 'onNoteUpdate' | 'onNoteDelete' | 'onStatusChange' | 'onError'>
): () => void {
  // SECURITY: Validate productionId is a valid UUID
  if (!productionId || !isValidUUID(productionId)) {
    if (isDev) console.warn(`[Realtime] Invalid productionId for notes subscription: ${productionId}`)
    return () => { }
  }

  const supabase = createClient()
  const channelName = `production-${productionId}-notes`

  // Use both postgres_changes (for when RLS works) and broadcast (as reliable fallback)
  const unsubPostgres = createSubscriptionWithRetry(
    channelName,
    () => {
      return supabase.channel(channelName).on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `production_id=eq.${productionId}`
        },
        (payload) => {
          if (isDev) console.log(`[Realtime] Note event: ${payload.eventType}`, payload)

          switch (payload.eventType) {
            case 'INSERT':
              if (callbacks.onNoteInsert) callbacks.onNoteInsert(payload.new as DbNote)
              break
            case 'UPDATE':
              if (callbacks.onNoteUpdate) callbacks.onNoteUpdate(payload.new as DbNote)
              break
            case 'DELETE':
              if (callbacks.onNoteDelete) callbacks.onNoteDelete(payload.old as DbNote)
              break
          }
        }
      )
    },
    callbacks.onError,
    callbacks.onStatusChange
  )

  // Broadcast channel for direct client-to-client sync (bypasses postgres_changes + RLS)
  const broadcastChannelName = `broadcast-${productionId}-notes`
  const broadcastChannel = supabase.channel(broadcastChannelName)
    .on('broadcast', { event: 'note-change' }, (payload) => {
      const { eventType, note } = payload.payload as { eventType: string; note: DbNote }
      console.log('[Realtime] Broadcast received:', eventType, note.id)

      switch (eventType) {
        case 'INSERT':
          if (callbacks.onNoteInsert) callbacks.onNoteInsert(note)
          break
        case 'UPDATE':
          if (callbacks.onNoteUpdate) callbacks.onNoteUpdate(note)
          break
        case 'DELETE':
          if (callbacks.onNoteDelete) callbacks.onNoteDelete(note)
          break
      }
    })
    .subscribe()

  // Store broadcast channel reference for sending
  _broadcastChannels.set(productionId, broadcastChannel)

  return () => {
    unsubPostgres()
    supabase.removeChannel(broadcastChannel)
    _broadcastChannels.delete(productionId)
  }
}

// Map of production ID to broadcast channel for sending events (notes)
const _broadcastChannels = new Map<string, ReturnType<ReturnType<typeof createClient>['channel']>>()

// Map of production ID to broadcast channel for sending events (fixtures)
const _fixtureBroadcastChannels = new Map<string, ReturnType<ReturnType<typeof createClient>['channel']>>()

/**
 * Broadcast a note change to other clients in the same production.
 * This is a reliable fallback when postgres_changes + RLS silently drops events.
 */
export function broadcastNoteChange(
  productionId: string,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  note: unknown
) {
  const channel = _broadcastChannels.get(productionId)
  if (channel) {
    channel.send({
      type: 'broadcast',
      event: 'note-change',
      payload: { eventType, note },
    })
  }
}

/**
 * Broadcast a fixture change to other clients in the same production.
 * This is a reliable fallback when postgres_changes + RLS silently drops events,
 * which is common during bulk upserts from CSV imports.
 */
export function broadcastFixtureChange(
  productionId: string,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'BULK_UPLOAD'
) {
  const channel = _fixtureBroadcastChannels.get(productionId)
  if (channel) {
    channel.send({
      type: 'broadcast',
      event: 'fixture-change',
      payload: { eventType },
    })
  }
}

/**
 * Subscribe to real-time changes for fixtures (channel/type/position data)
 * Includes automatic retry with exponential backoff on connection failures.
 * Uses both postgres_changes and broadcast (as reliable fallback when RLS
 * silently drops events, especially during bulk upserts).
 */
export function subscribeToFixtureChanges(
  productionId: string,
  callbacks: Pick<RealtimeCallbacks, 'onFixtureChange' | 'onStatusChange' | 'onError'>
): () => void {
  // SECURITY: Validate productionId is a valid UUID
  if (!productionId || !isValidUUID(productionId)) {
    if (isDev) console.warn(`[Realtime] Invalid productionId for fixtures subscription: ${productionId}`)
    return () => { }
  }

  const supabase = createClient()
  const channelName = `production-${productionId}-fixtures`

  const unsubPostgres = createSubscriptionWithRetry(
    channelName,
    () => {
      return supabase.channel(channelName).on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fixtures',
          filter: `production_id=eq.${productionId}`
        },
        (payload) => {
          if (isDev) console.log(`[Realtime] Fixture event: ${payload.eventType}`, payload)
          if (callbacks.onFixtureChange) {
            const fixture = (payload.eventType === 'DELETE' ? payload.old : payload.new) as DbFixture
            callbacks.onFixtureChange(fixture, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE')
          }
        }
      )
    },
    callbacks.onError,
    callbacks.onStatusChange
  )

  // Broadcast channel for direct client-to-client sync (bypasses postgres_changes + RLS)
  const broadcastChannelName = `broadcast-${productionId}-fixtures`
  const broadcastChannel = supabase.channel(broadcastChannelName)
    .on('broadcast', { event: 'fixture-change' }, (payload) => {
      const { eventType } = payload.payload as { eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'BULK_UPLOAD' }
      if (isDev) console.log('[Realtime] Fixture broadcast received:', eventType)

      // For bulk uploads, trigger a full refresh via the callback
      // fixture is undefined for broadcasts — the receiver should do a full refetch
      if (callbacks.onFixtureChange) {
        callbacks.onFixtureChange(undefined, eventType === 'BULK_UPLOAD' ? 'UPDATE' : eventType)
      }
    })
    .subscribe()

  // Store broadcast channel reference for sending
  _fixtureBroadcastChannels.set(productionId, broadcastChannel)

  return () => {
    unsubPostgres()
    supabase.removeChannel(broadcastChannel)
    _fixtureBroadcastChannels.delete(productionId)
  }
}

/**
 * Subscribe to real-time changes for production metadata
 * Includes automatic retry with exponential backoff on connection failures
 */
export function subscribeToProductionChanges(
  productionId: string,
  callbacks: Pick<RealtimeCallbacks, 'onProductionUpdate' | 'onError'>
): () => void {
  // SECURITY: Validate productionId is a valid UUID
  if (!productionId || !isValidUUID(productionId)) {
    if (isDev) console.warn(`[Realtime] Invalid productionId for production subscription: ${productionId}`)
    return () => { }
  }

  const supabase = createClient()
  const channelName = `production-${productionId}-meta`

  return createSubscriptionWithRetry(
    channelName,
    () => {
      return supabase.channel(channelName).on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'productions',
          filter: `id=eq.${productionId}`
        },
        (payload) => {
          if (isDev) console.log(`[Realtime] Production event: ${payload.eventType}`, payload)
          if (callbacks.onProductionUpdate) {
            callbacks.onProductionUpdate(payload.new as DbProduction)
          }
        }
      )
    },
    callbacks.onError
  )
}

/**
 * @deprecated Use granular subscribe functions instead
 */
export function subscribeToProduction(
  productionId: string,
  callbacks: RealtimeCallbacks
): () => void {
  if (isDev) console.warn('[Realtime] subscribeToProduction is deprecated. Using granular subscriptions.')

  const unsubNotes = subscribeToNoteChanges(productionId, callbacks)
  const unsubProd = subscribeToProductionChanges(productionId, callbacks)

  return () => {
    unsubNotes()
    unsubProd()
  }
}

/**
 * Subscribe to all productions list changes is removed/disabled
 * because broad table subscriptions without RLS filters can be security/performance risks
 * and homepage lists should typically just refresh on load or manual refresh.
 */
interface ProductionListCallbacks {
  onInsert?: (production: Record<string, unknown>) => void
  onUpdate?: (production: Record<string, unknown>) => void
  onDelete?: (production: Record<string, unknown>) => void
  onError?: (error: Error) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function subscribeToProductionsList(_callbacks: ProductionListCallbacks): () => void {
  if (isDev) console.warn('subscribeToProductionsList is deprecated/disabled. Use manual refresh.')
  return () => { }
}
