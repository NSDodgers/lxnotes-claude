/**
 * GitHub Storage Adapter
 *
 * Implements the StorageAdapter interface using GitHub as the backend.
 * All data is stored in JSON files in the repository, and accessed via
 * the GitHub Contents API through our proxy route.
 */

import type { Note, FixtureInfo, ModuleType } from '@/types'
import type { StorageAdapter, ProductionData, ScriptPage, SceneSong } from '@/lib/storage/adapter'
import {
  readJsonFile,
  writeJsonFile,
  fileExists,
  getCollaborativeDataPath,
} from './github-api'

// File paths for collaborative data
const DATA_FILES = {
  notes: getCollaborativeDataPath('notes.json'),
  production: getCollaborativeDataPath('production.json'),
  script: getCollaborativeDataPath('script.json'),
  fixtures: getCollaborativeDataPath('fixtures.json'),
}

// In-memory cache with SHA tracking for optimistic updates
interface CacheEntry<T> {
  data: T
  sha: string
  timestamp: number
}

interface NotesData {
  cue: Note[]
  work: Note[]
  production: Note[]
}

interface ScriptData {
  pages: ScriptPage[]
  scenesSongs: SceneSong[]
}

// Cache TTL (how long before we consider cached data stale)
const CACHE_TTL = 4000 // 4 seconds (slightly less than poll interval)

class GitHubStorageAdapter implements StorageAdapter {
  private notesCache: CacheEntry<NotesData> | null = null
  private productionCache: CacheEntry<ProductionData> | null = null
  private scriptCache: CacheEntry<ScriptData> | null = null
  private fixturesCache: CacheEntry<FixtureInfo[]> | null = null
  private initialized = false

  /**
   * Check if cache is still valid
   */
  private isCacheValid<T>(cache: CacheEntry<T> | null): cache is CacheEntry<T> {
    if (!cache) return false
    return Date.now() - cache.timestamp < CACHE_TTL
  }

  /**
   * Generate a unique ID for new notes
   */
  private generateId(): string {
    return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // ============================================
  // Notes Operations
  // ============================================

  notes = {
    getAll: async (moduleType: ModuleType): Promise<Note[]> => {
      if (this.isCacheValid(this.notesCache)) {
        return this.notesCache.data[moduleType] || []
      }

      const result = await readJsonFile<NotesData>(DATA_FILES.notes)

      if (!result) {
        return []
      }

      this.notesCache = {
        data: result.data,
        sha: result.sha,
        timestamp: Date.now(),
      }

      return result.data[moduleType] || []
    },

    get: async (id: string): Promise<Note | null> => {
      // Search through all module types
      for (const moduleType of ['cue', 'work', 'production'] as ModuleType[]) {
        const notes = await this.notes.getAll(moduleType)
        const note = notes.find((n) => n.id === id)
        if (note) return note
      }
      return null
    },

    create: async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
      // Ensure we have fresh data
      await this.notes.getAll(noteData.moduleType)

      const newNote: Note = {
        ...noteData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Note

      const currentData = this.notesCache?.data || { cue: [], work: [], production: [] }
      const updatedData: NotesData = {
        ...currentData,
        [noteData.moduleType]: [...(currentData[noteData.moduleType] || []), newNote],
      }

      const newSha = await writeJsonFile(
        DATA_FILES.notes,
        updatedData,
        this.notesCache?.sha || '',
        `Add note: ${newNote.title}`
      )

      // Update cache
      this.notesCache = {
        data: updatedData,
        sha: newSha,
        timestamp: Date.now(),
      }

      return newNote
    },

    update: async (id: string, updates: Partial<Note>): Promise<Note> => {
      // Find the note first
      let foundModuleType: ModuleType | null = null
      let foundNote: Note | null = null

      for (const moduleType of ['cue', 'work', 'production'] as ModuleType[]) {
        const notes = await this.notes.getAll(moduleType)
        const note = notes.find((n) => n.id === id)
        if (note) {
          foundModuleType = moduleType
          foundNote = note
          break
        }
      }

      if (!foundNote || !foundModuleType) {
        throw new Error(`Note not found: ${id}`)
      }

      const updatedNote: Note = {
        ...foundNote,
        ...updates,
        id: foundNote.id, // Preserve ID
        updatedAt: new Date(),
      } as Note

      const currentData = this.notesCache?.data || { cue: [], work: [], production: [] }
      const updatedData: NotesData = {
        ...currentData,
        [foundModuleType]: currentData[foundModuleType].map((n) =>
          n.id === id ? updatedNote : n
        ),
      }

      const newSha = await writeJsonFile(
        DATA_FILES.notes,
        updatedData,
        this.notesCache?.sha || '',
        `Update note: ${updatedNote.title}`
      )

      // Update cache
      this.notesCache = {
        data: updatedData,
        sha: newSha,
        timestamp: Date.now(),
      }

      return updatedNote
    },

    delete: async (id: string): Promise<void> => {
      // Find and delete the note
      let foundModuleType: ModuleType | null = null

      for (const moduleType of ['cue', 'work', 'production'] as ModuleType[]) {
        const notes = await this.notes.getAll(moduleType)
        if (notes.some((n) => n.id === id)) {
          foundModuleType = moduleType
          break
        }
      }

      if (!foundModuleType) {
        throw new Error(`Note not found: ${id}`)
      }

      const currentData = this.notesCache?.data || { cue: [], work: [], production: [] }
      const updatedData: NotesData = {
        ...currentData,
        [foundModuleType]: currentData[foundModuleType].filter((n) => n.id !== id),
      }

      const newSha = await writeJsonFile(
        DATA_FILES.notes,
        updatedData,
        this.notesCache?.sha || '',
        `Delete note`
      )

      // Update cache
      this.notesCache = {
        data: updatedData,
        sha: newSha,
        timestamp: Date.now(),
      }
    },

    createMany: async (
      notes: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[]
    ): Promise<Note[]> => {
      // Ensure we have fresh data
      await this.notes.getAll('cue')

      const newNotes: Note[] = notes.map((noteData) => ({
        ...noteData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as Note[]

      const currentData = this.notesCache?.data || { cue: [], work: [], production: [] }
      const updatedData: NotesData = { ...currentData }

      for (const note of newNotes) {
        updatedData[note.moduleType] = [...(updatedData[note.moduleType] || []), note]
      }

      const newSha = await writeJsonFile(
        DATA_FILES.notes,
        updatedData,
        this.notesCache?.sha || '',
        `Add ${notes.length} notes`
      )

      // Update cache
      this.notesCache = {
        data: updatedData,
        sha: newSha,
        timestamp: Date.now(),
      }

      return newNotes
    },
  }

  // ============================================
  // Fixtures Operations
  // ============================================

  fixtures = {
    getAll: async (): Promise<FixtureInfo[]> => {
      if (this.isCacheValid(this.fixturesCache)) {
        return this.fixturesCache.data
      }

      const result = await readJsonFile<FixtureInfo[]>(DATA_FILES.fixtures)

      if (!result) {
        return []
      }

      this.fixturesCache = {
        data: result.data,
        sha: result.sha,
        timestamp: Date.now(),
      }

      return result.data
    },

    upload: async (fixtures: FixtureInfo[]): Promise<{ success: boolean; count: number }> => {
      // Get current SHA if file exists
      await this.fixtures.getAll()

      const newSha = await writeJsonFile(
        DATA_FILES.fixtures,
        fixtures,
        this.fixturesCache?.sha || '',
        `Upload ${fixtures.length} fixtures`
      )

      this.fixturesCache = {
        data: fixtures,
        sha: newSha,
        timestamp: Date.now(),
      }

      return { success: true, count: fixtures.length }
    },

    clear: async (): Promise<void> => {
      await this.fixtures.getAll()

      const newSha = await writeJsonFile(
        DATA_FILES.fixtures,
        [],
        this.fixturesCache?.sha || '',
        'Clear fixtures'
      )

      this.fixturesCache = {
        data: [],
        sha: newSha,
        timestamp: Date.now(),
      }
    },
  }

  // ============================================
  // Script Operations
  // ============================================

  script = {
    getPages: async (): Promise<ScriptPage[]> => {
      if (this.isCacheValid(this.scriptCache)) {
        return this.scriptCache.data.pages
      }

      const result = await readJsonFile<ScriptData>(DATA_FILES.script)

      if (!result) {
        return []
      }

      this.scriptCache = {
        data: result.data,
        sha: result.sha,
        timestamp: Date.now(),
      }

      return result.data.pages || []
    },

    setPages: async (pages: ScriptPage[]): Promise<void> => {
      await this.script.getPages()

      const currentData = this.scriptCache?.data || { pages: [], scenesSongs: [] }
      const updatedData: ScriptData = {
        ...currentData,
        pages,
      }

      const newSha = await writeJsonFile(
        DATA_FILES.script,
        updatedData,
        this.scriptCache?.sha || '',
        `Update script pages`
      )

      this.scriptCache = {
        data: updatedData,
        sha: newSha,
        timestamp: Date.now(),
      }
    },

    getScenesSongs: async (): Promise<SceneSong[]> => {
      if (this.isCacheValid(this.scriptCache)) {
        return this.scriptCache.data.scenesSongs
      }

      const result = await readJsonFile<ScriptData>(DATA_FILES.script)

      if (!result) {
        return []
      }

      this.scriptCache = {
        data: result.data,
        sha: result.sha,
        timestamp: Date.now(),
      }

      return result.data.scenesSongs || []
    },

    setScenesSongs: async (scenesSongs: SceneSong[]): Promise<void> => {
      await this.script.getScenesSongs()

      const currentData = this.scriptCache?.data || { pages: [], scenesSongs: [] }
      const updatedData: ScriptData = {
        ...currentData,
        scenesSongs,
      }

      const newSha = await writeJsonFile(
        DATA_FILES.script,
        updatedData,
        this.scriptCache?.sha || '',
        `Update scenes/songs`
      )

      this.scriptCache = {
        data: updatedData,
        sha: newSha,
        timestamp: Date.now(),
      }
    },
  }

  // ============================================
  // Production Operations
  // ============================================

  production = {
    get: async (): Promise<ProductionData | null> => {
      if (this.isCacheValid(this.productionCache)) {
        return this.productionCache.data
      }

      const result = await readJsonFile<ProductionData>(DATA_FILES.production)

      if (!result) {
        return null
      }

      this.productionCache = {
        data: result.data,
        sha: result.sha,
        timestamp: Date.now(),
      }

      return result.data
    },

    set: async (data: ProductionData): Promise<void> => {
      await this.production.get()

      const newSha = await writeJsonFile(
        DATA_FILES.production,
        data,
        this.productionCache?.sha || '',
        `Update production info`
      )

      this.productionCache = {
        data,
        sha: newSha,
        timestamp: Date.now(),
      }
    },
  }

  // ============================================
  // Utility Operations
  // ============================================

  async clear(): Promise<void> {
    // Clear all caches
    this.notesCache = null
    this.productionCache = null
    this.scriptCache = null
    this.fixturesCache = null
    this.initialized = false
  }

  async isInitialized(): Promise<boolean> {
    if (this.initialized) return true

    // Check if production file exists (primary indicator of initialization)
    const exists = await fileExists(DATA_FILES.production)
    this.initialized = exists
    return exists
  }

  /**
   * Force refresh all caches from GitHub
   * Used by the sync manager for polling
   */
  async refreshAll(): Promise<void> {
    // Clear cache timestamps to force fresh reads
    if (this.notesCache) this.notesCache.timestamp = 0
    if (this.productionCache) this.productionCache.timestamp = 0
    if (this.scriptCache) this.scriptCache.timestamp = 0
    if (this.fixturesCache) this.fixturesCache.timestamp = 0

    // Fetch all data
    await Promise.all([
      this.notes.getAll('cue'),
      this.production.get(),
      this.script.getPages(),
      this.fixtures.getAll(),
    ])
  }

  /**
   * Get all cached notes data (for sync manager)
   */
  getCachedNotes(): NotesData | null {
    return this.notesCache?.data || null
  }

  /**
   * Invalidate cache (force next read to fetch from GitHub)
   */
  invalidateCache(): void {
    this.notesCache = null
    this.productionCache = null
    this.scriptCache = null
    this.fixturesCache = null
  }
}

// Export singleton instance
export const gitHubStorageAdapter = new GitHubStorageAdapter()

// Also export the class for testing
export { GitHubStorageAdapter }
