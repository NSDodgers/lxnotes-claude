import { SortingFn } from '@tanstack/react-table'
import { Note } from '@/types'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'

/**
 * Custom sort function for priority that uses the sortOrder from custom priorities store
 */
export const prioritySortFn: SortingFn<Note> = (rowA, rowB, columnId) => {
  const { getPriorities } = useCustomPrioritiesStore.getState()
  const priorities = getPriorities('cue')

  const priorityA = priorities.find(p => p.value === rowA.original.priority)
  const priorityB = priorities.find(p => p.value === rowB.original.priority)

  const sortOrderA = priorityA?.sortOrder ?? 999
  const sortOrderB = priorityB?.sortOrder ?? 999

  return sortOrderA - sortOrderB
}

/**
 * Custom sort function for cue numbers (numeric sorting)
 */
export const cueNumberSortFn: SortingFn<Note> = (rowA, rowB, columnId) => {
  const cueA = rowA.original.cueNumber
  const cueB = rowB.original.cueNumber

  // Handle missing cue numbers
  if (!cueA) return 1
  if (!cueB) return -1

  // Try to parse as numbers
  const numA = parseInt(cueA, 10)
  const numB = parseInt(cueB, 10)

  if (isNaN(numA)) return 1
  if (isNaN(numB)) return -1

  return numA - numB
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