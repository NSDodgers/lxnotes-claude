'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { Check, X, ArrowUpDown } from 'lucide-react'
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
import { useColumnLayoutStore } from '@/lib/stores/column-layout-store'
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

type SortField = 'description' | 'priority' | 'status' | 'type' | 'createdAt' | 'positionUnit' | 'scriptPageId' | 'channels'
type SortDirection = 'asc' | 'desc'

type ColumnId =
  | 'actions'
  | 'priority'
  | 'noteType'
  | 'cueReference'
  | 'workChannels'
  | 'workFixtureType'
  | 'workPurpose'
  | 'workPosition'
  | 'note'
  | 'workSceneryNeeds'
  | 'cueLocation'
  | 'createdBy'
  | 'createdAt'

interface ColumnDefinition {
  id: ColumnId
  label: string
  sortableField?: SortField
  resizable?: boolean
  minWidth: number
  maxWidth?: number
  defaultWidth?: number
  flex?: number
}

const getColumnDefinitions = (moduleType: ModuleType): ColumnDefinition[] => {
  const leadingColumns: ColumnDefinition[] = [
    {
      id: 'actions',
      label: 'Actions',
      resizable: false,
      minWidth: 96,
      defaultWidth: 112,
      maxWidth: 140,
    },
    {
      id: 'priority',
      label: 'Priority',
      sortableField: 'priority',
      resizable: true,
      minWidth: 80,
      defaultWidth: 140,
      maxWidth: 400,
    },
    {
      id: 'noteType',
      label: 'Type',
      sortableField: 'type',
      resizable: true,
      minWidth: 80,
      defaultWidth: 140,
      maxWidth: 400,
    },
  ]

  const moduleSpecificBeforeNote: ColumnDefinition[] = []

  if (moduleType === 'cue') {
    moduleSpecificBeforeNote.push({
      id: 'cueReference',
      label: 'Cue #',
      sortableField: 'scriptPageId',
      resizable: true,
      minWidth: 120,
      defaultWidth: 140,
      maxWidth: 240,
    })
  }

  if (moduleType === 'work') {
    moduleSpecificBeforeNote.push(
      {
        id: 'workChannels',
        label: 'Channels',
        sortableField: 'channels',
        resizable: true,
        minWidth: 140,
        defaultWidth: 160,
        maxWidth: 260,
      },
      {
        id: 'workFixtureType',
        label: 'Fixture Type',
        resizable: true,
        minWidth: 160,
        defaultWidth: 180,
        maxWidth: 280,
      },
      {
        id: 'workPurpose',
        label: 'Purpose',
        resizable: true,
        minWidth: 160,
        defaultWidth: 180,
        maxWidth: 280,
      },
      {
        id: 'workPosition',
        label: 'Position',
        sortableField: 'positionUnit',
        resizable: true,
        minWidth: 160,
        defaultWidth: 180,
        maxWidth: 280,
      }
    )
  }

  const coreNoteColumn: ColumnDefinition = {
    id: 'note',
    label: 'Note',
    resizable: true,
    minWidth: 200,
    maxWidth: 800,
    flex: 2,
  }

  const moduleSpecificAfterNote: ColumnDefinition[] = []

  if (moduleType === 'work') {
    moduleSpecificAfterNote.push({
      id: 'workSceneryNeeds',
      label: 'Scenery Needs',
      resizable: true,
      minWidth: 180,
      defaultWidth: 200,
      maxWidth: 320,
    })
  }

  if (moduleType === 'cue') {
    moduleSpecificAfterNote.push({
      id: 'cueLocation',
      label: 'Script Page - Scene/Song',
      resizable: true,
      minWidth: 220,
      defaultWidth: 260,
      maxWidth: 360,
    })
  }

  const trailingColumns: ColumnDefinition[] = [
    {
      id: 'createdBy',
      label: 'Who Created',
      resizable: true,
      minWidth: 160,
      defaultWidth: 180,
      maxWidth: 260,
    },
    {
      id: 'createdAt',
      label: 'Created',
      sortableField: 'createdAt',
      resizable: true,
      minWidth: 180,
      defaultWidth: 200,
      maxWidth: 280,
    },
  ]

  return [
    ...leadingColumns,
    ...moduleSpecificBeforeNote,
    coreNoteColumn,
    ...moduleSpecificAfterNote,
    ...trailingColumns,
  ]
}

interface SizedColumn {
  definition: ColumnDefinition
  persistedWidth: number | null
}

interface LayoutColumn extends SizedColumn {
  effectiveWidth: number
}

interface LayoutComputationResult {
  columns: LayoutColumn[]
  totalWidth: number
}

const clampWidthValue = (value: number, min: number, max: number) => {
  return Math.round(Math.min(Math.max(value, min), max))
}

const computeColumnLayout = (
  sizedColumns: SizedColumn[],
  widthState: Record<ColumnId, number | null>
): LayoutComputationResult => {
  if (sizedColumns.length === 0) {
    return { columns: [], totalWidth: 0 }
  }

  // Simple approach: use provided widths directly, no flex distribution
  const layoutColumns: LayoutColumn[] = sizedColumns.map(({ definition, persistedWidth }) => {
    const minWidth = definition.minWidth
    const maxWidth = definition.maxWidth ?? Number.POSITIVE_INFINITY

    // Use state width, or persisted, or default, or min
    const preferred = widthState[definition.id] ?? persistedWidth ?? definition.defaultWidth ?? minWidth
    const effectiveWidth = clampWidthValue(preferred, minWidth, maxWidth)

    return {
      definition,
      persistedWidth,
      effectiveWidth,
    }
  })

  const totalWidth = layoutColumns.reduce((sum, col) => sum + col.effectiveWidth, 0)

  return {
    columns: layoutColumns,
    totalWidth,
  }
}

const useColumnLayout = (
  moduleType: ModuleType,
  columns: ColumnDefinition[]
) => {
  const layout = useColumnLayoutStore((state) => {
    const profileLayouts = state.layouts[state.profileKey]
    return profileLayouts ? profileLayouts[moduleType] : undefined
  })
  const setColumnWidth = useColumnLayoutStore((state) => state.setColumnWidth)
  const resetModuleLayout = useColumnLayoutStore((state) => state.resetModuleLayout)

  const sizedColumns = useMemo<SizedColumn[]>(() => (
    columns.map((column) => ({
      definition: column,
      persistedWidth: layout?.widths?.[column.id] ?? null,
    }))
  ), [columns, layout])

  const persistColumnWidth = useCallback((columnId: string, width: number) => {
    setColumnWidth(moduleType, columnId, width)
  }, [moduleType, setColumnWidth])

  const resetColumns = useCallback(() => {
    resetModuleLayout(moduleType)
  }, [moduleType, resetModuleLayout])

  return {
    sizedColumns,
    persistColumnWidth,
    resetColumns,
    layoutVersion: layout?.version ?? 0,
  }
}

export function NotesTable({ notes, moduleType, onStatusUpdate, onEdit }: NotesTableProps) {
  const { lookupCue } = useCueLookup()
  const { getPriorities } = useCustomPrioritiesStore()
  const { getTypes } = useCustomTypesStore()
  const { getAggregate } = useFixtureStore()
  const { getOrderedPositions } = usePositionStore()
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const columnDefinitions = useMemo(() => getColumnDefinitions(moduleType), [moduleType])
  const { sizedColumns, persistColumnWidth, layoutVersion } = useColumnLayout(moduleType, columnDefinitions)

  // Initialize with default widths from column definitions, merged with persisted widths
  const [columnWidths, setColumnWidths] = useState<Record<ColumnId, number | null>>(() => {
    const initial: Record<ColumnId, number | null> = {} as Record<ColumnId, number | null>

    sizedColumns.forEach(({ definition, persistedWidth }) => {
      // Use persisted width if available, otherwise use default or min
      initial[definition.id] = persistedWidth ?? definition.defaultWidth ?? definition.minWidth
    })

    return initial
  })

  const [isResizing, setIsResizing] = useState(false)
  const tableContainerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)

  // Sync persisted widths from store (after hydration)
  useEffect(() => {
    // Don't sync during active resize to prevent jumping
    if (isResizing) {
      return
    }

    setColumnWidths((previous) => {
      let hasChanges = false
      const next: Record<ColumnId, number | null> = { ...previous }

      // Update columns that have persisted widths that differ from current
      sizedColumns.forEach(({ definition, persistedWidth }) => {
        if (persistedWidth != null && persistedWidth !== next[definition.id]) {
          next[definition.id] = persistedWidth
          hasChanges = true
        }
      })

      return hasChanges ? next : previous
    })
  }, [sizedColumns, isResizing, layoutVersion])

  const updateColumnWidth = useCallback(
    (columnId: ColumnId, width: number, options: { persist?: boolean } = {}) => {
      setColumnWidths((prev) => ({
        ...prev,
        [columnId]: width,
      }))

      if (options.persist) {
        persistColumnWidth(columnId, width)
      }
    },
    [persistColumnWidth]
  )

  const handleResizeStart = useCallback(() => {
    setIsResizing(true)
  }, [])

  const handleResizeMove = useCallback((columnId: ColumnId, width: number) => {
    updateColumnWidth(columnId, width, { persist: false })
  }, [updateColumnWidth])

  const handleResizeEnd = useCallback((columnId: ColumnId, width: number) => {
    updateColumnWidth(columnId, width, { persist: true })
    setIsResizing(false)
  }, [updateColumnWidth])

  const layoutResult = useMemo(() => (
    computeColumnLayout(sizedColumns, columnWidths)
  ), [sizedColumns, columnWidths])

  useEffect(() => {
    if (!tableContainerRef.current || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return
      const width = Math.round(entries[0].contentRect.width)
      setContainerWidth(width)
    })

    observer.observe(tableContainerRef.current)

    return () => observer.disconnect()
  }, [])

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

  const getPriority = (priorityValue: string) => {
    return availablePriorities.find(p => p.value === priorityValue)
  }
  
  const getType = (typeValue: string) => {
    return availableTypes.find(t => t.value === typeValue)
  }

  const buildCueLocationDisplay = (note: Note): string => {
    const formatLookup = (cueNumber: string) => {
      const lookup = lookupCue(cueNumber)
      return lookup.display || '-'
    }

    if (note.cueNumber) {
      return formatLookup(note.cueNumber)
    }

    if (note.scriptPageId) {
      if (note.scriptPageId.startsWith('cue-')) {
        return formatLookup(note.scriptPageId.replace('cue-', ''))
      }

      if (note.scriptPageId.startsWith('page-')) {
        const pageLabel = `Pg. ${note.scriptPageId.replace('page-', '')}`
        return note.sceneSongId ? `${pageLabel} – ${note.sceneSongId}` : pageLabel
      }

      return note.sceneSongId ? `${note.scriptPageId} – ${note.sceneSongId}` : note.scriptPageId
    }

    if (note.sceneSongId) {
      return note.sceneSongId
    }

    return '-'
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
    const getSortValue = (note: Note, field: SortField): number | string => {
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

        case 'description':
          return (note.description || '').toLowerCase()

        case 'status':
          return note.status

        default:
          const exhaustiveCheck: never = field
          return exhaustiveCheck
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
    if (typeof aPrimary === 'string' && typeof bPrimary === 'string') {
      primaryComparison = aPrimary.localeCompare(bPrimary)
    } else {
      primaryComparison = (aPrimary as number) - (bPrimary as number)
    }

    // If primary values are equal, use secondary sort
    if (primaryComparison === 0) {
      const secondaryField = getSecondarySort(sortField)
      if (secondaryField) {
        const aSecondary = getSortValue(a, secondaryField)
        const bSecondary = getSortValue(b, secondaryField)

        if (typeof aSecondary === 'string' && typeof bSecondary === 'string') {
          primaryComparison = aSecondary.localeCompare(bSecondary)
        } else {
          primaryComparison = (aSecondary as number) - (bSecondary as number)
        }
      }
    }

    // Apply sort direction
    return sortDirection === 'desc' ? -primaryComparison : primaryComparison
  })

  const renderHeaderCell = (column: ColumnDefinition, width: number | null) => (
    <ResizableHeaderCell
      key={column.id}
      column={column}
      width={width}
      isSorted={column.sortableField === sortField}
      sortDirection={sortDirection}
      onSort={column.sortableField ? () => handleSort(column.sortableField!) : undefined}
      onResizeStart={handleResizeStart}
      onResize={(width) => handleResizeMove(column.id, width)}
      onResizeEnd={(width) => handleResizeEnd(column.id, width)}
    />
  )

  const renderCellContent = (
    columnId: ColumnId,
    note: Note,
    options?: { workAggregate?: ReturnType<typeof getAggregate> }
  ) => {
    const workAggregate = options?.workAggregate

    switch (columnId) {
      case 'actions':
        return (
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
                  ? "bg-status-complete/20 border-status-complete text-status-complete shadow-xs"
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
                  ? "bg-status-cancelled/20 border-status-cancelled text-status-cancelled shadow-xs"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )

      case 'priority':
        return (
          <span
            className="text-sm font-medium"
            style={{ color: getPriority(note.priority)?.color || '#6B7280' }}
          >
            {getPriority(note.priority)?.label || note.priority}
          </span>
        )

      case 'noteType':
        return (
          <Badge
            style={{ backgroundColor: getType(note.type || '')?.color || '#6B7280' }}
            className="text-white"
          >
            {getType(note.type || '')?.label || note.type || moduleType}
          </Badge>
        )

      case 'cueReference':
        return (
          <span className="text-sm">
            {getReference(note) || '-'}
          </span>
        )

      case 'workChannels': {
        return (
          <FixtureAggregateDisplay
            aggregate={workAggregate ?? null}
            field="channels"
            className="text-sm"
          />
        )
      }

      case 'workFixtureType': {
        return (
          <FixtureAggregateDisplay
            aggregate={workAggregate ?? null}
            field="fixtureTypes"
            className="text-sm"
            maxItems={2}
          />
        )
      }

      case 'workPurpose': {
        return (
          <FixtureAggregateDisplay
            aggregate={workAggregate ?? null}
            field="purposes"
            className="text-sm"
            maxItems={2}
          />
        )
      }

      case 'workPosition': {
        return (
          <FixtureAggregateDisplay
            aggregate={workAggregate ?? null}
            field="positions"
            className="text-sm"
            maxItems={2}
          />
        )
      }

      case 'note':
        return (
          <div
            className="font-medium whitespace-pre-wrap wrap-break-word"
            data-testid="note-description-cell"
          >
            {note.description}
          </div>
        )

      case 'workSceneryNeeds':
        return (
          <span className="text-sm text-muted-foreground whitespace-pre-wrap wrap-break-word">
            {note.sceneryNeeds || '-'}
          </span>
        )

      case 'cueLocation':
        return (
          <span className="text-sm text-muted-foreground whitespace-pre-wrap wrap-break-word">
            {buildCueLocationDisplay(note)}
          </span>
        )

      case 'createdBy':
        return (
          <span className="text-sm text-muted-foreground">
            {note.createdBy || ''}
          </span>
        )

      case 'createdAt':
        return (
          <span className="text-sm text-muted-foreground">
            {formatDate(note.createdAt)}
          </span>
        )
    }

    return null
  }

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
      <div
        ref={tableContainerRef}
        className={cn(
          "max-h-[70vh] overflow-y-auto overflow-x-auto",
          isResizing && "select-none"
        )}
      >
        <Table
          style={containerWidth ? { width: `${layoutResult.totalWidth}px` } : undefined}
          className=""
        >
          <TableHeader className="sticky top-0 z-20 bg-bg-primary shadow-md border-b-2">
            <TableRow>
              {layoutResult.columns.map(({ definition, effectiveWidth }) => (
                renderHeaderCell(definition, effectiveWidth)
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedNotes.map((note) => {
              const workAggregate = moduleType === 'work' ? getAggregate(note.id) : undefined

              return (
                <TableRow
                  key={note.id}
                  className={onEdit ? "cursor-pointer" : ""}
                  onClick={onEdit ? () => onEdit(note) : undefined}
                >
                  {layoutResult.columns.map(({ definition, effectiveWidth }) => (
                    <TableCell
                      key={definition.id}
                      style={{
                        width: `${effectiveWidth}px`,
                        minWidth: `${definition.minWidth}px`,
                        maxWidth: definition.maxWidth ? `${definition.maxWidth}px` : undefined,
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                      }}
                    >
                      {renderCellContent(definition.id, note, { workAggregate })}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
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

interface ResizableHeaderCellProps {
  column: ColumnDefinition
  width: number | null
  isSorted: boolean
  sortDirection: SortDirection
  onSort?: () => void
  onResizeStart?: () => void
  onResize: (width: number) => void
  onResizeEnd: (width: number) => void
}

const RESIZE_STEP = 10

function ResizableHeaderCell({
  column,
  width,
  isSorted,
  sortDirection,
  onSort,
  onResizeStart,
  onResize,
  onResizeEnd,
}: ResizableHeaderCellProps) {
  const handleRef = useRef<HTMLSpanElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const latestWidthRef = useRef<number>(width ?? column.defaultWidth ?? column.minWidth)
  const pointerIdRef = useRef<number | null>(null)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    latestWidthRef.current = width ?? column.defaultWidth ?? column.minWidth
  }, [width, column.defaultWidth, column.minWidth])

  const clampWidth = useCallback((value: number) => {
    const min = column.minWidth
    const max = column.maxWidth ?? Number.POSITIVE_INFINITY
    const clamped = Math.min(Math.max(value, min), max)
    return Math.round(clamped)
  }, [column.maxWidth, column.minWidth])

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const startX = Number(handleRef.current?.dataset.startX ?? event.clientX)
    const startWidth = Number(handleRef.current?.dataset.startWidth ?? latestWidthRef.current)
    const deltaX = event.clientX - startX
    const nextWidth = clampWidth(startWidth + deltaX)

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }

    frameRef.current = requestAnimationFrame(() => {
      onResize(nextWidth)
      latestWidthRef.current = nextWidth
    })
  }, [onResize, clampWidth])

  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (pointerIdRef.current !== null && handleRef.current) {
      try {
        handleRef.current.releasePointerCapture(pointerIdRef.current)
      } catch {
        // Safari may throw if pointer capture not set; ignore
      }
    }
    pointerIdRef.current = null
    setIsResizing(false)
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)

    const startX = Number(handleRef.current?.dataset.startX ?? event.clientX)
    const startWidth = Number(handleRef.current?.dataset.startWidth ?? latestWidthRef.current)
    const finalWidth = clampWidth(startWidth + (event.clientX - startX))

    onResizeEnd(finalWidth)

    if (handleRef.current) {
      delete handleRef.current.dataset.startX
      delete handleRef.current.dataset.startWidth
    }
  }, [clampWidth, handlePointerMove, onResizeEnd])

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) return

    event.stopPropagation()
    event.preventDefault()

    const handle = event.currentTarget
    const currentWidth = latestWidthRef.current

    onResizeStart?.()

    pointerIdRef.current = event.pointerId
    handle.setPointerCapture(event.pointerId)
    handle.dataset.startX = String(event.clientX)
    handle.dataset.startWidth = String(currentWidth)
    setIsResizing(true)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }, [handlePointerMove, handlePointerUp, onResizeStart])

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

    event.preventDefault()
    const delta = event.key === 'ArrowLeft' ? -RESIZE_STEP : RESIZE_STEP
    const baseWidth = latestWidthRef.current
    const nextWidth = clampWidth(baseWidth + delta)
    latestWidthRef.current = nextWidth
    onResizeEnd(nextWidth)
  }, [clampWidth, onResizeEnd])

  const sortIndicator = column.sortableField ? (
    <ArrowUpDown
      className={cn(
        'h-3 w-3 transition-transform',
        isSorted && sortDirection === 'desc' ? 'rotate-180' : '',
        isSorted ? 'text-foreground' : 'text-muted-foreground'
      )}
    />
  ) : null

  const minWidth = column.minWidth
  const maxWidth = column.maxWidth
  const resolvedWidth = width ?? undefined

  const content = (
    <div className="flex items-center gap-1">
      {column.label}
      {sortIndicator}
    </div>
  )

  const onClick = column.sortableField ? onSort : undefined

  return (
    <TableHead
      className={cn(
        'bg-bg-primary relative',
        column.sortableField ? 'cursor-pointer select-none hover:text-foreground transition-colors' : ''
      )}
      style={{
        minWidth: `${minWidth}px`,
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        width: resolvedWidth != null ? `${resolvedWidth}px` : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1" onClick={onClick}>
          {content}
        </div>
        {column.resizable === false ? null : (
          <span
            ref={handleRef}
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-valuemin={minWidth}
            aria-valuemax={maxWidth ?? undefined}
            aria-valuenow={resolvedWidth ?? latestWidthRef.current}
            aria-label={`Resize ${column.label} column`}
            className={cn(
              "group/handle absolute -right-3 top-0 bottom-0 w-8 cursor-col-resize select-none flex items-center justify-center transition-colors",
              isResizing ? "bg-primary/20" : "hover:bg-accent/20 bg-blue-500/80"
            )}
            style={{ zIndex: 9999 }}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className={cn(
              "absolute inset-y-1 w-[2px] rounded transition-all",
              isResizing
                ? "bg-primary opacity-100"
                : "bg-border opacity-80 group-hover/handle:opacity-100 group-focus-visible/handle:opacity-100 group-hover/handle:bg-primary"
            )} />
            {isResizing && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md z-50 pointer-events-none">
                {Math.round(latestWidthRef.current)}px
              </div>
            )}
          </span>
        )}
      </div>
    </TableHead>
  )
}
