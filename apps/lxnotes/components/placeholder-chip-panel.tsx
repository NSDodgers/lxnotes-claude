'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Search, X, Sparkles } from 'lucide-react'
import { PlaceholderChip } from './placeholder-chip'
import { cn } from '@/lib/utils'
import type { PlaceholderDefinition } from '@/types'

interface PlaceholderChipPanelProps {
  placeholders: PlaceholderDefinition[]
  className?: string
  title?: string
  searchable?: boolean
  collapsible?: boolean
  defaultExpanded?: boolean
}

const categoryLabels = {
  production: 'Production Info',
  user: 'User Details', 
  date: 'Date & Time',
  notes: 'Notes Data'
} as const

const categoryDescriptions = {
  production: 'Information about the current production',
  user: 'Details about the current user',
  date: 'Current date and time values',
  notes: 'Dynamic data from filtered notes'
} as const

export function PlaceholderChipPanel({
  placeholders,
  className,
  title = "Available Placeholders",
  searchable = true,
  collapsible = true,
  defaultExpanded = true
}: PlaceholderChipPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['production', 'user', 'date', 'notes'])
  )

  // Filter placeholders based on search
  const filteredPlaceholders = useMemo(() => {
    if (!searchQuery.trim()) return placeholders
    
    const query = searchQuery.toLowerCase()
    return placeholders.filter(placeholder => 
      placeholder.label.toLowerCase().includes(query) ||
      placeholder.description.toLowerCase().includes(query) ||
      placeholder.key.toLowerCase().includes(query)
    )
  }, [placeholders, searchQuery])

  // Group placeholders by category
  const groupedPlaceholders = useMemo(() => {
    const groups: Record<string, PlaceholderDefinition[]> = {}
    
    filteredPlaceholders.forEach(placeholder => {
      const category = placeholder.category
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(placeholder)
    })
    
    return groups
  }, [filteredPlaceholders])

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const hasResults = filteredPlaceholders.length > 0
  const totalCategories = Object.keys(groupedPlaceholders).length

  if (!isExpanded && collapsible) {
    return (
      <div className={cn('bg-bg-secondary rounded-lg border border-bg-tertiary', className)}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-bg-hover transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-text-secondary" />
            <span className="font-medium text-text-primary">{title}</span>
            <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">
              {placeholders.length}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-text-secondary" />
        </button>
      </div>
    )
  }

  return (
    <div className={cn(
      'bg-bg-secondary rounded-lg border border-bg-tertiary overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-bg-tertiary">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-text-secondary" />
            <h3 className="font-medium text-text-primary">{title}</h3>
            <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">
              {filteredPlaceholders.length}
            </span>
          </div>
          {collapsible && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-bg-hover rounded transition-colors"
              title="Collapse panel"
            >
              <ChevronDown className="h-4 w-4 text-text-secondary" />
            </button>
          )}
        </div>

        {/* Search */}
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search placeholders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-bg-tertiary border border-bg-hover rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-modules-production transition-colors"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-bg-hover rounded transition-colors"
                title="Clear search"
              >
                <X className="h-3 w-3 text-text-muted" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
        {!hasResults ? (
          <div className="text-center py-6 text-text-muted">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {searchQuery ? `No placeholders found for "${searchQuery}"` : 'No placeholders available'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-text-muted mb-4 px-1">
              💡 <strong>Tip:</strong> Drag chips into text fields or click to insert at cursor
            </div>
            
            {Object.entries(groupedPlaceholders).map(([category, categoryPlaceholders]) => {
              const isExpanded = expandedCategories.has(category)
              const categoryKey = category as keyof typeof categoryLabels
              
              return (
                <div key={category} className="space-y-2">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-2 hover:bg-bg-hover rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-text-muted" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-text-muted" />
                      )}
                      <span className="text-sm font-medium text-text-primary">
                        {categoryLabels[categoryKey] || category}
                      </span>
                      <span className="text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded-full">
                        {categoryPlaceholders.length}
                      </span>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-5 space-y-2">
                      <p className="text-xs text-text-muted mb-3">
                        {categoryDescriptions[categoryKey] || `${category} placeholders`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {categoryPlaceholders.map((placeholder) => (
                          <PlaceholderChip
                            key={placeholder.key}
                            placeholder={placeholder}
                            variant="draggable"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {hasResults && (
        <div className="px-4 py-3 border-t border-bg-tertiary bg-bg-primary">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {filteredPlaceholders.length} placeholder{filteredPlaceholders.length !== 1 ? 's' : ''} 
              {totalCategories > 1 && ` across ${totalCategories} categories`}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-modules-production rounded-full"></span>
              Drag to insert
            </span>
          </div>
        </div>
      )}
    </div>
  )
}