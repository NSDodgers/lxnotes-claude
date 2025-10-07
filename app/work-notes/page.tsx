'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
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
import { useState, useEffect, useRef } from 'react'
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
import { useProductionStore } from '@/lib/stores/production-store'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { generateSampleFixtures } from '@/lib/test-data/sample-fixture-data'
import { isDemoMode } from '@/lib/demo-data'

export default function WorkNotesPage() {
  const mockNotesStore = useMockNotesStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize mock data only in non-demo mode
  // In demo mode, initializeDemoSession handles all initialization
  useEffect(() => {
    if (!isDemoMode()) {
      mockNotesStore.initializeWithMockData()
    }
    setIsInitialized(true)
  }, [])

  // Load notes into state after initialization
  useEffect(() => {
    if (isInitialized) {
      const loadedNotes = mockNotesStore.getAllNotes('work')
      setNotes(loadedNotes)
    }
  }, [isInitialized, mockNotesStore])

  const { name, abbreviation, logo } = useProductionStore()
  const customTypesStore = useCustomTypesStore()
  const { fixtures, uploadFixtures, linkFixturesToWorkNote, getHasBeenDeleted } = useFixtureStore()
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

  // Auto-load mock data in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && fixtures.length === 0 && !getHasBeenDeleted()) {
      loadTestData()
    }
  }, [fixtures.length, getHasBeenDeleted])

  // Development helper - populate test data
  const loadTestData = () => {
    if (fixtures.length === 0) {
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
        address: f.address
      }))
      uploadFixtures('prod-1', parsedRows, false)
    }
  }

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

  const updateNoteStatus = (noteId: string, status: NoteStatus) => {
    mockNotesStore.updateNote(noteId, { status })
    // Refresh notes in state
    const updatedNotes = mockNotesStore.getAllNotes('work')
    setNotes(updatedNotes)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setDialogDefaultType(note.type || 'Work')
    setIsDialogOpen(true)
  }

  const handleDialogAdd = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>, lightwrightFixtureIds?: string[]) => {
    if (editingNote) {
      // Update existing note
      mockNotesStore.updateNote(editingNote.id, noteData)

      // Handle fixture linking for work notes
      if (noteData.moduleType === 'work' && lightwrightFixtureIds) {
        linkFixturesToWorkNote(editingNote.id, lightwrightFixtureIds)
      }
    } else {
      // Create new note
      const note = mockNotesStore.addNote(noteData)

      // Handle fixture linking for work notes
      if (noteData.moduleType === 'work' && lightwrightFixtureIds && lightwrightFixtureIds.length > 0) {
        linkFixturesToWorkNote(note.id, lightwrightFixtureIds)
      }
    }
    setEditingNote(null)

    // Refresh notes in state
    const updatedNotes = mockNotesStore.getAllNotes('work')
    setNotes(updatedNotes)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Sticky Header Container */}
        <div className="flex-none space-y-6 pb-4">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center border-b border-bg-tertiary pb-6">
            {/* Left: Production Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-bg-secondary rounded-lg text-2xl overflow-hidden">
                {logo && (logo.startsWith('data:') || logo.startsWith('/') || logo.startsWith('http')) ? (
                  <img src={logo} alt="Production logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{logo}</span>
                )}
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
            <div className="flex justify-end gap-3">
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
    </DashboardLayout>
  )
}