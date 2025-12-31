import React from 'react'
import { pdf } from '@react-pdf/renderer'
import type { Note, ModuleType, FilterSortPreset, CustomPriority } from '@/types'
import type { PDFGenerationRequest, PDFGenerationResult, PDFStrategy } from './types'
import { CueNotesPDFStrategy } from './strategies/CueNotesPDFStrategy'
import { WorkNotesPDFStrategy } from './strategies/WorkNotesPDFStrategy'
import { ProductionNotesPDFStrategy } from './strategies/ProductionNotesPDFStrategy'
import { CueNotesPDF } from '@/components/pdf/CueNotesPDF'
import { WorkNotesPDF } from '@/components/pdf/WorkNotesPDF'
import { ProductionNotesPDF } from '@/components/pdf/ProductionNotesPDF'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { filterAndSortNotes } from '@/lib/utils/filter-sort-notes'

export class PDFGenerationService {
  private static instance: PDFGenerationService
  private strategies: Record<ModuleType, PDFStrategy>

  private constructor() {
    this.strategies = {
      cue: new CueNotesPDFStrategy(),
      work: new WorkNotesPDFStrategy(),
      production: new ProductionNotesPDFStrategy(),
      actor: new ProductionNotesPDFStrategy() // Actor notes use same PDF layout as production notes
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

      // Filter and sort notes using shared utilities
      const processedNotes = filterAndSortNotes(request.notes, request.filterPreset, customPriorities)

      // Format notes using strategy
      const formattedNotes = strategy.formatNotes(processedNotes)

      // Prepare common props
      const commonProps = {
        notes: formattedNotes,
        productionName: request.productionName || 'LX Notes Production',
        productionLogo: request.productionLogo,
        includeCheckboxes: request.pageStylePreset.config.includeCheckboxes,
        dateGenerated: new Date(),
        filterPresetName: request.filterPreset.name,
        groupByType: request.filterPreset.config.groupByType || false
      }

      // Select the appropriate PDF component based on module type
      let pdfDocument
      switch (request.moduleType) {
        case 'cue':
          pdfDocument = React.createElement(CueNotesPDF, commonProps)
          break
        case 'work':
          pdfDocument = React.createElement(WorkNotesPDF, commonProps)
          break
        case 'production':
          pdfDocument = React.createElement(ProductionNotesPDF, commonProps)
          break
        default:
          throw new Error(`Unsupported module type: ${request.moduleType}`)
      }

      // Generate PDF blob using @react-pdf/renderer
      const pdfBlob = await pdf(pdfDocument as any).toBlob()

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

}
