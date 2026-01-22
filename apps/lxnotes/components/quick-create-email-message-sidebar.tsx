'use client'

import { useState, useEffect } from 'react'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  PresetFormField,
  PresetFormInput,
  PresetFormToggle
} from './preset-dialog'
import { PresetSelector } from './preset-selector'
import { emailMessageFormSchema, type EmailMessageFormData } from '@/lib/validation/preset-schemas'
import type { EmailMessagePreset, ModuleType } from '@/types'

interface QuickCreateEmailMessageSidebarProps {
  isOpen: boolean
  onClose: () => void
  onPresetCreated: (preset: EmailMessagePreset) => void
  moduleType: ModuleType
  defaultValues?: Partial<EmailMessageFormData>
  editingPreset?: EmailMessagePreset | null
}

export function QuickCreateEmailMessageSidebar({
  isOpen,
  onClose,
  onPresetCreated,
  moduleType,
  defaultValues = {},
  editingPreset
}: QuickCreateEmailMessageSidebarProps) {
  const { addPreset, updatePreset, getAvailablePlaceholders, resolvePlaceholders } = useEmailMessagePresetsStore()
  const { getPresetsByModule } = useFilterSortPresetsStore()
  const { presets: pageStylePresets } = usePageStylePresetsStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

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

  // Populate form when editing
  useEffect(() => {
    if (editingPreset) {
      form.reset({
        name: editingPreset.name,
        moduleType: editingPreset.moduleType,
        recipients: editingPreset.config.recipients,
        subject: editingPreset.config.subject,
        message: editingPreset.config.message,
        filterAndSortPresetId: editingPreset.config.filterAndSortPresetId,
        pageStylePresetId: editingPreset.config.pageStylePresetId,
        includeNotesInBody: editingPreset.config.includeNotesInBody,
        attachPdf: editingPreset.config.attachPdf,
      })
    } else {
      // Reset to defaults if not editing
      form.reset({
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
      })
    }
    // Note: defaultValues is intentionally excluded from dependencies because it's passed
    // as a default prop value (= {}) which creates a new reference on every render.
    // We only want to reset the form when isOpen or editingPreset changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPreset, isOpen, moduleType])

  const moduleFilterPresets = getPresetsByModule(moduleType)

  const handleSubmit = async (data: EmailMessageFormData) => {
    setIsSubmitting(true)

    try {
      if (editingPreset) {
        // Update existing preset
        updatePreset(editingPreset.id, {
          name: data.name,
          config: {
            recipients: data.recipients,
            subject: data.subject,
            message: data.message,
            filterAndSortPresetId: data.filterAndSortPresetId,
            pageStylePresetId: data.pageStylePresetId,
            includeNotesInBody: data.includeNotesInBody,
            attachPdf: data.attachPdf,
          }
        })

        // Pass back updated preset
        const updatedPreset = {
          ...editingPreset,
          name: data.name,
          config: {
            recipients: data.recipients,
            subject: data.subject,
            message: data.message,
            filterAndSortPresetId: data.filterAndSortPresetId,
            pageStylePresetId: data.pageStylePresetId,
            includeNotesInBody: data.includeNotesInBody,
            attachPdf: data.attachPdf,
          },
          updatedAt: new Date()
        }
        onPresetCreated(updatedPreset)
      } else {
        // Create new preset
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

        // Mock created preset since store doesn't return it
        const createdPreset: EmailMessagePreset = {
          id: `email-message-${Math.random().toString(36).substr(2, 9)}`,
          productionId: 'prod-1',
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
      }
      onClose()
    } catch (error) {
      console.error('Failed to save preset:', error)
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl flex flex-col overflow-hidden p-0">
        <SheetHeader className="p-6 pb-4 border-b border-bg-tertiary">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-text-primary" />
            <SheetTitle>{editingPreset ? 'Edit Email Message Preset' : 'Create Email Message Preset'}</SheetTitle>
          </div>
          <SheetDescription>
            {editingPreset ? 'Edit your existing email template' : 'Quick create for email template'}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-bg-tertiary p-6">
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isSubmitting || !form.watch('name') || !form.watch('subject') || !form.watch('message')}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {editingPreset ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Mail className="h-3 w-3" />
                  {editingPreset ? 'Save Changes' : 'Create Preset'}
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}