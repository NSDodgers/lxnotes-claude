/**
 * Supabase Realtime Subscriptions
 *
 * Manages real-time subscriptions to production data changes.
 * Uses Supabase Realtime postgres_changes for direct table change notifications.
 */

import { createClient } from './client'
import type { Database } from './database.types'

type DbNote = Database['public']['Tables']['notes']['Row']
type DbFixture = Database['public']['Tables']['fixtures']['Row']
type DbProduction = Database['public']['Tables']['productions']['Row']

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
 */
export function subscribeToNoteChanges(
  productionId: string,
  callbacks: Pick<RealtimeCallbacks, 'onNoteInsert' | 'onNoteUpdate' | 'onNoteDelete' | 'onStatusChange' | 'onError'>
): () => void {
  const supabase = createClient()
  if (!productionId) return () => { }

  console.log(`[Realtime] Subscribing to NOTES for production: ${productionId}`)
  const channel = supabase.channel(`production-${productionId}-notes`)

  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `production_id=eq.${productionId}`
      },
      (payload) => {
        console.log(`[Realtime] Note event: ${payload.eventType}`, payload)

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
    .subscribe((status, err) => {
      console.log(`[Realtime] Notes channel status:`, status)
      if (callbacks.onStatusChange) callbacks.onStatusChange(status)
      if (status === 'CHANNEL_ERROR' && callbacks.onError) callbacks.onError(new Error(`Notes error: ${err?.message}`))
    })

  return () => {
    console.log(`[Realtime] Unsubscribing from NOTES for ${productionId}`)
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to real-time changes for fixtures
 */
export function subscribeToFixtureChanges(
  productionId: string,
  callbacks: Pick<RealtimeCallbacks, 'onFixtureInsert' | 'onFixtureUpdate' | 'onFixtureDelete' | 'onError'>
): () => void {
  const supabase = createClient()
  if (!productionId) return () => { }

  console.log(`[Realtime] Subscribing to FIXTURES for production: ${productionId}`)
  const channel = supabase.channel(`production-${productionId}-fixtures`)

  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fixtures',
        filter: `production_id=eq.${productionId}`
      },
      (payload) => {
        console.log(`[Realtime] Fixture event: ${payload.eventType}`, payload)

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
    .subscribe((status, err) => {
      console.log(`[Realtime] Fixtures channel status:`, status)
      if (status === 'CHANNEL_ERROR' && callbacks.onError) callbacks.onError(new Error(`Fixtures error: ${err?.message}`))
    })

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to real-time changes for production metadata
 */
export function subscribeToProductionChanges(
  productionId: string,
  callbacks: Pick<RealtimeCallbacks, 'onProductionUpdate' | 'onError'>
): () => void {
  const supabase = createClient()
  if (!productionId) return () => { }

  console.log(`[Realtime] Subscribing to METADATA for production: ${productionId}`)
  const channel = supabase.channel(`production-${productionId}-meta`)

  channel
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'productions',
        filter: `id=eq.${productionId}`
      },
      (payload) => {
        console.log(`[Realtime] Production event: ${payload.eventType}`, payload)
        if (callbacks.onProductionUpdate) {
          callbacks.onProductionUpdate(payload.new as DbProduction)
        }
      }
    )
    .subscribe((status, err) => {
      console.log(`[Realtime] Production channel status:`, status)
      if (status === 'CHANNEL_ERROR' && callbacks.onError) callbacks.onError(new Error(`Production error: ${err?.message}`))
    })

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * @deprecated Use granular subscribe functions instead
 */
export function subscribeToProduction(
  productionId: string,
  callbacks: RealtimeCallbacks
): () => void {
  console.warn('[Realtime] subscribeToProduction is deprecated. Using granular subscriptions.')

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
  console.warn('subscribeToProductionsList is deprecated/disabled. Use manual refresh.')
  return () => { }
}
