'use client'

import { cn } from '@/lib/utils'

interface GroupByStepProps {
  value: boolean
  onChange: (value: boolean) => void
}

export function GroupByStep({ value, onChange }: GroupByStepProps) {
  return (
    <div className="space-y-4" data-testid="wizard-step-grouping">
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">
          Group notes by their type before applying sort order.
        </p>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors',
            !value
              ? 'border-primary bg-primary/5'
              : 'border-bg-tertiary hover:bg-bg-hover'
          )}
          data-testid="wizard-group-off"
        >
          <div className={cn(
            'mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
            !value ? 'border-primary' : 'border-text-secondary'
          )}>
            {!value && <div className="h-2 w-2 rounded-full bg-primary" />}
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">No Grouping</div>
            <div className="text-xs text-text-secondary">
              Sort all notes together in one continuous list
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors',
            value
              ? 'border-primary bg-primary/5'
              : 'border-bg-tertiary hover:bg-bg-hover'
          )}
          data-testid="wizard-group-on"
        >
          <div className={cn(
            'mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
            value ? 'border-primary' : 'border-text-secondary'
          )}>
            {value && <div className="h-2 w-2 rounded-full bg-primary" />}
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">Group by Type</div>
            <div className="text-xs text-text-secondary">
              Organize notes into sections by type, then sort within each section
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
