'use client'

import { cn } from '@/lib/utils'

type StatusFilter = 'todo' | 'complete' | 'cancelled' | null

interface StatusFilterStepProps {
  value: StatusFilter
  onChange: (value: StatusFilter) => void
}

const statusOptions: { value: StatusFilter; label: string; description: string }[] = [
  { value: null, label: 'All Statuses', description: 'Include notes with any status' },
  { value: 'todo', label: 'Todo Only', description: 'Only notes that are still pending' },
  { value: 'complete', label: 'Complete Only', description: 'Only notes that are done' },
  { value: 'cancelled', label: 'Cancelled Only', description: 'Only notes that were cancelled' },
]

export function StatusFilterStep({ value, onChange }: StatusFilterStepProps) {
  return (
    <div className="space-y-4" data-testid="wizard-step-status">
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">
          Filter notes by their completion status.
        </p>
      </div>

      <div className="space-y-2">
        {statusOptions.map((option) => (
          <button
            key={option.value ?? 'all'}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors',
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-bg-tertiary hover:bg-bg-hover'
            )}
            data-testid={`wizard-status-${option.value ?? 'all'}`}
          >
            <div className={cn(
              'mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
              value === option.value ? 'border-primary' : 'border-text-secondary'
            )}>
              {value === option.value && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary">{option.label}</div>
              <div className="text-xs text-text-secondary">{option.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
