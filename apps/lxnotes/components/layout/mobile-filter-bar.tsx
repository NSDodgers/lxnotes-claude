'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TabletFilterPopover } from './tablet-filter-popover'
import { useNotesFilterStore } from '@/lib/stores/notes-filter-store'
import type { NoteStatus, ModuleType } from '@/types'
import { usePathname } from 'next/navigation'

const baseStatusFilters: { value: NoteStatus; label: string; shortLabel: string; workOnly?: boolean }[] = [
  { value: 'todo', label: 'To Do', shortLabel: 'To Do' },
  { value: 'review', label: 'In Review', shortLabel: 'Review', workOnly: true },
  { value: 'complete', label: 'Done', shortLabel: 'Done' },
  { value: 'cancelled', label: 'Cancelled', shortLabel: 'Can.' },
]

interface MobileFilterBarProps {
  moduleType: ModuleType
  statusCounts: Record<string, number>
}

export function MobileFilterBar({ moduleType, statusCounts }: MobileFilterBarProps) {
  const pathname = usePathname()
  const { filterStatus, searchTerm, setFilterStatus, setSearchTerm, clearAllFilters, filterTypes, filterPriorities, sortField } = useNotesFilterStore()
  const [searchExpanded, setSearchExpanded] = useState(false)

  // Clear search and filters when navigating between modules
  useEffect(() => {
    setSearchTerm('')
    setSearchExpanded(false)
    clearAllFilters()
  }, [pathname, setSearchTerm, clearAllFilters])

  const activeFilterCount = (filterTypes.length > 0 ? 1 : 0) + (filterPriorities.length > 0 ? 1 : 0) + (sortField ? 1 : 0)

  return (
    <div className="flex-none bg-bg-secondary border-b border-bg-tertiary" data-testid="mobile-filter-bar">
      {/* Row: status buttons + search + filter — all in one horizontal row */}
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto">
        {/* Status buttons */}
        {baseStatusFilters
          .filter(sf => !sf.workOnly || moduleType === 'work')
          .map((sf) => (
            <Button
              key={sf.value}
              onClick={() => setFilterStatus(sf.value)}
              variant={filterStatus === sf.value ? sf.value : 'secondary'}
              size="sm"
              className="text-[11px] px-2 h-7 whitespace-nowrap shrink-0"
            >
              {sf.shortLabel} ({statusCounts[sf.value] || 0})
            </Button>
          ))}

        {/* Spacer */}
        <span className="flex-1 min-w-2" />

        {/* Search */}
        {searchExpanded ? (
          <div className="flex items-center gap-1 shrink-0">
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 w-28 text-xs"
              autoFocus
              data-testid="mobile-search-input"
            />
            <button
              onClick={() => { setSearchTerm(''); setSearchExpanded(false) }}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-tertiary shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchExpanded(true)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-tertiary shrink-0"
            aria-label="Search"
            data-testid="mobile-search-button"
          >
            <Search className="h-4 w-4 text-text-secondary" />
          </button>
        )}

        {/* Filter/Sort popover */}
        <div className="relative shrink-0">
          <TabletFilterPopover moduleType={moduleType} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
