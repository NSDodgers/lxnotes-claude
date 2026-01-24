'use client'

/**
 * Notes Context Provider
 *
 * Provides a unified interface for notes management across both:
 * - Demo mode: Uses in-memory mock notes store
 * - Production mode: Uses Supabase with realtime subscriptions
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { Note, ModuleType, NoteStatus } from '@/types'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { createSupabaseStorageAdapter } from '@/lib/supabase/supabase-storage-adapter'
import { subscribeToNoteChanges } from '@/lib/supabase/realtime'
import { useUndoStore } from '@/lib/stores/undo-store'
import {
  createCreateCommand,
  createUpdateCommand,
  createDeleteCommand,
} from '@/lib/undo/types'
import { toast } from 'sonner'

const isDev = process.env.NODE_ENV === 'development'

/** Validate UUID format to prevent injection attacks */
const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

interface NotesContextType {
  notes: Record<ModuleType, Note[]>
  isLoading: boolean
  error: Error | null
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'

  // CRUD operations
  getNotes: (moduleType: ModuleType) => Note[]
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>

  // Bulk operations
  setNotes: (moduleType: ModuleType, notes: Note[]) => void

  // Validation
  validateNote: (moduleType: ModuleType, note: Partial<Note>) => { valid: boolean; errors: string[] }

  // Undo/Redo operations
  undoLastAction: () => Promise<void>
  redoLastAction: () => Promise<void>
  canUndo: boolean
  canRedo: boolean
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
  const { getNotes, addNote, updateNote, deleteNote, isLoading, error, connectionStatus } = useNotes()
  const notes = getNotes(moduleType)

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
    isLoading,
    error,
    connectionStatus,
  }
}

interface NotesProviderProps {
  children: ReactNode
  productionId?: string // If provided, use Supabase mode
}

export function NotesProvider({ children, productionId }: NotesProviderProps) {
  const pathname = usePathname()
  const mockNotesStore = useMockNotesStore()
  const undoStore = useUndoStore()

  // Ref to hold undoLastAction for use in toast callbacks
  // (needed because undoLastAction is defined after deleteNote)
  const undoLastActionRef = useRef<(() => Promise<void>) | null>(null)

  // Track undo/redo availability
  const canUndo = useUndoStore((state) => state.pointer >= 0)
  const canRedo = useUndoStore((state) => state.pointer < state.stack.length - 1)

  // Determine mode based on URL or explicit productionId
  const isDemoMode = pathname.startsWith('/demo')
  const isProductionMode = !!productionId || pathname.startsWith('/production/')

  // Extract production ID from URL if not provided
  // SECURITY: Validate UUID format to prevent injection attacks
  const extractedId = isProductionMode && !isDemoMode ? pathname.split('/')[2] : undefined
  const resolvedProductionId = productionId || (
    extractedId && isValidUUID(extractedId) ? extractedId : undefined
  )

  // State for production mode
  const [supabaseNotes, setSupabaseNotes] = useState<Record<ModuleType, Note[]>>({
    cue: [],
    work: [],
    production: [],
    actor: [],
  })
  const [isLoading, setIsLoading] = useState(isProductionMode && !isDemoMode)
  const [error, setError] = useState<Error | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
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

          const [cueNotes, workNotes, productionNotes, actorNotes] = await Promise.all([
            storageAdapter.notes.getAll('cue'),
            storageAdapter.notes.getAll('work'),
            storageAdapter.notes.getAll('production'),
            storageAdapter.notes.getAll('actor'),
          ])

          setSupabaseNotes({
            cue: cueNotes,
            work: workNotes,
            production: productionNotes,
            actor: actorNotes,
          })
        } catch (err) {
          console.error('Failed to load notes:', err)
          setError(err instanceof Error ? err : new Error('Failed to load notes'))
          // toast.error('Failed to load notes')
        } finally {
          setIsLoading(false)
        }
      }

      loadNotes()

      // Subscribe to realtime updates
      setConnectionStatus('connecting')
      const unsubscribe = subscribeToNoteChanges(resolvedProductionId, {
        onStatusChange: (status) => {
          if (status === 'SUBSCRIBED') setConnectionStatus('connected')
          else if (status === 'CLOSED') setConnectionStatus('disconnected')
          else if (status === 'CHANNEL_ERROR') setConnectionStatus('error')
          else if (status === 'TIMED_OUT') setConnectionStatus('error')
        },
        onNoteInsert: (newNote) => {
          if (isDev) console.log('[NotesContext] onNoteInsert raw payload:', newNote)
          const moduleType = newNote.module_type as ModuleType
          if (isDev) console.log('[NotesContext] Module type:', moduleType)
          const note = convertDbNoteToNote(newNote)

          setSupabaseNotes(prev => {
            if (isDev) console.log('[NotesContext] Current count for', moduleType, ':', prev[moduleType]?.length)
            // Check if already exists (deduplication)
            if (prev[moduleType]?.some(n => n.id === note.id)) {
              if (isDev) console.log('[NotesContext] Note already exists, skipping')
              return prev
            }
            if (isDev) console.log('[NotesContext] Adding note. New count:', (prev[moduleType]?.length || 0) + 1)
            return {
              ...prev,
              [moduleType]: [note, ...prev[moduleType] || []],
            }
          })
        },
        onNoteUpdate: (updatedNote) => {
          const moduleType = updatedNote.module_type as ModuleType
          const note = convertDbNoteToNote(updatedNote)

          // Handle soft delete: if deleted_at is set, remove from UI
          if (updatedNote.deleted_at) {
            if (isDev) console.log('[NotesContext] Note soft-deleted, removing from UI:', note.id)
            setSupabaseNotes(prev => ({
              ...prev,
              [moduleType]: prev[moduleType].filter(n => n.id !== note.id),
            }))
            return
          }

          // Handle restore: if deleted_at is null and note not in state, add it
          setSupabaseNotes(prev => {
            const existsInState = prev[moduleType].some(n => n.id === note.id)
            if (!existsInState) {
              // Note was restored (deleted_at went from value to null)
              if (isDev) console.log('[NotesContext] Note restored, adding to UI:', note.id)
              return {
                ...prev,
                [moduleType]: [note, ...prev[moduleType]],
              }
            }
            // Normal update
            return {
              ...prev,
              [moduleType]: prev[moduleType].map(n =>
                n.id === note.id ? note : n
              ),
            }
          })
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
          setConnectionStatus('error')
          // toast.error('Connection lost. Retrying...')
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
      const newNote = mockNotesStore.addNote(noteData)
      // Push to undo stack
      undoStore.push(createCreateCommand(newNote))
      return newNote
    }

    try {
      const newNote = await adapter.notes.create(noteData)
      // Optimistically update local state (realtime should catch this too, but this makes it faster)
      setSupabaseNotes(prev => ({
        ...prev,
        [noteData.moduleType]: [newNote, ...prev[noteData.moduleType]],
      }))
      // Push to undo stack
      undoStore.push(createCreateCommand(newNote))
      return newNote
    } catch (err) {
      console.error('Failed to create note:', err)
      toast.error('Failed to create note')
      throw err
    }
  }, [isDemoMode, adapter, mockNotesStore, undoStore])

  // Update note based on mode
  const updateNote = useCallback(async (id: string, updates: Partial<Note>): Promise<void> => {
    if (isDemoMode || !adapter) {
      // Find the note before update for undo
      const previousNote = Object.values(mockNotesStore.notes)
        .flat()
        .find(n => n.id === id)

      mockNotesStore.updateNote(id, updates)

      // Find the updated note for undo
      const updatedNote = Object.values(mockNotesStore.notes)
        .flat()
        .find(n => n.id === id)

      if (previousNote && updatedNote) {
        undoStore.push(createUpdateCommand(previousNote, updatedNote))
      }
      return
    }

    // Find the note before update for undo
    const previousNote = Object.values(supabaseNotes)
      .flat()
      .find(n => n.id === id)

    // Optimistic update
    const previousNotes = { ...supabaseNotes }
    const updatedAt = new Date()
    setSupabaseNotes(prev => {
      const updatedNotes = { ...prev }
      for (const moduleType of Object.keys(updatedNotes) as ModuleType[]) {
        updatedNotes[moduleType] = updatedNotes[moduleType].map(note =>
          note.id === id ? { ...note, ...updates, updatedAt } : note
        )
      }
      return updatedNotes
    })

    try {
      await adapter.notes.update(id, updates)

      // Push to undo stack after successful update
      if (previousNote) {
        const updatedNote = { ...previousNote, ...updates, updatedAt }
        undoStore.push(createUpdateCommand(previousNote, updatedNote))
      }
    } catch (err) {
      console.error('Failed to update note:', err)
      toast.error('Failed to save changes')
      // Revert optimistic update
      setSupabaseNotes(previousNotes)
      throw err
    }
  }, [isDemoMode, adapter, mockNotesStore, supabaseNotes, undoStore])

  // Delete note based on mode
  const deleteNote = useCallback(async (id: string): Promise<void> => {
    if (isDemoMode || !adapter) {
      // Find the note before delete for undo
      const noteToDelete = Object.values(mockNotesStore.notes)
        .flat()
        .find(n => n.id === id)

      mockNotesStore.deleteNote(id)

      if (noteToDelete) {
        undoStore.push(createDeleteCommand(noteToDelete))
        toast('Note deleted', {
          action: {
            label: 'Undo',
            onClick: () => undoLastActionRef.current?.(),
          },
        })
      }
      return
    }

    // Find the note before delete for undo
    const noteToDelete = Object.values(supabaseNotes)
      .flat()
      .find(n => n.id === id)

    // Optimistic update
    const previousNotes = { ...supabaseNotes }
    setSupabaseNotes(prev => {
      const updatedNotes = { ...prev }
      for (const moduleType of Object.keys(updatedNotes) as ModuleType[]) {
        updatedNotes[moduleType] = updatedNotes[moduleType].filter(note => note.id !== id)
      }
      return updatedNotes
    })

    try {
      await adapter.notes.delete(id)

      // Push to undo stack after successful delete
      if (noteToDelete) {
        undoStore.push(createDeleteCommand(noteToDelete))
        toast('Note deleted', {
          action: {
            label: 'Undo',
            onClick: () => undoLastActionRef.current?.(),
          },
        })
      }
    } catch (err) {
      console.error('Failed to delete note:', err)
      toast.error('Failed to delete note')
      // Revert
      setSupabaseNotes(previousNotes)
      throw err
    }
  }, [isDemoMode, adapter, mockNotesStore, supabaseNotes, undoStore])

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

  // Undo last action
  const undoLastAction = useCallback(async (): Promise<void> => {
    const command = undoStore.undo()
    if (!command) return

    try {
      switch (command.type) {
        case 'create':
          // Undo create = soft delete the note
          if (isDemoMode || !adapter) {
            mockNotesStore.deleteNote(command.entityId)
          } else {
            // Soft delete via adapter
            await adapter.notes.delete(command.entityId)
            setSupabaseNotes(prev => ({
              ...prev,
              [command.moduleType]: prev[command.moduleType].filter(n => n.id !== command.entityId),
            }))
          }
          toast('Undone: Note creation')
          break

        case 'update':
          // Undo update = restore previous state
          if (command.previousState) {
            if (isDemoMode || !adapter) {
              mockNotesStore.updateNote(command.entityId, command.previousState)
            } else {
              await adapter.notes.update(command.entityId, command.previousState)
              setSupabaseNotes(prev => ({
                ...prev,
                [command.moduleType]: prev[command.moduleType].map(n =>
                  n.id === command.entityId ? command.previousState! : n
                ),
              }))
            }
            toast('Undone: Note edit')
          }
          break

        case 'delete':
          // Undo delete = restore the note
          if (command.previousState) {
            if (isDemoMode || !adapter) {
              // For demo mode, we need to add it back
              mockNotesStore.setNotes(command.moduleType, [
                command.previousState,
                ...mockNotesStore.getAllNotes(command.moduleType),
              ])
            } else {
              // Restore via adapter
              if (adapter.notes.restore) {
                await adapter.notes.restore(command.entityId)
                setSupabaseNotes(prev => ({
                  ...prev,
                  [command.moduleType]: [command.previousState!, ...prev[command.moduleType]],
                }))
              }
            }
            toast('Undone: Note deletion')
          }
          break
      }
    } catch (err) {
      console.error('Failed to undo:', err)
      toast.error('Failed to undo action')
      // Re-push the command since undo failed
      undoStore.push(command)
    }
  }, [isDemoMode, adapter, mockNotesStore, undoStore])

  // Update ref so toast callbacks can access undoLastAction
  undoLastActionRef.current = undoLastAction

  // Clear undo history when switching productions
  useEffect(() => {
    undoStore.setProductionId(resolvedProductionId ?? null)
  }, [resolvedProductionId, undoStore])

  // Redo last undone action
  const redoLastAction = useCallback(async (): Promise<void> => {
    const command = undoStore.redo()
    if (!command) return

    try {
      switch (command.type) {
        case 'create':
          // Redo create = restore the note
          if (command.newState) {
            if (isDemoMode || !adapter) {
              mockNotesStore.setNotes(command.moduleType, [
                command.newState,
                ...mockNotesStore.getAllNotes(command.moduleType),
              ])
            } else {
              if (adapter.notes.restore) {
                await adapter.notes.restore(command.entityId)
                setSupabaseNotes(prev => ({
                  ...prev,
                  [command.moduleType]: [command.newState!, ...prev[command.moduleType]],
                }))
              }
            }
            toast('Redone: Note creation')
          }
          break

        case 'update':
          // Redo update = apply new state
          if (command.newState) {
            if (isDemoMode || !adapter) {
              mockNotesStore.updateNote(command.entityId, command.newState)
            } else {
              await adapter.notes.update(command.entityId, command.newState)
              setSupabaseNotes(prev => ({
                ...prev,
                [command.moduleType]: prev[command.moduleType].map(n =>
                  n.id === command.entityId ? command.newState! : n
                ),
              }))
            }
            toast('Redone: Note edit')
          }
          break

        case 'delete':
          // Redo delete = soft delete the note
          if (isDemoMode || !adapter) {
            mockNotesStore.deleteNote(command.entityId)
          } else {
            await adapter.notes.delete(command.entityId)
            setSupabaseNotes(prev => ({
              ...prev,
              [command.moduleType]: prev[command.moduleType].filter(n => n.id !== command.entityId),
            }))
          }
          toast('Redone: Note deletion')
          break
      }
    } catch (err) {
      console.error('Failed to redo:', err)
      toast.error('Failed to redo action')
      // Move pointer back since redo failed
      undoStore.undo()
    }
  }, [isDemoMode, adapter, mockNotesStore, undoStore])

  // Get current notes for context value
  const notes: Record<ModuleType, Note[]> = isDemoMode || !resolvedProductionId
    ? {
      cue: mockNotesStore.getAllNotes('cue'),
      work: mockNotesStore.getAllNotes('work'),
      production: mockNotesStore.getAllNotes('production'),
      actor: mockNotesStore.getAllNotes('actor'),
    }
    : supabaseNotes

  return (
    <NotesContext.Provider
      value={{
        notes,
        isLoading,
        error,
        connectionStatus,
        getNotes,
        addNote,
        updateNote,
        deleteNote,
        setNotes,
        validateNote,
        undoLastAction,
        redoLastAction,
        canUndo,
        canRedo,
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}

// Raw database note type (snake_case from Supabase)
interface RawDbNote {
  id: string
  production_id: string
  module_type: string
  title: string
  description?: string | null
  type?: string | null
  priority: string
  status: string
  created_by?: string | null
  assigned_to?: string | null
  completed_by?: string | null
  created_at: string | null
  updated_at: string | null
  completed_at?: string | null
  due_date?: string | null
  cue_number?: string | null
  script_page_id?: string | null
  scene_song_id?: string | null
  lightwright_item_id?: string | null
  channel_numbers?: string | null
  position_unit?: string | null
  scenery_needs?: string | null
  deleted_at?: string | null
  deleted_by?: string | null
}

// Helper function to convert database note to Note type
function convertDbNoteToNote(dbNote: RawDbNote): Note {
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
    createdAt: dbNote.created_at ? new Date(dbNote.created_at) : new Date(),
    updatedAt: dbNote.updated_at ? new Date(dbNote.updated_at) : new Date(),
    completedAt: dbNote.completed_at ? new Date(dbNote.completed_at) : undefined,
    dueDate: dbNote.due_date ? new Date(dbNote.due_date) : undefined,
    cueNumber: dbNote.cue_number ?? undefined,
    scriptPageId: dbNote.script_page_id ?? undefined,
    sceneSongId: dbNote.scene_song_id ?? undefined,
    lightwrightItemId: dbNote.lightwright_item_id ?? undefined,
    channelNumbers: dbNote.channel_numbers ?? undefined,
    positionUnit: dbNote.position_unit ?? undefined,
    sceneryNeeds: dbNote.scenery_needs ?? undefined,
    deletedAt: dbNote.deleted_at ? new Date(dbNote.deleted_at) : undefined,
    deletedBy: dbNote.deleted_by ?? undefined,
  }
}
