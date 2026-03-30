'use client'

import { useEffect } from 'react'
import type { OrderItemCounts } from '@/types'
import { createClient } from '@/lib/supabase/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any
import { useOrderItemsStore } from '@/lib/stores/order-items-store'


/**
 * Hook to fetch and subscribe to order item counts for all notes in a production.
 * Populates the order items store so table cells can read counts via useOrderItemsStore.
 * Call once at the page level for work and electrician modules.
 * Pass productionId = undefined for demo mode (uses static demo counts).
 */
export function useOrderItemCounts(productionId: string | undefined): void {
  const setCounts = useOrderItemsStore(state => state.setCounts)

  // Production mode: fetch from Supabase
  useEffect(() => {
    if (!productionId) return

    let cancelled = false

    const fetchCounts = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('order_items' as SupabaseAny)
        .select('note_id, ordered, notes!inner(production_id)')
        .eq('notes.production_id', productionId)

      if (cancelled || error) {
        if (error) console.error('[OrderItemCounts] Fetch error:', error)
        return
      }

      const map: Record<string, OrderItemCounts> = {}
      for (const row of (data as SupabaseAny) as Array<{ note_id: string; ordered: boolean }>) {
        if (!map[row.note_id]) map[row.note_id] = { total: 0, ordered: 0 }
        map[row.note_id].total++
        if (row.ordered) map[row.note_id].ordered++
      }
      setCounts(map)
    }

    fetchCounts()
    return () => { cancelled = true }
  }, [productionId, setCounts])

  // Realtime subscription (production mode only)
  useEffect(() => {
    if (!productionId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`order-item-counts-${productionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => {
          const refetch = async () => {
            const { data, error } = await supabase
              .from('order_items' as SupabaseAny)
              .select('note_id, ordered, notes!inner(production_id)')
              .eq('notes.production_id', productionId)

            if (error) return

            const map: Record<string, OrderItemCounts> = {}
            for (const row of (data as SupabaseAny) as Array<{ note_id: string; ordered: boolean }>) {
              if (!map[row.note_id]) map[row.note_id] = { total: 0, ordered: 0 }
              map[row.note_id].total++
              if (row.ordered) map[row.note_id].ordered++
            }
            setCounts(map)
          }
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productionId, setCounts])
}
