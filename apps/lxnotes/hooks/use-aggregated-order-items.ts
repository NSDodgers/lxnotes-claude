'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { OrderItem, ModuleType } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useOrderItemsStore } from '@/lib/stores/order-items-store'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

interface DbAggregatedRow {
  id: string
  note_id: string
  name: string
  ordered: boolean
  created_at: string
  updated_at: string
  notes: {
    id: string
    channel_numbers: string | null
    position_unit: string | null
    description: string | null
    module_type: ModuleType
    production_id: string
  }
}

export interface NoteGroupMeta {
  noteId: string
  channelNumbers: string | null
  positionUnit: string | null
  description: string | null
  moduleType: ModuleType
}

export interface NoteGroup {
  meta: NoteGroupMeta
  items: OrderItem[]
  orderedCount: number
  totalCount: number
}

export interface AggregatedStats {
  total: number
  ordered: number
  remaining: number
}

export type StatusFilter = 'all' | 'unordered' | 'ordered'
export type ModuleFilter = 'both' | 'work' | 'electrician'

function dbRowToOrderItem(row: DbAggregatedRow): OrderItem {
  return {
    id: row.id,
    noteId: row.note_id,
    name: row.name,
    ordered: row.ordered,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function checkDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
}

export interface UseAggregatedOrderItemsReturn {
  noteGroups: NoteGroup[]
  filteredGroups: NoteGroup[]
  stats: AggregatedStats
  filteredStats: AggregatedStats
  isLoading: boolean
  statusFilter: StatusFilter
  moduleFilter: ModuleFilter
  setStatusFilter: (f: StatusFilter) => void
  setModuleFilter: (f: ModuleFilter) => void
  toggleOrdered: (itemId: string) => Promise<void>
}

export function useAggregatedOrderItems(productionId: string | undefined): UseAggregatedOrderItemsReturn {
  const [allItems, setAllItems] = useState<OrderItem[]>([])
  const [noteMetas, setNoteMetas] = useState<Map<string, NoteGroupMeta>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unordered')
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('both')
  const allItemsRef = useRef(allItems)
  allItemsRef.current = allItems
  const noteIdsRef = useRef<Set<string>>(new Set())
  const isDemo = checkDemoMode()
  const storeUpdateCount = useOrderItemsStore(state => state.updateCount)

  // Fetch all order items for the production
  useEffect(() => {
    if (!productionId || isDemo) {
      setAllItems([])
      setNoteMetas(new Map())
      return
    }

    let cancelled = false
    setIsLoading(true)

    const fetchAll = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('order_items' as SupabaseAny)
        .select('id, note_id, name, ordered, created_at, updated_at, notes!inner(id, channel_numbers, position_unit, description, module_type, production_id, status)')
        .eq('notes.production_id', productionId)
        .in('notes.module_type', ['work', 'electrician'])
        .in('notes.status', ['todo', 'review'])
        .order('created_at', { ascending: true })

      if (cancelled) return
      if (error) {
        console.error('[AggregatedOrderItems] Fetch error:', error)
        setIsLoading(false)
        return
      }

      const rows = (data as SupabaseAny) as DbAggregatedRow[]
      const items: OrderItem[] = []
      const metas = new Map<string, NoteGroupMeta>()
      const noteIds = new Set<string>()

      for (const row of rows) {
        items.push(dbRowToOrderItem(row))
        noteIds.add(row.note_id)
        if (!metas.has(row.note_id)) {
          metas.set(row.note_id, {
            noteId: row.note_id,
            channelNumbers: row.notes.channel_numbers,
            positionUnit: row.notes.position_unit,
            description: row.notes.description,
            moduleType: row.notes.module_type,
          })
        }
      }

      noteIdsRef.current = noteIds
      setAllItems(items)
      setNoteMetas(metas)
      setIsLoading(false)
    }

    fetchAll()
    return () => { cancelled = true }
  }, [productionId, isDemo])

  // Demo mode: read from the order items store counts (items are managed per-note in demo)
  useEffect(() => {
    if (!isDemo) return
    // In demo mode, we don't have a production-wide query. The individual useOrderItems hooks
    // manage demo items per-note. The aggregated view in demo reads from the store counts.
    // For simplicity, demo mode shows an empty state with a message.
  }, [isDemo])

  // Realtime subscription with granular event handling
  useEffect(() => {
    if (!productionId || isDemo) return

    const supabase = createClient()
    const channel = supabase
      .channel(`aggregated-order-items-${productionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        (payload) => {
          const noteId = (payload.new as { note_id?: string })?.note_id
            || (payload.old as { note_id?: string })?.note_id

          // Client-side filter: only process events for notes in this production
          if (noteId && !noteIdsRef.current.has(noteId)) {
            // Could be a new note we don't know about yet — refetch if INSERT
            if (payload.eventType === 'INSERT') {
              // Refetch to pick up new notes
              const refetch = async () => {
                const { data, error } = await supabase
                  .from('order_items' as SupabaseAny)
                  .select('id, note_id, name, ordered, created_at, updated_at, notes!inner(id, channel_numbers, position_unit, description, module_type, production_id, status)')
                  .eq('notes.production_id', productionId)
                  .in('notes.module_type', ['work', 'electrician'])
                  .in('notes.status', ['todo', 'review'])
                  .order('created_at', { ascending: true })

                if (error) return
                const rows = (data as SupabaseAny) as DbAggregatedRow[]
                const items: OrderItem[] = []
                const metas = new Map<string, NoteGroupMeta>()
                const noteIds = new Set<string>()
                for (const row of rows) {
                  items.push(dbRowToOrderItem(row))
                  noteIds.add(row.note_id)
                  if (!metas.has(row.note_id)) {
                    metas.set(row.note_id, {
                      noteId: row.note_id,
                      channelNumbers: row.notes.channel_numbers,
                      positionUnit: row.notes.position_unit,
                      description: row.notes.description,
                      moduleType: row.notes.module_type,
                    })
                  }
                }
                noteIdsRef.current = noteIds
                setAllItems(items)
                setNoteMetas(metas)
              }
              refetch()
            }
            return
          }

          switch (payload.eventType) {
            case 'INSERT': {
              const row = payload.new as { id: string; note_id: string; name: string; ordered: boolean; created_at: string; updated_at: string }
              const newItem: OrderItem = {
                id: row.id,
                noteId: row.note_id,
                name: row.name,
                ordered: row.ordered,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
              }
              setAllItems(prev => {
                if (prev.some(i => i.id === newItem.id)) return prev
                return [...prev, newItem]
              })
              break
            }
            case 'UPDATE': {
              const row = payload.new as { id: string; note_id: string; name: string; ordered: boolean; created_at: string; updated_at: string }
              const updated: OrderItem = {
                id: row.id,
                noteId: row.note_id,
                name: row.name,
                ordered: row.ordered,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
              }
              setAllItems(prev => prev.map(i => i.id === updated.id ? updated : i))
              break
            }
            case 'DELETE': {
              const oldId = (payload.old as { id: string }).id
              setAllItems(prev => prev.filter(i => i.id !== oldId))
              break
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productionId, isDemo])

  // Sync counts to store for table column display
  useEffect(() => {
    const counts: Record<string, { total: number; ordered: number }> = {}
    for (const item of allItems) {
      if (!counts[item.noteId]) counts[item.noteId] = { total: 0, ordered: 0 }
      counts[item.noteId].total++
      if (item.ordered) counts[item.noteId].ordered++
    }
    for (const [noteId, c] of Object.entries(counts)) {
      storeUpdateCount(noteId, c)
    }
  }, [allItems, storeUpdateCount])

  // Build note groups sorted by remaining items descending
  const noteGroups = useMemo((): NoteGroup[] => {
    const groupMap = new Map<string, OrderItem[]>()
    for (const item of allItems) {
      const group = groupMap.get(item.noteId) || []
      group.push(item)
      groupMap.set(item.noteId, group)
    }

    const groups: NoteGroup[] = []
    for (const [noteId, items] of groupMap) {
      const meta = noteMetas.get(noteId)
      if (!meta) continue
      // Sort items: unordered first, then ordered
      const sorted = [...items].sort((a, b) => {
        if (a.ordered !== b.ordered) return a.ordered ? 1 : -1
        return a.createdAt.getTime() - b.createdAt.getTime()
      })
      const orderedCount = items.filter(i => i.ordered).length
      groups.push({
        meta,
        items: sorted,
        orderedCount,
        totalCount: items.length,
      })
    }

    // Sort groups by remaining items descending (most outstanding first)
    groups.sort((a, b) => {
      const aRemaining = a.totalCount - a.orderedCount
      const bRemaining = b.totalCount - b.orderedCount
      return bRemaining - aRemaining
    })

    return groups
  }, [allItems, noteMetas])

  // Global stats (always reflects all items regardless of filter)
  const stats = useMemo((): AggregatedStats => {
    const ordered = allItems.filter(i => i.ordered).length
    return {
      total: allItems.length,
      ordered,
      remaining: allItems.length - ordered,
    }
  }, [allItems])

  // Apply filters
  const filteredGroups = useMemo((): NoteGroup[] => {
    let groups = noteGroups

    // Module filter
    if (moduleFilter !== 'both') {
      groups = groups.filter(g => g.meta.moduleType === moduleFilter)
    }

    // Status filter
    if (statusFilter === 'unordered') {
      groups = groups
        .map(g => ({
          ...g,
          items: g.items.filter(i => !i.ordered),
        }))
        .filter(g => g.items.length > 0)
    } else if (statusFilter === 'ordered') {
      groups = groups
        .map(g => ({
          ...g,
          items: g.items.filter(i => i.ordered),
        }))
        .filter(g => g.items.length > 0)
    }

    return groups
  }, [noteGroups, statusFilter, moduleFilter])

  // Filtered stats
  const filteredStats = useMemo((): AggregatedStats => {
    let items = allItems
    if (moduleFilter !== 'both') {
      const noteIds = new Set(noteGroups.filter(g => g.meta.moduleType === moduleFilter).map(g => g.meta.noteId))
      items = items.filter(i => noteIds.has(i.noteId))
    }
    const ordered = items.filter(i => i.ordered).length
    return { total: items.length, ordered, remaining: items.length - ordered }
  }, [allItems, noteGroups, moduleFilter])

  // Toggle ordered (optimistic + Supabase update)
  const toggleOrdered = useCallback(async (itemId: string) => {
    const item = allItemsRef.current.find(i => i.id === itemId)
    if (!item) return

    const newOrdered = !item.ordered

    // Optimistic
    setAllItems(prev => prev.map(i => i.id === itemId ? { ...i, ordered: newOrdered } : i))

    const supabase = createClient()
    const { error } = await supabase
      .from('order_items' as SupabaseAny)
      .update({ ordered: newOrdered })
      .eq('id', itemId)

    if (error) {
      console.error('[AggregatedOrderItems] Toggle error:', error)
      // Silent revert (match existing pattern)
      setAllItems(prev => prev.map(i => i.id === itemId ? { ...i, ordered: !newOrdered } : i))
    }
  }, [])

  return {
    noteGroups,
    filteredGroups,
    stats,
    filteredStats,
    isLoading,
    statusFilter,
    moduleFilter,
    setStatusFilter,
    setModuleFilter,
    toggleOrdered,
  }
}
