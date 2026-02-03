'use client'

import { DroppableTextarea } from '@/components/ui/droppable-textarea'
import { PlaceholderChipPanel } from '@/components/placeholder-chip-panel'
import { PresetFormField } from '@/components/preset-dialog'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'

interface MessageStepProps {
  value: string
  onChange: (value: string) => void
}

export function MessageStep({ value, onChange }: MessageStepProps) {
  const { getAvailablePlaceholders } = useEmailMessagePresetsStore()
  const placeholders = getAvailablePlaceholders()

  return (
    <div className="space-y-4" data-testid="wizard-step-message">
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">
          Write the email body. Placeholders will be replaced when sending.
        </p>
      </div>

      <PresetFormField label="Message" description="The main content of your email">
        <DroppableTextarea
          value={value}
          onChange={onChange}
          availablePlaceholders={placeholders}
          placeholder="Email body text..."
          className="min-h-[120px]"
          data-testid="wizard-message-input"
        />
      </PresetFormField>

      <div className="space-y-2">
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Available Placeholders
        </div>
        <p className="text-xs text-text-muted mb-2">
          Drag and drop onto the message field above
        </p>
        <PlaceholderChipPanel placeholders={placeholders} />
      </div>
    </div>
  )
}
