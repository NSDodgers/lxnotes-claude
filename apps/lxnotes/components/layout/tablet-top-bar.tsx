'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Search, Plus, Lightbulb, Wrench, FileText, X, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useTabletModeStore } from '@/lib/stores/tablet-mode-store'
import { useNotesFilterStore } from '@/lib/stores/notes-filter-store'
import { TabletFilterPopover } from './tablet-filter-popover'
import type { NoteStatus, ModuleType } from '@/types'

function getModuleInfo(pathname: string) {
  if (pathname.includes('/cue-notes')) {
    return { name: 'Cue Notes', icon: Lightbulb, color: 'text-modules-cue', addVariant: 'cue' as const, moduleType: 'cue' as ModuleType }
  }
  if (pathname.includes('/work-notes')) {
    return { name: 'Work Notes', icon: Wrench, color: 'text-modules-work', addVariant: 'work' as const, moduleType: 'work' as ModuleType }
  }
  if (pathname.includes('/production-notes')) {
    return { name: 'Production Notes', icon: FileText, color: 'text-modules-production', addVariant: 'production' as const, moduleType: 'production' as ModuleType }
  }
  return null
}

const statusFilters: { value: NoteStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'complete', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function TabletTopBar() {
  const pathname = usePathname()
  const moduleInfo = getModuleInfo(pathname)
  const { toggleTabletSidebar, toggleTabletMode } = useTabletModeStore()
  const { filterStatus, searchTerm, onAddNote, setFilterStatus, setSearchTerm, clearAllFilters } = useNotesFilterStore()
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
      data-testid="tablet-top-bar"
      className="h-12 flex-none flex items-center gap-2 px-3 bg-bg-secondary border-b border-bg-tertiary"
    >
      {/* Hamburger */}
      <button
        onClick={toggleTabletSidebar}
        className="touch-target flex items-center justify-center rounded-lg hover:bg-bg-tertiary"
        aria-label="Open menu"
        data-testid="tablet-menu-button"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Module name */}
      {moduleInfo && ModuleIcon && (
        <div className="flex items-center gap-2 mr-auto">
          <ModuleIcon className={cn('h-5 w-5', moduleInfo.color)} />
          <span className="font-semibold text-sm">{moduleInfo.name}</span>
        </div>
      )}
      {!moduleInfo && <div className="mr-auto" />}

      {/* Status filters */}
      <div className="flex items-center gap-1">
        {statusFilters.map((sf) => (
          <Button
            key={sf.value}
            onClick={() => setFilterStatus(sf.value)}
            variant={filterStatus === sf.value ? sf.value : 'secondary'}
            size="sm"
            className="text-xs px-2 h-8"
          >
            {sf.label}
          </Button>
        ))}
      </div>

      {/* Filter/Sort popover */}
      {moduleInfo && (
        <TabletFilterPopover moduleType={moduleInfo.moduleType} />
      )}

      {/* Search */}
      {searchExpanded ? (
        <div className="flex items-center gap-1">
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-40 h-8 text-sm"
            autoFocus
            data-testid="tablet-search-input"
          />
          <button
            onClick={() => {
              setSearchTerm('')
              setSearchExpanded(false)
            }}
            className="touch-target flex items-center justify-center rounded-lg hover:bg-bg-tertiary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setSearchExpanded(true)}
          className="touch-target flex items-center justify-center rounded-lg hover:bg-bg-tertiary"
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
          className="h-8 px-3"
          data-testid="tablet-add-note-button"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}

      {/* Exit tablet mode */}
      <button
        onClick={toggleTabletMode}
        className="flex items-center gap-1.5 rounded-full px-3 h-8 text-xs text-text-secondary bg-bg-tertiary/50 hover:bg-bg-tertiary border border-bg-tertiary transition-colors touch-target"
        data-testid="tablet-mode-exit-topbar"
      >
        <Monitor className="h-4 w-4" />
        <span>Exit</span>
      </button>
    </div>
  )
}
