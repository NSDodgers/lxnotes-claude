'use client'

import { useState, useRef } from 'react'
import { Plus, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { PresetCard } from './preset-card'
import { PresetSelector } from './preset-selector'
import { PlaceholderChipPanel } from './placeholder-chip-panel'
import { DroppableInput } from './ui/droppable-input'
import { DroppableTextarea } from './ui/droppable-textarea'
import { 
  PresetDialog, 
  PresetDialogContent, 
  PresetDialogActions,
  PresetFormField,
  PresetFormInput,
  PresetFormTextarea,
  PresetFormToggle
} from './preset-dialog'
import { emailMessageFormSchema, type EmailMessageFormData } from '@/lib/validation/preset-schemas'
import type { EmailMessagePreset } from '@/types'
import { cn } from '@/lib/utils'

export function EmailMessagePresetsManager() {
  const { 
    presets, 
    addPreset, 
    updatePreset, 
    deletePreset, 
    getAvailablePlaceholders,
    resolvePlaceholders 
  } = useEmailMessagePresetsStore()
  const { presets: filterSortPresets } = useFilterSortPresetsStore()
  const { presets: pageStylePresets } = usePageStylePresetsStore()
  
  const [collapsed, setCollapsed] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<EmailMessagePreset | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // Refs no longer needed with DroppableInput/DroppableTextarea

  const form = useForm<EmailMessageFormData>({
    resolver: zodResolver(emailMessageFormSchema),
    defaultValues: {
      name: '',
      recipients: '',
      subject: '',
      message: '',
      filterAndSortPresetId: null,
      pageStylePresetId: null,
      includeNotesInBody: true,
      attachPdf: false,
    },
  })

  const watchedAttachPdf = form.watch('attachPdf')
  const watchedSubject = form.watch('subject')
  const watchedMessage = form.watch('message')

  const availablePlaceholders = getAvailablePlaceholders()

  const handleCreate = () => {
    setEditingPreset(null)
    form.reset({
      name: '',
      recipients: '',
      subject: '',
      message: '',
      filterAndSortPresetId: null,
      pageStylePresetId: null,
      includeNotesInBody: true,
      attachPdf: false,
    })
    setIsDialogOpen(true)
    setShowPreview(false)
  }

  const handleEdit = (preset: EmailMessagePreset) => {
    setEditingPreset(preset)
    form.reset({
      name: preset.name,
      recipients: preset.config.recipients,
      subject: preset.config.subject,
      message: preset.config.message,
      filterAndSortPresetId: preset.config.filterAndSortPresetId,
      pageStylePresetId: preset.config.pageStylePresetId,
      includeNotesInBody: preset.config.includeNotesInBody,
      attachPdf: preset.config.attachPdf,
    })
    setIsDialogOpen(true)
    setShowPreview(false)
  }

  const handleDelete = (id: string) => {
    deletePreset(id)
  }

  const handleSubmit = (data: EmailMessageFormData) => {
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
    } else {
      // Create new preset
      addPreset({
        type: 'email_message',
        moduleType: 'all',
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
      })
    }
    
    setIsDialogOpen(false)
    setEditingPreset(null)
    form.reset()
  }

  const handleCancel = () => {
    setIsDialogOpen(false)
    setEditingPreset(null)
    form.reset()
    setShowPreview(false)
  }

  // Placeholder insertion now handled by DroppableInput/DroppableTextarea components

  const getPreviewData = () => ({
    productionTitle: 'Sample Production',
    userFullName: 'Dev User',
    noteCount: 15,
    todoCount: 8,
    completeCount: 7,
    cancelledCount: 0,
    filterDescription: 'All notes',
    sortDescription: 'Sorted by priority (descending)',
    dateRange: 'All dates',
  })

  const nonSystemPresets = presets.filter(p => !p.isDefault)
  const systemPresets = presets.filter(p => p.isDefault)

  return (
    <>
      <div className="rounded-lg bg-bg-secondary p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <h2 className="text-lg font-semibold text-text-primary">Email Message Presets</h2>
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="text-sm">({presets.length})</span>
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </div>
          </button>
          <button 
            onClick={handleCreate}
            className="text-sm text-modules-production hover:text-modules-production/80 font-medium flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Preset
          </button>
        </div>
        
        {!collapsed && (
          <div className="space-y-3">
            {presets.length === 0 ? (
              <p className="text-text-secondary text-sm py-4">
                No email message presets created yet. Click &quot;Add Preset&quot; to create your first one.
              </p>
            ) : (
              <>
                {/* System presets */}
                {systemPresets.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-text-secondary">System Defaults</h3>
                    {systemPresets.map((preset) => (
                      <PresetCard
                        key={preset.id}
                        preset={preset}
                        onEdit={(p) => handleEdit(p as EmailMessagePreset)}
                        onDelete={handleDelete}
                        showDetails={true}
                      />
                    ))}
                  </div>
                )}

                {/* Custom presets */}
                {nonSystemPresets.length > 0 && (
                  <div className="space-y-2">
                    {systemPresets.length > 0 && (
                      <h3 className="text-sm font-medium text-text-secondary mt-6">Custom Presets</h3>
                    )}
                    {nonSystemPresets.map((preset) => (
                      <PresetCard
                        key={preset.id}
                        preset={preset}
                        onEdit={(p) => handleEdit(p as EmailMessagePreset)}
                        onDelete={handleDelete}
                        showDetails={true}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <PresetDialog
        open={isDialogOpen}
        onClose={handleCancel}
        title={editingPreset ? 'Edit Email Message Preset' : 'Create Email Message Preset'}
        description="Create reusable email templates with dynamic placeholders"
        className="max-w-4xl"
      >
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <PresetDialogContent className="space-y-6">
            {/* Basic info */}
            <div className="grid gap-4 md:grid-cols-2">
              <PresetFormField label="Preset Name" required>
                <PresetFormInput
                  {...form.register('name')}
                  placeholder="e.g., Daily Lighting Report"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </PresetFormField>

              <PresetFormField 
                label="Recipients" 
                description="Comma-separated email addresses"
              >
                <PresetFormInput
                  {...form.register('recipients')}
                  placeholder="user1@example.com, user2@example.com"
                />
                {form.formState.errors.recipients && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.recipients.message}
                  </p>
                )}
              </PresetFormField>
            </div>

            {/* Email content */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <PresetFormField label="Subject Line" required>
                  <DroppableInput
                    value={form.watch('subject')}
                    onChange={(value) => form.setValue('subject', value)}
                    availablePlaceholders={availablePlaceholders}
                    placeholder="{{PRODUCTION_TITLE}} - Daily Report {{CURRENT_DATE}}"
                    onPlaceholderInsert={(placeholder) => {
                      // Optional callback for tracking placeholder usage
                      console.log('Placeholder inserted in subject:', placeholder)
                    }}
                  />
                  {form.formState.errors.subject && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.subject.message}
                    </p>
                  )}
                </PresetFormField>

                <PresetFormField label="Message Body" required>
                  <DroppableTextarea
                    value={form.watch('message')}
                    onChange={(value) => form.setValue('message', value)}
                    availablePlaceholders={availablePlaceholders}
                    rows={8}
                    placeholder="Hello team,

Here's today's report for {{PRODUCTION_TITLE}}.

Outstanding items: {{TODO_COUNT}}
Completed items: {{COMPLETE_COUNT}}

Best regards,
{{USER_FULL_NAME}}"
                    onPlaceholderInsert={(placeholder) => {
                      // Optional callback for tracking placeholder usage
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
                {/* Preview toggle */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-text-secondary">Preview</h4>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-modules-production hover:text-modules-production/80 flex items-center gap-1"
                  >
                    {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showPreview ? 'Hide' : 'Show'} preview
                  </button>
                </div>

                {showPreview && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-text-secondary">Subject:</label>
                      <div className="text-sm bg-bg-tertiary p-2 rounded border">
                        {resolvePlaceholders(watchedSubject, getPreviewData())}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary">Message:</label>
                      <div className="text-sm bg-bg-tertiary p-2 rounded border whitespace-pre-wrap">
                        {resolvePlaceholders(watchedMessage, getPreviewData())}
                      </div>
                    </div>
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

            {/* Integration settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-text-secondary">Integration Settings</h4>
              
              <PresetFormField 
                label="Filter & Sort Preset" 
                description="Choose which notes to include in the email"
              >
                <PresetSelector
                  presets={filterSortPresets}
                  selectedId={form.watch('filterAndSortPresetId')}
                  onSelect={(preset) => form.setValue('filterAndSortPresetId', preset?.id || null)}
                  placeholder="Select filter & sort preset..."
                />
              </PresetFormField>

              <div className="grid gap-4 md:grid-cols-2">
                <PresetFormToggle
                  checked={form.watch('includeNotesInBody')}
                  onCheckedChange={(checked) => form.setValue('includeNotesInBody', checked)}
                  label="Include Notes in Body"
                  description="Add a table of notes directly in the email"
                />

                <PresetFormToggle
                  checked={watchedAttachPdf}
                  onCheckedChange={(checked) => form.setValue('attachPdf', checked)}
                  label="Attach PDF"
                  description="Generate and attach a PDF file"
                />
              </div>

              {watchedAttachPdf && (
                <PresetFormField 
                  label="Page Style Preset" 
                  description="Choose PDF formatting for the attachment"
                >
                  <PresetSelector
                    presets={pageStylePresets}
                    selectedId={form.watch('pageStylePresetId')}
                    onSelect={(preset) => form.setValue('pageStylePresetId', preset?.id || null)}
                    placeholder="Select page style preset..."
                  />
                </PresetFormField>
              )}
            </div>
          </PresetDialogContent>

          <PresetDialogActions>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-modules-production text-white rounded-lg hover:bg-modules-production/90 transition-colors"
            >
              {editingPreset ? 'Update' : 'Create'} Preset
            </button>
          </PresetDialogActions>
        </form>
      </PresetDialog>
    </>
  )
}
