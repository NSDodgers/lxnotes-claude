export type ModuleType = 'cue' | 'work' | 'production'
export type NoteStatus = 'todo' | 'complete' | 'cancelled'
export type UserRole = 'admin' | 'user'

// Custom types and priorities system
export interface CustomType {
  id: string
  productionId: string
  moduleType: ModuleType
  value: string // Internal identifier (lowercase, underscored)
  label: string // Display name
  color: string // Hex color
  isSystem: boolean // True for system defaults
  isHidden: boolean // Can hide system defaults
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface CustomPriority {
  id: string
  productionId: string
  moduleType: ModuleType
  value: string // Internal identifier
  label: string // Display name  
  color: string // Hex color
  sortOrder: number // Supports decimals for insertion between defaults
  isSystem: boolean // True for system defaults
  isHidden: boolean // Can hide system defaults
  createdAt: Date
  updatedAt: Date
}

export interface SystemOverride {
  id: string
  productionId: string
  moduleType: ModuleType
  systemId: string // ID of system default being overridden
  type: 'type' | 'priority'
  overrideData: {
    label?: string
    color?: string
    isHidden?: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface ProductionSettings {
  id: string
  productionId: string
  settings: {
    customTypes: Record<ModuleType, CustomType[]>
    customPriorities: Record<ModuleType, CustomPriority[]>
    systemOverrides: SystemOverride[]
  }
  createdAt: Date
  updatedAt: Date
}

export interface Production {
  id: string
  name: string
  abbreviation: string
  logo?: string
  description?: string
  startDate?: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Note {
  id: string
  productionId: string
  moduleType: ModuleType
  title: string
  description?: string
  type?: string
  priority: string // Flexible priority value (replaces enum)
  status: NoteStatus
  createdBy?: string
  assignedTo?: string
  completedBy?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  dueDate?: Date
  
  // Module-specific fields
  scriptPageId?: string
  sceneSongId?: string
  lightwrightItemId?: string
  
  // Work notes specific fields
  channelNumbers?: string
  positionUnit?: string
  sceneryNeeds?: string
}

export interface ScriptPage {
  id: string
  productionId: string
  pageNumber: string
  firstCueNumber?: string
  createdAt: Date
  updatedAt: Date
}

export interface SceneSong {
  id: string
  scriptPageId: string
  name: string
  type: 'scene' | 'song'
  firstCueNumber?: string
  orderIndex: number
  // Continuation fields
  continuesFromId?: string // ID of the scene/song this continues from
  continuesOnPageId?: string // ID of the page this continues onto (for UI navigation)
  createdAt: Date
  updatedAt: Date
}

export interface LightwrightItem {
  id: string
  importId: string
  lwid: string // Lightwright ID
  data: Record<string, any>
}

export interface Preset {
  id: string
  productionId: string
  type: 'page_style' | 'filter_sort' | 'email_message'
  moduleType: ModuleType | 'all'
  name: string
  config: Record<string, any>
  isDefault: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Enhanced preset types with specific configurations
export interface PageStylePreset extends Preset {
  type: 'page_style'
  moduleType: 'all'
  config: {
    paperSize: 'a4' | 'letter' | 'legal'
    orientation: 'portrait' | 'landscape'
    includeCheckboxes: boolean
  }
}

export interface FilterSortPreset extends Preset {
  type: 'filter_sort'
  moduleType: ModuleType
  config: {
    statusFilter: NoteStatus | null // null means all statuses
    typeFilters: string[] // Array of type values to include
    priorityFilters: string[] // Array of priority values to include
    sortBy: string // Field to sort by (varies by module)
    sortOrder: 'asc' | 'desc'
    groupByType: boolean // Whether to group by note type first
  }
}

export interface EmailMessagePreset extends Preset {
  type: 'email_message'
  moduleType: 'all'
  config: {
    recipients: string // Comma-separated email addresses
    subject: string // Subject line with placeholders
    message: string // Message body with placeholders
    filterAndSortPresetId: string | null // Reference to filter/sort preset
    pageStylePresetId: string | null // Reference to page style preset (for PDF attachment)
    includeNotesInBody: boolean // Whether to include notes table in email body
    attachPdf: boolean // Whether to attach PDF file to email
  }
}

// Union type for all preset types
export type AnyPreset = PageStylePreset | FilterSortPreset | EmailMessagePreset

// Placeholder types for email templates
export interface PlaceholderDefinition {
  key: string
  label: string
  description: string
  category: 'production' | 'user' | 'date' | 'notes'
}

// Filter/Sort configuration types
export interface FilterConfiguration {
  statusFilter: NoteStatus | null
  typeFilters: string[]
  priorityFilters: string[]
}

export interface SortConfiguration {
  sortBy: string
  sortOrder: 'asc' | 'desc'
  groupByType: boolean
}

// Module-specific sort fields
export type CueNotesSortField = 'cue_number' | 'priority' | 'type' | 'created_at' | 'completed_at' | 'cancelled_at'
export type WorkNotesSortField = 'priority' | 'type' | 'channel' | 'position' | 'created_at' | 'completed_at' | 'cancelled_at'
export type ProductionNotesSortField = 'priority' | 'department' | 'created_at' | 'completed_at' | 'cancelled_at'

export type ModuleSortField = CueNotesSortField | WorkNotesSortField | ProductionNotesSortField

export interface ProductionMember {
  id: string
  productionId: string
  userId: string
  role: UserRole
  joinedAt: Date
}

export interface User {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  createdAt: Date
}

// Lightwright integration types
export interface LightwrightInfo {
  id: string
  productionId: string
  lwid: string // Stable Lightwright ID
  channel: number
  position: string
  unitNumber: string
  fixtureType: string
  purpose: string
  universe?: number
  address?: number
  universeAddressRaw: string
  isActive: boolean
  source: string // e.g., 'Lightwright'
  sourceUploadedAt: Date
  createdAt: Date
  updatedAt: Date
  removedAt?: Date
}

export interface WorkNoteLightwrightLink {
  workNoteId: string
  lightwrightInfoId: string
  createdAt: Date
}

export interface LightwrightAggregate {
  workNoteId: string
  channels: string // "1-5, 21, 45"
  positions: string[] // Unique positions
  positionUnits: string // Friendly formatted position/units like "DECK: #s 1-5, 1E #11"
  fixtureTypes: string[] // Unique types
  purposes: string[] // Unique purposes
  universeAddresses: string[] // Formatted universe/address pairs
  hasInactive: boolean
}

// CSV parsing types
export interface LightwrightCSVRow {
  [key: string]: string
}

export interface ParsedLightwrightRow {
  lwid: string
  channel: number
  position: string
  unitNumber: string
  fixtureType: string
  purpose: string
  universeAddressRaw: string
  universe?: number
  address?: number
}

export interface LightwrightUploadResult {
  success: boolean
  processed: number
  inserted: number
  updated: number
  inactivated: number
  skippedInfrastructure: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  warnings: Array<{
    row: number
    message: string
  }>
}

// Channel expression types
export interface ChannelRange {
  start: number
  end: number
}

export interface ParsedChannelExpression {
  channels: number[]
  ranges: ChannelRange[]
  invalid: string[]
}

// Enhanced validation types for CSV upload
export type RowErrorType = 
  | 'missing_lwid'
  | 'missing_channel' 
  | 'invalid_channel'
  | 'duplicate_lwid'
  | 'parsing_error'

export interface RowError {
  row: number
  type: RowErrorType
  field: string
  value: string
  message: string
  canSkip: boolean
}

export interface ValidationResult {
  totalRows: number
  validRows: number
  infrastructureRows: number
  errorRows: number
  errors: RowError[]
  sampleData: LightwrightCSVRow[] // First few rows for preview
  parsedSamples: (ParsedLightwrightRow | null)[] // Parsed versions of samples
}

export interface ImportOptions {
  skipInvalidChannels: boolean
  skipMissingLwid: boolean
  skipDuplicates: boolean
  deactivateMissing: boolean
  selectedRowsToSkip: number[] // Specific row numbers to skip
}