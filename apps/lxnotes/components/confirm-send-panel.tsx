'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Pencil, Send, Download, Loader2, Check, X, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DroppableInput } from '@/components/ui/droppable-input'
import { DroppableTextarea } from '@/components/ui/droppable-textarea'
import { PlaceholderChipPanel } from '@/components/placeholder-chip-panel'
import { resolvePlaceholders, PlaceholderData } from '@/lib/utils/placeholders'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'
import { filterAndSortNotes } from '@/lib/utils/filter-sort-notes'
import { useProductionOptional } from '@/components/production/production-provider'
import type { EmailMessagePreset, PrintPreset, ModuleType, Note } from '@/types'

type ActionPreset = EmailMessagePreset | PrintPreset

interface ConfirmSendPanelProps {
  preset: ActionPreset
  moduleType: ModuleType
  notes: Note[]
  placeholderData: PlaceholderData
  variant: 'email' | 'print'
  isSubmitting: boolean
  submitError: string | null
  onBack: () => void
  onSubmit: (overrides?: EmailOverrides) => void
}

export interface EmailOverrides {
  recipients?: string
  subject?: string
  message?: string
}

export function ConfirmSendPanel({
  preset,
  moduleType,
  notes,
  placeholderData,
  variant,
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}: ConfirmSendPanelProps) {
  const { getPreset: getFilterPreset } = useFilterSortPresetsStore()
  const { presets: pageStylePresets } = usePageStylePresetsStore()
  const { getPriorities } = useCustomPrioritiesStore()
  const productionContext = useProductionOptional()
  const updateEmailPreset = productionContext?.updateEmailPreset

  // Per-field override state
  const [editingField, setEditingField] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<EmailOverrides>({})
  const [isSavingPreset, setIsSavingPreset] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  // Local copy of preset that gets updated after save, so we don't rely on stale parent prop
  const [localPreset, setLocalPreset] = useState(preset)

  const isEmail = variant === 'email' && localPreset.type === 'email_message'
  const emailPreset = isEmail ? (localPreset as EmailMessagePreset) : null

  // Resolve linked presets
  const filterPresetId = emailPreset
    ? emailPreset.config.filterAndSortPresetId
    : (localPreset as PrintPreset).config.filterSortPresetId
  const pageStylePresetId = emailPreset
    ? emailPreset.config.pageStylePresetId
    : (localPreset as PrintPreset).config.pageStylePresetId

  const filterPreset = filterPresetId ? getFilterPreset(filterPresetId) : null
  const pageStylePreset = pageStylePresetId
    ? pageStylePresets.find(p => p.id === pageStylePresetId)
    : null

  // Compute note count
  const noteCount = useMemo(() => {
    if (!filterPreset) return notes.length
    const customPriorities = getPriorities(moduleType)
    return filterAndSortNotes(notes, filterPreset, customPriorities).length
  }, [notes, filterPreset, moduleType, getPriorities])

  // Resolve placeholder values for display
  const resolvedRecipients = emailPreset
    ? (overrides.recipients ?? emailPreset.config.recipients)
    : ''
  const resolvedSubject = emailPreset
    ? resolvePlaceholders(overrides.subject ?? emailPreset.config.subject, placeholderData)
    : ''
  const resolvedMessage = emailPreset
    ? resolvePlaceholders(overrides.message ?? emailPreset.config.message, placeholderData)
    : ''

  const handleFieldEdit = (field: string, value: string) => {
    setOverrides(prev => ({ ...prev, [field]: value }))
    setEditingField(null)
    setSaveSuccess(false) // Reset save success when editing
  }

  const handleCancelEdit = () => {
    setEditingField(null)
  }

  const handleSubmit = () => {
    const hasOverrides = Object.keys(overrides).length > 0
    onSubmit(hasOverrides ? overrides : undefined)
  }

  // Save current configuration to production preset
  const handleSaveToPreset = async () => {
    if (!updateEmailPreset || !emailPreset) return

    setIsSavingPreset(true)
    setSaveSuccess(false)

    try {
      const updatedPreset: EmailMessagePreset = {
        ...emailPreset,
        config: {
          ...emailPreset.config,
          recipients: overrides.recipients ?? emailPreset.config.recipients,
          subject: overrides.subject ?? emailPreset.config.subject,
          message: overrides.message ?? emailPreset.config.message,
        },
        updatedAt: new Date(),
      }

      await updateEmailPreset(updatedPreset)
      setSaveSuccess(true)

      // Update local copy so display stays correct, then clear overrides
      setLocalPreset(updatedPreset)
      setOverrides({})
    } catch (err) {
      console.error('Error saving preset:', err)
    } finally {
      setIsSavingPreset(false)
    }
  }

  const hasUnsavedChanges = Object.keys(overrides).length > 0
  const canSaveToPreset = isEmail && hasUnsavedChanges && updateEmailPreset

  // For email, recipients must be set
  const canSubmit = isEmail
    ? resolvedRecipients.trim().length > 0
    : true

  return (
    <div className="flex flex-col h-full" data-testid="confirm-send-panel">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-bg-tertiary">
        <button
          onClick={onBack}
          className="p-1 hover:bg-bg-hover rounded transition-colors"
          data-testid="confirm-panel-back"
        >
          <ArrowLeft className="h-4 w-4 text-text-secondary" />
        </button>
        <h3 className="font-medium text-text-primary truncate">{localPreset.name}</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* Email fields (only for email variant) */}
        {isEmail && emailPreset && (
          <div className="space-y-3">
            {/* Recipients */}
            <EditableField
              label="To"
              value={resolvedRecipients}
              isEditing={editingField === 'recipients'}
              onStartEdit={() => setEditingField('recipients')}
              onSave={(val) => handleFieldEdit('recipients', val)}
              onCancel={handleCancelEdit}
              testId="confirm-field-recipients"
            />

            {/* Subject */}
            <EditableField
              label="Subject"
              value={resolvedSubject}
              rawValue={overrides.subject ?? emailPreset.config.subject}
              isEditing={editingField === 'subject'}
              onStartEdit={() => setEditingField('subject')}
              onSave={(val) => handleFieldEdit('subject', val)}
              onCancel={handleCancelEdit}
              showPlaceholders
              testId="confirm-field-subject"
            />

            {/* Message */}
            <EditableField
              label="Body"
              value={resolvedMessage}
              rawValue={overrides.message ?? emailPreset.config.message}
              isEditing={editingField === 'message'}
              onStartEdit={() => setEditingField('message')}
              onSave={(val) => handleFieldEdit('message', val)}
              onCancel={handleCancelEdit}
              multiline
              showPlaceholders
              testId="confirm-field-message"
            />
          </div>
        )}

        {/* Details section */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Details
          </div>
          <div className="rounded-lg border border-bg-tertiary bg-bg-secondary p-3 space-y-2 text-sm">
            {filterPreset && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Filter</span>
                <span className="text-text-primary">{filterPreset.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-secondary">Notes</span>
              <span className="text-text-primary">{noteCount} matching</span>
            </div>
            {pageStylePreset && (
              <div className="flex justify-between">
                <span className="text-text-secondary">PDF</span>
                <span className="text-text-primary">
                  {pageStylePreset.config.paperSize.toUpperCase()} {pageStylePreset.config.orientation} ✓
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {submitError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {/* Save to preset option */}
        {canSaveToPreset && (
          <div className="rounded-lg border border-bg-tertiary bg-bg-secondary p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-text-primary">Save changes to preset?</span>
                <p className="text-xs text-text-secondary mt-0.5">
                  Everyone on this production will see these settings
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveToPreset}
                disabled={isSavingPreset}
                data-testid="save-to-preset-btn"
              >
                {isSavingPreset ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Save success message */}
        {saveSuccess && !hasUnsavedChanges && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
            Preset saved for this production
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="pt-4 border-t border-bg-tertiary">
        {isEmail && !canSubmit && (
          <p className="text-sm text-text-muted mb-3 text-center">
            Please add recipients to send email
          </p>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit}
          className="w-full"
          data-testid="confirm-panel-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {variant === 'email' ? 'Sending...' : 'Generating...'}
            </>
          ) : (
            <>
              {variant === 'email' ? (
                <Send className="h-4 w-4 mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {variant === 'email' ? 'Send Email' : 'Download PDF'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Editable field with pencil icon override
interface EditableFieldProps {
  label: string
  value: string
  rawValue?: string // unresolved value for editing (with placeholders)
  isEditing: boolean
  onStartEdit: () => void
  onSave: (value: string) => void
  onCancel: () => void
  multiline?: boolean
  showPlaceholders?: boolean // Show placeholder chips when editing
  testId: string
}

function EditableField({
  label,
  value,
  rawValue,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  multiline,
  showPlaceholders,
  testId,
}: EditableFieldProps) {
  const [editValue, setEditValue] = useState('')
  const { getAvailablePlaceholders } = useEmailMessagePresetsStore()
  const placeholders = getAvailablePlaceholders()

  const handleStartEdit = () => {
    setEditValue(rawValue ?? value)
    onStartEdit()
  }

  const handleSave = () => {
    onSave(editValue)
  }

  if (isEditing) {
    return (
      <div className="space-y-2" data-testid={testId}>
        <div className="text-xs font-medium text-text-secondary">{label}</div>
        {showPlaceholders ? (
          // Use droppable inputs with placeholder support
          multiline ? (
            <DroppableTextarea
              value={editValue}
              onChange={setEditValue}
              availablePlaceholders={placeholders}
              className="min-h-[100px] text-sm"
            />
          ) : (
            <DroppableInput
              value={editValue}
              onChange={setEditValue}
              availablePlaceholders={placeholders}
              className="text-sm"
            />
          )
        ) : (
          // Regular inputs for non-placeholder fields
          multiline ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="min-h-[100px] text-sm"
              autoFocus
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-sm"
              autoFocus
            />
          )
        )}
        {/* Show placeholder chips when editing subject/message */}
        {showPlaceholders && (
          <PlaceholderChipPanel
            placeholders={placeholders}
            title="Drag placeholders into field"
            collapsible={false}
            searchable={false}
            className="max-h-48"
          />
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSave}>
            <Check className="h-3 w-3 mr-1" />
            Done
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group" data-testid={testId}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        <button
          onClick={handleStartEdit}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-bg-hover rounded transition-all"
          title={`Edit ${label.toLowerCase()}`}
          data-testid={`${testId}-edit`}
        >
          <Pencil className="h-3 w-3 text-text-secondary" />
        </button>
      </div>
      <div className={cn(
        'text-sm text-text-primary',
        multiline && 'whitespace-pre-wrap max-h-[120px] overflow-y-auto'
      )}>
        {value || <span className="text-text-muted italic">Not set</span>}
      </div>
    </div>
  )
}
