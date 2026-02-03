'use client'

import { Input } from '@/components/ui/input'
import { PresetFormField } from '@/components/preset-dialog'

interface RecipientsStepProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function RecipientsStep({ value, onChange, error }: RecipientsStepProps) {
  return (
    <div className="space-y-4" data-testid="wizard-step-recipients">
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">
          Enter the email addresses to send reports to.
        </p>
      </div>

      <PresetFormField
        label="Recipients"
        description="Separate multiple addresses with commas"
      >
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="email@example.com, team@example.com"
          type="email"
          data-testid="wizard-recipients-input"
        />
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
      </PresetFormField>

      <div className="text-xs text-text-muted">
        <strong>Tip:</strong> You can leave this blank and fill in recipients when sending.
      </div>
    </div>
  )
}
