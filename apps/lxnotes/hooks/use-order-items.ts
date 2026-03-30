'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { OrderItem } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useOrderItemsStore } from '@/lib/stores/order-items-store'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

interface DbOrderItem {
  id: string
  note_id: string
  name: string
  ordered: boolean
  created_at: string
  updated_at: string
}

function dbRowToOrderItem(row: DbOrderItem): OrderItem {
  return {
    id: row.id,
    noteId: row.note_id,
    name: row.name,
    ordered: row.ordered,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export interface UseOrderItemsReturn {
  items: OrderItem[]
  isLoading: boolean
  addItem: (name: string) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  toggleOrdered: (itemId: string) => Promise<void>
}

// Check if running in demo mode
function checkDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
}

// In-memory store for demo mode order items (keyed by noteId)
const demoOrderItems: Record<string, OrderItem[]> = {}

function getDemoItems(noteId: string): OrderItem[] {
  if (!demoOrderItems[noteId]) {
    demoOrderItems[noteId] = []
  }
  return demoOrderItems[noteId]
}

/**
 * Hook to manage order items for a specific note.
 * Supports optimistic updates and realtime subscriptions.
 * In demo mode, uses in-memory storage.
 * Pass noteId = null/undefined to disable.
 */
export function useOrderItems(noteId: string | null | undefined): UseOrderItemsReturn {
  const [items, setItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const isDemo = checkDemoMode()
  const updateStoreCount = useOrderItemsStore(state => state.updateCount)
  const removeStoreCount = useOrderItemsStore(state => state.removeCount)

  // Sync demo mode items to the counts store for table column
  useEffect(() => {
    if (!isDemo || !noteId) return
    if (items.length === 0) {
      removeStoreCount(noteId)
    } else {
      updateStoreCount(noteId, {
        total: items.length,
        ordered: items.filter(i => i.ordered).length,
      })
    }
  }, [isDemo, noteId, items, updateStoreCount, removeStoreCount])

  // Initialize items
  useEffect(() => {
    if (!noteId) {
      setItems([])
      return
    }

    if (isDemo) {
      setItems(getDemoItems(noteId))
      return
    }

    let cancelled = false
    setIsLoading(true)

    const fetchItems = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('order_items' as SupabaseAny)
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: true })

      if (cancelled) return
      if (error) {
        console.error('[OrderItems] Fetch error:', error)
        setIsLoading(false)
        return
      }

      setItems(((data as SupabaseAny) as DbOrderItem[]).map(dbRowToOrderItem))
      setIsLoading(false)
    }

    fetchItems()
    return () => { cancelled = true }
  }, [noteId, isDemo])

  // Realtime subscription (production mode only)
  useEffect(() => {
    if (!noteId || isDemo) return

    const supabase = createClient()
    const channel = supabase
      .channel(`order-items-${noteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
          filter: `note_id=eq.${noteId}`,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT': {
              const newItem = dbRowToOrderItem(payload.new as DbOrderItem)
              setItems(prev => {
                if (prev.some(i => i.id === newItem.id)) return prev
                return [...prev, newItem]
              })
              break
            }
            case 'UPDATE': {
              const updated = dbRowToOrderItem(payload.new as DbOrderItem)
              setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
              break
            }
            case 'DELETE': {
              const oldId = (payload.old as { id: string }).id
              setItems(prev => prev.filter(i => i.id !== oldId))
              break
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [noteId, isDemo])

  const addItem = useCallback(async (name: string) => {
    if (!noteId || !name.trim()) return

    const newItem: OrderItem = {
      id: isDemo ? `demo-order-${Date.now()}` : `temp-${Date.now()}`,
      noteId,
      name: name.trim(),
      ordered: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (isDemo) {
      demoOrderItems[noteId] = [...(demoOrderItems[noteId] || []), newItem]
      setItems([...demoOrderItems[noteId]])
      return
    }

    // Optimistic add
    setItems(prev => [...prev, newItem])

    const supabase = createClient()
    const { data, error } = await supabase
      .from('order_items' as SupabaseAny)
      .insert({ note_id: noteId, name: name.trim() })
      .select()
      .single()

    if (error) {
      console.error('[OrderItems] Insert error:', error)
      setItems(prev => prev.filter(i => i.id !== newItem.id))
      return
    }

    const realItem = dbRowToOrderItem((data as SupabaseAny) as DbOrderItem)
    setItems(prev => prev.map(i => i.id === newItem.id ? realItem : i))
  }, [noteId, isDemo])

  const removeItem = useCallback(async (itemId: string) => {
    if (isDemo && noteId) {
      demoOrderItems[noteId] = (demoOrderItems[noteId] || []).filter(i => i.id !== itemId)
      setItems([...demoOrderItems[noteId]])
      return
    }

    const removed = itemsRef.current.find(i => i.id === itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))

    const supabase = createClient()
    const { error } = await supabase
      .from('order_items' as SupabaseAny)
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('[OrderItems] Delete error:', error)
      if (removed) {
        setItems(prev => [...prev, removed])
      }
    }
  }, [isDemo, noteId])

  const toggleOrdered = useCallback(async (itemId: string) => {
    const item = itemsRef.current.find(i => i.id === itemId)
    if (!item) return

    const newOrdered = !item.ordered

    if (isDemo && noteId) {
      demoOrderItems[noteId] = (demoOrderItems[noteId] || []).map(i =>
        i.id === itemId ? { ...i, ordered: newOrdered } : i
      )
      setItems([...demoOrderItems[noteId]])
      return
    }

    // Optimistic
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ordered: newOrdered } : i))

    const supabase = createClient()
    const { error } = await supabase
      .from('order_items' as SupabaseAny)
      .update({ ordered: newOrdered })
      .eq('id', itemId)

    if (error) {
      console.error('[OrderItems] Update error:', error)
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, ordered: !newOrdered } : i))
    }
  }, [isDemo, noteId])

  return { items, isLoading, addItem, removeItem, toggleOrdered }
}
