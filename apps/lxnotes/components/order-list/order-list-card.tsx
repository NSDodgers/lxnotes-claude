'use client'

import { useState } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { NoteGroup } from '@/hooks/use-aggregated-order-items'

interface OrderListCardProps {
  group: NoteGroup
  onToggleOrdered: (itemId: string) => Promise<void>
  onOpenNote: (noteId: string, moduleType: string) => void
  defaultCollapsed?: boolean
  compact?: boolean
}

export function OrderListCard({ group, onToggleOrdered, onOpenNote, defaultCollapsed, compact }: OrderListCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false)
  const { meta, items, orderedCount, totalCount } = group
  const allDone = totalCount > 0 && orderedCount === totalCount
  const borderColor = meta.moduleType === 'electrician' ? 'border-l-cyan-400' : 'border-l-blue-400'

  const channelDisplay = meta.channelNumbers || '—'
  const positionDisplay = meta.positionUnit || ''
  const descriptionPreview = !compact && meta.description
    ? meta.description.length > 40
      ? meta.description.slice(0, 40) + '...'
      : meta.description
    : ''

  return (
    <div
      className={cn('bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden border-l-[3px]', borderColor)}
      data-testid={`order-list-card-${meta.noteId}`}
    >
      {/* Card Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-bg-tertiary/30 transition-colors"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-text-tertiary flex-shrink-0 transition-transform',
              collapsed && '-rotate-90'
            )}
          />
          <span className={cn('font-semibold tabular-nums', compact ? 'text-[13px]' : 'text-sm')}>
            Ch {channelDisplay}
          </span>
          {positionDisplay && (
            <span className={cn('text-text-secondary truncate', compact ? 'text-[13px]' : 'text-[13px]')}>
              {positionDisplay}
            </span>
          )}
          {descriptionPreview && (
            <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded truncate max-w-[200px]">
              {descriptionPreview}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <span className={cn('text-xs', allDone ? 'text-green-400' : 'text-text-tertiary')}>
            <span className="text-green-400">{orderedCount}</span>
            {' / '}
            {totalCount}
            {allDone && ' ✓'}
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation()
              onOpenNote(meta.noteId, meta.moduleType)
            }}
            className="text-[11px] text-text-tertiary hover:text-text-secondary flex items-center gap-1 cursor-pointer"
            role="link"
            data-testid={`order-list-open-note-${meta.noteId}`}
          >
            <ExternalLink className="h-3 w-3" />
            Open note
          </span>
        </div>
      </button>

      {/* Card Body */}
      {!collapsed && (
        <div className="px-3 pb-2.5 border-t border-bg-tertiary">
          {items.map(item => (
            <div
              key={item.id}
              className={cn('flex items-center gap-2.5 border-b border-bg-tertiary/50 last:border-b-0', compact ? 'py-1.5' : 'py-2')}
              data-testid={`order-list-item-${item.id}`}
            >
              <Checkbox
                checked={item.ordered}
                onCheckedChange={() => onToggleOrdered(item.id)}
                className="flex-shrink-0"
                data-testid={`order-list-item-checkbox-${item.id}`}
              />
              <span className={cn(
                'flex-1',
                compact ? 'text-[13px]' : 'text-sm',
                item.ordered && 'line-through text-text-tertiary'
              )}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
