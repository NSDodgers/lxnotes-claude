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
}

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