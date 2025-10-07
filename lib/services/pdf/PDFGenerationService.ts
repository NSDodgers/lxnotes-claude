import type { Note, ModuleType, FilterSortPreset, CustomPriority } from '@/types'
import type { PDFGenerationRequest, PDFGenerationResult, PDFStrategy } from './types'
import { PDFTemplateEngine } from './PDFTemplateEngine'
import { CueNotesPDFStrategy } from './strategies/CueNotesPDFStrategy'
import { WorkNotesPDFStrategy } from './strategies/WorkNotesPDFStrategy'
import { ProductionNotesPDFStrategy } from './strategies/ProductionNotesPDFStrategy'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'

export class PDFGenerationService {
  private static instance: PDFGenerationService
  private strategies: Record<ModuleType, PDFStrategy>

  private constructor() {
    this.strategies = {
      cue: new CueNotesPDFStrategy(),
      work: new WorkNotesPDFStrategy(),
      production: new ProductionNotesPDFStrategy()
    }
  }

  static getInstance(): PDFGenerationService {
    if (!PDFGenerationService.instance) {
      PDFGenerationService.instance = new PDFGenerationService()
    }
    return PDFGenerationService.instance
  }

  async generatePDF(request: PDFGenerationRequest): Promise<PDFGenerationResult> {
    try {
      // Get the appropriate strategy
      const strategy = this.strategies[request.moduleType]
      if (!strategy) {
        throw new Error(`No PDF strategy found for module type: ${request.moduleType}`)
      }

      // Get custom priorities for module
      const { getPriorities } = useCustomPrioritiesStore.getState()
      const customPriorities = getPriorities(request.moduleType)

      // Filter and sort notes according to preset
      const filteredNotes = this.filterNotes(request.notes, request.filterPreset)
      const sortedNotes = this.sortNotes(filteredNotes, request.filterPreset, customPriorities)

      // Format notes using strategy
      const formattedNotes = strategy.formatNotes(sortedNotes)

      // Create PDF configuration
      const config = {
        paperSize: request.pageStylePreset.config.paperSize,
        orientation: request.pageStylePreset.config.orientation,
        includeCheckboxes: request.pageStylePreset.config.includeCheckboxes,
        moduleType: request.moduleType,
        productionName: request.productionName || 'LX Notes Production',
        productionLogo: request.productionLogo,
        dateGenerated: new Date()
      }

      // Generate PDF using template engine
      const templateEngine = new PDFTemplateEngine(config, strategy)
      const pdfBlob = templateEngine.generatePDF(formattedNotes)

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${strategy.getModuleTitle().replace(' ', '_')}_${timestamp}.pdf`

      return {
        success: true,
        pdfBlob,
        filename
      }

    } catch (error) {
      console.error('PDF generation failed:', error)
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private filterNotes(notes: Note[], filterPreset: FilterSortPreset): Note[] {
    return notes.filter(note => {
      // Status filter
      if (filterPreset.config.statusFilter && note.status !== filterPreset.config.statusFilter) {
        return false
      }

      // Type filters
      if (filterPreset.config.typeFilters.length > 0 &&
          !filterPreset.config.typeFilters.includes(note.type || '')) {
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

  private sortNotes(
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
            return this.extractLowestChannelNumber(note.channelNumbers || '')
          case 'position':
            return note.positionUnit || ''
          case 'department':
            return note.type || ''
          case 'cue_number':
            return this.extractCueNumber(note.scriptPageId || '')
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
      if (typeof aPrimary === 'string') {
        primaryComparison = aPrimary.localeCompare(bPrimary)
      } else {
        primaryComparison = aPrimary - bPrimary
      }

      // If primary values are equal, use secondary sort
      if (primaryComparison === 0) {
        const secondaryField = getSecondarySort(sortBy)
        if (secondaryField) {
          const aSecondary = getSortValue(a, secondaryField)
          const bSecondary = getSortValue(b, secondaryField)

          if (typeof aSecondary === 'string') {
            primaryComparison = aSecondary.localeCompare(bSecondary)
          } else {
            primaryComparison = aSecondary - bSecondary
          }
        }
      }

      // Apply sort direction
      return sortOrder === 'desc' ? -primaryComparison : primaryComparison
    })

    return sortedNotes
  }

  private extractCueNumber(scriptPageId: string): number {
    // Extract number from strings like 'cue-127', 'page-78', etc.
    const match = scriptPageId.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  private extractLowestChannelNumber(channelExpression: string): number {
    if (!channelExpression) return 0

    // Handle expressions like "1-5, 21, 45" or "1, 3-7, 12"
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
}
