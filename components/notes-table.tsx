'use client'

import { useState } from 'react'
import { Check, X, Clock, Edit2, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note, NoteStatus, ModuleType } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCueLookup } from '@/lib/services/cue-lookup'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface NotesTableProps {
  notes: Note[]
  moduleType: ModuleType
  onStatusUpdate: (noteId: string, status: NoteStatus) => void
  onEdit?: (note: Note) => void
}

type SortField = 'title' | 'priority' | 'status' | 'type' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export function NotesTable({ notes, moduleType, onStatusUpdate, onEdit }: NotesTableProps) {
  const { lookupCue } = useCueLookup()
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const getStatusIcon = (status: NoteStatus) => {
    switch (status) {
      case 'complete': return <Check className="h-4 w-4" />
      case 'cancelled': return <X className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-priority-high'
      case 'medium': return 'text-priority-medium'  
      case 'low': return 'text-priority-low'
      default: return 'text-text-muted'
    }
  }

  const getModuleColor = (moduleType: ModuleType) => {
    switch (moduleType) {
      case 'cue': return 'modules-cue'
      case 'work': return 'modules-work'
      case 'production': return 'modules-production'
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedNotes = [...notes].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    if (sortField === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
      bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
    }

    if (sortField === 'createdAt') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const renderHeader = (label: string, field: SortField) => (
    <TableHead 
      className="cursor-pointer hover:text-foreground transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  )

  const getReference = (note: Note) => {
    if (moduleType === 'cue') {
      if (note.scriptPageId && note.scriptPageId.startsWith('cue-')) {
        return note.scriptPageId.split('cue-')[1]
      }
      if (note.scriptPageId) return `Pg. ${note.scriptPageId.split('-')[1]}`
      if (note.sceneSongId) return note.sceneSongId
    }
    if (moduleType === 'work' && note.lightwrightItemId) {
      return note.lightwrightItemId
    }
    return ''
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date))
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Actions</TableHead>
            {renderHeader('Priority', 'priority')}
            {renderHeader('Type', 'type')}
            {moduleType === 'cue' && (
              <TableHead>Cue #</TableHead>
            )}
            {moduleType === 'work' && (
              <>
                <TableHead>Channel #(s)</TableHead>
                <TableHead>Position/Unit</TableHead>
              </>
            )}
            {renderHeader('Note', 'title')}
            {moduleType === 'work' && (
              <TableHead>Scenery Needs</TableHead>
            )}
            {moduleType === 'cue' && (
              <TableHead>Script Page - Scene/Song</TableHead>
            )}
            <TableHead>Who Created</TableHead>
            {renderHeader('Created', 'createdAt')}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedNotes.map((note) => (
            <TableRow 
              key={note.id} 
              className={onEdit ? "cursor-pointer" : ""} 
              onClick={onEdit ? () => onEdit(note) : undefined}
            >
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="complete"
                    onClick={(e) => {
                      e.stopPropagation()
                      onStatusUpdate(note.id, note.status === 'complete' ? 'todo' : 'complete')
                    }}
                    title={note.status === 'complete' ? 'Mark as todo' : 'Mark as complete'}
                    className={cn("h-7 w-7", note.status !== 'complete' && "opacity-60 hover:opacity-100")}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="cancelled"
                    onClick={(e) => {
                      e.stopPropagation()
                      onStatusUpdate(note.id, note.status === 'cancelled' ? 'todo' : 'cancelled')
                    }}
                    title={note.status === 'cancelled' ? 'Reopen' : 'Cancel'}
                    className={cn("h-7 w-7", note.status !== 'cancelled' && "opacity-60 hover:opacity-100")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <span className={cn('text-sm font-medium', getPriorityColor(note.priority))}>
                  {note.priority === 'high' ? 'Critical' : note.priority === 'medium' ? 'Very High' : 'Medium'}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={moduleType as any}>
                  {note.type || moduleType}
                </Badge>
              </TableCell>
              {moduleType === 'cue' && (
                <TableCell className="text-sm">
                  {getReference(note) || '-'}
                </TableCell>
              )}
              {moduleType === 'work' && (
                <>
                  <TableCell className="text-sm">
                    {note.channelNumbers || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {note.positionUnit || '-'}
                  </TableCell>
                </>
              )}
              <TableCell className="max-w-md">
                <div className="font-medium">{note.title}</div>
              </TableCell>
              {moduleType === 'work' && (
                <TableCell className="text-sm text-muted-foreground">
                  {note.sceneryNeeds || '-'}
                </TableCell>
              )}
              {moduleType === 'cue' && (
                <TableCell className="text-sm text-muted-foreground">
                  {(() => {
                    // Extract cue number from scriptPageId if it exists
                    if (note.scriptPageId && note.scriptPageId.startsWith('cue-')) {
                      const cueNumber = note.scriptPageId.replace('cue-', '')
                      const lookup = lookupCue(cueNumber)
                      return lookup.display || '-'
                    }
                    
                    // Fallback for existing data format
                    const scriptPage = note.scriptPageId ? 
                      (note.scriptPageId.startsWith('page-') ? 
                        `Pg. ${note.scriptPageId.replace('page-', '')}` : 
                        note.scriptPageId.startsWith('cue-') ? 
                          note.scriptPageId.replace('cue-', '') : 
                          note.scriptPageId) : '';
                    const sceneSong = note.sceneSongId || '';
                    
                    if (scriptPage && sceneSong) {
                      return `${scriptPage} - ${sceneSong}`;
                    } else if (scriptPage) {
                      return scriptPage;
                    } else if (sceneSong) {
                      return sceneSong;
                    } else {
                      return '-';
                    }
                  })()}
                </TableCell>
              )}
              <TableCell className="text-sm text-muted-foreground">
                {note.createdBy || 'Nick Solyom'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(note.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {notes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No notes found
        </div>
      )}
    </div>
  )
}