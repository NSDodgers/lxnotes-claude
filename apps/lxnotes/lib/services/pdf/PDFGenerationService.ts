import React from 'react'
import { pdf } from '@react-pdf/renderer'
import type { ModuleType } from '@/types'
import type { PDFGenerationRequest, PDFGenerationResult, PDFStrategy } from './types'
import { CueNotesPDFStrategy } from './strategies/CueNotesPDFStrategy'
import { WorkNotesPDFStrategy } from './strategies/WorkNotesPDFStrategy'
import { ProductionNotesPDFStrategy } from './strategies/ProductionNotesPDFStrategy'
import { ElectricianNotesPDFStrategy } from './strategies/ElectricianNotesPDFStrategy'
import { CueNotesPDF } from '@/components/pdf/CueNotesPDF'
import { WorkNotesPDF } from '@/components/pdf/WorkNotesPDF'
import { ProductionNotesPDF } from '@/components/pdf/ProductionNotesPDF'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { filterAndSortNotes } from '@/lib/utils/filter-sort-notes'
import { DEFAULT_PRODUCTION_LOGO } from '@/lib/stores/production-store'

export class PDFGenerationService {
  private static instance: PDFGenerationService
  private strategies: Record<ModuleType, PDFStrategy>

  private constructor() {
    this.strategies = {
      cue: new CueNotesPDFStrategy(),
      work: new WorkNotesPDFStrategy(),
      production: new ProductionNotesPDFStrategy(),
      electrician: new ElectricianNotesPDFStrategy() // Electrician notes share the fixture-aware Work Notes layout (with an "Electrician Notes" title)
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
      const baseStrategy = this.strategies[request.moduleType]
      if (!baseStrategy) {
        throw new Error(`No PDF strategy found for module type: ${request.moduleType}`)
      }

      // Apply title override if provided (e.g., combined view uses "Work + Electrician Notes")
      const strategy = request.moduleTitleOverride
        ? Object.assign(Object.create(Object.getPrototypeOf(baseStrategy)), baseStrategy, { getModuleTitle: () => request.moduleTitleOverride! })
        : baseStrategy

      // Get custom priorities and types for module
      const { getPriorities } = useCustomPrioritiesStore.getState()
      const customPriorities = getPriorities(request.moduleType)

      // Build type color map from the custom types store
      const { getTypes } = useCustomTypesStore.getState()
      const moduleTypes = getTypes(request.moduleType)
      const typeColorMap: Record<string, string> = {}
      for (const t of moduleTypes) {
        typeColorMap[t.value] = t.color
      }

      // Filter and sort notes using shared utilities
      const processedNotes = request.filterPreset
        ? filterAndSortNotes(request.notes, request.filterPreset, customPriorities)
        : request.notes

      // Format notes using strategy
      const formattedNotes = strategy.formatNotes(processedNotes, request.fixtureAggregates)

      // Prepare common props
      const commonProps = {
        notes: formattedNotes,
        productionName: request.productionName || 'LX Notes Production',
        productionLogo: request.productionLogo === DEFAULT_PRODUCTION_LOGO
          ? undefined
          : request.productionLogo,
        includeCheckboxes: request.pageStyle.includeCheckboxes,
        paperSize: request.pageStyle.paperSize,
        orientation: request.pageStyle.orientation,
        dateGenerated: new Date(),
        filterPresetName: request.filterPreset?.name || 'All notes',
        groupByType: request.filterPreset?.config.groupByType || false,
        typeColorMap,
        moduleTitle: strategy.getModuleTitle(),
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
        case 'electrician':
          pdfDocument = React.createElement(WorkNotesPDF, commonProps)
          break
        default:
          throw new Error(`Unsupported module type: ${request.moduleType}`)
      }

      // Generate PDF blob using @react-pdf/renderer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
