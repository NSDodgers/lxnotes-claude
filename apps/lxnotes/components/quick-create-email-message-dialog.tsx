'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Eye } from 'lucide-react'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { PlaceholderChipPanel } from './placeholder-chip-panel'
import { DroppableInput } from './ui/droppable-input'
import { DroppableTextarea } from './ui/droppable-textarea'
import { 
  QuickCreatePresetDialog, 
  QuickCreatePresetDialogContent, 
  QuickCreatePresetDialogActions 
} from './quick-create-preset-dialog'
import { 
  PresetFormField,
  PresetFormInput,
  PresetFormTextarea,
  PresetFormToggle
} from './preset-dialog'
import { PresetSelector } from './preset-selector'
import { emailMessageFormSchema, type EmailMessageFormData } from '@/lib/validation/preset-schemas'
import type { EmailMessagePreset, ModuleType } from '@/types'
import { cn } from '@/lib/utils'

interface QuickCreateEmailMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  onPresetCreated: (preset: EmailMessagePreset) => void
  moduleType: ModuleType
  defaultValues?: Partial<EmailMessageFormData>
}

export function QuickCreateEmailMessageDialog({
  isOpen,
  onClose,
  onPresetCreated,
  moduleType,
  defaultValues = {}
}: QuickCreateEmailMessageDialogProps) {
  const { addPreset, getAvailablePlaceholders, resolvePlaceholders } = useEmailMessagePresetsStore()
  const { presets: filterSortPresets, getPresetsByModule } = useFilterSortPresetsStore()
  const { presets: pageStylePresets } = usePageStylePresetsStore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  // Refs no longer needed with DroppableInput/DroppableTextarea

  const form = useForm<EmailMessageFormData>({
    resolver: zodResolver(emailMessageFormSchema),
    defaultValues: {
      name: '',
      moduleType: moduleType,
      recipients: '',
      subject: '',
      message: '',
      filterAndSortPresetId: null,
      pageStylePresetId: null,
      includeNotesInBody: true,
      attachPdf: false,
      ...defaultValues,
    },
  })

  const moduleFilterPresets = getPresetsByModule(moduleType)

  const handleSubmit = async (data: EmailMessageFormData) => {
    setIsSubmitting(true)

    try {
      // Create preset using store
      const newPresetData = {
        type: 'email_message' as const,
        moduleType: data.moduleType,
        name: data.name,
        productionId: 'prod-1', // TODO: Get from production context
        config: {
          recipients: data.recipients,
          subject: data.subject,
          message: data.message,
          filterAndSortPresetId: data.filterAndSortPresetId,
          pageStylePresetId: data.pageStylePresetId,
          includeNotesInBody: data.includeNotesInBody,
          attachPdf: data.attachPdf,
        },
        isDefault: false,
        createdBy: 'user', // TODO: Get from auth
      }

      addPreset(newPresetData)

      // Create the preset object to return
      const createdPreset: EmailMessagePreset = {
        id: `email-message-${Math.random().toString(36).substr(2, 9)}`,
        productionId: 'prod-1', // TODO: Get from production context
        type: 'email_message',
        moduleType: data.moduleType,
        name: data.name,
        config: newPresetData.config,
        isDefault: false,
        createdBy: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      onPresetCreated(createdPreset)
      onClose()
    } catch (error) {
      console.error('Failed to create preset:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.reset()
    onClose()
  }


  // Generate a default name based on subject
  const generateDefaultName = () => {
    const subject = form.watch('subject')
    if (subject) {
      // Remove placeholders for the name
      const cleanSubject = subject.replace(/\{\{[^}]+\}\}/g, '').trim()
      if (cleanSubject.length > 30) {
        return cleanSubject.substring(0, 30) + '...'
      }
      return cleanSubject || 'Email Template'
    }
    return 'Email Template'
  }

  const handleAutoFillName = () => {
    const defaultName = generateDefaultName()
    form.setValue('name', defaultName)
  }

  const moduleDisplayNames: Record<ModuleType, string> = {
    cue: 'Cue Notes',
    work: 'Work Notes',
    production: 'Production Notes',
    actor: 'Actor Notes'
  }

  const getPreviewData = () => ({
    productionTitle: 'Sample Production',
    userFullName: 'Dev User',
    moduleName: moduleDisplayNames[moduleType],
    noteCount: 15,
    todoCount: 8,
    completeCount: 7,
    cancelledCount: 0,
    filterDescription: 'All notes',
    sortDescription: 'Sorted by priority (descending)',
    dateRange: 'All dates',
  })

  const availablePlaceholders = getAvailablePlaceholders()

  return (
    <QuickCreatePresetDialog
      open={isOpen}
      onClose={handleCancel}
      title="Create Email Message Preset"
      description="Quick create for email template"
      className="max-w-4xl"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <QuickCreatePresetDialogContent>
          <div className="space-y-4">
            {/* Preset Name */}
            <PresetFormField label="Preset Name" required>
              <div className="space-y-2">
                <PresetFormInput
                  {...form.register('name')}
                  placeholder="e.g., Daily Report Template"
                  disabled={isSubmitting}
                />
                {!form.watch('name') && form.watch('subject') && (
                  <button
                    type="button"
                    onClick={handleAutoFillName}
                    className="text-xs text-modules-production hover:text-modules-production/80"
                    disabled={isSubmitting}
                  >
                    Auto-fill name from subject
                  </button>
                )}
              </div>
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </PresetFormField>

            {/* Recipients */}
            <PresetFormField 
              label="Default Recipients" 
              description="Comma-separated email addresses (can be left empty)"
            >
              <PresetFormInput
                {...form.register('recipients')}
                placeholder="user1@example.com, user2@example.com"
                disabled={isSubmitting}
              />
              {form.formState.errors.recipients && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.recipients.message}
                </p>
              )}
            </PresetFormField>

            {/* Content divided into two columns */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                {/* Subject */}
                <PresetFormField label="Subject" required>
                  <DroppableInput
                    value={form.watch('subject')}
                    onChange={(value) => form.setValue('subject', value)}
                    availablePlaceholders={availablePlaceholders}
                    placeholder="{{PRODUCTION_TITLE}} - Daily Report {{CURRENT_DATE}}"
                    disabled={isSubmitting}
                    onPlaceholderInsert={(placeholder) => {
                      console.log('Placeholder inserted in subject:', placeholder)
                    }}
                  />
                  {form.formState.errors.subject && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.subject.message}
                    </p>
                  )}
                </PresetFormField>

                {/* Message */}
                <PresetFormField label="Message" required>
                  <DroppableTextarea
                    value={form.watch('message')}
                    onChange={(value) => form.setValue('message', value)}
                    availablePlaceholders={availablePlaceholders}
                    rows={8}
                    placeholder={`Hello team,

Here's the daily report for {{PRODUCTION_TITLE}} as of {{CURRENT_DATE}}.

Summary:
- Outstanding items: {{TODO_COUNT}}
- Completed today: {{COMPLETE_COUNT}}
- Total notes: {{NOTE_COUNT}}

Best regards,
{{USER_FULL_NAME}}`}
                    disabled={isSubmitting}
                    onPlaceholderInsert={(placeholder) => {
                      console.log('Placeholder inserted in message:', placeholder)
                    }}
                  />
                  {form.formState.errors.message && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.message.message}
                    </p>
                  )}
                </PresetFormField>
              </div>
              
              <div className="space-y-4">
                {/* Preview */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-text-secondary">Preview</h4>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-modules-production hover:text-modules-production/80 flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    {showPreview ? 'Hide' : 'Show'} preview
                  </button>
                </div>

                {showPreview && (form.watch('subject') || form.watch('message')) && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-text-secondary">Subject:</label>
                      <div className="text-sm bg-bg-tertiary p-2 rounded border">
                        {resolvePlaceholders(form.watch('subject'), getPreviewData())}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary">Message:</label>
                      <div className="text-sm bg-bg-tertiary p-2 rounded border whitespace-pre-wrap">
                        {resolvePlaceholders(form.watch('message'), getPreviewData())}
                      </div>
                    </div>
                    {form.watch('recipients') && (
                      <div className="text-xs text-text-muted border-t border-bg-hover pt-2">
                        To: {form.watch('recipients')}
                      </div>
                    )}
                  </div>
                )}

                {/* Placeholders */}
                <PlaceholderChipPanel
                  placeholders={availablePlaceholders}
                  title="Drag & Drop Placeholders"
                  searchable={true}
                  collapsible={true}
                  defaultExpanded={true}
                />
              </div>
            </div>

            {/* Optional Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-text-secondary">Optional Settings</h4>
              
              {moduleFilterPresets.length > 0 && (
                <PresetFormField 
                  label="Default Filter & Sort Preset" 
                  description="Pre-select a filter preset when using this template"
                >
                  <PresetSelector
                    presets={moduleFilterPresets}
                    selectedId={form.watch('filterAndSortPresetId')}
                    onSelect={(preset) => form.setValue('filterAndSortPresetId', preset?.id || null)}
                    placeholder="None (optional)"
                  />
                </PresetFormField>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <PresetFormToggle
                  checked={form.watch('includeNotesInBody')}
                  onCheckedChange={(checked) => form.setValue('includeNotesInBody', checked)}
                  label="Include Notes in Body"
                  description="Add notes table to email"
                />

                <PresetFormToggle
                  checked={form.watch('attachPdf')}
                  onCheckedChange={(checked) => {
                    form.setValue('attachPdf', checked)
                    if (!checked) {
                      form.setValue('pageStylePresetId', null)
                    }
                  }}
                  label="Attach PDF of notes"
                  description="Generate PDF attachment"
                />
              </div>

              {form.watch('attachPdf') && (
                <PresetFormField
                  label="Page Style Preset"
                  description="Page style for PDF attachment"
                >
                  <PresetSelector
                    presets={pageStylePresets}
                    selectedId={form.watch('pageStylePresetId')}
                    onSelect={(preset) => form.setValue('pageStylePresetId', preset?.id || null)}
                    placeholder="None (optional)"
                  />
                </PresetFormField>
              )}
            </div>
          </div>
        </QuickCreatePresetDialogContent>

        <QuickCreatePresetDialogActions>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !form.watch('name') || !form.watch('subject') || !form.watch('message')}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
              isSubmitting || !form.watch('name') || !form.watch('subject') || !form.watch('message')
                ? "bg-bg-tertiary text-text-muted cursor-not-allowed"
                : "bg-modules-production text-white hover:bg-modules-production/90"
            )}
          >
            {isSubmitting ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Mail className="h-3 w-3" />
                Create Preset
              </>
            )}
          </button>
        </QuickCreatePresetDialogActions>
      </form>
    </QuickCreatePresetDialog>
  )
}