'use client'

import { useState } from 'react'
import { ChevronDown, Check, Plus, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnyPreset, ModuleType } from '@/types'

interface PresetSelectorProps {
  presets: AnyPreset[]
  selectedId?: string | null
  onSelect: (preset: AnyPreset | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  // New props for quick creation
  enableQuickCreate?: boolean
  presetType?: 'filter_sort' | 'page_style' | 'email_message'
  moduleType?: ModuleType
  onQuickCreate?: () => void
  // New props for inline editing
  onEdit?: (preset: AnyPreset) => void
  canEdit?: (preset: AnyPreset) => boolean
}

export function PresetSelector({
  presets,
  selectedId,
  onSelect,
  placeholder = 'Select a preset...',
  disabled = false,
  className,
  enableQuickCreate = false,
  presetType,
  moduleType,
  onQuickCreate,
  onEdit,
  canEdit
}: PresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedPreset = presets.find(p => p.id === selectedId)

  const handleSelect = (preset: AnyPreset | null) => {
    onSelect(preset)
    setIsOpen(false)
  }

  const getPresetSummary = (preset: AnyPreset) => {
    switch (preset.type) {
      case 'page_style':
        return `${preset.config.paperSize.toUpperCase()} • ${preset.config.orientation}`
      case 'filter_sort':
        const statusText = preset.config.statusFilter ? preset.config.statusFilter.toUpperCase() : 'ALL'
        return `${statusText} • Sort by ${preset.config.sortBy}`
      case 'email_message':
        const recipientCount = preset.config.recipients ? preset.config.recipients.split(',').length : 0
        return `${recipientCount} recipients`
    }
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-left bg-bg-tertiary border border-bg-hover rounded-lg transition-colors',
          'focus:outline-hidden focus:border-modules-production',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:bg-bg-hover'
        )}
      >
        <div className="flex-1 min-w-0">
          {selectedPreset ? (
            <div>
              <div className="font-medium text-text-primary truncate">
                {selectedPreset.name}
              </div>
              <div className="text-sm text-text-secondary truncate">
                {getPresetSummary(selectedPreset)}
              </div>
            </div>
          ) : (
            <span className="text-text-secondary">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn(
          'h-4 w-4 text-text-secondary transition-transform',
          isOpen && 'transform rotate-180'
        )} />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-lg max-h-60 overflow-auto"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            {/* Quick create option */}
            {enableQuickCreate && onQuickCreate && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onQuickCreate()
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-bg-hover transition-colors flex items-center gap-3 text-modules-production hover:text-modules-production/80"
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Create New...</span>
                </button>
                <div className="border-t border-bg-tertiary my-1" />
              </>
            )}
            
            {/* None option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                'w-full px-3 py-2 text-left hover:bg-bg-hover transition-colors flex items-center gap-3',
                !selectedId && 'bg-bg-tertiary'
              )}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                {!selectedId && <Check className="h-3 w-3 text-modules-production" />}
              </div>
              <span className="text-text-secondary">None</span>
            </button>

            {/* Preset options */}
            {presets.map((preset) => {
              const isEditable = onEdit && (canEdit ? canEdit(preset) : !preset.isDefault)
              
              return (
                <div
                  key={preset.id}
                  className={cn(
                    'w-full flex items-center gap-3 group relative',
                    selectedId === preset.id && 'bg-bg-tertiary'
                  )}
                >
                  {/* Main selection area */}
                  <button
                    type="button"
                    onClick={() => handleSelect(preset)}
                    className={cn(
                      'flex-1 px-3 py-2 text-left hover:bg-bg-hover transition-colors flex items-center gap-3'
                    )}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      {selectedId === preset.id && (
                        <Check className="h-3 w-3 text-modules-production" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary truncate">
                          {preset.name}
                        </span>
                        {preset.isDefault && (
                          <span className="px-1.5 py-0.5 text-xs bg-bg-tertiary text-text-secondary rounded">
                            System
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-text-secondary truncate">
                        {getPresetSummary(preset)}
                      </div>
                    </div>
                  </button>
                  {/* Edit button */}
                  {isEditable && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(preset)
                        setIsOpen(false)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-bg-tertiary rounded transition-all mr-3"
                      title="Edit preset"
                    >
                      <Pencil className="h-3 w-3 text-text-secondary hover:text-text-primary" />
                    </button>
                  )}
                </div>
              )
            })}

          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  )
}