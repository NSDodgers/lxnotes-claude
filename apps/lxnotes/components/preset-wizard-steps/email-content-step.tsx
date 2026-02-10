'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DroppableInput } from '@/components/ui/droppable-input'
import { DroppableTextarea } from '@/components/ui/droppable-textarea'
import { PlaceholderChipPanel } from '@/components/placeholder-chip-panel'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'

interface EmailContentStepProps {
  recipients: string
  subject: string
  message: string
  onRecipientsChange: (val: string) => void
  onSubjectChange: (val: string) => void
  onMessageChange: (val: string) => void
}

export function EmailContentStep({
  recipients,
  subject,
  message,
  onRecipientsChange,
  onSubjectChange,
  onMessageChange,
}: EmailContentStepProps) {
  const { getAvailablePlaceholders } = useEmailMessagePresetsStore()
  const placeholders = getAvailablePlaceholders()

  return (
    <div className="space-y-4" data-testid="wizard-step-email-content">
      {/* Recipients */}
      <div className="space-y-2">
        <Label htmlFor="wizard-recipients" className="text-sm font-medium">
          To
        </Label>
        <Input
          id="wizard-recipients"
          value={recipients}
          onChange={(e) => onRecipientsChange(e.target.value)}
          placeholder="email@example.com, team@example.com"
          data-testid="wizard-recipients-input"
        />
      </div>

      {/* Subject with placeholder support */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Subject</Label>
        <DroppableInput
          value={subject}
          onChange={onSubjectChange}
          availablePlaceholders={placeholders}
          placeholder="Email subject line..."
          data-testid="wizard-subject-input"
        />
      </div>

      {/* Message with placeholder support */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Message</Label>
        <DroppableTextarea
          value={message}
          onChange={onMessageChange}
          availablePlaceholders={placeholders}
          placeholder="Email body..."
          className="min-h-[150px]"
          data-testid="wizard-message-input"
        />
      </div>

      {/* Placeholder chips */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Drag placeholders into fields above
        </Label>
        <PlaceholderChipPanel placeholders={placeholders} />
      </div>
    </div>
  )
}
