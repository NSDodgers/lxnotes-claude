import type { Note, ModuleType, FilterSortPreset, PageStylePreset, FixtureAggregate } from '@/types'

export interface PDFGenerationRequest {
  moduleType: ModuleType
  filterPreset: FilterSortPreset
  pageStylePreset: PageStylePreset
  notes: Note[]
  productionName?: string
  productionLogo?: string
  fixtureAggregates?: Record<string, FixtureAggregate>
}

export interface PDFGenerationResult {
  success: boolean
  pdfBlob?: Blob
  filename: string
  error?: string
}

export interface PDFFormattedNote {
  id: string
  title: string
  description?: string
  type?: string
  priority: string
  status: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  dueDate?: Date
  assignedTo?: string
  moduleSpecificData: Record<string, string | number | boolean | null | undefined>
}

export interface PDFConfiguration {
  paperSize: 'a4' | 'letter' | 'legal'
  orientation: 'portrait' | 'landscape'
  includeCheckboxes: boolean
  moduleType: ModuleType
  productionName: string
  productionLogo?: string
  dateGenerated: Date
}

export interface PDFStrategy {
  formatNotes(notes: Note[], fixtureAggregates?: Record<string, FixtureAggregate>): PDFFormattedNote[]
  getColumnHeaders(): string[]
  getModuleTitle(): string
  formatModuleSpecificData(note: Note, fixtureAggregates?: Record<string, FixtureAggregate>): Record<string, string | number | boolean | null | undefined>
}
