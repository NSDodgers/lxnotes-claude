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
import { useDesignerModeStore } from '@/lib/stores/designer-mode-store'
import { useIsMobile } from '@/lib/hooks/use-mobile-detect'
import { useNotesFilterStore } from '@/lib/stores/notes-filter-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { sortNotes } from '@/lib/utils/filter-sort-notes'
import { ScriptManager } from '@/components/script-manager'
import { MobileNoteList } from '@/components/notes-table/mobile-note-card'
import { MobileFilterBar } from '@/components/layout/mobile-filter-bar'
import { MobileActionBar } from '@/components/layout/mobile-action-bar'
import { UndoRedoButtons } from '@/components/undo-redo-buttons'
import { ColumnConfigPopover } from '@/components/notes-table/column-config-popover'
import { isDemoMode } from '@/lib/demo-data'
import { useNoteCommentCounts } from '@/hooks/use-note-comment-counts'
import { NoteCommentsPanel } from '@/components/note-comments-panel'
import Image from 'next/image'
import { DEFAULT_PRODUCTION_LOGO } from '@/lib/stores/production-store'

export default function CueNotesPage() {
  const notesContext = useNotes()
  // Determine effective notes based on mode
  const isDemo = isDemoMode()
  const notes: Note[] = useMemo(() => {
    return isDemo
      ? (typeof window !== 'undefined' ? useMockNotesStore.getState().notes.cue : [])
      : notesContext.notes.cue
  }, [isDemo, notesContext.notes.cue])

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
  const productionId = productionContext?.productionId ?? 'demo-production'
  useNoteCommentCounts(isProductionMode ? productionId : undefined)
  const customTypesStore = useCustomTypesStore()
  const { isDesignerMode } = useDesignerModeStore()
  const isMobile = useIsMobile()
  const tabletFilterStatus = useNotesFilterStore((s) => s.filterStatus)
  const tabletSearchTerm = useNotesFilterStore((s) => s.searchTerm)
  const setOnAddNote = useNotesFilterStore((s) => s.setOnAddNote)
  const setStatusCounts = useNotesFilterStore((s) => s.setStatusCounts)
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
  // In tablet/mobile mode, use shared filter store; in desktop, use local state
  const useSharedFilters = isDesignerMode || isMobile
  const effectiveSearchTerm = useSharedFilters ? tabletSearchTerm : searchTerm
  const effectiveFilterStatus = useSharedFilters ? tabletFilterStatus : filterStatus

  const effectiveFilterTypes = useSharedFilters ? tabletFilterTypes : filterTypes
  const emptyMessage = effectiveFilterStatus === 'deleted'
    ? 'No deleted notes. Notes you delete will appear here.'
    : 'No cue notes found'

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const note of notes) {
      counts[note.status] = (counts[note.status] || 0) + 1
    }
    return counts
  }, [notes])

  useEffect(() => {
    if (isDesignerMode || isMobile) {
      setStatusCounts(statusCounts)
    }
  }, [isDesignerMode, isMobile, statusCounts, setStatusCounts])

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter(note => {
      const searchLower = effectiveSearchTerm.toLowerCase()
      const matchesSearch = (note.description || '').toLowerCase().includes(searchLower) ||
        note.scriptPageId?.toLowerCase().includes(searchLower) ||
        note.sceneSongId?.toLowerCase().includes(searchLower)
      const matchesStatus = note.status === effectiveFilterStatus
      const matchesType = effectiveFilterTypes.length > 0
        ? effectiveFilterTypes.includes(note.type || '')
        : true
      const matchesPriority = useSharedFilters && tabletFilterPriorities.length > 0
        ? tabletFilterPriorities.includes(note.priority)
        : true
      return matchesSearch && matchesStatus && matchesType && matchesPriority
    })

    if (useSharedFilters) {
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
  }, [notes, effectiveSearchTerm, effectiveFilterStatus, effectiveFilterTypes, useSharedFilters, tabletFilterPriorities, tabletSortField, tabletSortDirection, isHydrated, customPrioritiesStore])

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

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]

  const updateNoteStatus = async (noteId: string, status: NoteStatus) => {
    const updates: Partial<Note> = { status }
    if (status === 'cancelled') {
      updates.cancelledBy = displayName
      updates.cancelledAt = new Date()
    } else if (status === 'complete') {
      updates.completedBy = displayName
      updates.completedAt = new Date()
    } else if (status === 'todo') {
      // Reopening — clear cancelled and completed tracking
      updates.cancelledBy = undefined
      updates.cancelledAt = undefined
      updates.completedBy = undefined
      updates.completedAt = undefined
    }
    await notesContext.updateNote(noteId, updates)
  }

  const handleQuickAdd = useCallback(async () => {
    const productionId = productionContext?.productionId ?? 'demo-production'
    const localDisplayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]
    const note = await notesContext.addNote({
      moduleType: 'cue',
      description: '',
      status: 'todo',
      priority: 'medium',
      type: inlineEditing.lastType ?? 'cue',
      productionId,
      createdBy: localDisplayName,
    } as Omit<Note, 'id' | 'createdAt' | 'updatedAt'>)
    return note
  }, [notesContext, productionContext?.productionId, user, inlineEditing.lastType])

  const handleInlineSave = useCallback(async (noteId: string, column: EditableColumn, value: string) => {
    const updates: Partial<Note> = {}
    if (column === 'description') { updates.description = value }
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
      const note = notesContext.notes.cue.find(n => n.id === noteId)
      if (note && !note.description?.trim()) {
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
  const designerAddNote = useCallback(() => {
    setEditingNote(null)
    setDialogDefaultType('Cue')
    setIsDialogOpen(true)
  }, [])

  useEffect(() => {
    if (isDesignerMode || isMobile) {
      setOnAddNote(designerAddNote)
      return () => setOnAddNote(null)
    }
  }, [isDesignerMode, isMobile, designerAddNote, setOnAddNote])

  const updateNoteStatusRef = useRef(updateNoteStatus)
  updateNoteStatusRef.current = updateNoteStatus

  const tabletColumns = useMemo(
    () => createTabletCueColumns({ onStatusUpdate: (noteId, status) => updateNoteStatusRef.current(noteId, status) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Tablet mode rendering (checked before isMobile so designer mode
  // always shows the table view, even on narrow viewports like iPad Mini)
  if (isDesignerMode) {
    return (
      <>
        <div className="h-full">
          <TabletNotesTable
            notes={filteredNotes}
            columns={tabletColumns}
            moduleType="cue"
            onEdit={handleEditNote}
            emptyIcon={Lightbulb}
            emptyMessage={emptyMessage}
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

  // Mobile mode rendering
  if (isMobile) {
    return (
      <>
        <MobileFilterBar moduleType="cue" statusCounts={statusCounts} />
        <MobileNoteList
          notes={filteredNotes}
          moduleType="cue"
          onStatusUpdate={updateNoteStatus}
          onEdit={handleEditNote}
          emptyIcon={Lightbulb}
          emptyMessage={emptyMessage}
        />
        <MobileActionBar
          moduleType="cue"
          onAddNote={() => openDialog()}
          onPDF={() => setIsPrintViewOpen(true)}
          onEmail={() => setIsEmailViewOpen(true)}
          overflowItems={[
            { label: 'Undo / Redo', icon: RotateCcw, onClick: () => {} },
            { label: 'Manage Script', icon: FileText, onClick: () => setIsScriptManagerOpen(true) },
          ]}
        />

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
                    <div className="relative w-full h-full bg-black">
                      <Image src={displayLogo} alt="Production logo" fill className="object-contain" />
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
                data-testid="print-notes-button"
              >
                <Printer className="h-4 w-4" />
                PDF
              </Button>
              <Button
                onClick={() => setIsEmailViewOpen(true)}
                variant="secondary"
                data-testid="email-notes-button"
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
                data-testid="add-note-button"
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
              <div className="flex flex-col gap-2" data-testid="status-filters">
                <label className="text-sm font-medium text-text-secondary">Status</label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setFilterStatus('todo')}
                    variant={filterStatus === 'todo' ? 'todo' : 'secondary'}
                    size="sm"
                    data-testid="status-filter-todo"
                  >
                    To Do ({statusCounts['todo'] || 0})
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('complete')}
                    variant={filterStatus === 'complete' ? 'complete' : 'secondary'}
                    size="sm"
                    data-testid="status-filter-complete"
                  >
                    Complete ({statusCounts['complete'] || 0})
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('cancelled')}
                    variant={filterStatus === 'cancelled' ? 'cancelled' : 'secondary'}
                    size="sm"
                    data-testid="status-filter-cancelled"
                  >
                    Cancelled ({statusCounts['cancelled'] || 0})
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('deleted')}
                    variant={filterStatus === 'deleted' ? 'deleted' : 'secondary'}
                    size="sm"
                    data-testid="status-filter-deleted"
                  >
                    Deleted ({statusCounts['deleted'] || 0})
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
              <ColumnConfigPopover moduleType="cue" />
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
            onQuickAdd={handleQuickAdd}
            emptyMessage={emptyMessage}
            statusFilter={effectiveFilterStatus}
            inlineEditing={inlineEditingProps}
          />

          {filteredNotes.length === 0 && (
            <div className="text-center py-12" data-testid="empty-state">
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

      <NoteCommentsPanel productionId={productionId} />
    </>
  )
}
