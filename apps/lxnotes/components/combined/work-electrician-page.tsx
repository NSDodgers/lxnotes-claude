'use client'

import { WorkNotesTable } from '@/components/notes-table/work-notes-table'
import { AddNoteDialog } from '@/components/add-note-dialog'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useInlineEditing } from '@/hooks/use-inline-editing'
import type { EditableColumn } from '@/hooks/use-inline-editing'
import { EmailNotesSidebar } from '@/components/email-notes-sidebar'
import { PrintNotesSidebar } from '@/components/print-notes-sidebar'
import { Plus, Search, Layers, Mail, Printer } from 'lucide-react'
import type { Note, NoteStatus, ModuleType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProductionOptional } from '@/components/production/production-provider'
import { useAuthContext } from '@/components/auth/auth-provider'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { useNotes } from '@/lib/contexts/notes-context'
import { isDemoMode } from '@/lib/demo-data'
import { useIsMobile } from '@/lib/hooks/use-mobile-detect'
import { UndoRedoButtons } from '@/components/undo-redo-buttons'

const COMBINED_MODULE_TYPES: ModuleType[] = ['work', 'electrician']

export default function CombinedWorkElectricianPage() {
  const notesContext = useNotes()
  const isDemo = isDemoMode()

  // Merge work + electrician notes client-side
  const notes: Note[] = useMemo(() => {
    if (isDemo && typeof window !== 'undefined') {
      const state = useMockNotesStore.getState().notes
      return [...state.work, ...state.electrician]
    }
    return [...notesContext.notes.work, ...notesContext.notes.electrician]
  }, [isDemo, notesContext.notes.work, notesContext.notes.electrician])

  // Mock store subscription for demo mode
  const [, forceUpdate] = useState({})
  useEffect(() => {
    if (isDemo) {
      const unsubWork = useMockNotesStore.subscribe(
        (state) => state.notes.work,
        () => forceUpdate({})
      )
      const unsubElec = useMockNotesStore.subscribe(
        (state) => state.notes.electrician,
        () => forceUpdate({})
      )
      return () => {
        if (typeof unsubWork === 'function') unsubWork()
        if (typeof unsubElec === 'function') unsubElec()
      }
    }
  }, [isDemo])

  useProductionOptional()
  useAuthContext()
  const isMobile = useIsMobile()

  // Local filter state (matches desktop pattern of existing module pages)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<NoteStatus>('todo')

  // Filter notes
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter((n) => !n.deletedAt)

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((n) => n.status === filterStatus)
    }

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.description?.toLowerCase().includes(q) ||
          n.channelNumbers?.toLowerCase().includes(q) ||
          n.positionUnit?.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [notes, filterStatus, searchTerm])

  // Dialog and sidebar state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isEmailViewOpen, setIsEmailViewOpen] = useState(false)
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false)
  const [dialogModuleType, setDialogModuleType] = useState<ModuleType>('work')

  const handleDialogAdd = useCallback(
    async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
      await notesContext.addNote(note)
      setIsDialogOpen(false)
      setEditingNote(null)
    },
    [notesContext]
  )

  const handleEdit = useCallback((note: Note) => {
    setEditingNote(note)
    setDialogModuleType(note.moduleType)
    setIsDialogOpen(true)
  }, [])

  const handleStatusUpdate = useCallback(
    async (noteId: string, status: NoteStatus) => {
      await notesContext.updateNote(noteId, { status })
    },
    [notesContext]
  )

  const handleOpenDialog = useCallback(() => {
    setEditingNote(null)
    setIsDialogOpen(true)
  }, [])

  // Inline editing (use 'work' as the module type since work+electrician share same editable columns)
  const inlineEditing = useInlineEditing('work')

  const handleInlineSave = useCallback(async (noteId: string, column: EditableColumn, value: string) => {
    const updates: Partial<Note> = {}
    if (column === 'title') { updates.title = value; updates.description = value }
    else if (column === 'type') {
      updates.type = value
      inlineEditing.setLastType(value)
    }
    else if (column === 'priority') updates.priority = value
    await notesContext.updateNote(noteId, updates)
  }, [notesContext, inlineEditing])

  const handleInlineCancel = useCallback(async (noteId: string, isNewNote: boolean) => {
    if (isNewNote) {
      const allNotes = [...notesContext.notes.work, ...notesContext.notes.electrician]
      const note = allNotes.find(n => n.id === noteId)
      if (note && !note.title.trim()) {
        await notesContext.deleteNote(noteId)
      }
    }
    inlineEditing.stopEditing()
  }, [notesContext, inlineEditing])

  const inlineEditingProps = useMemo(() => ({
    ...inlineEditing,
    onSave: handleInlineSave,
    onAdvance: inlineEditing.moveToNextCell,
    onCancel: handleInlineCancel,
  }), [inlineEditing, handleInlineSave, handleInlineCancel])

  // Status filter buttons
  const statusOptions: { value: NoteStatus; label: string }[] = [
    { value: 'todo', label: 'Todo' },
    { value: 'review', label: 'Review' },
    { value: 'complete', label: 'Complete' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  // Empty state
  if (notes.length === 0 && !notesContext.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Layers className="h-12 w-12 text-teal-400 mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          No work or electrician notes yet
        </h2>
        <p className="text-text-secondary mb-6 max-w-md">
          Create your first note to get started. Notes from both Work Notes and Electrician Notes will appear here together.
        </p>
        <Button onClick={handleOpenDialog} className="bg-teal-500 hover:bg-teal-600">
          <Plus className="h-4 w-4 mr-2" />
          Create Note
        </Button>
        <AddNoteDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAdd={handleDialogAdd}
          moduleType={dialogModuleType}
          editingNote={editingNote}
          combinedViewModuleTypes={COMBINED_MODULE_TYPES}
          onModuleTypeChange={setDialogModuleType}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-teal-400" />
          <h1 className="text-2xl font-bold text-text-primary">Work + Electrician Notes</h1>
          <span className="text-sm text-text-secondary">
            {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <UndoRedoButtons />
          <Button
            onClick={() => setIsPrintViewOpen(true)}
            variant="secondary"
          >
            <Printer className="h-4 w-4" />
            PDF
          </Button>
          <Button
            onClick={() => setIsEmailViewOpen(true)}
            variant="secondary"
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
          <Button
            onClick={handleOpenDialog}
            data-testid="combined-add-note"
            className="bg-teal-500 hover:bg-teal-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Status filter + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {statusOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={filterStatus === opt.value ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus(opt.value)}
              data-testid={`combined-status-${opt.value}`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="combined-search"
          />
        </div>
      </div>

      {/* Table */}
      <WorkNotesTable
        notes={filteredNotes}
        onStatusUpdate={handleStatusUpdate}
        onEdit={handleEdit}
        emptyMessage="No notes match your filters"
        inlineEditing={inlineEditingProps}
      />

      {/* Add/Edit Dialog */}
      <AddNoteDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingNote(null)
        }}
        onAdd={handleDialogAdd}
        moduleType={dialogModuleType}
        editingNote={editingNote}
        combinedViewModuleTypes={COMBINED_MODULE_TYPES}
        onModuleTypeChange={setDialogModuleType}
      />

      {/* Print/Email Sidebars */}
      <EmailNotesSidebar
        moduleType="combined-work-electrician"
        isOpen={isEmailViewOpen}
        onClose={() => setIsEmailViewOpen(false)}
      />

      <PrintNotesSidebar
        moduleType="combined-work-electrician"
        isOpen={isPrintViewOpen}
        onClose={() => setIsPrintViewOpen(false)}
        notes={filteredNotes}
      />
    </div>
  )
}
