'use client'

import { WorkNotesTable } from '@/components/notes-table/work-notes-table'
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
import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Plus, Search, Wrench, Upload, Mail, Printer, Database, ArrowUpDown, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note, NoteStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { useCurrentProductionStore, DEFAULT_PRODUCTION_LOGO } from '@/lib/stores/production-store'
import { useProductionOptional } from '@/components/production/production-provider'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { useNotes } from '@/lib/contexts/notes-context'
// Lazy loaded via dynamic import to avoid loading 4,682 lines on page load
// import { generateSampleFixtures } from '@/lib/test-data/sample-fixture-data'
import { isDemoMode } from '@/lib/demo-data'
import { UndoRedoButtons } from '@/components/undo-redo-buttons'
import Image from 'next/image'

export default function WorkNotesPage() {
  const notesContext = useNotes()
  const mockNotesStore = useMockNotesStore()
  // Determine effective notes based on mode
  const isDemo = isDemoMode()
  const notes = isDemo
    ? (typeof window !== 'undefined' ? useMockNotesStore.getState().notes.work : [])
    : notesContext.getNotes('work')

  // Mock store subscription for demo mode only
  const [, forceUpdate] = useState({})
  useEffect(() => {
    if (isDemo) {
      const unsubscribe = useMockNotesStore.subscribe(
        (state) => state.notes.work,
        () => forceUpdate({})
      )
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe()
      }
    }
  }, [isDemo])

  const [isInitialized, setIsInitialized] = useState(false)
  const initializeWithMockData = useMockNotesStore(state => state.initializeWithMockData)

  // Initialize mock data only in non-demo mode and non-production mode
  useEffect(() => {
    if (!isDemoMode() && typeof window !== 'undefined' && !window.location.pathname.startsWith('/production/')) {
      initializeWithMockData()
    }
    setIsInitialized(true)
  }, [initializeWithMockData])

  // Get production data from context (Supabase) if available, otherwise fall back to store
  const productionContext = useProductionOptional()
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
  // Use selector to only subscribe to fixtures.length instead of entire array
  // This prevents massive re-renders when fixtures are uploaded
  const fixturesLength = useFixtureStore((state) => state.fixtures.length)
  const uploadFixtures = useFixtureStore((state) => state.uploadFixtures)
  const linkFixturesToWorkNote = useFixtureStore((state) => state.linkFixturesToWorkNote)
  const getHasBeenDeleted = useFixtureStore((state) => state.getHasBeenDeleted)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<NoteStatus>('todo')
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [showImport, setShowImport] = useState(false)
  const [isLightwrightDialogOpen, setIsLightwrightDialogOpen] = useState(false)
  const [isLightwrightViewerOpen, setIsLightwrightViewerOpen] = useState(false)
  const [isPositionManagerOpen, setIsPositionManagerOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogDefaultType, setDialogDefaultType] = useState<string>('Work')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isEmailViewOpen, setIsEmailViewOpen] = useState(false)
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const resetColumnsRef = useRef<(() => void) | null>(null)

  // Handle client-side hydration for stores with skipHydration: true
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Development helper - populate test data (ASYNC)
  const loadTestData = useCallback(async () => {
    if (fixturesLength === 0) {
      // Dynamic import to avoid loading 4,682 lines on page load
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
      uploadFixtures('prod-1', parsedRows, false)
    }
  }, [fixturesLength, uploadFixtures])

  // Auto-load mock data in development mode (DISABLED in demo mode)
  // In demo mode, fixture data is loaded by initializeDemoSession in lib/demo-data/loader.ts
  // This prevents redundant loading and UI freezes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isDemoMode() && fixturesLength === 0 && !getHasBeenDeleted()) {
      // Only load test data in non-demo development mode
      loadTestData()
    }
  }, [fixturesLength, getHasBeenDeleted, loadTestData])

  // Get custom types from store (only after hydration)
  const availableTypes = isHydrated ? customTypesStore.getTypes('work') : []
  const typeOptions = availableTypes.map(type => ({
    value: type.value,
    label: type.label,
    color: type.color
  }))

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = note.status === filterStatus
    const matchesType = filterTypes.length === 0 || filterTypes.includes(note.type || '')
    return matchesSearch && matchesStatus && matchesType
  })

  const openQuickAdd = (typeValue: string) => {
    setDialogDefaultType(typeValue)
    setEditingNote(null)
    setIsDialogOpen(true)
  }

  const updateNoteStatus = async (noteId: string, status: NoteStatus) => {
    await notesContext.updateNote(noteId, { status })
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setDialogDefaultType(note.type || 'Work')
    setIsDialogOpen(true)
  }

  const handleDialogAdd = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>, lightwrightFixtureIds?: string[]) => {
    if (editingNote) {
      // Update existing note
      await notesContext.updateNote(editingNote.id, noteData)

      // Handle fixture linking for work notes
      if (noteData.moduleType === 'work' && lightwrightFixtureIds) {
        linkFixturesToWorkNote(editingNote.id, lightwrightFixtureIds)
      }
    } else {
      // Create new note
      const note = await notesContext.addNote(noteData)

      // Handle fixture linking for work notes
      if (noteData.moduleType === 'work' && lightwrightFixtureIds && lightwrightFixtureIds.length > 0) {
        linkFixturesToWorkNote(note.id, lightwrightFixtureIds)
      }
    }
    setEditingNote(null)
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Sticky Header Container */}
        <div className="flex-none space-y-6 pb-4">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center border-b border-bg-tertiary pb-6">
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
                <Wrench className="h-8 w-8 text-modules-work" />
                Work Notes
              </h1>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-col items-end gap-2">
              {/* Row 1: View/Export Actions */}
              <div className="flex items-center gap-3">
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
              <div className="flex gap-3">
                <Button
                  onClick={() => setIsLightwrightDialogOpen(true)}
                  variant="outline"
                >
                  <Upload className="h-5 w-5" />
                  Import Hookup CSV
                </Button>
                <Button
                  onClick={() => openQuickAdd('work')}
                  variant="work"
                >
                  <Plus className="h-5 w-5" />
                  Add Work Note
                </Button>
              </div>
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
                  placeholder="Search work notes..."
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

          {/* Quick Add Bar */}
          {filterStatus === 'todo' && (
            <div className="flex items-center gap-2 flex-wrap">
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
          )}
        </div>


        {/* Notes Table - Fills remaining space */}
        <div className="flex-1 min-h-0">
          <WorkNotesTable
            notes={filteredNotes}
            onStatusUpdate={updateNoteStatus}
            onEdit={handleEditNote}
            onMountResetFn={(resetFn) => {
              resetColumnsRef.current = resetFn
            }}
          />

          {filteredNotes.length === 0 && (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No work notes found</p>
              <p className="text-text-muted text-sm mt-1">Try adjusting your filters or add a new note</p>
            </div>
          )}
        </div>
      </div>

      <AddNoteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleDialogAdd}
        moduleType="work"
        defaultType={dialogDefaultType}
        editingNote={editingNote}
      />

      <EmailNotesSidebar
        moduleType="work"
        isOpen={isEmailViewOpen}
        onClose={() => setIsEmailViewOpen(false)}
      />

      <PrintNotesSidebar
        moduleType="work"
        isOpen={isPrintViewOpen}
        onClose={() => setIsPrintViewOpen(false)}
        notes={notes}
      />

      <HookupImportSidebar
        isOpen={isLightwrightDialogOpen}
        onClose={() => setIsLightwrightDialogOpen(false)}
        productionId="prod-1"
      />

      <FixtureDataViewer
        isOpen={isLightwrightViewerOpen}
        onClose={() => setIsLightwrightViewerOpen(false)}
        productionId="prod-1"
      />

      <Sheet open={isPositionManagerOpen} onOpenChange={setIsPositionManagerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-4xl max-w-none">
          <SheetHeader className="pb-6">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-modules-work" />
              <SheetTitle>Position Management</SheetTitle>
            </div>
            <SheetDescription>
              Customize the sort order of positions from your fixture data
            </SheetDescription>
          </SheetHeader>

          <PositionManager />
        </SheetContent>
      </Sheet>
    </>
  )
}
