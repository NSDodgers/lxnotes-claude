'use client'

import { useState } from 'react'
import { Check, X, Clock, Edit2, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note, NoteStatus, ModuleType } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCueLookup } from '@/lib/services/cue-lookup'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { usePositionStore } from '@/lib/stores/position-store'
import { FixtureAggregateDisplay } from '@/components/fixture-aggregate-display'
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

type SortField = 'title' | 'priority' | 'status' | 'type' | 'createdAt' | 'positionUnit' | 'scriptPageId' | 'channels'
type SortDirection = 'asc' | 'desc'

export function NotesTable({ notes, moduleType, onStatusUpdate, onEdit }: NotesTableProps) {
  const { lookupCue } = useCueLookup()
  const { getPriorities } = useCustomPrioritiesStore()
  const { getTypes } = useCustomTypesStore()
  const { getAggregate } = useFixtureStore()
  const { getOrderedPositions } = usePositionStore()
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Get production ID from first note (assuming all notes are from the same production)
  const productionId = notes.length > 0 ? notes[0].productionId : 'prod-1'
  const orderedPositions = getOrderedPositions(productionId)
  
  // Get custom priorities and types for this module
  const availablePriorities = getPriorities(moduleType)
  const availableTypes = getTypes(moduleType)

  // Helper function to extract position from positionUnit field
  const extractPositionFromUnit = (positionUnit: string): string => {
    // positionUnit format is typically "Position Units X-Y" or "Position Unit X"
    // We want to extract just the "Position" part
    if (!positionUnit) return ''

    // Split by "Unit" and take the first part, then trim
    const parts = positionUnit.split(/\s+Unit/i)
    return parts[0]?.trim() || positionUnit
  }

  // Helper function to extract lowest channel number from channel expressions
  const extractLowestChannelNumber = (channelExpression: string): number => {
    if (!channelExpression) return 0

    // Handle expressions like "1-5, 21, 45" or "1, 3-7, 12"
    const channels: number[] = []

    // Split by commas and process each part
    const parts = channelExpression.split(',')

    for (const part of parts) {
      const trimmed = part.trim()

      // Check if it's a range (e.g., "1-5")
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(s => parseInt(s.trim(), 10))
        if (!isNaN(start)) channels.push(start)
        if (!isNaN(end)) channels.push(end)
      } else {
        // Single number
        const num = parseInt(trimmed, 10)
        if (!isNaN(num)) channels.push(num)
      }
    }

    // Return the lowest channel number, or 0 if none found
    return channels.length > 0 ? Math.min(...channels) : 0
  }

  const getStatusIcon = (status: NoteStatus) => {
    switch (status) {
      case 'complete': return <Check className="h-4 w-4" />
      case 'cancelled': return <X className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getPriority = (priorityValue: string) => {
    return availablePriorities.find(p => p.value === priorityValue)
  }
  
  const getType = (typeValue: string) => {
    return availableTypes.find(t => t.value === typeValue)
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
    // Helper function to get sort value for a given field and note
    const getSortValue = (note: Note, field: SortField): any => {
      switch (field) {
        case 'priority':
          const priority = availablePriorities.find(p => p.value === note.priority)
          return priority ? priority.sortOrder : 999

        case 'positionUnit':
          const position = moduleType === 'work' ? extractPositionFromUnit(note.positionUnit || '') : ''
          if (orderedPositions.length > 0) {
            const index = orderedPositions.indexOf(position)
            return index === -1 ? 9999 : index
          }
          return position.toLowerCase()

        case 'createdAt':
          return new Date(note.createdAt).getTime()

        case 'scriptPageId':
          // For cue notes, sort by cueNumber if available
          if (moduleType === 'cue' && note.cueNumber) {
            const cueNum = parseInt(note.cueNumber, 10)
            return isNaN(cueNum) ? 0 : cueNum
          }
          // Fallback for legacy data
          const match = note.scriptPageId?.match(/(\d+)/)
          return match ? parseInt(match[1], 10) : 0

        case 'channels':
          // Get channel from fixture aggregate for work notes
          const aggregate = moduleType === 'work' ? getAggregate(note.id) : null
          return aggregate ? extractLowestChannelNumber(aggregate.channels) : 0

        case 'type':
          return (note.type || '').toLowerCase()

        case 'title':
          return note.title.toLowerCase()

        case 'status':
          return note.status

        default:
          return (note as any)[field] || ''
      }
    }

    // Determine secondary sort field based on module and primary sort
    const getSecondarySort = (primaryField: SortField): SortField | null => {
      if (moduleType === 'cue') {
        if (primaryField === 'priority' || primaryField === 'type') {
          return 'scriptPageId' // Cue number
        }
      } else if (moduleType === 'work') {
        if (primaryField === 'priority' || primaryField === 'type' || primaryField === 'positionUnit') {
          return 'channels'
        }
      }
      return null
    }

    // Get primary sort values
    const aPrimary = getSortValue(a, sortField)
    const bPrimary = getSortValue(b, sortField)

    // Compare primary values
    let primaryComparison = 0
    if (typeof aPrimary === 'string') {
      primaryComparison = aPrimary.localeCompare(bPrimary)
    } else {
      primaryComparison = aPrimary - bPrimary
    }

    // If primary values are equal, use secondary sort
    if (primaryComparison === 0) {
      const secondaryField = getSecondarySort(sortField)
      if (secondaryField) {
        const aSecondary = getSortValue(a, secondaryField)
        const bSecondary = getSortValue(b, secondaryField)

        if (typeof aSecondary === 'string') {
          primaryComparison = aSecondary.localeCompare(bSecondary)
        } else {
          primaryComparison = aSecondary - bSecondary
        }
      }
    }

    // Apply sort direction
    return sortDirection === 'desc' ? -primaryComparison : primaryComparison
  })

  const renderHeader = (label: string, field: SortField) => (
    <TableHead 
      className="cursor-pointer hover:text-foreground transition-colors bg-bg-primary"
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
      // Use cueNumber field directly for cue notes
      if (note.cueNumber) {
        return note.cueNumber
      }
      // Fallback for legacy data
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
      <div className="max-h-[70vh] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-bg-primary shadow-md border-b-2">
            <TableRow>
            <TableHead className="w-20 bg-bg-primary">Actions</TableHead>
            {renderHeader('Priority', 'priority')}
            {renderHeader('Type', 'type')}
            {moduleType === 'cue' && (
              renderHeader('Cue #', 'scriptPageId')
            )}
            {moduleType === 'work' && (
              <>
                {renderHeader('Channels', 'channels')}
                <TableHead className="bg-bg-primary">Type</TableHead>
                <TableHead className="bg-bg-primary">Purpose</TableHead>
                {renderHeader('Position', 'positionUnit')}
              </>
            )}
            <TableHead className="bg-bg-primary">Note</TableHead>
            {moduleType === 'work' && (
              <TableHead className="bg-bg-primary">Scenery Needs</TableHead>
            )}
            {moduleType === 'cue' && (
              <TableHead className="bg-bg-primary">Script Page - Scene/Song</TableHead>
            )}
            <TableHead className="bg-bg-primary">Who Created</TableHead>
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
                    className={cn(
                      "h-7 w-7",
                      note.status === 'complete'
                        ? "bg-status-complete/20 border-status-complete text-status-complete shadow-sm"
                        : "opacity-60 hover:opacity-100"
                    )}
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
                    className={cn(
                      "h-7 w-7",
                      note.status === 'cancelled'
                        ? "bg-status-cancelled/20 border-status-cancelled text-status-cancelled shadow-sm"
                        : "opacity-60 hover:opacity-100"
                    )}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <span 
                  className="text-sm font-medium"
                  style={{ color: getPriority(note.priority)?.color || '#6B7280' }}
                >
                  {getPriority(note.priority)?.label || note.priority}
                </span>
              </TableCell>
              <TableCell>
                <Badge 
                  style={{ backgroundColor: getType(note.type || '')?.color || '#6B7280' }}
                  className="text-white"
                >
                  {getType(note.type || '')?.label || note.type || moduleType}
                </Badge>
              </TableCell>
              {moduleType === 'cue' && (
                <TableCell className="text-sm">
                  {getReference(note) || '-'}
                </TableCell>
              )}
              {moduleType === 'work' && (() => {
                const aggregate = getAggregate(note.id)
                return (
                  <>
                    <TableCell className="text-sm">
                      <FixtureAggregateDisplay 
                        aggregate={aggregate} 
                        field="channels"
                        className="text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      <FixtureAggregateDisplay 
                        aggregate={aggregate} 
                        field="fixtureTypes"
                        className="text-sm"
                        maxItems={2}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      <FixtureAggregateDisplay 
                        aggregate={aggregate} 
                        field="purposes"
                        className="text-sm"
                        maxItems={2}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      <FixtureAggregateDisplay 
                        aggregate={aggregate} 
                        field="positions"
                        className="text-sm"
                        maxItems={2}
                      />
                    </TableCell>
                  </>
                )
              })()}
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
                    // Use cueNumber field for script lookups
                    if (note.cueNumber) {
                      const lookup = lookupCue(note.cueNumber)
                      return lookup.display || '-'
                    }

                    // Extract cue number from scriptPageId if it exists (legacy data)
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
      </div>
      {notes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No notes found
        </div>
      )}
    </div>
  )
}