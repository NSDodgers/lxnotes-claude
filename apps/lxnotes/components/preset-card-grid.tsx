'use client'

import { useMemo } from 'react'
import { Plus, Mail, Send, Download, Printer, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EmailMessagePreset, PrintPreset, ModuleType, Note } from '@/types'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { filterAndSortNotes } from '@/lib/utils/filter-sort-notes'

type ActionPreset = EmailMessagePreset | PrintPreset

interface PresetCardGridProps {
  presets: ActionPreset[]
  moduleType: ModuleType
  notes: Note[]
  variant: 'email' | 'print'
  onSelectPreset: (preset: ActionPreset) => void
  onCreateNew: () => void
  onCustomOneOff: () => void
  className?: string
}

export function PresetCardGrid({
  presets,
  moduleType,
  notes,
  variant,
  onSelectPreset,
  onCreateNew,
  onCustomOneOff,
  className,
}: PresetCardGridProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Section header */}
      <div className="text-sm font-medium text-text-secondary uppercase tracking-wider">
        Your Presets
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-3">
        {presets.map((preset) => (
          <ActionPresetCard
            key={preset.id}
            preset={preset}
            moduleType={moduleType}
            notes={notes}
            variant={variant}
            onClick={() => onSelectPreset(preset)}
          />
        ))}

        {/* New preset card */}
        <button
          onClick={onCreateNew}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-4',
            'rounded-lg border-2 border-dashed border-bg-tertiary',
            'hover:border-text-secondary hover:bg-bg-hover transition-colors',
            'text-text-secondary hover:text-text-primary',
            'min-h-[120px]'
          )}
          data-testid="preset-card-create-new"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">New Preset</span>
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-bg-tertiary" />
        <span className="text-xs text-text-secondary">or</span>
        <div className="flex-1 h-px bg-bg-tertiary" />
      </div>

      {/* Custom one-off link */}
      <button
        onClick={onCustomOneOff}
        className={cn(
          'w-full py-2.5 px-4 rounded-lg border border-bg-tertiary',
          'hover:bg-bg-hover transition-colors',
          'text-sm text-text-secondary hover:text-text-primary',
          'text-center'
        )}
        data-testid="preset-card-custom-one-off"
      >
        Custom One-Off {variant === 'email' ? 'Distribution' : 'Print'}
      </button>
    </div>
  )
}

// Individual action preset card
interface ActionPresetCardProps {
  preset: ActionPreset
  moduleType: ModuleType
  notes: Note[]
  variant: 'email' | 'print'
  onClick: () => void
}

function ActionPresetCard({ preset, moduleType, notes, variant, onClick }: ActionPresetCardProps) {
  const { getPreset: getFilterPreset } = useFilterSortPresetsStore()
  const { getPriorities } = useCustomPrioritiesStore()

  // Resolve note count from linked filter preset
  const noteCount = useMemo(() => {
    const filterPresetId = preset.type === 'email_message'
      ? (preset as EmailMessagePreset).config.filterAndSortPresetId
      : (preset as PrintPreset).config.filterSortPresetId

    if (!filterPresetId) return notes.length

    const filterPreset = getFilterPreset(filterPresetId)
    if (!filterPreset) return notes.length

    const customPriorities = getPriorities(moduleType)
    return filterAndSortNotes(notes, filterPreset, customPriorities).length
  }, [preset, notes, moduleType, getFilterPreset, getPriorities])

  const hasPdf = preset.type === 'email_message'
    ? (preset as EmailMessagePreset).config.attachPdf
    : true // Print presets always produce PDF

  const actionLabel = variant === 'email' ? 'Send' : 'Download'
  const ActionIcon = variant === 'email' ? Send : Download

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-2 p-4',
        'rounded-lg border border-bg-tertiary bg-bg-secondary',
        'hover:bg-bg-hover hover:border-text-secondary/30 transition-colors',
        'text-left min-h-[120px]',
        'group'
      )}
      data-testid={`preset-card-${preset.id}`}
    >
      {/* Preset name */}
      <div className="font-medium text-sm text-text-primary leading-tight line-clamp-2">
        {preset.name}
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-1 text-xs text-text-secondary mt-auto">
        <span>{noteCount} note{noteCount !== 1 ? 's' : ''}</span>
        {hasPdf && (
          <span className="flex items-center gap-1">
            <Paperclip className="h-3 w-3" />
            PDF
          </span>
        )}
      </div>

      {/* Action hint */}
      <div className={cn(
        'flex items-center gap-1.5 text-xs font-medium mt-1',
        'text-text-secondary group-hover:text-text-primary transition-colors'
      )}>
        <ActionIcon className="h-3.5 w-3.5" />
        {actionLabel}
      </div>
    </button>
  )
}
