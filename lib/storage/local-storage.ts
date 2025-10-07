/**
 * Local Storage Adapter
 *
 * Used for Dev Mode - data persists across browser sessions for development convenience.
 * Allows developers to work on features without re-entering data after each refresh.
 */

import type { Note, FixtureInfo, ModuleType } from '@/types'
import type { StorageAdapter, ProductionData, ScriptPage, SceneSong } from './adapter'
import { createSafeStorage } from './safe-storage'

const STORAGE_PREFIX = 'lxnotes:dev:'

export class LocalStorageAdapter implements StorageAdapter {
  private storage: Storage

  constructor() {
    this.storage = createSafeStorage('lxnotes-dev-adapter', 'local')
  }

  private getKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`
  }

  private getItem<T>(key: string): T | null {
    const item = this.storage.getItem(this.getKey(key))
    if (!item) return null

    try {
      return JSON.parse(item) as T
    } catch {
      return null
    }
  }

  private setItem<T>(key: string, value: T): void {
    this.storage.setItem(this.getKey(key), JSON.stringify(value))
  }

  private removeItem(key: string): void {
    this.storage.removeItem(this.getKey(key))
  }

  // Notes operations
  notes = {
    getAll: async (moduleType: ModuleType): Promise<Note[]> => {
      const allNotes = this.getItem<Record<ModuleType, Note[]>>('notes') || {
        cue: [],
        work: [],
        production: []
      }
      return allNotes[moduleType] || []
    },

    get: async (id: string): Promise<Note | null> => {
      const allNotes = this.getItem<Record<ModuleType, Note[]>>('notes')
      if (!allNotes) return null

      for (const moduleType of Object.keys(allNotes) as ModuleType[]) {
        const note = allNotes[moduleType].find(n => n.id === id)
        if (note) return note
      }

      return null
    },

    create: async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
      const allNotes = this.getItem<Record<ModuleType, Note[]>>('notes') || {
        cue: [],
        work: [],
        production: []
      }

      const newNote: Note = {
        ...noteData,
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      allNotes[noteData.moduleType] = [...allNotes[noteData.moduleType], newNote]
      this.setItem('notes', allNotes)

      return newNote
    },

    update: async (id: string, updates: Partial<Note>): Promise<Note> => {
      const allNotes = this.getItem<Record<ModuleType, Note[]>>('notes')
      if (!allNotes) throw new Error('Notes not found')

      let updatedNote: Note | null = null

      for (const moduleType of Object.keys(allNotes) as ModuleType[]) {
        const index = allNotes[moduleType].findIndex(n => n.id === id)
        if (index >= 0) {
          updatedNote = {
            ...allNotes[moduleType][index],
            ...updates,
            updatedAt: new Date()
          }
          allNotes[moduleType][index] = updatedNote
          break
        }
      }

      if (!updatedNote) throw new Error('Note not found')

      this.setItem('notes', allNotes)
      return updatedNote
    },

    delete: async (id: string): Promise<void> => {
      const allNotes = this.getItem<Record<ModuleType, Note[]>>('notes')
      if (!allNotes) return

      for (const moduleType of Object.keys(allNotes) as ModuleType[]) {
        allNotes[moduleType] = allNotes[moduleType].filter(n => n.id !== id)
      }

      this.setItem('notes', allNotes)
    },

    createMany: async (notes: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Note[]> => {
      const allNotes = this.getItem<Record<ModuleType, Note[]>>('notes') || {
        cue: [],
        work: [],
        production: []
      }

      const createdNotes: Note[] = notes.map(noteData => ({
        ...noteData,
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      // Group by module type
      for (const note of createdNotes) {
        allNotes[note.moduleType].push(note)
      }

      this.setItem('notes', allNotes)
      return createdNotes
    }
  }

  // Fixtures operations
  fixtures = {
    getAll: async (): Promise<FixtureInfo[]> => {
      return this.getItem<FixtureInfo[]>('fixtures') || []
    },

    upload: async (fixtures: FixtureInfo[]): Promise<{ success: boolean; count: number }> => {
      this.setItem('fixtures', fixtures)
      return { success: true, count: fixtures.length }
    },

    clear: async (): Promise<void> => {
      this.removeItem('fixtures')
    }
  }

  // Script operations
  script = {
    getPages: async (): Promise<ScriptPage[]> => {
      return this.getItem<ScriptPage[]>('script:pages') || []
    },

    setPages: async (pages: ScriptPage[]): Promise<void> => {
      this.setItem('script:pages', pages)
    },

    getScenesSongs: async (): Promise<SceneSong[]> => {
      return this.getItem<SceneSong[]>('script:scenes-songs') || []
    },

    setScenesSongs: async (scenesSongs: SceneSong[]): Promise<void> => {
      this.setItem('script:scenes-songs', scenesSongs)
    }
  }

  // Production operations
  production = {
    get: async (): Promise<ProductionData | null> => {
      return this.getItem<ProductionData>('production')
    },

    set: async (data: ProductionData): Promise<void> => {
      this.setItem('production', data)
    }
  }

  // Utility operations
  clear = async (): Promise<void> => {
    const keysToRemove: string[] = []
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => this.storage.removeItem(key))
  }

  isInitialized = async (): Promise<boolean> => {
    return this.getItem<boolean>('initialized') === true
  }

  markInitialized = (): void => {
    this.setItem('initialized', true)
  }
}
