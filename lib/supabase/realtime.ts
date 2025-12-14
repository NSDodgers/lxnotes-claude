/**
 * Supabase Realtime Subscriptions
 *
 * Manages real-time subscriptions to production data changes.
 * Uses Supabase Realtime to receive instant updates when data changes.
 */

import { createClient } from './client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
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
}

/**
 * Subscribe to real-time changes for a specific production
 *
 * @param productionId - The production to subscribe to
 * @param callbacks - Callback functions for different events
 * @returns Unsubscribe function
 */
export function subscribeToProduction(
  productionId: string,
  callbacks: RealtimeCallbacks
): () => void {
  const supabase = createClient()
  const channels: RealtimeChannel[] = []

  // Subscribe to notes changes
  const notesChannel = supabase
    .channel(`notes:${productionId}`)
    .on<DbNote>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notes',
        filter: `production_id=eq.${productionId}`,
      },
      (payload: RealtimePostgresChangesPayload<DbNote>) => {
        if (payload.new && callbacks.onNoteInsert) {
          callbacks.onNoteInsert(payload.new as DbNote)
        }
      }
    )
    .on<DbNote>(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notes',
        filter: `production_id=eq.${productionId}`,
      },
      (payload: RealtimePostgresChangesPayload<DbNote>) => {
        if (payload.new && callbacks.onNoteUpdate) {
          callbacks.onNoteUpdate(payload.new as DbNote)
        }
      }
    )
    .on<DbNote>(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'notes',
        filter: `production_id=eq.${productionId}`,
      },
      (payload: RealtimePostgresChangesPayload<DbNote>) => {
        if (payload.old && callbacks.onNoteDelete) {
          callbacks.onNoteDelete(payload.old as DbNote)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && callbacks.onError) {
        callbacks.onError(new Error('Failed to subscribe to notes channel'))
      }
    })

  channels.push(notesChannel)

  // Subscribe to fixtures changes
  const fixturesChannel = supabase
    .channel(`fixtures:${productionId}`)
    .on<DbFixture>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'fixtures',
        filter: `production_id=eq.${productionId}`,
      },
      (payload: RealtimePostgresChangesPayload<DbFixture>) => {
        if (payload.new && callbacks.onFixtureInsert) {
          callbacks.onFixtureInsert(payload.new as DbFixture)
        }
      }
    )
    .on<DbFixture>(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'fixtures',
        filter: `production_id=eq.${productionId}`,
      },
      (payload: RealtimePostgresChangesPayload<DbFixture>) => {
        if (payload.new && callbacks.onFixtureUpdate) {
          callbacks.onFixtureUpdate(payload.new as DbFixture)
        }
      }
    )
    .on<DbFixture>(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'fixtures',
        filter: `production_id=eq.${productionId}`,
      },
      (payload: RealtimePostgresChangesPayload<DbFixture>) => {
        if (payload.old && callbacks.onFixtureDelete) {
          callbacks.onFixtureDelete(payload.old as DbFixture)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && callbacks.onError) {
        callbacks.onError(new Error('Failed to subscribe to fixtures channel'))
      }
    })

  channels.push(fixturesChannel)

  // Subscribe to production changes
  const productionChannel = supabase
    .channel(`production:${productionId}`)
    .on<DbProduction>(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'productions',
        filter: `id=eq.${productionId}`,
      },
      (payload: RealtimePostgresChangesPayload<DbProduction>) => {
        if (payload.new && callbacks.onProductionUpdate) {
          callbacks.onProductionUpdate(payload.new as DbProduction)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && callbacks.onError) {
        callbacks.onError(new Error('Failed to subscribe to production channel'))
      }
    })

  channels.push(productionChannel)

  // Return unsubscribe function
  return () => {
    channels.forEach(channel => {
      supabase.removeChannel(channel)
    })
  }
}

/**
 * Subscribe to all productions list changes (for homepage)
 *
 * @param callbacks - Callback functions for production events
 * @returns Unsubscribe function
 */
export function subscribeToProductionsList(callbacks: {
  onInsert?: (production: DbProduction) => void
  onUpdate?: (production: DbProduction) => void
  onDelete?: (oldProduction: DbProduction) => void
  onError?: (error: Error) => void
}): () => void {
  const supabase = createClient()

  const channel = supabase
    .channel('productions-list')
    .on<DbProduction>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'productions',
      },
      (payload: RealtimePostgresChangesPayload<DbProduction>) => {
        if (payload.new && callbacks.onInsert) {
          callbacks.onInsert(payload.new as DbProduction)
        }
      }
    )
    .on<DbProduction>(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'productions',
      },
      (payload: RealtimePostgresChangesPayload<DbProduction>) => {
        if (payload.new && callbacks.onUpdate) {
          callbacks.onUpdate(payload.new as DbProduction)
        }
      }
    )
    .on<DbProduction>(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'productions',
      },
      (payload: RealtimePostgresChangesPayload<DbProduction>) => {
        if (payload.old && callbacks.onDelete) {
          callbacks.onDelete(payload.old as DbProduction)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && callbacks.onError) {
        callbacks.onError(new Error('Failed to subscribe to productions list channel'))
      }
    })

  return () => {
    supabase.removeChannel(channel)
  }
}
