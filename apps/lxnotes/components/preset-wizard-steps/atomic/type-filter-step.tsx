'use client'

import { useMemo } from 'react'
import { CheckSquare, Square } from 'lucide-react'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import type { ModuleType } from '@/types'

interface TypeFilterStepProps {
  value: string[]
  onChange: (value: string[]) => void
  moduleType: ModuleType
}

export function TypeFilterStep({ value, onChange, moduleType }: TypeFilterStepProps) {
  const { getTypes } = useCustomTypesStore()
  const availableTypes = useMemo(() => getTypes(moduleType), [moduleType, getTypes])

  const handleToggle = (typeValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, typeValue])
    } else {
      onChange(value.filter(t => t !== typeValue))
    }
  }

  const handleSelectAll = () => {
    onChange(availableTypes.map(t => t.value))
  }

  const handleSelectNone = () => {
    onChange([])
  }

  const allSelected = value.length === availableTypes.length
  const noneSelected = value.length === 0

  return (
    <div className="space-y-4" data-testid="wizard-step-types">
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">
          Select which note types to include.
        </p>
      </div>

      {/* Quick select buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
          data-testid="wizard-types-select-all"
        >
          <CheckSquare className="h-4 w-4" />
          Select All
        </button>
        <button
          type="button"
          onClick={handleSelectNone}
          className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
          data-testid="wizard-types-select-none"
        >
          <Square className="h-4 w-4" />
          Select None
        </button>
      </div>

      {/* Type checkboxes */}
      <div className="space-y-2">
        {availableTypes.map((type) => {
          const isChecked = value.includes(type.value)
          return (
            <label
              key={type.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-bg-tertiary hover:bg-bg-hover cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleToggle(type.value, e.target.checked)}
                className="rounded h-4 w-4"
              />
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-sm text-text-primary">{type.label}</span>
              </div>
            </label>
          )
        })}
      </div>

      {/* Summary */}
      <div className="text-xs text-text-muted">
        {allSelected ? 'All types selected' :
         noneSelected ? 'No types selected (all will be included)' :
         `${value.length} of ${availableTypes.length} types selected`}
      </div>
    </div>
  )
}
