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
  onFixtureInsert?: (fixture: DbFixture) => void
  onFixtureUpdate?: (fixture: DbFixture) => void
  onFixtureDelete?: (oldFixture: DbFixture) => void
  onProductionUpdate?: (production: DbProduction) => void
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

  return createSubscriptionWithRetry(
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
}

/**
 * Subscribe to real-time changes for fixtures
 * Includes automatic retry with exponential backoff on connection failures
 */
export function subscribeToFixtureChanges(
  productionId: string,
  callbacks: Pick<RealtimeCallbacks, 'onFixtureInsert' | 'onFixtureUpdate' | 'onFixtureDelete' | 'onError'>
): () => void {
  // SECURITY: Validate productionId is a valid UUID
  if (!productionId || !isValidUUID(productionId)) {
    if (isDev) console.warn(`[Realtime] Invalid productionId for fixtures subscription: ${productionId}`)
    return () => { }
  }

  const supabase = createClient()
  const channelName = `production-${productionId}-fixtures`

  return createSubscriptionWithRetry(
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

          switch (payload.eventType) {
            case 'INSERT':
              if (callbacks.onFixtureInsert) callbacks.onFixtureInsert(payload.new as DbFixture)
              break
            case 'UPDATE':
              if (callbacks.onFixtureUpdate) callbacks.onFixtureUpdate(payload.new as DbFixture)
              break
            case 'DELETE':
              if (callbacks.onFixtureDelete) callbacks.onFixtureDelete(payload.old as DbFixture)
              break
          }
        }
      )
    },
    callbacks.onError
  )
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
  const unsubFixtures = subscribeToFixtureChanges(productionId, callbacks)
  const unsubProd = subscribeToProductionChanges(productionId, callbacks)

  return () => {
    unsubNotes()
    unsubFixtures()
    unsubProd()
  }
}

/**
 * Subscribe to all productions list changes is removed/disabled
 * because broad table subscriptions without RLS filters can be security/performance risks
 * and homepage lists should typically just refresh on load or manual refresh.
 */
export function subscribeToProductionsList(callbacks: any): () => void {
  if (isDev) console.warn('subscribeToProductionsList is deprecated/disabled. Use manual refresh.')
  return () => { }
}
