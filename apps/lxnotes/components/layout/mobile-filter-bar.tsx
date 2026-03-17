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
      {/* Status buttons - horizontal scroll */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto">
        {baseStatusFilters
          .filter(sf => !sf.workOnly || moduleType === 'work')
          .map((sf) => (
            <Button
              key={sf.value}
              onClick={() => setFilterStatus(sf.value)}
              variant={filterStatus === sf.value ? sf.value : 'secondary'}
              size="sm"
              className="text-xs px-2.5 h-8 whitespace-nowrap shrink-0"
            >
              {sf.shortLabel} ({statusCounts[sf.value] || 0})
            </Button>
          ))}
      </div>

      {/* Search + filter trigger */}
      <div className="flex items-center gap-2 px-3 pb-2">
        {searchExpanded ? (
          <div className="flex items-center gap-1 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-sm pl-8"
                autoFocus
                data-testid="mobile-search-input"
              />
            </div>
            <button
              onClick={() => {
                setSearchTerm('')
                setSearchExpanded(false)
              }}
              className="touch-target flex items-center justify-center rounded-lg hover:bg-bg-tertiary shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setSearchExpanded(true)}
              className="touch-target flex items-center justify-center rounded-lg hover:bg-bg-tertiary"
              aria-label="Search"
              data-testid="mobile-search-button"
            >
              <Search className="h-5 w-5 text-text-secondary" />
            </button>
            <div className="flex-1" />
          </>
        )}

        {/* Filter/Sort popover - reuse tablet one */}
        <div className="relative">
          <TabletFilterPopover moduleType={moduleType} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
