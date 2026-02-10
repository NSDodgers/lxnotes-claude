'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resolvePlaceholders, PlaceholderData } from '@/lib/utils/placeholders'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { filterAndSortNotes } from '@/lib/utils/filter-sort-notes'
import type { Note, ModuleType } from '@/types'

interface NameAndSaveStepProps {
  name: string
  onNameChange: (val: string) => void
  variant: 'email' | 'print'
  // Preview data
  recipients?: string
  subject?: string
  filterPresetId: string | null
  pageStylePresetId: string | null
  moduleType: ModuleType
  notes: Note[]
  placeholderData: PlaceholderData
}

export function NameAndSaveStep({
  name,
  onNameChange,
  variant,
  recipients,
  subject,
  filterPresetId,
  pageStylePresetId,
  moduleType,
  notes,
  placeholderData,
}: NameAndSaveStepProps) {
  const { getPreset: getFilterPreset } = useFilterSortPresetsStore()
  const { presets: pageStylePresets } = usePageStylePresetsStore()
  const { getPriorities } = useCustomPrioritiesStore()

  const filterPreset = filterPresetId ? getFilterPreset(filterPresetId) : null
  const pageStylePreset = pageStylePresetId
    ? pageStylePresets.find(p => p.id === pageStylePresetId)
    : null

  const noteCount = useMemo(() => {
    if (!filterPreset) return notes.length
    const customPriorities = getPriorities(moduleType)
    return filterAndSortNotes(notes, filterPreset, customPriorities).length
  }, [notes, filterPreset, moduleType, getPriorities])

  const resolvedSubject = subject ? resolvePlaceholders(subject, placeholderData) : null

  return (
    <div className="space-y-6" data-testid="wizard-step-name-save">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="wizard-preset-name" className="text-sm font-medium">
          Preset name
        </Label>
        <Input
          id="wizard-preset-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Daily Report, Tech Rehearsal"
          data-testid="wizard-name-input"
          autoFocus
        />
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Preview
        </div>
        <div className="rounded-lg border border-bg-tertiary bg-bg-secondary p-4 space-y-2 text-sm">
          {variant === 'email' && recipients && (
            <div className="flex justify-between">
              <span className="text-text-secondary">To</span>
              <span className="text-text-primary truncate ml-4">{recipients}</span>
            </div>
          )}
          {variant === 'email' && resolvedSubject && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Subject</span>
              <span className="text-text-primary truncate ml-4">{resolvedSubject}</span>
            </div>
          )}
          {filterPreset && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Filter</span>
              <span className="text-text-primary">{filterPreset.name}</span>
            </div>
          )}
          {pageStylePreset && (
            <div className="flex justify-between">
              <span className="text-text-secondary">PDF</span>
              <span className="text-text-primary">
                {pageStylePreset.config.paperSize.toUpperCase()} {pageStylePreset.config.orientation} ✓
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-text-secondary">Notes</span>
            <span className="text-text-primary">{noteCount} matching</span>
          </div>
        </div>
      </div>
    </div>
  )
}
