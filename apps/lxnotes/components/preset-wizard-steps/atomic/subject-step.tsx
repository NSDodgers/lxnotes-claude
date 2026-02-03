'use client'

import { DroppableInput } from '@/components/ui/droppable-input'
import { PlaceholderChipPanel } from '@/components/placeholder-chip-panel'
import { PresetFormField } from '@/components/preset-dialog'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'

interface SubjectStepProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function SubjectStep({ value, onChange, error }: SubjectStepProps) {
  const { getAvailablePlaceholders } = useEmailMessagePresetsStore()
  const placeholders = getAvailablePlaceholders()

  return (
    <div className="space-y-4" data-testid="wizard-step-subject">
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">
          Write the email subject line. You can use placeholders that will be replaced when sending.
        </p>
      </div>

      <PresetFormField label="Subject" required>
        <DroppableInput
          value={value}
          onChange={onChange}
          availablePlaceholders={placeholders}
          placeholder="Email subject line..."
          data-testid="wizard-subject-input"
        />
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
      </PresetFormField>

      <div className="space-y-2">
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Available Placeholders
        </div>
        <p className="text-xs text-text-muted mb-2">
          Drag and drop onto the subject field above
        </p>
        <PlaceholderChipPanel placeholders={placeholders} />
      </div>
    </div>
  )
}
