'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Search, Plus, Lightbulb, Wrench, Zap, FileText, X, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useDesignerModeStore } from '@/lib/stores/designer-mode-store'
import { useNotesFilterStore } from '@/lib/stores/notes-filter-store'
import { DesignerFilterPopover } from './designer-filter-popover'
import { ColumnConfigPopover } from '@/components/notes-table/column-config-popover'
import type { NoteStatus, ModuleType } from '@/types'

function getModuleInfo(pathname: string) {
  if (pathname.includes('/cue-notes')) {
    return { name: 'Cue Notes', icon: Lightbulb, color: 'text-modules-cue', addVariant: 'cue' as const, moduleType: 'cue' as ModuleType }
  }
  if (pathname.includes('/work-notes')) {
    return { name: 'Work Notes', icon: Wrench, color: 'text-modules-work', addVariant: 'work' as const, moduleType: 'work' as ModuleType }
  }
  if (pathname.includes('/electrician-notes')) {
    return { name: 'Electrician Notes', icon: Zap, color: 'text-modules-electrician', addVariant: 'electrician' as const, moduleType: 'electrician' as ModuleType }
  }
  if (pathname.includes('/production-notes')) {
    return { name: 'Production Notes', icon: FileText, color: 'text-modules-production', addVariant: 'production' as const, moduleType: 'production' as ModuleType }
  }
  return null
}

const baseStatusFilters: { value: NoteStatus; label: string; workOnly?: boolean }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'review', label: 'In Review', workOnly: true },
  { value: 'complete', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'deleted', label: 'Deleted' },
]

export function DesignerTopBar() {
  const pathname = usePathname()
  const moduleInfo = getModuleInfo(pathname)
  const { toggleDesignerSidebar, toggleDesignerMode } = useDesignerModeStore()
  const { filterStatus, searchTerm, onAddNote, setFilterStatus, setSearchTerm, clearAllFilters, statusCounts } = useNotesFilterStore()
  const [searchExpanded, setSearchExpanded] = useState(false)

  // Clear search and filters when navigating between modules
  useEffect(() => {
    setSearchTerm('')
    setSearchExpanded(false)
    clearAllFilters()
  }, [pathname, setSearchTerm, clearAllFilters])

  const ModuleIcon = moduleInfo?.icon

  return (
    <div
      data-testid="designer-top-bar"
      className="flex-none flex flex-col bg-bg-secondary"
    >
      {/* Row 1: Utility controls */}
      <div className="h-10 flex items-center gap-1.5 px-3">
        {/* Hamburger */}
        <button
          onClick={toggleDesignerSidebar}
          className="touch-target flex-none flex items-center justify-center rounded-lg hover:bg-bg-tertiary"
          aria-label="Open menu"
          data-testid="designer-menu-button"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Exit designer mode */}
        <button
          onClick={toggleDesignerMode}
          className="flex-none flex items-center gap-1.5 rounded-full px-3 h-8 text-xs text-text-secondary bg-bg-tertiary/50 hover:bg-bg-tertiary border border-bg-tertiary transition-colors touch-target"
          data-testid="designer-mode-exit-topbar"
        >
          <Monitor className="h-4 w-4" />
          <span>Exit</span>
        </button>

        {/* Module name — hidden when search is expanded to reclaim space */}
        {!searchExpanded && moduleInfo && ModuleIcon && (
          <div className="flex items-center gap-2 mr-auto min-w-0">
            <ModuleIcon className={cn('h-5 w-5 flex-none', moduleInfo.color)} />
            <span className="font-semibold text-sm truncate">{moduleInfo.name}</span>
          </div>
        )}
        {(searchExpanded || !moduleInfo) && <div className="mr-auto" />}

        {/* Column config popover */}
        {moduleInfo && (
          <ColumnConfigPopover moduleType={moduleInfo.moduleType} statusFilter={filterStatus} />
        )}

        {/* Filter/Sort popover */}
        {moduleInfo && (
          <DesignerFilterPopover moduleType={moduleInfo.moduleType} />
        )}

        {/* Search */}
        {searchExpanded ? (
          <div className="flex items-center gap-1 min-w-0">
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-28 h-8 text-sm"
              autoFocus
              data-testid="designer-search-input"
            />
            <button
              onClick={() => {
                setSearchTerm('')
                setSearchExpanded(false)
              }}
              className="touch-target flex-none flex items-center justify-center rounded-lg hover:bg-bg-tertiary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchExpanded(true)}
            className="touch-target flex-none flex items-center justify-center rounded-lg hover:bg-bg-tertiary"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        )}

        {/* Add button */}
        {onAddNote && moduleInfo && (
          <Button
            onClick={onAddNote}
            size="sm"
            variant={moduleInfo.addVariant}
            className="flex-none h-8 px-3"
            data-testid="designer-add-note-button"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Row 2: Status filters */}
      <div
        className="h-9 flex items-center gap-1 px-3 border-b border-bg-tertiary overflow-x-auto"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {baseStatusFilters.filter(sf => !sf.workOnly || moduleInfo?.moduleType === 'work').map((sf) => (
          <Button
            key={sf.value}
            onClick={() => setFilterStatus(sf.value)}
            variant={filterStatus === sf.value ? sf.value : 'secondary'}
            size="sm"
            className="text-xs px-2 h-7 flex-none"
          >
            {sf.label} ({statusCounts[sf.value] || 0})
          </Button>
        ))}
      </div>
    </div>
  )
}
