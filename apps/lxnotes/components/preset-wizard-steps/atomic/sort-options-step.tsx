'use client'

import { useMemo } from 'react'
import { PresetFormField, PresetFormSelect } from '@/components/preset-dialog'
import { getSortFieldsForModule } from '@/lib/validation/preset-schemas'
import type { ModuleType } from '@/types'

interface SortOptionsStepProps {
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortByChange: (value: string) => void
  onSortOrderChange: (value: 'asc' | 'desc') => void
  moduleType: ModuleType
}

const fieldLabels: Record<string, string> = {
  cue_number: 'Cue Number',
  channel: 'Channel',
  position: 'Position',
  department: 'Department',
  priority: 'Priority',
  type: 'Type',
  created_at: 'Date Created',
  completed_at: 'Date Completed',
  cancelled_at: 'Date Cancelled',
}

export function SortOptionsStep({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  moduleType,
}: SortOptionsStepProps) {
  const availableSortFields = useMemo(() => {
    const fields = getSortFieldsForModule(moduleType)
    return fields.map(field => ({ value: field, label: fieldLabels[field] || field }))
  }, [moduleType])

  return (
    <div className="space-y-4" data-testid="wizard-step-sorting">
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">
          Choose how to sort the notes in your output.
        </p>
      </div>

      <div className="space-y-4">
        <PresetFormField label="Sort By" description="Which field to use for sorting">
          <PresetFormSelect
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            data-testid="wizard-sort-by-select"
          >
            {availableSortFields.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </PresetFormSelect>
        </PresetFormField>

        <PresetFormField label="Sort Order" description="Ascending or descending">
          <PresetFormSelect
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            data-testid="wizard-sort-order-select"
          >
            <option value="asc">Ascending (A-Z, 1-9, oldest first)</option>
            <option value="desc">Descending (Z-A, 9-1, newest first)</option>
          </PresetFormSelect>
        </PresetFormField>
      </div>
    </div>
  )
}
