export type ModuleType = 'cue' | 'work' | 'production'
export type NoteStatus = 'todo' | 'complete' | 'cancelled'
export type Priority = 'high' | 'medium' | 'low'
export type UserRole = 'admin' | 'user'

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
  priority: Priority
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