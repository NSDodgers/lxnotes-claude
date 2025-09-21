import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PositionOrder {
  id: string
  productionId: string
  positions: string[] // Ordered array of position names
  positionOrderMap?: Record<string, number> // CSV-provided order values
  orderSource: 'csv' | 'custom' | 'alphabetical' // Source of the current order
  lastUpdated: Date
  csvChecksum?: string // To detect changes in CSV data
}

interface PositionState {
  // Core data
  orders: Record<string, PositionOrder> // keyed by productionId

  // Actions
  updateOrder: (productionId: string, positions: string[], orderSource?: 'csv' | 'custom' | 'alphabetical') => void
  getOrderedPositions: (productionId: string) => string[]
  handleCsvUpdate: (productionId: string, newPositions: string[]) => UpdateResult
  handleCsvUpdateWithOrder: (productionId: string, fixtures: Array<{ position: string; positionOrder?: number }>) => UpdateResult
  clearOrder: (productionId: string) => void

  // Utilities
  extractUniquePositions: (fixtures: Array<{ position: string }>) => string[]
  extractPositionsWithOrder: (fixtures: Array<{ position: string; positionOrder?: number }>) => { positions: string[]; orderMap: Record<string, number> }
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
      updateOrder: (productionId: string, positions: string[], orderSource: 'csv' | 'custom' | 'alphabetical' = 'custom') => {
        const now = new Date()
        const existingOrder = get().orders[productionId]

        const newOrder: PositionOrder = {
          id: `pos-order-${productionId}`,
          productionId,
          positions,
          positionOrderMap: existingOrder?.positionOrderMap, // Preserve existing order map unless it's a CSV update
          orderSource,
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

        // Auto-update the order - this is from CSV so mark as custom since user may have manually adjusted
        get().updateOrder(productionId, finalOrder, 'custom')

        return {
          type: updateType,
          addedPositions,
          removedPositions,
          newOrder: finalOrder,
          needsReview
        }
      },

      // Handle CSV update with position order information
      handleCsvUpdateWithOrder: (productionId: string, fixtures: Array<{ position: string; positionOrder?: number }>): UpdateResult => {
        const existingOrder = get().orders[productionId]
        const { positions: newPositions, orderMap } = get().extractPositionsWithOrder(fixtures)
        const newChecksum = get().generateChecksum(newPositions)

        // If no existing order, use CSV order if available, otherwise alphabetical
        if (!existingOrder) {
          const hasAnyOrder = Object.keys(orderMap).length > 0
          let orderedPositions: string[]
          let orderSource: 'csv' | 'alphabetical'

          if (hasAnyOrder) {
            // Sort by position order, with positions without order at the end (alphabetically)
            orderedPositions = newPositions.sort((a, b) => {
              const aOrder = orderMap[a]
              const bOrder = orderMap[b]

              if (aOrder !== undefined && bOrder !== undefined) {
                return aOrder - bOrder
              } else if (aOrder !== undefined && bOrder === undefined) {
                return -1
              } else if (aOrder === undefined && bOrder !== undefined) {
                return 1
              } else {
                return a.localeCompare(b)
              }
            })
            orderSource = 'csv'
          } else {
            orderedPositions = [...newPositions].sort()
            orderSource = 'alphabetical'
          }

          // Create new order with CSV data
          const now = new Date()
          const newOrder: PositionOrder = {
            id: `pos-order-${productionId}`,
            productionId,
            positions: orderedPositions,
            positionOrderMap: Object.keys(orderMap).length > 0 ? orderMap : undefined,
            orderSource,
            lastUpdated: now,
            csvChecksum: newChecksum
          }

          set(state => ({
            orders: {
              ...state.orders,
              [productionId]: newOrder
            }
          }))

          return {
            type: 'no_change',
            addedPositions: [],
            removedPositions: [],
            newOrder: orderedPositions,
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

        // Smart merge: preserve existing order unless it was CSV-derived and we have new CSV order
        const existingPositions = new Set(existingOrder.positions)
        const newPositionsSet = new Set(newPositions)

        const addedPositions = newPositions.filter(pos => !existingPositions.has(pos))
        const removedPositions = existingOrder.positions.filter(pos => !newPositionsSet.has(pos))

        let finalOrder: string[]
        let finalOrderMap: Record<string, number> | undefined
        let finalOrderSource = existingOrder.orderSource

        // If the existing order was from CSV and we have new CSV order data, use the new CSV order
        if (existingOrder.orderSource === 'csv' && Object.keys(orderMap).length > 0) {
          finalOrder = newPositions.sort((a, b) => {
            const aOrder = orderMap[a]
            const bOrder = orderMap[b]

            if (aOrder !== undefined && bOrder !== undefined) {
              return aOrder - bOrder
            } else if (aOrder !== undefined && bOrder === undefined) {
              return -1
            } else if (aOrder === undefined && bOrder !== undefined) {
              return 1
            } else {
              return a.localeCompare(b)
            }
          })
          finalOrderMap = orderMap
          finalOrderSource = 'csv'
        } else {
          // Preserve existing order, add new positions at end
          const preservedOrder = existingOrder.positions.filter(pos => newPositionsSet.has(pos))
          finalOrder = [...preservedOrder, ...addedPositions]
          finalOrderMap = existingOrder.positionOrderMap
          // Keep existing order source
        }

        // Determine update type
        let updateType: UpdateResult['type'] = 'no_change'
        let needsReview = false

        if (addedPositions.length > 0 && removedPositions.length > 0) {
          updateType = 'positions_changed'
          needsReview = true
        } else if (addedPositions.length > 0) {
          updateType = 'positions_added'
          needsReview = addedPositions.length > 3
        } else if (removedPositions.length > 0) {
          updateType = 'positions_removed'
          needsReview = true
        }

        // Update the order
        const now = new Date()
        const updatedOrder: PositionOrder = {
          ...existingOrder,
          positions: finalOrder,
          positionOrderMap: finalOrderMap,
          orderSource: finalOrderSource,
          lastUpdated: now,
          csvChecksum: newChecksum
        }

        set(state => ({
          orders: {
            ...state.orders,
            [productionId]: updatedOrder
          }
        }))

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

      // Extract positions with order information from fixture data
      extractPositionsWithOrder: (fixtures: Array<{ position: string; positionOrder?: number }>): { positions: string[]; orderMap: Record<string, number> } => {
        const positions = fixtures
          .map(f => f.position)
          .filter(Boolean)
          .filter(pos => pos.trim().length > 0)

        const uniquePositions = [...new Set(positions)]
        const orderMap: Record<string, number> = {}

        // Build order map from fixtures that have position order data
        fixtures.forEach(fixture => {
          if (fixture.position && fixture.positionOrder !== undefined) {
            const position = fixture.position.trim()
            if (position && !orderMap.hasOwnProperty(position)) {
              orderMap[position] = fixture.positionOrder
            }
          }
        })

        return {
          positions: uniquePositions,
          orderMap
        }
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
    }
  )
)