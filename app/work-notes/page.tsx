'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NotesTable } from '@/components/notes-table'
import { AddNoteDialog } from '@/components/add-note-dialog'
import { useState } from 'react'
import { Plus, Search, Wrench, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note, Priority, NoteStatus } from '@/types'
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

// Mock data for development
const mockWorkNotes: Note[] = [
  // Work type notes
  {
    id: '1',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Replace lamp in FOH position 3',
    description: 'HPL 575W burnt out during tech rehearsal',
    priority: 'high',
    status: 'todo',
    type: 'Work',
    createdAt: new Date('2024-01-16T09:30:00'),
    updatedAt: new Date('2024-01-16T09:30:00'),
    lightwrightItemId: 'LW001',
    channelNumbers: '101, 102',
    positionUnit: 'FOH-3 Units 1-2',
    sceneryNeeds: 'Need ladder access behind set piece',
  },
  {
    id: '2',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Hang additional side light positions',
    description: 'Install 4 new fixtures on SL boom',
    priority: 'medium',
    status: 'complete',
    type: 'Work',
    createdAt: new Date('2024-01-14T08:15:00'),
    updatedAt: new Date('2024-01-15T17:45:00'),
    lightwrightItemId: 'LW078',
    channelNumbers: '215, 216, 217, 218',
    positionUnit: 'SL Boom Units 4-7',
    sceneryNeeds: 'Coordinate with scenic for boom placement',
  },
  {
    id: '3',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Repair damaged yoke on Unit 47',
    description: 'Tilt mechanism sticking, needs cleaning',
    priority: 'low',
    status: 'cancelled',
    type: 'Work',
    createdAt: new Date('2024-01-12T14:20:00'),
    updatedAt: new Date('2024-01-14T11:30:00'),
    lightwrightItemId: 'LW047',
  },
  // Focus type notes
  {
    id: '4',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Gel replacement for cyc lights',
    description: 'Change R80 to R83 for warmer tone in Act 2',
    priority: 'medium',
    status: 'complete',
    type: 'Focus',
    createdAt: new Date('2024-01-13T16:00:00'),
    updatedAt: new Date('2024-01-15T10:20:00'),
    lightwrightItemId: 'LW045',
    channelNumbers: '301-310',
    positionUnit: 'Cyc Units 1-10',
    sceneryNeeds: 'Access behind cyc during intermission only',
  },
  {
    id: '5',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Refocus specials after set change',
    description: 'Platform height changed, need to adjust 8 fixtures',
    priority: 'high',
    status: 'todo',
    type: 'Focus',
    createdAt: new Date('2024-01-16T11:45:00'),
    updatedAt: new Date('2024-01-16T11:45:00'),
    channelNumbers: '151-158',
    positionUnit: 'Balcony Rail Specials 1-8',
    sceneryNeeds: 'Wait until platform is final height',
  },
  {
    id: '6',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Barn door adjustment on front wash',
    description: 'Clean up spill light hitting proscenium',
    priority: 'low',
    status: 'cancelled',
    type: 'Focus',
    createdAt: new Date('2024-01-11T13:30:00'),
    updatedAt: new Date('2024-01-13T09:15:00'),
    lightwrightItemId: 'LW023',
  },
  // Paperwork type notes
  {
    id: '7',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Update hookup with circuit changes',
    description: 'Circuits 47-52 reassigned to new dimmers',
    priority: 'medium',
    status: 'todo',
    type: 'Paperwork',
    createdAt: new Date('2024-01-15T14:30:00'),
    updatedAt: new Date('2024-01-15T14:30:00'),
  },
  {
    id: '8',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Complete safety inspection forms',
    description: 'Annual electrical safety documentation',
    priority: 'high',
    status: 'complete',
    type: 'Paperwork',
    createdAt: new Date('2024-01-10T09:00:00'),
    updatedAt: new Date('2024-01-12T16:45:00'),
  },
  {
    id: '9',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Organize gel swatch book',
    description: 'Update with new LED color samples',
    priority: 'low',
    status: 'cancelled',
    type: 'Paperwork',
    createdAt: new Date('2024-01-09T15:20:00'),
    updatedAt: new Date('2024-01-11T10:30:00'),
  },
  // Electrician type notes
  {
    id: '10',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Check DMX cable run stage left',
    description: 'Intermittent signal issues on Universe 2',
    priority: 'high',
    status: 'todo',
    type: 'Electrician',
    createdAt: new Date('2024-01-16T07:45:00'),
    updatedAt: new Date('2024-01-16T07:45:00'),
  },
  {
    id: '11',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Install new dimmer rack cooling fan',
    description: 'Rack 3 running hot, fan replacement needed',
    priority: 'medium',
    status: 'complete',
    type: 'Electrician',
    createdAt: new Date('2024-01-13T10:15:00'),
    updatedAt: new Date('2024-01-15T14:20:00'),
  },
  {
    id: '12',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Ground fault testing on all circuits',
    description: 'Monthly safety protocol check',
    priority: 'low',
    status: 'cancelled',
    type: 'Electrician',
    createdAt: new Date('2024-01-08T11:00:00'),
    updatedAt: new Date('2024-01-10T09:30:00'),
  },
  {
    id: '13',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Repair loose connection in patch panel',
    description: 'Circuit 28 has intermittent power loss',
    priority: 'medium',
    status: 'todo',
    type: 'Electrician',
    createdAt: new Date('2024-01-15T19:30:00'),
    updatedAt: new Date('2024-01-15T19:30:00'),
  },
  // Think type notes
  {
    id: '14',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Evaluate LED retrofit for house lights',
    description: 'Cost analysis and energy savings calculation',
    priority: 'low',
    status: 'complete',
    type: 'Think',
    createdAt: new Date('2024-01-07T16:00:00'),
    updatedAt: new Date('2024-01-12T13:45:00'),
  },
  {
    id: '15',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Consider wireless DMX for fly gallery',
    description: 'Cable runs problematic, research wireless options',
    priority: 'medium',
    status: 'todo',
    type: 'Think',
    createdAt: new Date('2024-01-14T12:30:00'),
    updatedAt: new Date('2024-01-14T12:30:00'),
  },
  {
    id: '16',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Alternative rigging for overhead specials',
    description: 'Current position blocks sightlines from balcony',
    priority: 'high',
    status: 'cancelled',
    type: 'Think',
    createdAt: new Date('2024-01-11T18:15:00'),
    updatedAt: new Date('2024-01-13T15:45:00'),
  },
  {
    id: '17',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Research new haze machine options',
    description: 'Current unit too noisy for intimate scenes',
    priority: 'medium',
    status: 'todo',
    type: 'Think',
    createdAt: new Date('2024-01-16T14:00:00'),
    updatedAt: new Date('2024-01-16T14:00:00'),
  },
  {
    id: '18',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Plan cable management upgrade',
    description: 'Current system creating trip hazards',
    priority: 'high',
    status: 'complete',
    type: 'Think',
    createdAt: new Date('2024-01-09T13:20:00'),
    updatedAt: new Date('2024-01-14T10:15:00'),
  },
]

export default function WorkNotesPage() {
  const [notes, setNotes] = useState(mockWorkNotes)
  const { name, abbreviation, logo } = useProductionStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<NoteStatus>('todo')
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogDefaultType, setDialogDefaultType] = useState<string>('Work')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [newNote, setNewNote] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    type: 'Work',
    channelNumbers: '',
    positionUnit: '',
    sceneryNeeds: '',
  })

  // Get unique types from all notes
  const availableTypes = Array.from(new Set(notes.map(note => note.type).filter(Boolean))) as string[]
  const typeOptions = availableTypes.map(type => ({ value: type, label: type }))

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          note.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = note.status === filterStatus
    const matchesType = filterTypes.length === 0 || filterTypes.includes(note.type || '')
    return matchesSearch && matchesStatus && matchesType
  })

  const handleAddNote = (noteData?: { title?: string; type?: string }) => {
    const title = noteData?.title || newNote.title
    const type = noteData?.type || newNote.type
    
    if (title.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        productionId: 'prod-1',
        moduleType: 'work',
        title: title,
        description: noteData?.title ? '' : newNote.description,
        priority: 'medium',
        status: 'todo',
        type: type,
        createdAt: new Date(),
        updatedAt: new Date(),
        channelNumbers: noteData?.title ? '' : newNote.channelNumbers,
        positionUnit: noteData?.title ? '' : newNote.positionUnit,
        sceneryNeeds: noteData?.title ? '' : newNote.sceneryNeeds,
      }
      setNotes([note, ...notes])
      setNewNote({ title: '', description: '', priority: 'medium', type: 'Work', channelNumbers: '', positionUnit: '', sceneryNeeds: '' })
      setIsAddingNote(false)
    }
  }

  const openQuickAdd = (type: string) => {
    const titles: { [key: string]: string } = {
      'Work': 'New work task',
      'Focus': 'Focus lights',
      'Paperwork': 'Complete paperwork',
      'Electrician': 'Electrical work',
      'Think': 'Think about issue'
    }
    handleAddNote({ title: titles[type] || `New ${type.toLowerCase()} note`, type })
  }

  const updateNoteStatus = (noteId: string, status: NoteStatus) => {
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, status, updatedAt: new Date() } : note
    ))
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setDialogDefaultType(note.type || 'Work')
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
              <Wrench className="h-8 w-8 text-modules-work" />
              Work Notes
            </h1>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setShowImport(!showImport)}
              variant="outline"
            >
              <Upload className="h-5 w-5" />
              Import Lightwright
            </Button>
            <Button
              onClick={() => setIsAddingNote(true)}
              variant="work"
            >
              <Plus className="h-5 w-5" />
              Add Work Note
            </Button>
          </div>
        </div>

        {/* Lightwright Import */}
        {showImport && (
          <div className="rounded-lg bg-card border p-4">
            <h3 className="font-medium mb-3">Import Lightwright CSV</h3>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground mb-2">Drop your Lightwright CSV file here</p>
              <p className="text-muted-foreground text-sm mb-4">or</p>
              <Button variant="work">
                Browse Files
              </Button>
            </div>
            <Button
              onClick={() => setShowImport(false)}
              variant="ghost"
              size="sm"
              className="mt-3"
            >
              Cancel
            </Button>
          </div>
        )}

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
              placeholder="Search work notes..."
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
            <Button onClick={() => openQuickAdd('Work')} variant="secondary" size="xs">
              <Plus className="h-3 w-3" />Work
            </Button>
            <Button onClick={() => openQuickAdd('Focus')} variant="priority_high" size="xs">
              <Plus className="h-3 w-3" />Focus
            </Button>
            <Button onClick={() => openQuickAdd('Paperwork')} variant="todo" size="xs">
              <Plus className="h-3 w-3" />Paperwork
            </Button>
            <Button onClick={() => openQuickAdd('Electrician')} variant="priority_low" size="xs">
              <Plus className="h-3 w-3" />Electrician
            </Button>
            <Button onClick={() => openQuickAdd('Think')} variant="priority_medium" size="xs">
              <Plus className="h-3 w-3" />Think
            </Button>
          </div>
        )}

        {/* Quick Add Form */}
        {isAddingNote && (
          <div className="rounded-lg bg-card border p-4 space-y-4">
            <h3 className="font-medium">Quick Add Work Note</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                type="text"
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                autoFocus
              />
              <Select value={newNote.priority} onValueChange={(value: Priority) => setNewNote({ ...newNote, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Select value={newNote.type} onValueChange={(value) => setNewNote({ ...newNote, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Troubleshooting">Troubleshooting</SelectItem>
                  <SelectItem value="Setup">Setup</SelectItem>
                  <SelectItem value="Strike">Strike</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="Lightwright ID (optional)..."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                type="text"
                placeholder="Channel Numbers (e.g. 101, 102, 103)..."
                value={newNote.channelNumbers}
                onChange={(e) => setNewNote({ ...newNote, channelNumbers: e.target.value })}
              />
              <Input
                type="text"
                placeholder="Position/Unit (e.g. FOH-3 Units 1-2)..."
                value={newNote.positionUnit}
                onChange={(e) => setNewNote({ ...newNote, positionUnit: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Description (optional)..."
              value={newNote.description}
              onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
              rows={2}
            />
            <Textarea
              placeholder="Scenery needs (optional)..."
              value={newNote.sceneryNeeds}
              onChange={(e) => setNewNote({ ...newNote, sceneryNeeds: e.target.value })}
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleAddNote()}
                variant="work"
              >
                Add Note
              </Button>
              <Button
                onClick={() => setIsAddingNote(false)}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Notes Table */}
        <NotesTable 
          notes={filteredNotes}
          moduleType="work"
          onStatusUpdate={updateNoteStatus}
          onEdit={handleEditNote}
        />

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">No work notes found</p>
            <p className="text-text-muted text-sm mt-1">Try adjusting your filters or add a new note</p>
          </div>
        )}
      </div>

      <AddNoteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleDialogAdd}
        moduleType="work"
        defaultType={dialogDefaultType}
        editingNote={editingNote}
      />
    </DashboardLayout>
  )
}