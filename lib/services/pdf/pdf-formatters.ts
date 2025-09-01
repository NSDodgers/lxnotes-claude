import type { Note, ModuleType, FilterSortPreset, LightwrightInfo, ScriptPage, SceneSong } from '@/types'

export interface ColumnConfig {
  key: string
  label: string
  width: string
}

export interface FormattedNoteContent {
  title: string
  description: string
  status: 'todo' | 'complete' | 'cancelled'
  priority: string
  type: string
  
  // Cue Notes specific
  scriptPage?: string
  sceneSong?: string
  
  // Work Notes specific  
  channel?: string
  position?: string
  instrument?: string
  
  // Production Notes specific
  department?: string
  
  // Additional data
  createdAt: Date
  assignedTo?: string
  
  // Module-specific extracted fields
  cueNumber?: string // For Cue Notes
}

export const getModuleColumns = (moduleType: ModuleType, includeCheckboxes: boolean = false): ColumnConfig[] => {
  switch(moduleType) {
    case 'cue':
      // Optimized for Cue Notes like the example PDF
      if (includeCheckboxes) {
        return [
          { key: 'checkboxPriority', label: 'Priority', width: '12%' },
          { key: 'type', label: 'Type', width: '15%' },
          { key: 'cueNumber', label: 'Cue #', width: '10%' },
          { key: 'sceneSong', label: 'Scene/Song', width: '25%' },
          { key: 'note', label: 'Note', width: '30%' },
          { key: 'created', label: 'Created', width: '8%' },
        ]
      } else {
        return [
          { key: 'priority', label: 'Priority', width: '10%' },
          { key: 'type', label: 'Type', width: '15%' },
          { key: 'cueNumber', label: 'Cue #', width: '10%' },
          { key: 'sceneSong', label: 'Scene/Song', width: '25%' },
          { key: 'note', label: 'Note', width: '32%' },
          { key: 'created', label: 'Created', width: '8%' },
        ]
      }
    
    case 'work':
      if (includeCheckboxes) {
        return [
          { key: 'checkboxPriority', label: 'Priority', width: '12%' },
          { key: 'type', label: 'Type', width: '12%' },
          { key: 'channel', label: 'Channel', width: '8%' },
          { key: 'position', label: 'Position', width: '15%' },
          { key: 'instrument', label: 'Instrument', width: '12%' },
          { key: 'note', label: 'Note', width: '33%' },
          { key: 'created', label: 'Created', width: '8%' },
        ]
      } else {
        return [
          { key: 'priority', label: 'Priority', width: '8%' },
          { key: 'type', label: 'Type', width: '12%' },
          { key: 'channel', label: 'Channel', width: '8%' },
          { key: 'position', label: 'Position', width: '15%' },
          { key: 'instrument', label: 'Instrument', width: '12%' },
          { key: 'note', label: 'Note', width: '37%' },
          { key: 'created', label: 'Created', width: '8%' },
        ]
      }
    
    case 'production':
      if (includeCheckboxes) {
        return [
          { key: 'checkboxPriority', label: 'Priority', width: '12%' },
          { key: 'type', label: 'Type', width: '15%' },
          { key: 'department', label: 'Department', width: '12%' },
          { key: 'note', label: 'Note', width: '53%' },
          { key: 'created', label: 'Created', width: '8%' },
        ]
      } else {
        return [
          { key: 'priority', label: 'Priority', width: '8%' },
          { key: 'type', label: 'Type', width: '15%' },
          { key: 'department', label: 'Department', width: '12%' },
          { key: 'note', label: 'Note', width: '57%' },
          { key: 'created', label: 'Created', width: '8%' },
        ]
      }
    
    default:
      return []
  }
}

export const extractNoteContent = (
  note: Note, 
  moduleType: ModuleType,
  options: {
    lightwrightData?: Map<string, LightwrightInfo[]>
    scriptPages?: Map<string, ScriptPage>
    scenesSongs?: Map<string, SceneSong>
  } = {}
): FormattedNoteContent => {
  // Defensive null/undefined checks
  if (!note || typeof note !== 'object') {
    console.warn('Invalid note object passed to extractNoteContent:', note)
    return {
      title: 'Invalid Note',
      description: '',
      status: 'todo' as const,
      priority: 'medium',
      type: 'general',
      createdAt: new Date(),
    }
  }

  // Ensure required fields have fallbacks
  const safeCreatedAt = note.createdAt instanceof Date ? note.createdAt : new Date()
  const safeStatus = ['todo', 'complete', 'cancelled'].includes(note.status) ? note.status : 'todo'
  
  const common = {
    title: typeof note.title === 'string' ? note.title : 'Untitled',
    description: typeof note.description === 'string' ? note.description : '',
    status: safeStatus as 'todo' | 'complete' | 'cancelled',
    priority: typeof note.priority === 'string' ? note.priority : 'medium',
    type: typeof note.type === 'string' ? note.type : 'general',
    createdAt: safeCreatedAt,
    assignedTo: typeof note.assignedTo === 'string' ? note.assignedTo : undefined,
  }
  
  try {
    switch(moduleType) {
      case 'cue':
        return {
          ...common,
          scriptPage: getScriptPageDisplay(note.scriptPageId, options.scriptPages),
          sceneSong: getSceneSongDisplay(note.sceneSongId, options.scenesSongs),
          // Extract cue number from title or other field if available
          cueNumber: extractCueNumber(common.title),
        }
      
      case 'work':
        const lightwrightInfo = getLightwrightDisplay(note.lightwrightItemId, options.lightwrightData)
        return {
          ...common,
          channel: lightwrightInfo.channel || (typeof note.channelNumbers === 'string' ? note.channelNumbers : '-'),
          position: lightwrightInfo.position || (typeof note.positionUnit === 'string' ? note.positionUnit : '-'),
          instrument: lightwrightInfo.instrument || '-',
        }
      
      case 'production':
        return {
          ...common,
          department: 'General', // Could be extracted from customFields if needed
        }
      
      default:
        console.warn('Unknown module type in extractNoteContent:', moduleType)
        return common
    }
  } catch (error) {
    console.error('Error in extractNoteContent module-specific processing:', error)
    return common // Return basic content if module-specific processing fails
  }
}

// Helper function to extract cue number from note title for display
function extractCueNumber(title: string): string {
  if (!title || typeof title !== 'string') return '-'
  
  try {
    // Look for patterns like "Cue 123", "Q 45", or just numbers
    const cueMatch = title.match(/(?:cue|q)\s*(\d+)/i) || title.match(/\b(\d+)\b/)
    return cueMatch ? cueMatch[1] : '-'
  } catch (error) {
    console.error('Error extracting cue number from title:', title, error)
    return '-'
  }
}

// Helper function to extract cue number for numeric sorting
function extractCueNumberForSorting(title: string): number {
  if (!title || typeof title !== 'string') return 0
  
  try {
    const cueMatch = title.match(/(?:cue|q)\s*(\d+)/i) || title.match(/\b(\d+)\b/)
    return cueMatch ? parseInt(cueMatch[1], 10) : 0
  } catch (error) {
    console.error('Error extracting cue number for sorting from title:', title, error)
    return 0
  }
}

// Helper function to parse channel numbers for sorting
function parseChannelForSorting(channelString: string): number {
  if (!channelString || typeof channelString !== 'string') return 0
  
  try {
    // Extract first number from channel string (e.g., "1-5, 21, 45" -> 1)
    const firstChannelMatch = channelString.match(/(\d+)/)
    return firstChannelMatch ? parseInt(firstChannelMatch[1], 10) : 0
  } catch (error) {
    console.error('Error parsing channel for sorting:', channelString, error)
    return 0
  }
}

export const getScriptPageDisplay = (
  scriptPageId?: string, 
  scriptPages?: Map<string, ScriptPage>
): string => {
  if (!scriptPageId || !scriptPages || typeof scriptPageId !== 'string') return '-'
  
  try {
    const scriptPage = scriptPages.get(scriptPageId)
    return (scriptPage && typeof scriptPage.pageNumber !== 'undefined') 
      ? `Page ${scriptPage.pageNumber}` 
      : '-'
  } catch (error) {
    console.error('Error getting script page display:', scriptPageId, error)
    return '-'
  }
}

export const getSceneSongDisplay = (
  sceneSongId?: string,
  scenesSongs?: Map<string, SceneSong>
): string => {
  if (!sceneSongId || !scenesSongs || typeof sceneSongId !== 'string') return '-'
  
  try {
    const sceneSong = scenesSongs.get(sceneSongId)
    if (!sceneSong || !sceneSong.name || typeof sceneSong.name !== 'string') return '-'
    
    // Format like the example: "Pg. 1. - scene 1 / Pg. 1. - hello"
    // This is simplified - you may want to include more context
    return sceneSong.name
  } catch (error) {
    console.error('Error getting scene/song display:', sceneSongId, error)
    return '-'
  }
}

export const getLightwrightDisplay = (
  lightwrightItemId?: string,
  lightwrightData?: Map<string, LightwrightInfo[]>
): { channel: string; position: string; instrument: string } => {
  if (!lightwrightItemId || !lightwrightData || typeof lightwrightItemId !== 'string') {
    return { channel: '-', position: '-', instrument: '-' }
  }
  
  try {
    const items = lightwrightData.get(lightwrightItemId) || []
    if (!Array.isArray(items) || items.length === 0) {
      return { channel: '-', position: '-', instrument: '-' }
    }
    
    // For multiple items, create aggregated display with null safety
    const channels = items
      .filter(item => item && typeof item.channel !== 'undefined')
      .map(item => item.channel.toString())
      .join(', ') || '-'
      
    const positions = [...new Set(
      items
        .filter(item => item && item.position)
        .map(item => item.position)
    )].join(', ') || '-'
    
    const instruments = [...new Set(
      items
        .filter(item => item && item.fixtureType)
        .map(item => item.fixtureType)
    )].join(', ') || '-'
    
    return {
      channel: channels,
      position: positions,
      instrument: instruments,
    }
  } catch (error) {
    console.error('Error getting Lightwright display:', lightwrightItemId, error)
    return { channel: '-', position: '-', instrument: '-' }
  }
}

export const applyFilters = (
  notes: Note[], 
  filterPreset: FilterSortPreset
): Note[] => {
  let filtered = [...notes]
  
  // Apply status filter
  if (filterPreset.config.statusFilter) {
    filtered = filtered.filter(note => note.status === filterPreset.config.statusFilter)
  }
  
  // Apply type filters
  if (filterPreset.config.typeFilters.length > 0) {
    filtered = filtered.filter(note => 
      filterPreset.config.typeFilters.includes(note.type || 'general')
    )
  }
  
  // Apply priority filters
  if (filterPreset.config.priorityFilters.length > 0) {
    filtered = filtered.filter(note => 
      filterPreset.config.priorityFilters.includes(note.priority)
    )
  }
  
  return filtered
}

export const applySorting = (
  notes: Note[], 
  filterPreset: FilterSortPreset
): Note[] => {
  const sortedNotes = [...notes]
  
  // Sort by specified field
  sortedNotes.sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (filterPreset.config.sortBy) {
      case 'title':
        aValue = a.title?.toLowerCase() || ''
        bValue = b.title?.toLowerCase() || ''
        break
      case 'priority':
        // Extended priority sorting to handle custom priorities with various formats
        const priorityOrder = { 
          'critical': 6,
          'very_high': 5,   // Underscore format
          'very high': 5,   // Space format
          'veryhigh': 5,    // No separator format
          'high': 4, 
          'medium': 3, 
          'low': 2,
          'very_low': 1,    // Underscore format
          'very low': 1,    // Space format
          'verylow': 1      // No separator format
        }
        // Try multiple normalization approaches to handle various priority formats
        const aPriorityRaw = a.priority?.toLowerCase() || ''
        const bPriorityRaw = b.priority?.toLowerCase() || ''
        
        // First try: exact match
        aValue = priorityOrder[aPriorityRaw as keyof typeof priorityOrder]
        bValue = priorityOrder[bPriorityRaw as keyof typeof priorityOrder]
        
        // Second try: convert underscores/hyphens to spaces
        if (aValue === undefined) {
          const aPrioritySpaced = aPriorityRaw.replace(/[_-]/g, ' ').trim()
          aValue = priorityOrder[aPrioritySpaced as keyof typeof priorityOrder]
        }
        if (bValue === undefined) {
          const bPrioritySpaced = bPriorityRaw.replace(/[_-]/g, ' ').trim()
          bValue = priorityOrder[bPrioritySpaced as keyof typeof priorityOrder]
        }
        
        // Third try: remove all separators
        if (aValue === undefined) {
          const aPriorityCondensed = aPriorityRaw.replace(/[_\s-]/g, '')
          aValue = priorityOrder[aPriorityCondensed as keyof typeof priorityOrder]
        }
        if (bValue === undefined) {
          const bPriorityCondensed = bPriorityRaw.replace(/[_\s-]/g, '')
          bValue = priorityOrder[bPriorityCondensed as keyof typeof priorityOrder]
        }
        
        // Default to 0 if no match found
        aValue = aValue || 0
        bValue = bValue || 0
        break
      case 'status':
        const statusOrder = { 'todo': 1, 'complete': 2, 'cancelled': 3 }
        aValue = statusOrder[a.status as keyof typeof statusOrder] || 0
        bValue = statusOrder[b.status as keyof typeof statusOrder] || 0
        break
      case 'type':
        aValue = a.type?.toLowerCase() || ''
        bValue = b.type?.toLowerCase() || ''
        break
      case 'cue_number':
        // Extract numeric cue number for proper numeric sorting
        aValue = extractCueNumberForSorting(a.title || '')
        bValue = extractCueNumberForSorting(b.title || '')
        break
      case 'completed_at':
        aValue = a.completedAt?.getTime() || 0
        bValue = b.completedAt?.getTime() || 0
        break
      case 'cancelled_at':
        // Use updatedAt for cancelled notes, 0 for non-cancelled
        aValue = (a.status === 'cancelled' ? a.updatedAt?.getTime() : 0) || 0
        bValue = (b.status === 'cancelled' ? b.updatedAt?.getTime() : 0) || 0
        break
      case 'channel':
        // Parse channel numbers for proper numeric sorting
        aValue = parseChannelForSorting(a.channelNumbers || '')
        bValue = parseChannelForSorting(b.channelNumbers || '')
        break
      case 'position':
        aValue = a.positionUnit?.toLowerCase() || ''
        bValue = b.positionUnit?.toLowerCase() || ''
        break
      case 'department':
        // Extract department from custom fields or default to 'General'
        aValue = 'general' // Placeholder - could be enhanced to extract from custom fields
        bValue = 'general'
        break
      case 'created_at':
      default:
        aValue = a.createdAt.getTime()
        bValue = b.createdAt.getTime()
        break
    }
    
    if (aValue < bValue) return filterPreset.config.sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return filterPreset.config.sortOrder === 'asc' ? 1 : -1
    return 0
  })
  
  return sortedNotes
}

export const groupNotesByType = (notes: Note[]): Map<string, Note[]> => {
  const groups = new Map<string, Note[]>()
  
  notes.forEach(note => {
    const type = note.type || 'general'
    if (!groups.has(type)) {
      groups.set(type, [])
    }
    groups.get(type)!.push(note)
  })
  
  return groups
}

export const getFilterSummary = (filterPreset: FilterSortPreset): string => {
  const parts = []
  
  if (filterPreset.config.statusFilter) {
    parts.push(`Status: ${filterPreset.config.statusFilter.toUpperCase()}`)
  } else {
    parts.push('Status: ALL')
  }
  
  if (filterPreset.config.typeFilters.length > 0) {
    parts.push(`Types: ${filterPreset.config.typeFilters.length} selected`)
  } else {
    parts.push('Types: ALL')
  }
  
  if (filterPreset.config.priorityFilters.length > 0) {
    parts.push(`Priorities: ${filterPreset.config.priorityFilters.length} selected`)
  } else {
    parts.push('Priorities: ALL')
  }
  
  parts.push(`Sort: ${filterPreset.config.sortBy} (${filterPreset.config.sortOrder})`)
  
  if (filterPreset.config.groupByType) {
    parts.push('Grouped by type')
  }
  
  return parts.join(' • ')
}