'use client'

import { useState } from 'react'
import { Plus, X, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlaceholderDefinition } from '@/types'

interface PlaceholderChipsProps {
  placeholders: PlaceholderDefinition[]
  onInsert: (placeholder: string) => void
  className?: string
}

export function PlaceholderChips({ placeholders, onInsert, className }: PlaceholderChipsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', 'production', 'user', 'date', 'notes'] as const
  const categoryLabels = {
    all: 'All',
    production: 'Production',
    user: 'User',
    date: 'Date & Time',
    notes: 'Notes Data'
  }

  const filteredPlaceholders = placeholders.filter(p => 
    selectedCategory === 'all' || p.category === selectedCategory
  )

  const handleInsert = (placeholder: PlaceholderDefinition) => {
    onInsert(placeholder.key)
  }

  const getCategoryColor = (category: PlaceholderDefinition['category']) => {
    switch (category) {
      case 'production':
        return 'bg-modules-production/20 text-modules-production border-modules-production/30'
      case 'user':
        return 'bg-modules-cue/20 text-modules-cue border-modules-cue/30'
      case 'date':
        return 'bg-modules-work/20 text-modules-work border-modules-work/30'
      case 'notes':
        return 'bg-modules-production/20 text-modules-production border-modules-production/30'
      default:
        return 'bg-bg-tertiary text-text-secondary border-bg-hover'
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-text-secondary">Available Placeholders</h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-modules-production hover:text-modules-production/80 flex items-center gap-1"
        >
          {isExpanded ? 'Hide' : 'Show'} placeholders
          {isExpanded ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full border transition-colors flex-shrink-0',
                  selectedCategory === category
                    ? 'bg-modules-production text-white border-modules-production'
                    : 'bg-bg-tertiary text-text-secondary border-bg-hover hover:bg-bg-hover'
                )}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>

          {/* Placeholder chips */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredPlaceholders.map((placeholder) => (
              <div
                key={placeholder.key}
                className="flex items-center gap-3 p-3 rounded-lg border border-bg-tertiary hover:bg-bg-hover transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded border',
                      getCategoryColor(placeholder.category)
                    )}>
                      {placeholder.category}
                    </span>
                    <code className="text-sm font-mono text-text-primary bg-bg-tertiary px-2 py-0.5 rounded">
                      {placeholder.key}
                    </code>
                  </div>
                  <div className="text-sm text-text-primary font-medium">
                    {placeholder.label}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {placeholder.description}
                  </div>
                </div>
                <button
                  onClick={() => handleInsert(placeholder)}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
                  title="Insert placeholder"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {filteredPlaceholders.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-4">
              No placeholders found in this category.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Simple helper component for inline placeholder insertion
interface PlaceholderInserterProps {
  onInsert: (placeholder: string) => void
  triggerText?: string
  className?: string
}

export function PlaceholderInserter({ 
  onInsert, 
  triggerText = 'Insert placeholder',
  className 
}: PlaceholderInserterProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Common placeholders for quick access
  const quickPlaceholders = [
    '{{PRODUCTION_TITLE}}',
    '{{USER_FULL_NAME}}',
    '{{CURRENT_DATE}}',
    '{{NOTE_COUNT}}',
    '{{TODO_COUNT}}'
  ]

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-modules-production hover:text-modules-production/80 flex items-center gap-1"
      >
        <Plus className="h-3 w-3" />
        {triggerText}
      </button>

      {isOpen && (
        <>
          <div className="absolute z-50 mt-1 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-lg p-2 min-w-48">
            <div className="space-y-1">
              {quickPlaceholders.map((placeholder) => (
                <button
                  key={placeholder}
                  type="button"
                  onClick={() => {
                    onInsert(placeholder)
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-mono hover:bg-bg-hover rounded transition-colors"
                >
                  {placeholder}
                </button>
              ))}
            </div>
          </div>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
        </>
      )}
    </div>
  )
}