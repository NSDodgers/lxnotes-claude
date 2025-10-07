/**
 * Storage Adapter Interface
 *
 * Provides a unified interface for data storage across different modes:
 * - Demo Mode: sessionStorage (isolated per tab)
 * - Dev Mode: localStorage (persists across sessions)
 * - Production Mode: Supabase (future implementation)
 */

import type { Note, FixtureInfo, ModuleType } from '@/types'

export interface ProductionData {
  name: string
  abbreviation: string
  logo: string
}

export interface ScriptPage {
  id: string
  pageNumber: string
  firstCueNumber?: string
}

export interface SceneSong {
  id: string
  name: string
  type: 'scene' | 'song'
}

export interface StorageAdapter {
  // Notes operations
  notes: {
    getAll(moduleType: ModuleType): Promise<Note[]>
    get(id: string): Promise<Note | null>
    create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note>
    update(id: string, updates: Partial<Note>): Promise<Note>
    delete(id: string): Promise<void>
    createMany(notes: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Note[]>
  }

  // Fixtures operations
  fixtures: {
    getAll(): Promise<FixtureInfo[]>
    upload(fixtures: FixtureInfo[]): Promise<{ success: boolean; count: number }>
    clear(): Promise<void>
  }

  // Script operations
  script: {
    getPages(): Promise<ScriptPage[]>
    setPages(pages: ScriptPage[]): Promise<void>
    getScenesSongs(): Promise<SceneSong[]>
    setScenesSongs(scenesSongs: SceneSong[]): Promise<void>
  }

  // Production operations
  production: {
    get(): Promise<ProductionData | null>
    set(data: ProductionData): Promise<void>
  }

  // Utility operations
  clear(): Promise<void>
  isInitialized(): Promise<boolean>
}

export type StorageMode = 'demo' | 'dev' | 'production'