import { create } from 'zustand'
import type { OrderItemCounts } from '@/types'

interface OrderItemsState {
  counts: Record<string, OrderItemCounts> // keyed by noteId
  setCounts: (counts: Record<string, OrderItemCounts>) => void
  updateCount: (noteId: string, counts: OrderItemCounts) => void
  removeCount: (noteId: string) => void
  getCount: (noteId: string) => OrderItemCounts | null
}

export const useOrderItemsStore = create<OrderItemsState>()((set, get) => ({
  counts: {},

  setCounts: (counts) => set({ counts }),

  updateCount: (noteId, counts) =>
    set(state => ({ counts: { ...state.counts, [noteId]: counts } })),

  removeCount: (noteId) =>
    set(state => {
      const { [noteId]: _, ...rest } = state.counts
      return { counts: rest }
    }),

  getCount: (noteId) => get().counts[noteId] || null,
}))
