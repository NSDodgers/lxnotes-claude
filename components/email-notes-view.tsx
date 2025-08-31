'use client'

import { useState } from 'react'
import { Mail, Eye, Send } from 'lucide-react'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { PresetSelector } from './preset-selector'
import { QuickCreateFilterSortDialog } from './quick-create-filter-sort-dialog'
import { QuickCreatePageStyleDialog } from './quick-create-page-style-dialog'
import { QuickCreateEmailMessageDialog } from './quick-create-email-message-dialog'
import { 
  PresetDialog, 
  PresetDialogContent, 
  PresetDialogActions,
  PresetFormField,
  PresetFormInput,
  PresetFormTextarea,
  PresetFormToggle
} from './preset-dialog'
import type { ModuleType, EmailMessagePreset, FilterSortPreset, PageStylePreset } from '@/types'
import { cn } from '@/lib/utils'

interface EmailNotesViewProps {
  moduleType: ModuleType
  isOpen: boolean
  onClose: () => void
}

export function EmailNotesView({ moduleType, isOpen, onClose }: EmailNotesViewProps) {
  const { presets: emailPresets, resolvePlaceholders } = useEmailMessagePresetsStore()
  const { presets: filterSortPresets, getPresetsByModule } = useFilterSortPresetsStore()
  const { presets: pageStylePresets } = usePageStylePresetsStore()
  
  const [selectedEmailPreset, setSelectedEmailPreset] = useState<EmailMessagePreset | null>(null)
  const [selectedFilterPreset, setSelectedFilterPreset] = useState<string | null>(null)
  const [selectedPageStylePreset, setSelectedPageStylePreset] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showFilterQuickCreate, setShowFilterQuickCreate] = useState(false)
  const [showPageStyleQuickCreate, setShowPageStyleQuickCreate] = useState(false)
  const [showEmailMessageQuickCreate, setShowEmailMessageQuickCreate] = useState(false)
  const [editingFilterPreset, setEditingFilterPreset] = useState<FilterSortPreset | null>(null)
  const [editingPageStylePreset, setEditingPageStylePreset] = useState<PageStylePreset | null>(null)
  const [editingEmailPreset, setEditingEmailPreset] = useState<EmailMessagePreset | null>(null)
  
  // Manual email fields (when not using preset)
  const [recipients, setRecipients] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [includeNotesInBody, setIncludeNotesInBody] = useState(true)
  const [attachPdf, setAttachPdf] = useState(false)

  if (!isOpen) return null

  const moduleFilterPresets = getPresetsByModule(moduleType)

  const handlePresetLoad = (preset: EmailMessagePreset | null) => {
    setSelectedEmailPreset(preset)
    if (preset) {
      setRecipients(preset.config.recipients)
      setSubject(preset.config.subject)
      setMessage(preset.config.message)
      setSelectedFilterPreset(preset.config.filterAndSortPresetId)
      setSelectedPageStylePreset(preset.config.pageStylePresetId)
      setIncludeNotesInBody(preset.config.includeNotesInBody)
      setAttachPdf(preset.config.attachPdf)
    } else {
      // Clear form
      setRecipients('')
      setSubject('')
      setMessage('')
      setSelectedFilterPreset(null)
      setSelectedPageStylePreset(null)
      setIncludeNotesInBody(true)
      setAttachPdf(false)
    }
  }

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

  const handleSend = () => {
    // In a real implementation, this would send the email
    alert('Email would be sent here!')
    onClose()
  }

  const handleFilterPresetCreated = (preset: FilterSortPreset) => {
    setSelectedFilterPreset(preset.id)
    setShowFilterQuickCreate(false)
  }

  const handlePageStylePresetCreated = (preset: PageStylePreset) => {
    setSelectedPageStylePreset(preset.id)
    setShowPageStyleQuickCreate(false)
  }

  const handleEmailMessagePresetCreated = (preset: EmailMessagePreset) => {
    handlePresetLoad(preset)
    setShowEmailMessageQuickCreate(false)
  }

  const handleEditFilterPreset = (preset: FilterSortPreset) => {
    setEditingFilterPreset(preset)
    setShowFilterQuickCreate(true)
  }

  const handleEditPageStylePreset = (preset: PageStylePreset) => {
    setEditingPageStylePreset(preset)
    setShowPageStyleQuickCreate(true)
  }

  const handleEditEmailPreset = (preset: EmailMessagePreset) => {
    setEditingEmailPreset(preset)
    setShowEmailMessageQuickCreate(true)
  }

  const moduleName = {
    cue: 'Cue Notes',
    work: 'Work Notes',
    production: 'Production Notes'
  }[moduleType]

  return (
    <PresetDialog
      open={isOpen}
      onClose={onClose}
      title={`Email ${moduleName}`}
      description="Send notes via email with optional PDF attachment"
      className="max-w-4xl"
    >
      <PresetDialogContent className="space-y-6">
        {/* Preset Selection */}
        <div className="bg-bg-tertiary rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-text-primary">Use Email Preset</h3>
          </div>
          <PresetSelector
            presets={emailPresets}
            selectedId={selectedEmailPreset?.id || null}
            onSelect={(preset) => handlePresetLoad(preset as EmailMessagePreset)}
            placeholder="Choose email template or compose manually..."
            enableQuickCreate={true}
            presetType="email_message"
            onQuickCreate={() => setShowEmailMessageQuickCreate(true)}
            onEdit={(preset) => handleEditEmailPreset(preset as EmailMessagePreset)}
            canEdit={() => true}
          />
          {selectedEmailPreset && (
            <p className="text-xs text-text-muted mt-2">
              Preset loaded - you can modify any settings below before sending
            </p>
          )}
        </div>

        {/* Manual Email Composition */}
        <div className="grid gap-4 md:grid-cols-2">
          <PresetFormField label="Recipients" required>
            <PresetFormInput
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="user1@example.com, user2@example.com"
            />
          </PresetFormField>

          <PresetFormField label="Subject" required>
            <PresetFormInput
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={`${moduleName} Report`}
            />
          </PresetFormField>
        </div>

        <PresetFormField label="Message" required>
          <PresetFormTextarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Enter your message here..."
          />
        </PresetFormField>

        {/* Filter & PDF Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-text-secondary">Content Settings</h4>
          
          <PresetFormField 
            label="Filter & Sort Preset" 
            description="Choose which notes to include"
          >
            <PresetSelector
              presets={moduleFilterPresets}
              selectedId={selectedFilterPreset}
              onSelect={(preset) => setSelectedFilterPreset(preset?.id || null)}
              placeholder="Select filter preset (optional)..."
              enableQuickCreate={true}
              presetType="filter_sort"
              moduleType={moduleType}
              onQuickCreate={() => setShowFilterQuickCreate(true)}
              onEdit={(preset) => handleEditFilterPreset(preset as FilterSortPreset)}
              canEdit={() => true}
            />
          </PresetFormField>

          <div className="grid gap-4 md:grid-cols-2">
            <PresetFormToggle
              checked={includeNotesInBody}
              onCheckedChange={setIncludeNotesInBody}
              label="Include Notes in Body"
              description="Add notes table directly in email"
            />

            <PresetFormToggle
              checked={attachPdf}
              onCheckedChange={setAttachPdf}
              label="Attach PDF"
              description="Generate and attach PDF file"
            />
          </div>

          {attachPdf && (
            <PresetFormField label="Page Style Preset" description="PDF formatting options">
              <PresetSelector
                presets={pageStylePresets}
                selectedId={selectedPageStylePreset}
                onSelect={(preset) => setSelectedPageStylePreset(preset?.id || null)}
                placeholder="Select page style preset..."
                enableQuickCreate={true}
                presetType="page_style"
                onQuickCreate={() => setShowPageStyleQuickCreate(true)}
                onEdit={(preset) => handleEditPageStylePreset(preset as PageStylePreset)}
                canEdit={() => true}
              />
            </PresetFormField>
          )}
        </div>

        {/* Preview */}
        {(subject || message) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-text-secondary">Preview</h4>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-modules-production hover:text-modules-production/80 flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                {showPreview ? 'Hide' : 'Show'} preview
              </button>
            </div>

            {showPreview && (
              <div className="bg-bg-tertiary rounded-lg p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary">To:</label>
                  <div className="text-sm text-text-primary">{recipients || 'No recipients'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">Subject:</label>
                  <div className="text-sm text-text-primary">
                    {resolvePlaceholders(subject, getPreviewData())}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">Message:</label>
                  <div className="text-sm text-text-primary whitespace-pre-wrap">
                    {resolvePlaceholders(message, getPreviewData())}
                  </div>
                </div>
                {selectedFilterPreset && (
                  <div className="text-xs text-text-muted border-t border-bg-hover pt-2">
                    Notes will be filtered using the selected preset
                  </div>
                )}
                {attachPdf && (
                  <div className="text-xs text-text-muted">
                    PDF attachment will be generated
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="bg-bg-tertiary rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-text-secondary" />
            <span className="text-text-secondary">
              Email will be sent to {recipients ? recipients.split(',').length : 0} recipients
              {selectedFilterPreset && ' with filtered notes'}
              {includeNotesInBody && ' (notes in body)'}
              {attachPdf && ' (PDF attached)'}
            </span>
          </div>
        </div>
      </PresetDialogContent>

      <PresetDialogActions>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={!recipients || !subject || !message}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
            !recipients || !subject || !message
              ? "bg-bg-tertiary text-text-muted cursor-not-allowed"
              : "bg-modules-production text-white hover:bg-modules-production/90"
          )}
        >
          <Send className="h-4 w-4" />
          Send Email
        </button>
      </PresetDialogActions>
      
      {/* Quick Create Filter/Sort Dialog */}
      <QuickCreateFilterSortDialog
        isOpen={showFilterQuickCreate}
        onClose={() => setShowFilterQuickCreate(false)}
        onPresetCreated={handleFilterPresetCreated}
        moduleType={moduleType}
      />
      
      {/* Quick Create Page Style Dialog */}
      <QuickCreatePageStyleDialog
        isOpen={showPageStyleQuickCreate}
        onClose={() => setShowPageStyleQuickCreate(false)}
        onPresetCreated={handlePageStylePresetCreated}
      />
      
      {/* Quick Create Email Message Dialog */}
      <QuickCreateEmailMessageDialog
        isOpen={showEmailMessageQuickCreate}
        onClose={() => setShowEmailMessageQuickCreate(false)}
        onPresetCreated={handleEmailMessagePresetCreated}
        moduleType={moduleType}
      />
    </PresetDialog>
  )
}