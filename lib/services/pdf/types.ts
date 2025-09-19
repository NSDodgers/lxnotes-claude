import type { Note, ModuleType, FilterSortPreset, PageStylePreset } from '@/types'

export interface PDFGenerationRequest {
  moduleType: ModuleType
  filterPreset: FilterSortPreset
  pageStylePreset: PageStylePreset
  notes: Note[]
  productionName?: string
  productionLogo?: string
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
  moduleSpecificData: Record<string, any>
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
  formatNotes(notes: Note[]): PDFFormattedNote[]
  getColumnHeaders(): string[]
  getModuleTitle(): string
  formatModuleSpecificData(note: Note): Record<string, any>
}