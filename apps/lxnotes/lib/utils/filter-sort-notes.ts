import type { Note, ModuleType, FilterSortPreset, CustomPriority } from '@/types'
import { ALL_TYPES_SENTINEL } from './generate-dynamic-presets'

/**
 * Filters notes based on filter preset configuration
 */
export function filterNotes(notes: Note[], filterPreset: FilterSortPreset): Note[] {
  return notes.filter(note => {
    // Status filter
    if (filterPreset.config.statusFilter && note.status !== filterPreset.config.statusFilter) {
      return false
    }

    // Type filters - skip if ALL_TYPES_SENTINEL is present (means include all types)
    const typeFilters = filterPreset.config.typeFilters
    if (typeFilters.length > 0 &&
        !typeFilters.includes(ALL_TYPES_SENTINEL) &&
        !typeFilters.includes(note.type || '')) {
      return false
    }

    // Priority filters
    if (filterPreset.config.priorityFilters.length > 0 &&
        !filterPreset.config.priorityFilters.includes(note.priority)) {
      return false
    }

    return true
  })
}

/**
 * Sorts notes based on filter preset configuration and custom priorities
 */
export function sortNotes(
  notes: Note[],
  filterPreset: FilterSortPreset,
  customPriorities: CustomPriority[]
): Note[] {
  const sortedNotes = [...notes]
  const { sortBy, sortOrder, groupByType } = filterPreset.config
  const moduleType = filterPreset.moduleType

  // Combined sort that preserves grouping when enabled
  sortedNotes.sort((a, b) => {
    // First, group by type if enabled
    if (groupByType) {
      const typeA = a.type || ''
      const typeB = b.type || ''
      const typeComparison = typeA.localeCompare(typeB)

      // If types are different, sort by type
      if (typeComparison !== 0) {
        return typeComparison
      }

      // If types are the same, continue to secondary sort
    }

    // Helper function to get sort value for a given field
    const getSortValue = (note: Note, field: string): number | string => {
      switch (field) {
        case 'priority':
          const priority = customPriorities.find(p => p.value === note.priority)
          return priority ? priority.sortOrder : 999 // Fallback for unknown priorities
        case 'created_at':
          return note.createdAt.getTime()
        case 'completed_at':
          return note.completedAt?.getTime() || 0
        case 'cancelled_at':
          return note.updatedAt.getTime()
        case 'channel':
          // Extract lowest channel number from channelNumbers field
          return extractLowestChannelNumber(note.channelNumbers || '')
        case 'position':
          return note.positionUnit || ''
        case 'department':
          return note.type || ''
        case 'cue_number':
          return extractCueNumber(note.scriptPageId || '')
        case 'type':
          return (note.type || '').toLowerCase()
        default:
          return note.title
      }
    }

    // Determine secondary sort field based on module and primary sort
    const getSecondarySort = (primaryField: string): string | null => {
      if (moduleType === 'cue') {
        if (primaryField === 'priority' || primaryField === 'type') {
          return 'cue_number'
        }
      } else if (moduleType === 'work') {
        if (primaryField === 'priority' || primaryField === 'type' || primaryField === 'position') {
          return 'channel'
        }
      }
      return null
    }

    // Get primary sort values
    const aPrimary = getSortValue(a, sortBy)
    const bPrimary = getSortValue(b, sortBy)

    // Compare primary values
    let primaryComparison = 0
    if (typeof aPrimary === 'string' && typeof bPrimary === 'string') {
      primaryComparison = aPrimary.localeCompare(bPrimary)
    } else {
      primaryComparison = (aPrimary as number) - (bPrimary as number)
    }

    // If primary values are equal, use secondary sort
    if (primaryComparison === 0) {
      const secondaryField = getSecondarySort(sortBy)
      if (secondaryField) {
        const aSecondary = getSortValue(a, secondaryField)
        const bSecondary = getSortValue(b, secondaryField)

        if (typeof aSecondary === 'string' && typeof bSecondary === 'string') {
          primaryComparison = aSecondary.localeCompare(bSecondary)
        } else {
          primaryComparison = (aSecondary as number) - (bSecondary as number)
        }
      }
    }

    // Apply sort direction
    return sortOrder === 'desc' ? -primaryComparison : primaryComparison
  })

  return sortedNotes
}

/**
 * Filters and sorts notes in a single operation
 */
export function filterAndSortNotes(
  notes: Note[],
  filterPreset: FilterSortPreset,
  customPriorities: CustomPriority[]
): Note[] {
  const filtered = filterNotes(notes, filterPreset)
  return sortNotes(filtered, filterPreset, customPriorities)
}

/**
 * Extracts numeric value from cue identifiers like 'cue-127', 'page-78'
 */
function extractCueNumber(scriptPageId: string): number {
  const match = scriptPageId.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Extracts the lowest channel number from expressions like "1-5, 21, 45"
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
