'use client'

import { SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useNotesFilterStore } from '@/lib/stores/notes-filter-store'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import type { ModuleType } from '@/types'

const SORT_OPTIONS: Record<string, { field: string; label: string }[]> = {
  cue: [
    { field: 'cue_number', label: 'Cue #' },
    { field: 'priority', label: 'Priority' },
    { field: 'type', label: 'Type' },
    { field: 'created_at', label: 'Date' },
  ],
  work: [
    { field: 'priority', label: 'Priority' },
    { field: 'position', label: 'Position' },
    { field: 'channel', label: 'Channel' },
    { field: 'type', label: 'Type' },
    { field: 'created_at', label: 'Date' },
  ],
  production: [
    { field: 'priority', label: 'Priority' },
    { field: 'type', label: 'Type' },
    { field: 'created_at', label: 'Date' },
  ],
}

interface TabletFilterPopoverProps {
  moduleType: ModuleType
}

export function TabletFilterPopover({ moduleType }: TabletFilterPopoverProps) {
  const filterTypes = useNotesFilterStore((s) => s.filterTypes)
  const filterPriorities = useNotesFilterStore((s) => s.filterPriorities)
  const sortField = useNotesFilterStore((s) => s.sortField)
  const sortDirection = useNotesFilterStore((s) => s.sortDirection)
  const setFilterTypes = useNotesFilterStore((s) => s.setFilterTypes)
  const setFilterPriorities = useNotesFilterStore((s) => s.setFilterPriorities)
  const setSortField = useNotesFilterStore((s) => s.setSortField)
  const setSortDirection = useNotesFilterStore((s) => s.setSortDirection)
  const clearAllFilters = useNotesFilterStore((s) => s.clearAllFilters)

  const availableTypes = useCustomTypesStore((s) => s.getTypes)(moduleType)
  const availablePriorities = useCustomPrioritiesStore((s) => s.getPriorities)(moduleType)

  const sortOptions = SORT_OPTIONS[moduleType] || SORT_OPTIONS.production
  const hasActiveFilters = filterTypes.length > 0 || filterPriorities.length > 0 || sortField !== null

  const toggleType = (value: string) => {
    if (filterTypes.includes(value)) {
      setFilterTypes(filterTypes.filter((t) => t !== value))
    } else {
      setFilterTypes([...filterTypes, value])
    }
  }

  const togglePriority = (value: string) => {
    if (filterPriorities.includes(value)) {
      setFilterPriorities(filterPriorities.filter((p) => p !== value))
    } else {
      setFilterPriorities([...filterPriorities, value])
    }
  }

  const handleSortField = (field: string) => {
    if (sortField === field) {
      setSortField(null)
    } else {
      setSortField(field)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="touch-target relative flex items-center justify-center rounded-lg hover:bg-bg-tertiary"
          aria-label="Filter and sort"
          data-testid="tablet-filter-sort-button"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {hasActiveFilters && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="p-3 space-y-4">
          {/* Sort By */}
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Sort By</h4>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {sortOptions.map((opt) => (
                <button
                  key={opt.field}
                  onClick={() => handleSortField(opt.field)}
                  className={cn(
                    'h-9 px-3 rounded-full text-xs font-medium transition-colors',
                    sortField === opt.field
                      ? 'bg-blue-600 text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                  )}
                  data-testid={`tablet-sort-${opt.field}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setSortDirection('asc')}
                className={cn(
                  'h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1 transition-colors',
                  sortDirection === 'asc'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                )}
                data-testid="tablet-sort-asc"
              >
                <ArrowUp className="h-3 w-3" /> Ascending
              </button>
              <button
                onClick={() => setSortDirection('desc')}
                className={cn(
                  'h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1 transition-colors',
                  sortDirection === 'desc'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                )}
                data-testid="tablet-sort-desc"
              >
                <ArrowDown className="h-3 w-3" /> Descending
              </button>
            </div>
          </div>

          {/* Type filter */}
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Type</h4>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterTypes([])}
                className={cn(
                  'h-8 px-3 rounded-full text-xs font-medium transition-colors',
                  filterTypes.length === 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                )}
              >
                All
              </button>
              {availableTypes.filter(t => !t.isHidden).map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.value)}
                  className={cn(
                    'h-8 px-3 rounded-full text-xs font-medium transition-colors border',
                    filterTypes.includes(type.value)
                      ? 'text-white'
                      : 'text-text-secondary hover:opacity-80'
                  )}
                  style={
                    filterTypes.includes(type.value)
                      ? { backgroundColor: type.color, borderColor: type.color }
                      : { borderColor: type.color, backgroundColor: 'transparent' }
                  }
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority filter */}
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Priority</h4>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterPriorities([])}
                className={cn(
                  'h-8 px-3 rounded-full text-xs font-medium transition-colors',
                  filterPriorities.length === 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                )}
              >
                All
              </button>
              {availablePriorities.filter(p => !p.isHidden).map((priority) => (
                <button
                  key={priority.id}
                  onClick={() => togglePriority(priority.value)}
                  className={cn(
                    'h-8 px-3 rounded-full text-xs font-medium transition-colors border',
                    filterPriorities.includes(priority.value)
                      ? 'text-white'
                      : 'text-text-secondary hover:opacity-80'
                  )}
                  style={
                    filterPriorities.includes(priority.value)
                      ? { backgroundColor: priority.color, borderColor: priority.color }
                      : { borderColor: priority.color, backgroundColor: 'transparent' }
                  }
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear all */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="w-full text-xs text-text-secondary"
              data-testid="tablet-clear-all-filters"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
