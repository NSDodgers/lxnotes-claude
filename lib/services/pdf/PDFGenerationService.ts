import type { Note, ModuleType } from '@/types'
import type { PDFGenerationRequest, PDFGenerationResult, PDFStrategy } from './types'
import { PDFTemplateEngine } from './PDFTemplateEngine'
import { CueNotesPDFStrategy } from './strategies/CueNotesPDFStrategy'
import { WorkNotesPDFStrategy } from './strategies/WorkNotesPDFStrategy'
import { ProductionNotesPDFStrategy } from './strategies/ProductionNotesPDFStrategy'

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

      // Filter and sort notes according to preset
      const filteredNotes = this.filterNotes(request.notes, request.filterPreset)
      const sortedNotes = this.sortNotes(filteredNotes, request.filterPreset)

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

  private filterNotes(notes: Note[], filterPreset: any): Note[] {
    return notes.filter(note => {
      // Status filter
      if (filterPreset.config.statusFilter && note.status !== filterPreset.config.statusFilter) {
        return false
      }

      // Type filters
      if (filterPreset.config.typeFilters.length > 0 &&
          !filterPreset.config.typeFilters.includes(note.type)) {
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

  private sortNotes(notes: Note[], filterPreset: any): Note[] {
    const sortedNotes = [...notes]
    const { sortBy, sortOrder, groupByType } = filterPreset.config

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

      // Apply primary/secondary sort
      let valueA: any
      let valueB: any

      switch (sortBy) {
        case 'priority':
          const priorityOrder = ['critical', 'very_high', 'medium', 'low', 'very_low']
          valueA = priorityOrder.indexOf(a.priority)
          valueB = priorityOrder.indexOf(b.priority)
          if (valueA === -1) valueA = 999
          if (valueB === -1) valueB = 999
          break
        case 'created_at':
          valueA = a.createdAt.getTime()
          valueB = b.createdAt.getTime()
          break
        case 'completed_at':
          valueA = a.completedAt?.getTime() || 0
          valueB = b.completedAt?.getTime() || 0
          break
        case 'channel':
          valueA = a.channelNumbers || ''
          valueB = b.channelNumbers || ''
          break
        case 'position':
          valueA = a.positionUnit || ''
          valueB = b.positionUnit || ''
          break
        case 'department':
          valueA = a.type || ''
          valueB = b.type || ''
          break
        case 'cue_number':
          // Extract numeric part from scriptPageId (e.g., 'cue-127' -> 127, 'page-78' -> 78)
          valueA = this.extractCueNumber(a.scriptPageId || '')
          valueB = this.extractCueNumber(b.scriptPageId || '')
          break
        default:
          valueA = a.title
          valueB = b.title
      }

      if (typeof valueA === 'string') {
        const comparison = valueA.localeCompare(valueB)
        return sortOrder === 'desc' ? -comparison : comparison
      } else {
        const comparison = valueA - valueB
        return sortOrder === 'desc' ? -comparison : comparison
      }
    })

    return sortedNotes
  }

  private extractCueNumber(scriptPageId: string): number {
    // Extract number from strings like 'cue-127', 'page-78', etc.
    const match = scriptPageId.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }
}