'use client'

import { X } from 'lucide-react'
import { useNotesFilterStore } from '@/lib/stores/notes-filter-store'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import type { ModuleType } from '@/types'

const SORT_LABELS: Record<string, string> = {
  cue_number: 'Cue #',
  priority: 'Priority',
  type: 'Type',
  created_at: 'Date',
  position: 'Position',
  channel: 'Channel',
}

interface TabletFilterChipsProps {
  moduleType: ModuleType
}

export function TabletFilterChips({ moduleType }: TabletFilterChipsProps) {
  const filterTypes = useNotesFilterStore((s) => s.filterTypes)
  const filterPriorities = useNotesFilterStore((s) => s.filterPriorities)
  const sortField = useNotesFilterStore((s) => s.sortField)
  const sortDirection = useNotesFilterStore((s) => s.sortDirection)
  const setFilterTypes = useNotesFilterStore((s) => s.setFilterTypes)
  const setFilterPriorities = useNotesFilterStore((s) => s.setFilterPriorities)
  const setSortField = useNotesFilterStore((s) => s.setSortField)
  const clearAllFilters = useNotesFilterStore((s) => s.clearAllFilters)

  const availableTypes = useCustomTypesStore((s) => s.getTypes)(moduleType)
  const availablePriorities = useCustomPrioritiesStore((s) => s.getPriorities)(moduleType)

  const hasActiveFilters = filterTypes.length > 0 || filterPriorities.length > 0 || sortField !== null

  if (!hasActiveFilters) return null

  const typeLabels = filterTypes
    .map((v) => availableTypes.find((t) => t.value === v)?.label)
    .filter(Boolean)
    .join(', ')

  const priorityLabels = filterPriorities
    .map((v) => availablePriorities.find((p) => p.value === v)?.label)
    .filter(Boolean)
    .join(', ')

  return (
    <div
      className="h-9 flex-none flex items-center gap-1.5 px-3 overflow-x-auto"
      data-testid="tablet-filter-chips"
    >
      {sortField && (
        <Chip
          label={`Sort: ${SORT_LABELS[sortField] || sortField} ${sortDirection === 'desc' ? '\u2193' : '\u2191'}`}
          onDismiss={() => setSortField(null)}
        />
      )}
      {filterTypes.length > 0 && (
        <Chip
          label={`Type: ${typeLabels}`}
          onDismiss={() => setFilterTypes([])}
        />
      )}
      {filterPriorities.length > 0 && (
        <Chip
          label={`Priority: ${priorityLabels}`}
          onDismiss={() => setFilterPriorities([])}
        />
      )}
      <button
        onClick={clearAllFilters}
        className="text-xs text-text-secondary hover:text-text-primary whitespace-nowrap ml-1"
        data-testid="tablet-chips-clear-all"
      >
        Clear all
      </button>
    </div>
  )
}

function Chip({ label, onDismiss }: { label: string; onDismiss: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-border bg-bg-secondary text-xs text-text-primary whitespace-nowrap">
      {label}
      <button
        onClick={onDismiss}
        className="ml-0.5 hover:text-text-primary text-text-secondary"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
