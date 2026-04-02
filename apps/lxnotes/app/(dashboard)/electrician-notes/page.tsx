'use client'

import { ElectricianNotesTable } from '@/components/notes-table/electrician-notes-table'
import { ColumnConfigPopover } from '@/components/notes-table/column-config-popover'
import { TabletNotesTable } from '@/components/notes-table/tablet-notes-table'
import { createTabletElectricianColumns } from '@/components/notes-table/columns/tablet-electrician-columns'
import { AddNoteDialog } from '@/components/add-note-dialog'
import { EmailNotesSidebar } from '@/components/email-notes-sidebar'
import { PrintNotesSidebar } from '@/components/print-notes-sidebar'
import { HookupImportSidebar } from '@/components/hookup-import-sidebar'
import { FixtureDataViewer } from '@/components/fixture-data-viewer'
import { PositionManager } from '@/components/position-manager'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useInlineEditing } from '@/hooks/use-inline-editing'
import type { EditableColumn } from '@/hooks/use-inline-editing'
import { usePathname } from 'next/navigation'
import { Plus, Search, Zap, Upload, Mail, Printer, Database, ArrowUpDown, RotateCcw, ChevronDown } from 'lucide-react'
import type { Note, NoteStatus, FilterSortPreset } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MultiSelect } from '@/components/ui/multi-select'
import { useCurrentProductionStore, DEFAULT_PRODUCTION_LOGO } from '@/lib/stores/production-store'
import { useProductionOptional } from '@/components/production/production-provider'
import { useAuthContext } from '@/components/auth/auth-provider'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { useNotes } from '@/lib/contexts/notes-context'
import { isDemoMode } from '@/lib/demo-data'
import { useOrderItemCounts } from '@/hooks/use-order-item-counts'
import { useNoteCommentCounts } from '@/hooks/use-note-comment-counts'
import { NoteCommentsPanel } from '@/components/note-comments-panel'
import { createSupabaseStorageAdapter } from '@/lib/supabase/supabase-storage-adapter'
import { useDesignerModeStore } from '@/lib/stores/designer-mode-store'
import { useIsMobile } from '@/lib/hooks/use-mobile-detect'
import { useNotesFilterStore } from '@/lib/stores/notes-filter-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { sortNotes } from '@/lib/utils/filter-sort-notes'
import { MobileNoteList } from '@/components/notes-table/mobile-note-card'
import { MobileFilterBar } from '@/components/layout/mobile-filter-bar'
import { MobileActionBar } from '@/components/layout/mobile-action-bar'
import { UndoRedoButtons } from '@/components/undo-redo-buttons'
import { useEditNoteQueryParam } from '@/hooks/use-edit-note-query-param'
import Image from 'next/image'
import { toast } from 'sonner'

export default function ElectricianNotesPage() {
  const notesContext = useNotes()
  const isDemo = isDemoMode()
  const notes: Note[] = useMemo(() => {
    return isDemo
      ? (typeof window !== 'undefined' ? useMockNotesStore.getState().notes.electrician : [])
      : notesContext.notes.electrician
  }, [isDemo, notesContext.notes.electrician])

  const [, forceUpdate] = useState({})
  useEffect(() => {
    if (isDemo) {
      const unsubscribe = useMockNotesStore.subscribe(
        (state) => state.notes.electrician,
        () => forceUpdate({})
      )
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe()
      }
    }
  }, [isDemo])

  const initializeWithMockData = useMockNotesStore(state => state.initializeWithMockData)

  useEffect(() => {
    if (!isDemoMode() && typeof window !== 'undefined' && !window.location.pathname.startsWith('/production/')) {
      initializeWithMockData()
    }
  }, [initializeWithMockData])

  const productionContext = useProductionOptional()
  const { user } = useAuthContext()
  const storeData = useCurrentProductionStore()
  const pathname = usePathname()
  const isProductionMode = pathname.startsWith('/production/')
  const productionId = productionContext?.productionId ?? 'prod-1'
  const name = productionContext?.production?.name ?? (isProductionMode ? '' : storeData.name)
  const abbreviation = productionContext?.production?.abbreviation ?? (isProductionMode ? '' : storeData.abbreviation)
  const logo = isProductionMode
    ? (productionContext?.production?.logo || DEFAULT_PRODUCTION_LOGO)
    : storeData.logo
  // Populate order item counts store for the Orders column
  useOrderItemCounts(isProductionMode ? productionId : undefined)
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
  const fixturesLength = useFixtureStore((state) => state.fixtures.length)
  const uploadFixtures = useFixtureStore((state) => state.uploadFixtures)
  const linkFixturesToWorkNote = useFixtureStore((state) => state.linkFixturesToWorkNote)
  const getHasBeenDeleted = useFixtureStore((state) => state.getHasBeenDeleted)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<NoteStatus>('todo')
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [isLightwrightDialogOpen, setIsLightwrightDialogOpen] = useState(false)
  const [isLightwrightViewerOpen, setIsLightwrightViewerOpen] = useState(false)
  const [isPositionManagerOpen, setIsPositionManagerOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogDefaultType, setDialogDefaultType] = useState<string>('Work')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isEmailViewOpen, setIsEmailViewOpen] = useState(false)
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const inlineEditing = useInlineEditing('electrician')

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const loadTestData = useCallback(async () => {
    if (fixturesLength === 0 && !isProductionMode) {
      const { generateSampleFixtures } = await import('@/lib/test-data/sample-fixture-data')

      const testFixtures = generateSampleFixtures()
      const parsedRows = testFixtures.map(f => ({
        lwid: f.lwid,
        channel: f.channel,
        position: f.position,
        unitNumber: f.unitNumber,
        fixtureType: f.fixtureType,
        purpose: f.purpose,
        universeAddressRaw: f.universeAddressRaw,
        universe: f.universe,
        address: f.address,
        positionOrder: f.positionOrder
      }))
      uploadFixtures(productionId, parsedRows, false)
    }
  }, [fixturesLength, uploadFixtures, isProductionMode, productionId])

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isDemoMode() && !isProductionMode && fixturesLength === 0 && !getHasBeenDeleted()) {
      loadTestData()
    }
  }, [fixturesLength, getHasBeenDeleted, loadTestData, isProductionMode])

  const availableTypes = isHydrated ? customTypesStore.getTypes('electrician') : []
  const typeOptions = availableTypes.map(type => ({
    value: type.value,
    label: type.label,
    color: type.color
  }))

  const useSharedFilters = isDesignerMode || isMobile
  const effectiveSearchTerm = useSharedFilters ? tabletSearchTerm : searchTerm
  const effectiveFilterStatus = useSharedFilters ? tabletFilterStatus : filterStatus
  const effectiveFilterTypes = useSharedFilters ? tabletFilterTypes : filterTypes
  const emptyMessage = effectiveFilterStatus === 'deleted'
    ? 'No deleted notes. Notes you delete will appear here.'
    : 'No electrician notes found'

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
      const matchesSearch = (note.description || '').toLowerCase().includes(effectiveSearchTerm.toLowerCase())
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
      const activeSortField = tabletSortField ?? 'priority'
      const priorities = isHydrated ? customPrioritiesStore.getPriorities('electrician') : []
      return sortNotes(filtered, {
        type: 'filter_sort',
        moduleType: 'electrician',
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

  const openQuickAdd = (typeValue: string) => {
    setDialogDefaultType(typeValue)
    setEditingNote(null)
    setIsDialogOpen(true)
  }

  const updateNoteStatus = async (noteId: string, status: NoteStatus) => {
    await notesContext.updateNote(noteId, { status })
  }

  const handleQuickAdd = useCallback(async () => {
    const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]
    const note = await notesContext.addNote({
      moduleType: 'electrician',
      description: '',
      status: 'todo',
      priority: 'medium',
      type: inlineEditing.lastType ?? 'work',
      productionId,
      createdBy: displayName,
    } as Omit<Note, 'id' | 'createdAt' | 'updatedAt'>)
    return note
  }, [notesContext, productionId, user, inlineEditing.lastType])

  const handleInlineSave = useCallback(async (noteId: string, column: EditableColumn, value: string) => {
    const updates: Partial<Note> = {}
    if (column === 'description') { updates.description = value }
    else if (column === 'type') {
      updates.type = value
      inlineEditing.setLastType(value)
    }
    else if (column === 'priority') updates.priority = value
    await notesContext.updateNote(noteId, updates)
  }, [notesContext, inlineEditing])

  const handleInlineCancel = useCallback(async (noteId: string, isNewNote: boolean) => {
    if (isNewNote) {
      const note = notesContext.notes.electrician.find(n => n.id === noteId)
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

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setDialogDefaultType(note.type || 'Work')
    setIsDialogOpen(true)
  }

  // Handle ?editNote query param (from order list page "Open note" link)
  useEditNoteQueryParam(useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (note) handleEditNote(note)
  }, [notes])) // eslint-disable-line react-hooks/exhaustive-deps

  const designerAddNote = useCallback(() => {
    setEditingNote(null)
    setDialogDefaultType('work')
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
    () => createTabletElectricianColumns({ onStatusUpdate: (noteId, status) => updateNoteStatusRef.current(noteId, status) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleDialogAdd = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>, lightwrightFixtureIds?: string[]) => {
    if (editingNote) {
      await notesContext.updateNote(editingNote.id, noteData)

      // Show toast if note was moved to another module
      if (noteData.moduleType !== editingNote.moduleType) {
        const targetLabel = noteData.moduleType === 'work' ? 'Work Notes' : 'Electrician Notes'
        toast(`Moved to ${targetLabel}`, {
          action: { label: 'Undo', onClick: () => notesContext.undoLastAction() }
        })
      }

      if (noteData.moduleType === 'electrician' && lightwrightFixtureIds) {
        linkFixturesToWorkNote(editingNote.id, lightwrightFixtureIds)

        if (!isDemo && isProductionMode) {
          const adapter = createSupabaseStorageAdapter(productionId)
          adapter.fixtureLinks?.setForWorkNote(editingNote.id, lightwrightFixtureIds).catch(err => {
            console.error('[ElectricianNotes] Failed to persist fixture links:', err)
          })
        }
      }
    } else {
      const note = await notesContext.addNote(noteData)

      if (noteData.moduleType === 'electrician' && lightwrightFixtureIds && lightwrightFixtureIds.length > 0) {
        linkFixturesToWorkNote(note.id, lightwrightFixtureIds)

        if (!isDemo && isProductionMode) {
          const adapter = createSupabaseStorageAdapter(productionId)
          adapter.fixtureLinks?.setForWorkNote(note.id, lightwrightFixtureIds).catch(err => {
            console.error('[ElectricianNotes] Failed to persist fixture links:', err)
          })
        }
      }
    }
    setEditingNote(null)
  }

  // Mobile mode rendering
  if (isMobile) {
    return (
      <>
        <MobileFilterBar moduleType="electrician" statusCounts={statusCounts} />
        <MobileNoteList
          notes={filteredNotes}
          moduleType="electrician"
          onStatusUpdate={updateNoteStatus}
          onEdit={handleEditNote}
          emptyIcon={Zap}
          emptyMessage={emptyMessage}
        />
        <MobileActionBar
          moduleType="electrician"
          onAddNote={() => openQuickAdd('work')}
          onPDF={() => setIsPrintViewOpen(true)}
          onEmail={() => setIsEmailViewOpen(true)}
          overflowItems={[
            { label: 'Undo / Redo', icon: RotateCcw, onClick: () => {} },
            { label: 'Import Hookup CSV', icon: Upload, onClick: () => setIsLightwrightDialogOpen(true) },
            { label: 'View Hookup', icon: Database, onClick: () => setIsLightwrightViewerOpen(true) },
            { label: 'Manage Positions', icon: ArrowUpDown, onClick: () => setIsPositionManagerOpen(true) },
          ]}
        />

        <AddNoteDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAdd={handleDialogAdd}
          moduleType="electrician"
          defaultType={dialogDefaultType}
          editingNote={editingNote}
        />

        <EmailNotesSidebar
          moduleType="electrician"
          isOpen={isEmailViewOpen}
          onClose={() => setIsEmailViewOpen(false)}
        />

        <PrintNotesSidebar
          moduleType="electrician"
          isOpen={isPrintViewOpen}
          onClose={() => setIsPrintViewOpen(false)}
          notes={notes}
        />

        <HookupImportSidebar
          isOpen={isLightwrightDialogOpen}
          onClose={() => setIsLightwrightDialogOpen(false)}
          productionId={productionId}
        />

        <FixtureDataViewer
          isOpen={isLightwrightViewerOpen}
          onClose={() => setIsLightwrightViewerOpen(false)}
          productionId={productionId}
        />

        <Sheet open={isPositionManagerOpen} onOpenChange={setIsPositionManagerOpen}>
          <SheetContent side="right" className="w-full sm:max-w-4xl max-w-none">
            <SheetHeader className="pb-6">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-modules-electrician" />
                <SheetTitle>Position Management</SheetTitle>
              </div>
              <SheetDescription>
                Customize the sort order of positions from your fixture data
              </SheetDescription>
            </SheetHeader>
            <PositionManager productionId={productionId} />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Tablet mode rendering
  if (isDesignerMode) {
    return (
      <>
        <div className="h-full">
          <TabletNotesTable
            notes={filteredNotes}
            columns={tabletColumns}
            onEdit={handleEditNote}
            emptyIcon={Zap}
            emptyMessage={emptyMessage}
          />
        </div>

        <AddNoteDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAdd={handleDialogAdd}
          moduleType="electrician"
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
                <Zap className="h-8 w-8 text-modules-electrician" />
                Electrician Notes
              </h1>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-col items-end gap-2 min-w-0">
              {/* Row 1: View/Export Actions */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
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
                  onClick={() => setIsLightwrightViewerOpen(true)}
                  variant="secondary"
                >
                  <Database className="h-4 w-4" />
                  View Hookup
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsPositionManagerOpen(true)}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  Manage Positions
                </Button>
              </div>
              {/* Row 2: Modification Actions */}
              <div className="flex gap-2 flex-wrap justify-end">
                <Button
                  onClick={() => setIsLightwrightDialogOpen(true)}
                  variant="outline"
                >
                  <Upload className="h-5 w-5" />
                  Import Hookup CSV
                </Button>
                <Button
                  onClick={() => openQuickAdd('work')}
                  variant="electrician"
                >
                  <Plus className="h-5 w-5" />
                  Add Electrician Note
                </Button>
              </div>
            </div>
          </div>


          {/* Filters and Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Status Filters - No "In Review" for electrician */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">Status</label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setFilterStatus('todo')}
                    variant={filterStatus === 'todo' ? 'todo' : 'secondary'}
                    size="sm"
                  >
                    To Do ({statusCounts['todo'] || 0})
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('complete')}
                    variant={filterStatus === 'complete' ? 'complete' : 'secondary'}
                    size="sm"
                  >
                    Complete ({statusCounts['complete'] || 0})
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('cancelled')}
                    variant={filterStatus === 'cancelled' ? 'cancelled' : 'secondary'}
                    size="sm"
                  >
                    Cancelled ({statusCounts['cancelled'] || 0})
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('deleted')}
                    variant={filterStatus === 'deleted' ? 'deleted' : 'secondary'}
                    size="sm"
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
                  placeholder="Search electrician notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-80 pl-8 font-medium"
                  data-testid="search-input"
                  aria-label="Search notes"
                />
              </div>
              <ColumnConfigPopover moduleType="electrician" />
            </div>
          </div>

          {/* Quick Add Bar */}
          {filterStatus === 'todo' && (
            <>
              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground text-sm">Quick Add:</span>
                {availableTypes.map(type => (
                  <Button
                    key={type.id}
                    onClick={() => openQuickAdd(type.value)}
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
                            openQuickAdd(type.value)
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
          <ElectricianNotesTable
            notes={filteredNotes}
            onStatusUpdate={updateNoteStatus}
            onEdit={handleEditNote}
            onQuickAdd={handleQuickAdd}
            emptyMessage={emptyMessage}
            inlineEditing={inlineEditingProps}
          />

          {filteredNotes.length === 0 && (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No electrician notes found</p>
              <p className="text-text-muted text-sm mt-1">Try adjusting your filters or add a new note</p>
            </div>
          )}
        </div>
      </div>

      <AddNoteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleDialogAdd}
        moduleType="electrician"
        defaultType={dialogDefaultType}
        editingNote={editingNote}
      />

      <EmailNotesSidebar
        moduleType="electrician"
        isOpen={isEmailViewOpen}
        onClose={() => setIsEmailViewOpen(false)}
      />

      <PrintNotesSidebar
        moduleType="electrician"
        isOpen={isPrintViewOpen}
        onClose={() => setIsPrintViewOpen(false)}
        notes={notes}
      />

      <HookupImportSidebar
        isOpen={isLightwrightDialogOpen}
        onClose={() => setIsLightwrightDialogOpen(false)}
        productionId={productionId}
      />

      <FixtureDataViewer
        isOpen={isLightwrightViewerOpen}
        onClose={() => setIsLightwrightViewerOpen(false)}
        productionId={productionId}
      />

      <Sheet open={isPositionManagerOpen} onOpenChange={setIsPositionManagerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-4xl max-w-none">
          <SheetHeader className="pb-6">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-modules-electrician" />
              <SheetTitle>Position Management</SheetTitle>
            </div>
            <SheetDescription>
              Customize the sort order of positions from your fixture data
            </SheetDescription>
          </SheetHeader>

          <PositionManager productionId={productionId} />
        </SheetContent>
      </Sheet>

      <NoteCommentsPanel productionId={productionId} />
    </>
  )
}
