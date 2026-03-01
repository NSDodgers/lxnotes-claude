/**
 * Cue Notes Module - Main component for theatrical lighting cue management
 * Manages notes linked to specific lighting cues, script pages, and scenes/songs
 */
'use client'

import { CueNotesTable } from '@/components/notes-table/cue-notes-table'
import { TabletNotesTable } from '@/components/notes-table/tablet-notes-table'
import { createTabletCueColumns } from '@/components/notes-table/columns/tablet-cue-columns'
import { AddNoteDialog } from '@/components/add-note-dialog'
import { EmailNotesSidebar } from '@/components/email-notes-sidebar'
import { PrintNotesSidebar } from '@/components/print-notes-sidebar'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useInlineEditing } from '@/hooks/use-inline-editing'
import type { EditableColumn } from '@/hooks/use-inline-editing'
import { usePathname } from 'next/navigation'
import { Plus, Search, Lightbulb, FileText, Mail, Printer, RotateCcw, ChevronDown } from 'lucide-react'
import type { Note, NoteStatus, FilterSortPreset } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MultiSelect } from '@/components/ui/multi-select'
import { useCurrentProductionStore } from '@/lib/stores/production-store'
import { useProductionOptional } from '@/components/production/production-provider'
import { useAuthContext } from '@/components/auth/auth-provider'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { useNotes } from '@/lib/contexts/notes-context'
import { useTabletModeStore } from '@/lib/stores/tablet-mode-store'
import { useNotesFilterStore } from '@/lib/stores/notes-filter-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { sortNotes } from '@/lib/utils/filter-sort-notes'
import { ScriptManager } from '@/components/script-manager'
import { UndoRedoButtons } from '@/components/undo-redo-buttons'
import { isDemoMode } from '@/lib/demo-data'
import Image from 'next/image'
import { DEFAULT_PRODUCTION_LOGO } from '@/lib/stores/production-store'

export default function CueNotesPage() {
  const notesContext = useNotes()
  // Determine effective notes based on mode
  const isDemo = isDemoMode()
  const notes: Note[] = useMemo(() => {
    return isDemo
      ? (typeof window !== 'undefined' ? useMockNotesStore.getState().notes.cue : [])
      : notesContext.getNotes('cue')
  }, [isDemo, notesContext])

  // Mock store subscription for demo mode only
  const [, forceUpdate] = useState({})
  useEffect(() => {
    if (isDemo) {
      const unsubscribe = useMockNotesStore.subscribe(
        (state) => state.notes.cue,
        () => forceUpdate({}) // Force re-render on store update
      )
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe()
      }
    }
  }, [isDemo])
  // Get production data from context (Supabase) if available, otherwise fall back to store
  const productionContext = useProductionOptional()
  const { user } = useAuthContext()
  const storeData = useCurrentProductionStore()
  const pathname = usePathname()
  const isProductionMode = pathname.startsWith('/production/')
  // When in production mode (real Supabase), use placeholder during loading and when no logo
  // Only fall back to store data when NOT in production mode (demo/default)
  const name = productionContext?.production?.name ?? (isProductionMode ? '' : storeData.name)
  const abbreviation = productionContext?.production?.abbreviation ?? (isProductionMode ? '' : storeData.abbreviation)
  const logo = isProductionMode
    ? (productionContext?.production?.logo || DEFAULT_PRODUCTION_LOGO)
    : storeData.logo
  const customTypesStore = useCustomTypesStore()
  const { isTabletMode } = useTabletModeStore()
  const tabletFilterStatus = useNotesFilterStore((s) => s.filterStatus)
  const tabletSearchTerm = useNotesFilterStore((s) => s.searchTerm)
  const setOnAddNote = useNotesFilterStore((s) => s.setOnAddNote)
  const tabletFilterTypes = useNotesFilterStore((s) => s.filterTypes)
  const tabletFilterPriorities = useNotesFilterStore((s) => s.filterPriorities)
  const tabletSortField = useNotesFilterStore((s) => s.sortField)
  const tabletSortDirection = useNotesFilterStore((s) => s.sortDirection)
  const customPrioritiesStore = useCustomPrioritiesStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<NoteStatus>('todo')
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogDefaultType, setDialogDefaultType] = useState<string>('Cue')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isEmailViewOpen, setIsEmailViewOpen] = useState(false)
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false)
  const [isScriptManagerOpen, setIsScriptManagerOpen] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const resetColumnsRef = useRef<(() => void) | null>(null)
  const inlineEditing = useInlineEditing('cue')

  // Handle client-side hydration for stores with skipHydration: true
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Get custom types and priorities from stores (only after hydration)
  const availableTypes = isHydrated ? customTypesStore.getTypes('cue') : []
  const typeOptions = availableTypes.map(type => ({
    value: type.value,
    label: type.label,
    color: type.color
  }))
  // In tablet mode, use shared filter store; in desktop, use local state
  const effectiveSearchTerm = isTabletMode ? tabletSearchTerm : searchTerm
  const effectiveFilterStatus = isTabletMode ? tabletFilterStatus : filterStatus

  const effectiveFilterTypes = isTabletMode ? tabletFilterTypes : filterTypes

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter(note => {
      const searchLower = effectiveSearchTerm.toLowerCase()
      const matchesSearch = note.title.toLowerCase().includes(searchLower) ||
        note.description?.toLowerCase().includes(searchLower) ||
        note.scriptPageId?.toLowerCase().includes(searchLower) ||
        note.sceneSongId?.toLowerCase().includes(searchLower)
      const matchesStatus = note.status === effectiveFilterStatus
      const matchesType = effectiveFilterTypes.length > 0
        ? effectiveFilterTypes.includes(note.type || '')
        : true
      const matchesPriority = isTabletMode && tabletFilterPriorities.length > 0
        ? tabletFilterPriorities.includes(note.priority)
        : true
      return matchesSearch && matchesStatus && matchesType && matchesPriority
    })

    if (isTabletMode) {
      const activeSortField = tabletSortField ?? 'cue_number'
      const priorities = isHydrated ? customPrioritiesStore.getPriorities('cue') : []
      return sortNotes(filtered, {
        type: 'filter_sort',
        moduleType: 'cue',
        id: '_tablet',
        name: '_tablet',
        config: {
          statusFilter: null,
          typeFilters: [],
          priorityFilters: [],
          sortBy: activeSortField,
          sortOrder: tabletSortDirection,
          groupByType: false,
        },
      } as unknown as FilterSortPreset, priorities)
    }

    return filtered
  }, [notes, effectiveSearchTerm, effectiveFilterStatus, effectiveFilterTypes, isTabletMode, tabletFilterPriorities, tabletSortField, tabletSortDirection, isHydrated, customPrioritiesStore])

  const handleAddNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingNote) {
      // Update existing note
      await notesContext.updateNote(editingNote.id, noteData)
    } else {
      // Create new note
      await notesContext.addNote(noteData)
    }
  }

  const openDialog = (type?: string) => {
    setEditingNote(null)
    setDialogDefaultType(type || 'Cue')
    setIsDialogOpen(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setDialogDefaultType(note.type || 'Cue')
    setIsDialogOpen(true)
  }

  const updateNoteStatus = async (noteId: string, status: NoteStatus) => {
    await notesContext.updateNote(noteId, { status })
  }

  const handleQuickAdd = useCallback(async () => {
    const productionId = productionContext?.productionId ?? 'demo-production'
    const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]
    const note = await notesContext.addNote({
      moduleType: 'cue',
      title: '',
      status: 'todo',
      priority: 'medium',
      type: inlineEditing.lastType ?? 'cue',
      productionId,
      createdBy: displayName,
    } as Omit<Note, 'id' | 'createdAt' | 'updatedAt'>)
    return note
  }, [notesContext, productionContext?.productionId, user])

  const handleInlineSave = useCallback(async (noteId: string, column: EditableColumn, value: string) => {
    const updates: Partial<Note> = {}
    if (column === 'title') updates.title = value
    else if (column === 'type') {
      updates.type = value
      inlineEditing.setLastType(value)
    }
    else if (column === 'priority') updates.priority = value
    else if (column === 'cueNumber') updates.cueNumber = value
    await notesContext.updateNote(noteId, updates)
  }, [notesContext, inlineEditing])

  const handleInlineCancel = useCallback(async (noteId: string, isNewNote: boolean) => {
    if (isNewNote) {
      const note = notesContext.getNotes('cue').find(n => n.id === noteId)
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

  // Register add-note callback for tablet top bar
  const tabletAddNote = useCallback(() => {
    setEditingNote(null)
    setDialogDefaultType('Cue')
    setIsDialogOpen(true)
  }, [])

  useEffect(() => {
    if (isTabletMode) {
      setOnAddNote(tabletAddNote)
      return () => setOnAddNote(null)
    }
  }, [isTabletMode, tabletAddNote, setOnAddNote])

  const tabletColumns = useMemo(
    () => createTabletCueColumns({ onStatusUpdate: updateNoteStatus }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isTabletMode]
  )

  // Tablet mode rendering
  if (isTabletMode) {
    return (
      <>
        <div className="h-full">
          <TabletNotesTable
            notes={filteredNotes}
            columns={tabletColumns}
            onEdit={handleEditNote}
            emptyIcon={Lightbulb}
            emptyMessage="No cue notes found"
          />
        </div>

        <AddNoteDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAdd={handleAddNote}
          moduleType="cue"
          defaultType={dialogDefaultType}
          editingNote={editingNote}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Sticky Header Container */}
        <div className="flex-none space-y-6 pb-4">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto] items-start border-b border-bg-tertiary pb-6 min-w-0">
            {/* Left: Production Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-bg-secondary rounded-lg text-2xl overflow-hidden">
                {(() => {
                  const displayLogo = logo || DEFAULT_PRODUCTION_LOGO
                  return displayLogo.startsWith('data:') || displayLogo.startsWith('/') || displayLogo.startsWith('http') ? (
                    <div className="relative w-full h-full">
                      <Image src={displayLogo} alt="Production logo" fill className="object-cover" />
                    </div>
                  ) : (
                    <span>{displayLogo}</span>
                  )
                })()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">{name}</h2>
                <p className="text-text-secondary">{abbreviation}</p>
              </div>
            </div>

            {/* Center: Module Heading */}
            <div className="flex justify-center">
              <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3 whitespace-nowrap">
                <Lightbulb className="h-8 w-8 text-modules-cue" />
                Cue Notes
              </h1>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex justify-end items-center gap-2 flex-wrap min-w-0">
              <UndoRedoButtons />
              <div className="h-6 w-px bg-border" />
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
                variant="secondary"
                onClick={() => setIsScriptManagerOpen(true)}
              >
                <FileText className="h-5 w-5" />
                Manage Script
              </Button>
              <Button
                onClick={() => openDialog()}
                variant="cue"
              >
                <Plus className="h-5 w-5" />
                Add Cue Note
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Status Filters */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">Status</label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setFilterStatus('todo')}
                    variant={filterStatus === 'todo' ? 'todo' : 'secondary'}
                    size="sm"
                  >
                    To Do
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('complete')}
                    variant={filterStatus === 'complete' ? 'complete' : 'secondary'}
                    size="sm"
                  >
                    Complete
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('cancelled')}
                    variant={filterStatus === 'cancelled' ? 'cancelled' : 'secondary'}
                    size="sm"
                  >
                    Cancelled
                  </Button>
                </div>
              </div>

              {/* Type Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">Type</label>
                <MultiSelect
                  options={typeOptions}
                  selected={filterTypes}
                  onChange={setFilterTypes}
                  placeholder="All Types"
                  className="min-w-[140px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search cue notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-80 pl-8 font-medium"
                  data-testid="search-input"
                  aria-label="Search notes"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (resetColumnsRef.current) {
                    resetColumnsRef.current()
                  }
                }}
                title="Reset column widths to defaults"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Add Bar — Desktop: inline buttons, Mobile: popover */}
          {filterStatus === 'todo' && (
            <>
              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground text-sm">Quick Add:</span>
                {availableTypes.map(type => (
                  <Button
                    key={type.id}
                    onClick={() => openDialog(type.value)}
                    size="xs"
                    style={{
                      backgroundColor: type.color,
                      borderColor: type.color
                    }}
                    className="text-white hover:opacity-80 transition-opacity"
                  >
                    <Plus className="h-3 w-3" />{type.label}
                  </Button>
                ))}
              </div>
              <div className="flex sm:hidden">
                <Popover open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm">
                      <Plus className="h-4 w-4" />
                      Quick Add
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)]">
                    <div className="grid grid-cols-2 gap-2">
                      {availableTypes.map(type => (
                        <Button
                          key={type.id}
                          onClick={() => {
                            openDialog(type.value)
                            setIsQuickAddOpen(false)
                          }}
                          size="xs"
                          style={{
                            backgroundColor: type.color,
                            borderColor: type.color
                          }}
                          className="text-white hover:opacity-80 transition-opacity"
                        >
                          <Plus className="h-3 w-3" />{type.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>

        {/* Notes Table - Fills remaining space */}
        <div className="flex-1 min-h-0">
          <CueNotesTable
            notes={filteredNotes}
            onStatusUpdate={updateNoteStatus}
            onEdit={handleEditNote}
            onMountResetFn={(resetFn) => {
              resetColumnsRef.current = resetFn
            }}
            onQuickAdd={handleQuickAdd}
            inlineEditing={inlineEditingProps}
          />

          {filteredNotes.length === 0 && (
            <div className="text-center py-12">
              <Lightbulb className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No cue notes found</p>
              <p className="text-text-muted text-sm mt-1">Try adjusting your filters or add a new note</p>
            </div>
          )}
        </div>
      </div>

      <AddNoteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleAddNote}
        moduleType="cue"
        defaultType={dialogDefaultType}
        editingNote={editingNote}
      />

      <EmailNotesSidebar
        moduleType="cue"
        isOpen={isEmailViewOpen}
        onClose={() => setIsEmailViewOpen(false)}
      />

      <PrintNotesSidebar
        moduleType="cue"
        isOpen={isPrintViewOpen}
        onClose={() => setIsPrintViewOpen(false)}
        notes={notes}
      />

      <ScriptManager
        isOpen={isScriptManagerOpen}
        onClose={() => setIsScriptManagerOpen(false)}
        productionId={productionContext?.productionId ?? 'demo-production'}
      />
    </>
  )
}
