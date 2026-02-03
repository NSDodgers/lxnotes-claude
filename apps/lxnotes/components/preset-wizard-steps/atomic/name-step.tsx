'use client'

import { PresetFormField, PresetFormInput } from '@/components/preset-dialog'

interface NameStepProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function NameStep({ value, onChange, error }: NameStepProps) {
  return (
    <div className="space-y-4" data-testid="wizard-step-name">
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">
          Give your preset a name that describes when you&apos;ll use it.
        </p>
      </div>

      <PresetFormField label="Preset Name" required>
        <PresetFormInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., Daily Report, Tech Rehearsal Notes"
          autoFocus
          data-testid="wizard-name-input"
        />
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
      </PresetFormField>
    </div>
  )
}
