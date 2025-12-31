import { SortingFn } from '@tanstack/react-table'
import { Note } from '@/types'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { usePositionStore } from '@/lib/stores/position-store'
import { useFixtureStore } from '@/lib/stores/fixture-store'

/**
 * Helper function to extract position from positionUnit field
 * positionUnit format is typically "Position Units X-Y" or "Position Unit X"
 * We want to extract just the "Position" part
 */
function extractPositionFromUnit(positionUnit: string): string {
  if (!positionUnit) return ''

  // Split by "Unit" and take the first part, then trim
  const parts = positionUnit.split(/\s+Unit/i)
  return parts[0]?.trim() || positionUnit
}

/**
 * Helper function to extract lowest channel number from channel expressions
 * Handles expressions like "1-5, 21, 45" or "1, 3-7, 12"
 */
function extractLowestChannelNumber(channelExpression: string): number {
  if (!channelExpression) return 0

  const channels: number[] = []

  // Split by commas and process each part
  const parts = channelExpression.split(',')

  for (const part of parts) {
    const trimmed = part.trim()

    // Check if it's a range (e.g., "1-5")
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(s => parseInt(s.trim(), 10))
      if (!isNaN(start)) channels.push(start)
      if (!isNaN(end)) channels.push(end)
    } else {
      // Single number
      const num = parseInt(trimmed, 10)
      if (!isNaN(num)) channels.push(num)
    }
  }

  // Return the lowest channel number, or 0 if none found
  return channels.length > 0 ? Math.min(...channels) : 0
}

/**
 * Custom sort function for priority that uses the sortOrder from custom priorities store
 */
export const prioritySortFn: SortingFn<Note> = (rowA, rowB, columnId) => {
  const { getPriorities } = useCustomPrioritiesStore.getState()
  const priorities = getPriorities('work')

  const priorityA = priorities.find(p => p.value === rowA.original.priority)
  const priorityB = priorities.find(p => p.value === rowB.original.priority)

  const sortOrderA = priorityA?.sortOrder ?? 999
  const sortOrderB = priorityB?.sortOrder ?? 999

  return sortOrderA - sortOrderB
}

/**
 * Custom sort function for positions that uses the ordered positions from store
 * Positions are sorted according to their order in the position store
 */
export const positionSortFn: SortingFn<Note> = (rowA, rowB, columnId) => {
  const { getOrderedPositions } = usePositionStore.getState()

  // Get production ID from the first note (assuming all notes are from the same production)
  const productionId = rowA.original.productionId || 'prod-1'
  const orderedPositions = getOrderedPositions(productionId)

  const positionA = extractPositionFromUnit(rowA.original.positionUnit || '')
  const positionB = extractPositionFromUnit(rowB.original.positionUnit || '')

  // If we have ordered positions, use the index
  if (orderedPositions.length > 0) {
    const indexA = orderedPositions.indexOf(positionA)
    const indexB = orderedPositions.indexOf(positionB)

    const sortValueA = indexA === -1 ? 9999 : indexA
    const sortValueB = indexB === -1 ? 9999 : indexB

    return sortValueA - sortValueB
  }

  // Fallback to alphabetical if no ordered positions
  return positionA.toLowerCase().localeCompare(positionB.toLowerCase())
}

/**
 * Custom sort function for channels that extracts the lowest channel number
 * from the fixture aggregate data
 */
export const channelsSortFn: SortingFn<Note> = (rowA, rowB, columnId) => {
  const { getAggregate } = useFixtureStore.getState()

  const aggregateA = getAggregate(rowA.original.id)
  const aggregateB = getAggregate(rowB.original.id)

  const channelA = extractLowestChannelNumber(aggregateA?.channels || '')
  const channelB = extractLowestChannelNumber(aggregateB?.channels || '')

  return channelA - channelB
}

/**
 * Date sorting function (works with Date objects or ISO strings)
 */
export const dateSortFn: SortingFn<Note> = (rowA, rowB, columnId) => {
  const dateA = rowA.original.createdAt
  const dateB = rowB.original.createdAt

  if (!dateA) return 1
  if (!dateB) return -1

  const timeA = new Date(dateA).getTime()
  const timeB = new Date(dateB).getTime()

  return timeA - timeB
}