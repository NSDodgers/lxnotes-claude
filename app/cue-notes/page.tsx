'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NotesTable } from '@/components/notes-table'
import { AddNoteDialog } from '@/components/add-note-dialog'
import { useState } from 'react'
import { Plus, Search, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note, Priority, NoteStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'

// Mock data for development
const mockCueNotes: Note[] = [
  // Cue type notes
  {
    id: '1',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Fade house lights on page 23',
    description: 'Slow fade to 50% over 3 seconds when actor enters',
    priority: 'high',
    status: 'todo',
    type: 'Cue',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
    scriptPageId: 'cue-127',
    sceneSongId: 'Act1-Scene3',
  },
  {
    id: '2',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Blackout after finale',
    description: 'Complete blackout in 2 counts',
    priority: 'medium',
    status: 'complete',
    type: 'Cue',
    createdAt: new Date('2024-01-14T14:20:00'),
    updatedAt: new Date('2024-01-16T09:15:00'),
    scriptPageId: 'cue-245',
    sceneSongId: 'Act2-Finale',
  },
  {
    id: '3',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Intermission preset too bright',
    description: 'Reduce intensity to 75% for house lights',
    priority: 'low',
    status: 'cancelled',
    type: 'Cue',
    createdAt: new Date('2024-01-13T16:45:00'),
    updatedAt: new Date('2024-01-14T11:30:00'),
    scriptPageId: 'cue-156',
  },
  // Director type notes
  {
    id: '4',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Need more dramatic lighting for death scene',
    description: 'Director wants stronger side light and deeper shadows',
    priority: 'high',
    status: 'todo',
    type: 'Director',
    createdAt: new Date('2024-01-16T11:00:00'),
    updatedAt: new Date('2024-01-16T11:00:00'),
    scriptPageId: 'page-78',
    sceneSongId: 'Act2-Scene1',
  },
  {
    id: '5',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Approved new color palette for ballroom',
    description: 'Warmer tones approved, shift from cool blue to amber',
    priority: 'medium',
    status: 'complete',
    type: 'Director',
    createdAt: new Date('2024-01-12T13:30:00'),
    updatedAt: new Date('2024-01-15T10:45:00'),
    sceneSongId: 'Act1-Ballroom',
  },
  // Choreographer type notes
  {
    id: '6',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Dance number needs center special',
    description: 'Tight special on lead dancer for solo section',
    priority: 'medium',
    status: 'todo',
    type: 'Choreographer',
    createdAt: new Date('2024-01-15T09:20:00'),
    updatedAt: new Date('2024-01-15T09:20:00'),
    scriptPageId: 'page-34',
    sceneSongId: 'Act1-DanceNumber',
  },
  {
    id: '7',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Remove upstage wash during tap sequence',
    description: 'Too much spill light affecting the precision work',
    priority: 'low',
    status: 'cancelled',
    type: 'Choreographer',
    createdAt: new Date('2024-01-11T15:15:00'),
    updatedAt: new Date('2024-01-13T14:20:00'),
    sceneSongId: 'Act2-TapNumber',
  },
  // Designer type notes
  {
    id: '8',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Blue wash for dream sequence',
    description: 'Deep blue with breakup gobos, fade in over 8 counts',
    priority: 'medium',
    status: 'complete',
    type: 'Designer',
    createdAt: new Date('2024-01-10T16:30:00'),
    updatedAt: new Date('2024-01-14T12:45:00'),
    scriptPageId: 'page-45',
    sceneSongId: 'Act1-DreamSequence',
  },
  {
    id: '9',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Add texture to forest scene',
    description: 'Use leaf breakup gobos on trees, R79 color',
    priority: 'high',
    status: 'todo',
    type: 'Designer',
    createdAt: new Date('2024-01-16T08:45:00'),
    updatedAt: new Date('2024-01-16T08:45:00'),
    sceneSongId: 'Act1-Forest',
  },
  // Stage Manager type notes
  {
    id: '10',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Pre-show checklist updated',
    description: 'Added new safety check for fly system integration',
    priority: 'medium',
    status: 'complete',
    type: 'Stage Manager',
    createdAt: new Date('2024-01-14T07:30:00'),
    updatedAt: new Date('2024-01-15T18:20:00'),
  },
  {
    id: '11',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Cue timing adjustments needed',
    description: 'Several cues running late, need to tighten timing',
    priority: 'high',
    status: 'todo',
    type: 'Stage Manager',
    createdAt: new Date('2024-01-16T19:15:00'),
    updatedAt: new Date('2024-01-16T19:15:00'),
  },
  // Associate type notes
  {
    id: '12',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Focus session notes compiled',
    description: 'All focus notes from yesterday organized and prioritized',
    priority: 'low',
    status: 'complete',
    type: 'Associate',
    createdAt: new Date('2024-01-13T20:30:00'),
    updatedAt: new Date('2024-01-14T09:45:00'),
  },
  {
    id: '13',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Research color temperature options',
    description: 'Need warmer options for intimate scenes',
    priority: 'medium',
    status: 'cancelled',
    type: 'Associate',
    createdAt: new Date('2024-01-12T11:00:00'),
    updatedAt: new Date('2024-01-15T16:30:00'),
  },
  // Assistant type notes
  {
    id: '14',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Cable management in booth',
    description: 'Organize control cables to prevent interference',
    priority: 'low',
    status: 'todo',
    type: 'Assistant',
    createdAt: new Date('2024-01-15T12:15:00'),
    updatedAt: new Date('2024-01-15T12:15:00'),
  },
  // Spot type notes
  {
    id: '15',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Spotlight follow for solo',
    description: 'Track performer during song, stage right to center',
    priority: 'high',
    status: 'complete',
    type: 'Spot',
    createdAt: new Date('2024-01-14T17:00:00'),
    updatedAt: new Date('2024-01-16T20:30:00'),
    scriptPageId: 'page-67',
    sceneSongId: 'Act2-Solo',
  },
  {
    id: '16',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Spot operator needs better sightlines',
    description: 'Move position slightly stage left for Act 2',
    priority: 'medium',
    status: 'cancelled',
    type: 'Spot',
    createdAt: new Date('2024-01-13T18:45:00'),
    updatedAt: new Date('2024-01-14T10:15:00'),
  },
  // Programmer type notes
  {
    id: '17',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Optimize memory usage in console',
    description: 'Remove unused palettes and groups',
    priority: 'low',
    status: 'complete',
    type: 'Programmer',
    createdAt: new Date('2024-01-11T14:20:00'),
    updatedAt: new Date('2024-01-12T16:45:00'),
  },
  {
    id: '18',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Program backup sequences',
    description: 'Create alternate cues for emergency situations',
    priority: 'high',
    status: 'todo',
    type: 'Programmer',
    createdAt: new Date('2024-01-16T13:30:00'),
    updatedAt: new Date('2024-01-16T13:30:00'),
  },
  // Production type notes
  {
    id: '19',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Budget approval for additional fixtures',
    description: 'Request approved for 6 additional LED pars',
    priority: 'medium',
    status: 'complete',
    type: 'Production',
    createdAt: new Date('2024-01-09T10:00:00'),
    updatedAt: new Date('2024-01-11T15:30:00'),
  },
  // Paperwork type notes
  {
    id: '20',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Update lighting plot with changes',
    description: 'Reflect all modifications made during tech week',
    priority: 'medium',
    status: 'todo',
    type: 'Paperwork',
    createdAt: new Date('2024-01-16T16:00:00'),
    updatedAt: new Date('2024-01-16T16:00:00'),
  },
  {
    id: '21',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Archive previous show files',
    description: 'Clean up console and backup important files',
    priority: 'low',
    status: 'cancelled',
    type: 'Paperwork',
    createdAt: new Date('2024-01-10T09:30:00'),
    updatedAt: new Date('2024-01-12T14:00:00'),
  },
  // Think type notes
  {
    id: '22',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Consider alternative approach to storm scene',
    description: 'Current lightning effect not convincing enough',
    priority: 'high',
    status: 'todo',
    type: 'Think',
    createdAt: new Date('2024-01-15T21:45:00'),
    updatedAt: new Date('2024-01-15T21:45:00'),
    sceneSongId: 'Act2-Storm',
  },
  {
    id: '23',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Evaluate LED vs conventional for specials',
    description: 'Cost-benefit analysis completed, recommend LED',
    priority: 'medium',
    status: 'complete',
    type: 'Think',
    createdAt: new Date('2024-01-08T11:20:00'),
    updatedAt: new Date('2024-01-10T13:15:00'),
  },
]

export default function CueNotesPage() {
  const [notes, setNotes] = useState(mockCueNotes)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<NoteStatus>('todo')
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogDefaultType, setDialogDefaultType] = useState<string>('Cue')
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  // Get unique types from all notes
  const availableTypes = Array.from(new Set(notes.map(note => note.type).filter(Boolean))) as string[]
  const typeOptions = availableTypes.map(type => ({ value: type, label: type }))

  const filteredNotes = notes.filter(note => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = note.title.toLowerCase().includes(searchLower) ||
                          note.description?.toLowerCase().includes(searchLower) ||
                          note.scriptPageId?.toLowerCase().includes(searchLower) ||
                          note.sceneSongId?.toLowerCase().includes(searchLower)
    const matchesStatus = note.status === filterStatus
    const matchesType = filterTypes.length === 0 || filterTypes.includes(note.type || '')
    return matchesSearch && matchesStatus && matchesType
  })

  const handleAddNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
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

  const updateNoteStatus = (noteId: string, status: NoteStatus) => {
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, status, updatedAt: new Date() } : note
    ))
  }


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bg-tertiary pb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <Lightbulb className="h-8 w-8 text-modules-cue" />
              Cue Notes
            </h1>
            <p className="mt-2 text-text-secondary">
              Manage lighting cues and effects for your production
            </p>
          </div>
          <Button
            onClick={() => openDialog()}
            variant="cue"
          >
            <Plus className="h-5 w-5" />
            Add Cue Note
          </Button>
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
              placeholder="Search cue notes..."
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
            <Button onClick={() => openDialog('Cue')} variant="priority_low" size="xs">
              <Plus className="h-3 w-3" />Cue
            </Button>
            <Button onClick={() => openDialog('Director')} variant="priority_high" size="xs">
              <Plus className="h-3 w-3" />Director
            </Button>
            <Button onClick={() => openDialog('Choreographer')} variant="priority_high" size="xs">
              <Plus className="h-3 w-3" />Choreographer
            </Button>
            <Button onClick={() => openDialog('Designer')} variant="todo" size="xs">
              <Plus className="h-3 w-3" />Designer
            </Button>
            <Button onClick={() => openDialog('Stage Manager')} variant="cue" size="xs">
              <Plus className="h-3 w-3" />Stage Manager
            </Button>
            <Button onClick={() => openDialog('Associate')} variant="priority_medium" size="xs">
              <Plus className="h-3 w-3" />Associate
            </Button>
            <Button onClick={() => openDialog('Assistant')} variant="priority_medium" size="xs">
              <Plus className="h-3 w-3" />Assistant
            </Button>
            <Button onClick={() => openDialog('Spot')} variant="priority_low" size="xs">
              <Plus className="h-3 w-3" />Spot
            </Button>
            <Button onClick={() => openDialog('Programmer')} variant="cue" size="xs">
              <Plus className="h-3 w-3" />Programmer
            </Button>
            <Button onClick={() => openDialog('Production')} variant="secondary" size="xs">
              <Plus className="h-3 w-3" />Production
            </Button>
            <Button onClick={() => openDialog('Paperwork')} variant="priority_low" size="xs">
              <Plus className="h-3 w-3" />Paperwork
            </Button>
            <Button onClick={() => openDialog('Think')} variant="cue" size="xs">
              <Plus className="h-3 w-3" />Think
            </Button>
          </div>
        )}

        {/* Notes Table */}
        <NotesTable 
          notes={filteredNotes}
          moduleType="cue"
          onStatusUpdate={updateNoteStatus}
          onEdit={handleEditNote}
        />

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">No cue notes found</p>
            <p className="text-text-muted text-sm mt-1">Try adjusting your filters or add a new note</p>
          </div>
        )}
      </div>

      <AddNoteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleAddNote}
        moduleType="cue"
        defaultType={dialogDefaultType}
        editingNote={editingNote}
      />
    </DashboardLayout>
  )
}