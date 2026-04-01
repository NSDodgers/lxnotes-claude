'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { FilterSortPreset, PageStyleConfig } from '@/types'

// Standard page style options for inline selection
const PAGE_STYLE_OPTIONS: { label: string; description: string; value: PageStyleConfig }[] = [
  { label: 'Letter Landscape', description: 'LETTER • landscape', value: { paperSize: 'letter', orientation: 'landscape', includeCheckboxes: true } },
  { label: 'Letter Portrait', description: 'LETTER • portrait', value: { paperSize: 'letter', orientation: 'portrait', includeCheckboxes: true } },
  { label: 'A4 Landscape', description: 'A4 • landscape', value: { paperSize: 'a4', orientation: 'landscape', includeCheckboxes: true } },
  { label: 'A4 Portrait', description: 'A4 • portrait', value: { paperSize: 'a4', orientation: 'portrait', includeCheckboxes: true } },
  { label: 'Legal Landscape', description: 'LEGAL • landscape', value: { paperSize: 'legal', orientation: 'landscape', includeCheckboxes: true } },
  { label: 'Legal Portrait', description: 'LEGAL • portrait', value: { paperSize: 'legal', orientation: 'portrait', includeCheckboxes: true } },
]

interface WhatToSendStepProps {
  filterPresets: FilterSortPreset[]
  selectedFilterPresetId: string | null
  selectedPageStyle: PageStyleConfig | null
  includeNotesInBody: boolean
  attachPdf: boolean
  variant: 'email' | 'print'
  onFilterPresetChange: (id: string | null) => void
  onPageStyleChange: (pageStyle: PageStyleConfig) => void
  onIncludeNotesInBodyChange: (val: boolean) => void
  onAttachPdfChange: (val: boolean) => void
  onCreateFilterPreset?: () => void
}

export function WhatToSendStep({
  filterPresets,
  selectedFilterPresetId,
  selectedPageStyle,
  includeNotesInBody,
  attachPdf,
  variant,
  onFilterPresetChange,
  onPageStyleChange,
  onIncludeNotesInBodyChange,
  onAttachPdfChange,
  onCreateFilterPreset,
}: WhatToSendStepProps) {
  const showPdfOptions = variant === 'print' || attachPdf

  return (
    <div className="space-y-6" data-testid="wizard-step-what-to-send">
      {/* Filter preset selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-text-primary">
          Which notes to include
        </Label>
        <div className="space-y-2">
          <RadioOption
            id="filter-all"
            label="All notes"
            description="Include every note in this module"
            selected={selectedFilterPresetId === null}
            onSelect={() => onFilterPresetChange(null)}
          />
          {filterPresets.map(preset => (
            <RadioOption
              key={preset.id}
              id={`filter-${preset.id}`}
              label={preset.name}
              description={getFilterDescription(preset)}
              selected={selectedFilterPresetId === preset.id}
              onSelect={() => onFilterPresetChange(preset.id)}
            />
          ))}
          {onCreateFilterPreset && (
            <button
              type="button"
              onClick={onCreateFilterPreset}
              className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-bg-tertiary text-text-secondary hover:text-modules-production hover:border-modules-production/50 transition-colors text-sm"
              data-testid="wizard-create-filter-preset"
            >
              <Plus className="h-4 w-4" />
              Create New Filter...
            </button>
          )}
        </div>
      </div>

      {/* Email-specific: format options */}
      {variant === 'email' && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-text-primary">Format</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-notes-body"
                checked={includeNotesInBody}
                onCheckedChange={(checked) => onIncludeNotesInBodyChange(checked === true)}
              />
              <label htmlFor="include-notes-body" className="text-sm text-text-primary cursor-pointer">
                Include notes in email body
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="attach-pdf"
                checked={attachPdf}
                onCheckedChange={(checked) => onAttachPdfChange(checked === true)}
              />
              <label htmlFor="attach-pdf" className="text-sm text-text-primary cursor-pointer">
                Attach as PDF
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Page style selection (if PDF) */}
      {showPdfOptions && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-text-primary">Page style</Label>
          <div className="space-y-2">
            {PAGE_STYLE_OPTIONS.map((option, idx) => (
              <RadioOption
                key={idx}
                id={`page-style-${idx}`}
                label={option.label}
                description={option.description}
                selected={
                  selectedPageStyle?.paperSize === option.value.paperSize &&
                  selectedPageStyle?.orientation === option.value.orientation
                }
                onSelect={() => onPageStyleChange(option.value)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RadioOption({
  id,
  label,
  description,
  selected,
  onSelect,
}: {
  id: string
  label: string
  description: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-bg-tertiary hover:bg-bg-hover'
      )}
      data-testid={`wizard-radio-${id}`}
    >
      <div className={cn(
        'mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center',
        selected ? 'border-primary' : 'border-text-secondary'
      )}>
        {selected && <div className="h-2 w-2 rounded-full bg-primary" />}
      </div>
      <div>
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="text-xs text-text-secondary">{description}</div>
      </div>
    </button>
  )
}

function getFilterDescription(preset: FilterSortPreset): string {
  const parts: string[] = []
  if (preset.config.statusFilter) {
    parts.push(preset.config.statusFilter)
  }
  if (preset.config.typeFilters.length > 0) {
    parts.push(`${preset.config.typeFilters.length} types`)
  }
  parts.push(`sorted by ${preset.config.sortBy}`)
  return parts.join(' • ')
}
