'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NotesTable } from '@/components/notes-table'
import { AddNoteDialog } from '@/components/add-note-dialog'
import { useState, useEffect } from 'react'
import { Plus, Search, FileText, Users } from 'lucide-react'
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

// Mock data for development
const mockProductionNotes: Note[] = [
  // Scenic department notes
  {
    id: '1',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Set piece height blocking front light',
    description: 'Upstage platform at 4 feet blocks key light from FOH',
    priority: 'high',
    status: 'todo',
    type: 'Scenic',
    createdAt: new Date('2024-01-16T10:30:00'),
    updatedAt: new Date('2024-01-16T10:30:00'),
  },
  {
    id: '2',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Approved paint colors for set',
    description: 'Warmer beige will work better with lighting palette',
    priority: 'medium',
    status: 'complete',
    type: 'Scenic',
    createdAt: new Date('2024-01-14T15:20:00'),
    updatedAt: new Date('2024-01-15T11:45:00'),
  },
  {
    id: '3',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Reflective paint causing glare issues',
    description: 'Metallic finish on throne reflects too much light',
    priority: 'low',
    status: 'cancelled',
    type: 'Scenic',
    createdAt: new Date('2024-01-12T14:15:00'),
    updatedAt: new Date('2024-01-14T09:30:00'),
  },
  // Costumes department notes
  {
    id: '4',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Schedule meeting with costume department',
    description: 'Discuss color temperature for white costume reveals',
    priority: 'high',
    status: 'todo',
    type: 'Costumes',
    createdAt: new Date('2024-01-16T09:00:00'),
    updatedAt: new Date('2024-01-16T09:00:00'),
  },
  {
    id: '5',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Fabric samples approved for lighting test',
    description: 'New silk fabric responds well to blue wash',
    priority: 'medium',
    status: 'complete',
    type: 'Costumes',
    createdAt: new Date('2024-01-13T16:30:00'),
    updatedAt: new Date('2024-01-15T14:20:00'),
  },
  {
    id: '6',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Sequin costume causing light scatter',
    description: 'Princess dress creating unwanted sparkle effects',
    priority: 'medium',
    status: 'cancelled',
    type: 'Costumes',
    createdAt: new Date('2024-01-11T13:45:00'),
    updatedAt: new Date('2024-01-13T10:15:00'),
  },
  // Lighting department notes
  {
    id: '7',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'LED upgrade budget approved',
    description: 'Replacing 12 conventional fixtures with LED',
    priority: 'low',
    status: 'complete',
    type: 'Lighting',
    createdAt: new Date('2024-01-10T11:00:00'),
    updatedAt: new Date('2024-01-12T16:45:00'),
  },
  {
    id: '8',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Request additional circuit capacity',
    description: 'Need 6 more circuits for expanded design',
    priority: 'high',
    status: 'todo',
    type: 'Lighting',
    createdAt: new Date('2024-01-15T18:30:00'),
    updatedAt: new Date('2024-01-15T18:30:00'),
  },
  // Props department notes
  {
    id: '9',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Practical lanterns need dimming solution',
    description: 'Stage lanterns too bright, need inline dimmers',
    priority: 'medium',
    status: 'todo',
    type: 'Props',
    createdAt: new Date('2024-01-14T12:15:00'),
    updatedAt: new Date('2024-01-14T12:15:00'),
  },
  {
    id: '10',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Mirror placement approved',
    description: 'Angled to avoid light reflection into audience',
    priority: 'low',
    status: 'complete',
    type: 'Props',
    createdAt: new Date('2024-01-11T10:30:00'),
    updatedAt: new Date('2024-01-13T15:45:00'),
  },
  {
    id: '11',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Candle effect too realistic',
    description: 'LED candles look fake under stage lights',
    priority: 'medium',
    status: 'cancelled',
    type: 'Props',
    createdAt: new Date('2024-01-09T16:20:00'),
    updatedAt: new Date('2024-01-11T14:30:00'),
  },
  // Sound department notes
  {
    id: '12',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Coordinate with sound for Act 2 transitions',
    description: 'Sync lighting blackouts with sound effects timing',
    priority: 'high',
    status: 'complete',
    type: 'Sound',
    createdAt: new Date('2024-01-13T14:00:00'),
    updatedAt: new Date('2024-01-16T11:30:00'),
  },
  {
    id: '13',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Speaker placement affecting light positions',
    description: 'Stage right speaker blocking side light angle',
    priority: 'medium',
    status: 'todo',
    type: 'Sound',
    createdAt: new Date('2024-01-15T17:45:00'),
    updatedAt: new Date('2024-01-15T17:45:00'),
  },
  // Video department notes
  {
    id: '14',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Projector wash out from stage lights',
    description: 'Need to flag or adjust FOH positions to prevent spill',
    priority: 'high',
    status: 'todo',
    type: 'Video',
    createdAt: new Date('2024-01-16T13:20:00'),
    updatedAt: new Date('2024-01-16T13:20:00'),
  },
  {
    id: '15',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Screen surface reflection minimized',
    description: 'New matte screen reduces light bounce',
    priority: 'low',
    status: 'complete',
    type: 'Video',
    createdAt: new Date('2024-01-12T09:15:00'),
    updatedAt: new Date('2024-01-14T16:30:00'),
  },
  {
    id: '16',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Sync issues with lighting console',
    description: 'SMPTE timecode not stable during video cues',
    priority: 'medium',
    status: 'cancelled',
    type: 'Video',
    createdAt: new Date('2024-01-10T14:45:00'),
    updatedAt: new Date('2024-01-12T11:20:00'),
  },
  // Stage Management notes
  {
    id: '17',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Review safety protocols with stage management',
    description: 'Updated emergency lighting and evacuation procedures',
    priority: 'high',
    status: 'complete',
    type: 'Stage Management',
    createdAt: new Date('2024-01-11T08:30:00'),
    updatedAt: new Date('2024-01-13T17:15:00'),
  },
  {
    id: '18',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Cue light system needs expansion',
    description: 'Add cue lights to fly gallery and trap room',
    priority: 'medium',
    status: 'todo',
    type: 'Stage Management',
    createdAt: new Date('2024-01-15T12:45:00'),
    updatedAt: new Date('2024-01-15T12:45:00'),
  },
  // Directing notes
  {
    id: '19',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Update director on technical limitations',
    description: 'Flying effects would interfere with lighting grid',
    priority: 'high',
    status: 'complete',
    type: 'Directing',
    createdAt: new Date('2024-01-14T10:00:00'),
    updatedAt: new Date('2024-01-15T15:30:00'),
  },
  {
    id: '20',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Director requests more dramatic shadows',
    description: 'Increase side light angle for Act 3 interrogation',
    priority: 'medium',
    status: 'cancelled',
    type: 'Directing',
    createdAt: new Date('2024-01-12T19:30:00'),
    updatedAt: new Date('2024-01-14T13:45:00'),
  },
  {
    id: '21',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Approved lighting concept for finale',
    description: 'Warm wash with practical star effects overhead',
    priority: 'low',
    status: 'todo',
    type: 'Directing',
    createdAt: new Date('2024-01-16T16:15:00'),
    updatedAt: new Date('2024-01-16T16:15:00'),
  },
  // Choreography notes
  {
    id: '22',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Dance formation requires spot repositioning',
    description: 'New triangle formation needs 3 specials not 2',
    priority: 'medium',
    status: 'todo',
    type: 'Choreography',
    createdAt: new Date('2024-01-15T20:00:00'),
    updatedAt: new Date('2024-01-15T20:00:00'),
  },
  {
    id: '23',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Lift sequence timing coordinated',
    description: 'Lighting follows dancers up to 8-foot platforms',
    priority: 'high',
    status: 'complete',
    type: 'Choreography',
    createdAt: new Date('2024-01-13T18:15:00'),
    updatedAt: new Date('2024-01-16T10:45:00'),
  },
  {
    id: '24',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Floor reflection causing balance issues',
    description: 'Dancers slipping on glossy stage floor under lights',
    priority: 'low',
    status: 'cancelled',
    type: 'Choreography',
    createdAt: new Date('2024-01-10T13:30:00'),
    updatedAt: new Date('2024-01-12T09:45:00'),
  },
  // Production Management notes
  {
    id: '25',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Budget variance report due Friday',
    description: 'Additional LED fixtures pushed costs over by 8%',
    priority: 'medium',
    status: 'todo',
    type: 'Production Management',
    createdAt: new Date('2024-01-16T14:30:00'),
    updatedAt: new Date('2024-01-16T14:30:00'),
  },
  {
    id: '26',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Approved overtime for focus session',
    description: 'Extended tech week requires additional crew hours',
    priority: 'high',
    status: 'complete',
    type: 'Production Management',
    createdAt: new Date('2024-01-12T16:00:00'),
    updatedAt: new Date('2024-01-14T08:30:00'),
  },
  {
    id: '27',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Insurance claims for damaged equipment',
    description: 'Storm damage to outdoor lighting rig last month',
    priority: 'low',
    status: 'cancelled',
    type: 'Production Management',
    createdAt: new Date('2024-01-08T12:15:00'),
    updatedAt: new Date('2024-01-10T15:45:00'),
  },
]

export default function ProductionNotesPage() {
  const [notes, setNotes] = useState(mockProductionNotes)
  const { name, abbreviation, logo } = useProductionStore()
  const customTypesStore = useCustomTypesStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<NoteStatus>('todo')
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogDefaultType, setDialogDefaultType] = useState<string>('lighting')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Handle client-side hydration for stores with skipHydration: true
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Get custom types from store (only after hydration)
  const availableTypes = isHydrated ? customTypesStore.getTypes('production') : []
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
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, status, updatedAt: new Date() } : note
    ))
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setDialogDefaultType(note.type || 'Lighting')
    setIsDialogOpen(true)
  }

  const handleDialogAdd = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingNote) {
      // Update existing note
      const updatedNote: Note = {
        ...editingNote,
        ...noteData,
        updatedAt: new Date(),
      }
      setNotes(notes.map(note => note.id === editingNote.id ? updatedNote : note))
    } else {
      // Create new note
      const note: Note = {
        ...noteData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setNotes([note, ...notes])
    }
    setEditingNote(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center border-b border-bg-tertiary pb-6">
          {/* Left: Production Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 bg-bg-secondary rounded-lg text-2xl overflow-hidden">
              {logo.startsWith('data:') ? (
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
              <FileText className="h-8 w-8 text-modules-production" />
              Production Notes
            </h1>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => openQuickAdd('scenic')}
              variant="production"
            >
              <Plus className="h-5 w-5" />
              Add Production Note
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search production notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 pl-10"
            />
          </div>
        </div>

        {/* Quick Add Bar */}
        {filterStatus === 'todo' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground text-sm">Quick Add:</span>
            {availableTypes.map(type => {
              // Truncate long labels for quick add bar
              const displayLabel = type.label.length > 12 
                ? type.label.substring(0, 10) + '...' 
                : type.label;
              
              return (
                <Button 
                  key={type.id}
                  onClick={() => openQuickAdd(type.value)} 
                  size="xs"
                  style={{ 
                    backgroundColor: type.color,
                    borderColor: type.color 
                  }}
                  className="text-white hover:opacity-80 transition-opacity"
                  title={type.label} // Full name on hover
                >
                  <Plus className="h-3 w-3" />{displayLabel}
                </Button>
              );
            })}
          </div>
        )}


        {/* Notes Table */}
        <NotesTable 
          notes={filteredNotes}
          moduleType="production"
          onStatusUpdate={updateNoteStatus}
          onEdit={handleEditNote}
        />

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">No production notes found</p>
            <p className="text-text-muted text-sm mt-1">Try adjusting your filters or add a new note</p>
          </div>
        )}
      </div>

      <AddNoteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleDialogAdd}
        moduleType="production"
        defaultType={dialogDefaultType}
        editingNote={editingNote}
      />
    </DashboardLayout>
  )
}