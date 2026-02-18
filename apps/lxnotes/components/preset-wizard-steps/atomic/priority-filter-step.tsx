'use client'

import { useMemo } from 'react'
import { CheckSquare, Square } from 'lucide-react'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import type { ModuleType } from '@/types'

interface PriorityFilterStepProps {
  value: string[]
  onChange: (value: string[]) => void
  moduleType: ModuleType
}

export function PriorityFilterStep({ value, onChange, moduleType }: PriorityFilterStepProps) {
  const { getPriorities } = useCustomPrioritiesStore()
  const availablePriorities = useMemo(() => getPriorities(moduleType), [moduleType, getPriorities])

  const handleToggle = (priorityValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, priorityValue])
    } else {
      onChange(value.filter(p => p !== priorityValue))
    }
  }

  const handleSelectAll = () => {
    onChange(availablePriorities.map(p => p.value))
  }

  const handleSelectNone = () => {
    onChange([])
  }

  const allSelected = value.length === availablePriorities.length
  const noneSelected = value.length === 0

  return (
    <div className="space-y-4" data-testid="wizard-step-priorities">
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">
          Select which priority levels to include.
        </p>
      </div>

      {/* Quick select buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
          data-testid="wizard-priorities-select-all"
        >
          <CheckSquare className="h-4 w-4" />
          Select All
        </button>
        <button
          type="button"
          onClick={handleSelectNone}
          className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
          data-testid="wizard-priorities-select-none"
        >
          <Square className="h-4 w-4" />
          Select None
        </button>
      </div>

      {/* Priority checkboxes */}
      <div className="space-y-2">
        {availablePriorities.map((priority) => {
          const isChecked = value.includes(priority.value)
          return (
            <label
              key={priority.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-bg-tertiary hover:bg-bg-hover cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleToggle(priority.value, e.target.checked)}
                className="rounded h-4 w-4"
              />
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: priority.color }}
                />
                <span className="text-sm text-text-primary">{priority.label}</span>
              </div>
            </label>
          )
        })}
      </div>

      {/* Summary */}
      <div className="text-xs text-text-muted">
        {allSelected ? 'All priorities selected' :
         noneSelected ? 'No priorities selected (all will be included)' :
         `${value.length} of ${availablePriorities.length} priorities selected`}
      </div>
    </div>
  )
}
