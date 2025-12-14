'use client'

/**
 * Notes Context Provider
 *
 * Provides a unified interface for notes management across both:
 * - Demo mode: Uses in-memory mock notes store
 * - Production mode: Uses Supabase with realtime subscriptions
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { Note, ModuleType, NoteStatus } from '@/types'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { createSupabaseStorageAdapter } from '@/lib/supabase/supabase-storage-adapter'
import { subscribeToProduction } from '@/lib/supabase/realtime'

interface NotesContextType {
  notes: Record<ModuleType, Note[]>
  isLoading: boolean
  error: Error | null

  // CRUD operations
  getNotes: (moduleType: ModuleType) => Note[]
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>

  // Bulk operations
  setNotes: (moduleType: ModuleType, notes: Note[]) => void

  // Validation
  validateNote: (moduleType: ModuleType, note: Partial<Note>) => { valid: boolean; errors: string[] }
}

const NotesContext = createContext<NotesContextType | null>(null)

export function useNotes() {
  const context = useContext(NotesContext)
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider')
  }
  return context
}

/**
 * Hook to get notes for a specific module type
 */
export function useModuleNotes(moduleType: ModuleType) {
  const { getNotes, addNote, updateNote, deleteNote, isLoading, error } = useNotes()
  const notes = getNotes(moduleType)

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
    isLoading,
    error,
  }
}

interface NotesProviderProps {
  children: ReactNode
  productionId?: string // If provided, use Supabase mode
}

export function NotesProvider({ children, productionId }: NotesProviderProps) {
  const pathname = usePathname()
  const mockNotesStore = useMockNotesStore()

  // Determine mode based on URL or explicit productionId
  const isDemoMode = pathname.startsWith('/demo')
  const isProductionMode = !!productionId || pathname.startsWith('/production/')

  // Extract production ID from URL if not provided
  const resolvedProductionId = productionId || (
    isProductionMode && !isDemoMode
      ? pathname.split('/')[2] // /production/[id]/...
      : undefined
  )

  // State for production mode
  const [supabaseNotes, setSupabaseNotes] = useState<Record<ModuleType, Note[]>>({
    cue: [],
    work: [],
    production: [],
  })
  const [isLoading, setIsLoading] = useState(isProductionMode && !isDemoMode)
  const [error, setError] = useState<Error | null>(null)
  const [adapter, setAdapter] = useState<ReturnType<typeof createSupabaseStorageAdapter> | null>(null)

  // Initialize Supabase adapter for production mode
  useEffect(() => {
    if (resolvedProductionId && !isDemoMode) {
      const storageAdapter = createSupabaseStorageAdapter(resolvedProductionId)
      setAdapter(storageAdapter)

      // Load initial notes
      const loadNotes = async () => {
        try {
          setIsLoading(true)
          setError(null)

          const [cueNotes, workNotes, productionNotes] = await Promise.all([
            storageAdapter.notes.getAll('cue'),
            storageAdapter.notes.getAll('work'),
            storageAdapter.notes.getAll('production'),
          ])

          setSupabaseNotes({
            cue: cueNotes,
            work: workNotes,
            production: productionNotes,
          })
        } catch (err) {
          console.error('Failed to load notes:', err)
          setError(err instanceof Error ? err : new Error('Failed to load notes'))
        } finally {
          setIsLoading(false)
        }
      }

      loadNotes()

      // Subscribe to realtime updates
      const unsubscribe = subscribeToProduction(resolvedProductionId, {
        onNoteInsert: (newNote) => {
          const moduleType = newNote.module_type as ModuleType
          setSupabaseNotes(prev => ({
            ...prev,
            [moduleType]: [convertDbNoteToNote(newNote), ...prev[moduleType]],
          }))
        },
        onNoteUpdate: (updatedNote) => {
          const moduleType = updatedNote.module_type as ModuleType
          setSupabaseNotes(prev => ({
            ...prev,
            [moduleType]: prev[moduleType].map(note =>
              note.id === updatedNote.id ? convertDbNoteToNote(updatedNote) : note
            ),
          }))
        },
        onNoteDelete: (deletedNote) => {
          const moduleType = deletedNote.module_type as ModuleType
          setSupabaseNotes(prev => ({
            ...prev,
            [moduleType]: prev[moduleType].filter(note => note.id !== deletedNote.id),
          }))
        },
        onError: (err) => {
          console.error('Realtime subscription error:', err)
        },
      })

      return () => {
        unsubscribe()
      }
    }
  }, [resolvedProductionId, isDemoMode])

  // Get notes based on mode
  const getNotes = useCallback((moduleType: ModuleType): Note[] => {
    if (isDemoMode || !resolvedProductionId) {
      return mockNotesStore.getAllNotes(moduleType)
    }
    return supabaseNotes[moduleType]
  }, [isDemoMode, resolvedProductionId, mockNotesStore, supabaseNotes])

  // Add note based on mode
  const addNote = useCallback(async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    if (isDemoMode || !adapter) {
      return mockNotesStore.addNote(noteData)
    }

    const newNote = await adapter.notes.create(noteData)
    // Optimistically update local state (realtime will sync anyway)
    setSupabaseNotes(prev => ({
      ...prev,
      [noteData.moduleType]: [newNote, ...prev[noteData.moduleType]],
    }))
    return newNote
  }, [isDemoMode, adapter, mockNotesStore])

  // Update note based on mode
  const updateNote = useCallback(async (id: string, updates: Partial<Note>): Promise<void> => {
    if (isDemoMode || !adapter) {
      mockNotesStore.updateNote(id, updates)
      return
    }

    await adapter.notes.update(id, updates)
    // Optimistically update local state
    setSupabaseNotes(prev => {
      const updatedNotes = { ...prev }
      for (const moduleType of Object.keys(updatedNotes) as ModuleType[]) {
        updatedNotes[moduleType] = updatedNotes[moduleType].map(note =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
        )
      }
      return updatedNotes
    })
  }, [isDemoMode, adapter, mockNotesStore])

  // Delete note based on mode
  const deleteNote = useCallback(async (id: string): Promise<void> => {
    if (isDemoMode || !adapter) {
      mockNotesStore.deleteNote(id)
      return
    }

    await adapter.notes.delete(id)
    // Optimistically update local state
    setSupabaseNotes(prev => {
      const updatedNotes = { ...prev }
      for (const moduleType of Object.keys(updatedNotes) as ModuleType[]) {
        updatedNotes[moduleType] = updatedNotes[moduleType].filter(note => note.id !== id)
      }
      return updatedNotes
    })
  }, [isDemoMode, adapter, mockNotesStore])

  // Set notes (for bulk operations like demo initialization)
  const setNotes = useCallback((moduleType: ModuleType, notes: Note[]) => {
    if (isDemoMode || !resolvedProductionId) {
      mockNotesStore.setNotes(moduleType, notes)
    } else {
      setSupabaseNotes(prev => ({
        ...prev,
        [moduleType]: notes,
      }))
    }
  }, [isDemoMode, resolvedProductionId, mockNotesStore])

  // Validate note
  const validateNote = useCallback((moduleType: ModuleType, note: Partial<Note>) => {
    if (moduleType === 'cue') {
      return mockNotesStore.validateCueNote(note)
    } else if (moduleType === 'work') {
      return mockNotesStore.validateWorkNote(note)
    }
    return mockNotesStore.validateProductionNote(note)
  }, [mockNotesStore])

  // Get current notes for context value
  const notes: Record<ModuleType, Note[]> = isDemoMode || !resolvedProductionId
    ? {
        cue: mockNotesStore.getAllNotes('cue'),
        work: mockNotesStore.getAllNotes('work'),
        production: mockNotesStore.getAllNotes('production'),
      }
    : supabaseNotes

  return (
    <NotesContext.Provider
      value={{
        notes,
        isLoading,
        error,
        getNotes,
        addNote,
        updateNote,
        deleteNote,
        setNotes,
        validateNote,
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}

// Helper function to convert database note to Note type
function convertDbNoteToNote(dbNote: any): Note {
  return {
    id: dbNote.id,
    productionId: dbNote.production_id,
    moduleType: dbNote.module_type as ModuleType,
    title: dbNote.title,
    description: dbNote.description ?? undefined,
    type: dbNote.type ?? undefined,
    priority: dbNote.priority,
    status: dbNote.status as NoteStatus,
    createdBy: dbNote.created_by ?? undefined,
    assignedTo: dbNote.assigned_to ?? undefined,
    completedBy: dbNote.completed_by ?? undefined,
    createdAt: new Date(dbNote.created_at),
    updatedAt: new Date(dbNote.updated_at),
    completedAt: dbNote.completed_at ? new Date(dbNote.completed_at) : undefined,
    dueDate: dbNote.due_date ? new Date(dbNote.due_date) : undefined,
    cueNumber: dbNote.cue_number ?? undefined,
    scriptPageId: dbNote.script_page_id ?? undefined,
    sceneSongId: dbNote.scene_song_id ?? undefined,
    lightwrightItemId: dbNote.lightwright_item_id ?? undefined,
    channelNumbers: dbNote.channel_numbers ?? undefined,
    positionUnit: dbNote.position_unit ?? undefined,
    sceneryNeeds: dbNote.scenery_needs ?? undefined,
  }
}
