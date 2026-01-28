'use client'

import { Plus, Send, Download, Loader2, ArrowUpNarrowWide, ArrowDownWideNarrow, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EmailMessagePreset, PrintPreset, ModuleType, Note } from '@/types'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'

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
  loadingPresetId?: string | null
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
  loadingPresetId,
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
            variant={variant}
            onClick={() => onSelectPreset(preset)}
            isLoading={loadingPresetId === preset.id}
            disabled={!!loadingPresetId}
          />
        ))}

        {/* New preset card */}
        <button
          onClick={onCreateNew}
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 p-3',
            'rounded-lg border-2 border-dashed border-bg-tertiary',
            'hover:border-text-secondary hover:bg-bg-hover transition-colors',
            'text-text-secondary hover:text-text-primary',
            'min-h-[80px]'
          )}
          data-testid="preset-card-create-new"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-medium">New Preset</span>
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
  variant: 'email' | 'print'
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean
}

// Map sort field to display label for tooltips
const sortFieldLabels: Record<string, string> = {
  cue_number: 'Cue #',
  priority: 'Priority',
  created_at: 'Created',
  completed_at: 'Completed',
  cancelled_at: 'Cancelled',
  channel: 'Channel',
  position: 'Position',
  department: 'Dept',
  type: 'Type',
}

function ActionPresetCard({ preset, variant, onClick, isLoading, disabled }: ActionPresetCardProps) {
  const { getPreset: getFilterPreset } = useFilterSortPresetsStore()
  const { getPreset: getPageStylePreset } = usePageStylePresetsStore()

  // Get linked presets for metadata
  const filterPresetId = preset.type === 'email_message'
    ? (preset as EmailMessagePreset).config.filterAndSortPresetId
    : (preset as PrintPreset).config.filterSortPresetId

  const pageStylePresetId = preset.type === 'print'
    ? (preset as PrintPreset).config.pageStylePresetId
    : (preset as EmailMessagePreset).config.pageStylePresetId

  const filterPreset = filterPresetId ? getFilterPreset(filterPresetId) : null
  const pageStylePreset = pageStylePresetId ? getPageStylePreset(pageStylePresetId) : null

  // Get sort info for tooltip
  const sortBy = filterPreset?.config.sortBy || 'created_at'
  const sortOrder = filterPreset?.config.sortOrder || 'desc'
  const sortLabel = sortFieldLabels[sortBy] || sortBy

  // Get page style info for tooltip
  const paperSize = pageStylePreset?.config.paperSize || 'letter'
  const orientation = pageStylePreset?.config.orientation || 'portrait'
  const pageTooltip = `${paperSize.charAt(0).toUpperCase() + paperSize.slice(1)} ${orientation.charAt(0).toUpperCase() + orientation.slice(1)}`

  // Check if this is an "All" preset (overview presets)
  const isAllPreset = preset.name.toLowerCase().startsWith('all ')

  const ActionIcon = variant === 'email' ? Send : Download
  const SortIcon = sortOrder === 'asc' ? ArrowUpNarrowWide : ArrowDownWideNarrow

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-start gap-2 p-3',
        'rounded-lg border transition-colors',
        'text-left min-h-[80px]',
        'group',
        // Different styling for "All" presets vs type-specific
        isAllPreset
          ? 'bg-bg-tertiary/50 border-text-tertiary/30 hover:bg-bg-tertiary hover:border-text-secondary/40'
          : 'bg-bg-secondary border-bg-tertiary hover:bg-bg-hover hover:border-text-secondary/30',
        disabled && !isLoading && 'opacity-50 cursor-not-allowed',
        isLoading && 'cursor-wait'
      )}
      data-testid={`preset-card-${preset.id}`}
    >
      {/* Preset name - prominent */}
      <div className="font-medium text-sm text-text-primary leading-tight line-clamp-2">
        {preset.name}
      </div>

      {/* Footer: icons left, action right */}
      <div className="flex items-center justify-between w-full mt-auto">
        {/* Metadata icons - minimal, tooltips only */}
        <div className="flex items-center gap-2 text-text-tertiary">
          {pageStylePreset && (
            <span title={pageTooltip}>
              <FileText className="h-3.5 w-3.5" />
            </span>
          )}
          {filterPreset && (
            <span title={`Sort: ${sortLabel} (${sortOrder})`}>
              <SortIcon className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        {/* Action */}
        <div className={cn(
          'flex items-center gap-1 text-[10px] font-medium',
          'text-text-tertiary group-hover:text-text-secondary transition-colors',
          isLoading && 'text-text-secondary'
        )}>
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <ActionIcon className="h-3.5 w-3.5" />
          )}
        </div>
      </div>
    </button>
  )
}
