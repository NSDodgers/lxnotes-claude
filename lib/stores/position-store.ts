import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PositionOrder {
  id: string
  productionId: string
  positions: string[] // Ordered array of position names
  lastUpdated: Date
  csvChecksum?: string // To detect changes in CSV data
}

interface PositionState {
  // Core data
  orders: Record<string, PositionOrder> // keyed by productionId

  // Actions
  updateOrder: (productionId: string, positions: string[]) => void
  getOrderedPositions: (productionId: string) => string[]
  handleCsvUpdate: (productionId: string, newPositions: string[]) => UpdateResult
  clearOrder: (productionId: string) => void

  // Utilities
  extractUniquePositions: (fixtures: Array<{ position: string }>) => string[]
  generateChecksum: (positions: string[]) => string
}

export interface UpdateResult {
  type: 'no_change' | 'positions_added' | 'positions_removed' | 'positions_changed'
  addedPositions: string[]
  removedPositions: string[]
  newOrder: string[]
  needsReview: boolean
}

export const usePositionStore = create<PositionState>()(
  persist(
    (set, get) => ({
      // Initial state
      orders: {},

      // Update the position order for a production
      updateOrder: (productionId: string, positions: string[]) => {
        const now = new Date()
        const newOrder: PositionOrder = {
          id: `pos-order-${productionId}`,
          productionId,
          positions,
          lastUpdated: now,
          csvChecksum: get().generateChecksum(positions)
        }

        set(state => ({
          orders: {
            ...state.orders,
            [productionId]: newOrder
          }
        }))
      },

      // Get ordered positions for a production, with fallback to alphabetical
      getOrderedPositions: (productionId: string): string[] => {
        const order = get().orders[productionId]
        return order?.positions || []
      },

      // Handle CSV update with smart merge strategy
      handleCsvUpdate: (productionId: string, newPositions: string[]): UpdateResult => {
        const existingOrder = get().orders[productionId]
        const newChecksum = get().generateChecksum(newPositions)

        // If no existing order, just return the new positions
        if (!existingOrder) {
          return {
            type: 'no_change',
            addedPositions: [],
            removedPositions: [],
            newOrder: newPositions.sort(), // Start with alphabetical order
            needsReview: false
          }
        }

        // Check if positions have actually changed
        if (existingOrder.csvChecksum === newChecksum) {
          return {
            type: 'no_change',
            addedPositions: [],
            removedPositions: [],
            newOrder: existingOrder.positions,
            needsReview: false
          }
        }

        // Smart merge: preserve existing order, add new, remove missing
        const existingPositions = new Set(existingOrder.positions)
        const newPositionsSet = new Set(newPositions)

        const addedPositions = newPositions.filter(pos => !existingPositions.has(pos))
        const removedPositions = existingOrder.positions.filter(pos => !newPositionsSet.has(pos))

        // Create new order: existing positions that still exist + new positions at end
        const preservedOrder = existingOrder.positions.filter(pos => newPositionsSet.has(pos))
        const finalOrder = [...preservedOrder, ...addedPositions]

        // Determine update type
        let updateType: UpdateResult['type'] = 'no_change'
        let needsReview = false

        if (addedPositions.length > 0 && removedPositions.length > 0) {
          updateType = 'positions_changed'
          needsReview = true
        } else if (addedPositions.length > 0) {
          updateType = 'positions_added'
          needsReview = addedPositions.length > 3 // Review if many positions added
        } else if (removedPositions.length > 0) {
          updateType = 'positions_removed'
          needsReview = true
        }

        // Auto-update the order
        get().updateOrder(productionId, finalOrder)

        return {
          type: updateType,
          addedPositions,
          removedPositions,
          newOrder: finalOrder,
          needsReview
        }
      },

      // Clear position order for a production
      clearOrder: (productionId: string) => {
        set(state => {
          const newOrders = { ...state.orders }
          delete newOrders[productionId]
          return { orders: newOrders }
        })
      },

      // Extract unique positions from fixture data
      extractUniquePositions: (fixtures: Array<{ position: string }>): string[] => {
        const positions = fixtures
          .map(f => f.position)
          .filter(Boolean) // Remove empty/null positions
          .filter(pos => pos.trim().length > 0) // Remove whitespace-only positions

        return [...new Set(positions)].sort()
      },

      // Generate a simple checksum for position arrays
      generateChecksum: (positions: string[]): string => {
        const sorted = [...positions].sort()
        return btoa(sorted.join('|')).slice(0, 16)
      }
    }),
    {
      name: 'position-orders',
      version: 1,
      // Custom serialization for Date objects
      serialize: (state) => JSON.stringify(state, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() }
        }
        return value
      }),
      deserialize: (str) => JSON.parse(str, (key, value) => {
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.value)
        }
        return value
      })
    }
  )
)