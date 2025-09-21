'use client'

import { useState } from 'react'
import { Edit2, Trash2, ChevronDown, ChevronUp, FileText, Filter, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnyPreset, PageStylePreset, FilterSortPreset, EmailMessagePreset } from '@/types'

interface PresetCardProps {
  preset: AnyPreset
  onEdit: (preset: AnyPreset) => void
  onDelete: (id: string) => void
  showDetails?: boolean
  className?: string
}

export function PresetCard({ preset, onEdit, onDelete, showDetails = false, className }: PresetCardProps) {
  const [expanded, setExpanded] = useState(false)

  const getPresetIcon = () => {
    switch (preset.type) {
      case 'page_style':
        return <FileText className="h-4 w-4 text-modules-production" />
      case 'filter_sort':
        return <Filter className="h-4 w-4 text-modules-work" />
      case 'email_message':
        return <Mail className="h-4 w-4 text-modules-cue" />
    }
  }

  const getPresetSummary = () => {
    switch (preset.type) {
      case 'page_style': {
        const config = (preset as PageStylePreset).config
        return `${config.paperSize.toUpperCase()} • ${config.orientation} • ${config.includeCheckboxes ? 'Checkboxes' : 'No Checkboxes'}`
      }
      case 'filter_sort': {
        const config = (preset as FilterSortPreset).config
        const statusText = config.statusFilter ? config.statusFilter.toUpperCase() : 'ALL'
        const typeCount = config.typeFilters.length
        const priorityCount = config.priorityFilters.length
        return `${statusText} • ${typeCount} types • ${priorityCount} priorities • Sort by ${config.sortBy}`
      }
      case 'email_message': {
        const config = (preset as EmailMessagePreset).config
        const recipientCount = config.recipients ? config.recipients.split(',').length : 0
        const hasFilter = config.filterAndSortPresetId ? '✓' : '✗'
        const hasPDF = config.attachPdf ? '✓' : '✗'
        return `${recipientCount} recipients • Filter: ${hasFilter} • PDF: ${hasPDF}`
      }
    }
  }

  const getModuleBadge = () => {
    if (preset.moduleType === 'all') return null
    
    const colors = {
      cue: 'bg-modules-cue/20 text-modules-cue border-modules-cue/30',
      work: 'bg-modules-work/20 text-modules-work border-modules-work/30',
      production: 'bg-modules-production/20 text-modules-production border-modules-production/30',
    }
    
    return (
      <span className={cn(
        'px-2 py-1 text-xs font-medium rounded-full border',
        colors[preset.moduleType as keyof typeof colors]
      )}>
        {preset.moduleType} notes
      </span>
    )
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete "${preset.name}"?`)) {
      onDelete(preset.id)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(preset)
  }

  return (
    <div className={cn(
      'rounded-lg border border-bg-tertiary bg-bg-secondary hover:bg-bg-hover transition-colors',
      className
    )}>
      <div 
        className="p-compact-3 cursor-pointer"
        onClick={() => showDetails && setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {getPresetIcon()}
              <h3 className="font-medium text-text-primary truncate">{preset.name}</h3>
              {preset.isDefault && (
                <span className="px-2 py-1 text-xs font-medium bg-bg-tertiary text-text-secondary rounded">
                  System
                </span>
              )}
              {getModuleBadge()}
            </div>
            <p className="text-sm text-text-secondary">
              {getPresetSummary()}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleEdit}
              className="p-compact-1 hover:bg-bg-tertiary rounded transition-colors"
              title="Edit preset"
            >
              <Edit2 className="h-4 w-4 text-text-secondary" />
            </button>
            {!preset.isDefault && (
              <button
                onClick={handleDelete}
                className="p-compact-1 hover:bg-bg-tertiary rounded transition-colors"
                title="Delete preset"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            )}
            {showDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(!expanded)
                }}
                className="p-compact-1 hover:bg-bg-tertiary rounded transition-colors"
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {showDetails && expanded && (
        <div className="border-t border-bg-tertiary p-compact-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Created:</span>
              <span className="text-text-primary">{preset.createdAt.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Updated:</span>
              <span className="text-text-primary">{preset.updatedAt.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Created by:</span>
              <span className="text-text-primary">{preset.createdBy}</span>
            </div>
            
            {/* Type-specific details */}
            {preset.type === 'email_message' && (
              <div className="mt-4 space-y-2">
                <div className="text-text-secondary">Subject:</div>
                <div className="text-text-primary font-mono text-xs bg-bg-tertiary p-compact-2 rounded">
                  {(preset as EmailMessagePreset).config.subject}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}