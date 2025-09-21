'use client'

import { useState } from 'react'
import { Mail, Eye, Send } from 'lucide-react'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { useProductionStore } from '@/lib/stores/production-store'
import { PresetSelector } from './preset-selector'
import { QuickCreateFilterSortSidebar } from './quick-create-filter-sort-sidebar'
import { QuickCreatePageStyleSidebar } from './quick-create-page-style-sidebar'
import { QuickCreateEmailMessageSidebar } from './quick-create-email-message-sidebar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ModuleType, EmailMessagePreset, FilterSortPreset, PageStylePreset } from '@/types'
import { cn } from '@/lib/utils'
import { PDFGenerationService } from '@/lib/services/pdf'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'

interface EmailNotesSidebarProps {
  moduleType: ModuleType
  isOpen: boolean
  onClose: () => void
}

export function EmailNotesSidebar({ moduleType, isOpen, onClose }: EmailNotesSidebarProps) {
  const { presets: emailPresets, resolvePlaceholders } = useEmailMessagePresetsStore()
  const { presets: filterSortPresets, getPresetsByModule } = useFilterSortPresetsStore()
  const { presets: pageStylePresets } = usePageStylePresetsStore()
  const { name: productionName, logo: productionLogo } = useProductionStore()

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
    productionTitle: productionName,
    userFullName: 'Dev User',
    noteCount: 15,
    todoCount: 8,
    completeCount: 7,
    cancelledCount: 0,
    filterDescription: 'All notes',
    sortDescription: 'Sorted by priority (descending)',
    dateRange: 'All dates',
  })

  const handleSend = async () => {
    if (!recipients || !subject || !message) {
      return
    }

    try {
      let pdfBlob: Blob | null = null

      // Generate PDF attachment if requested
      if (attachPdf && selectedFilterPreset && selectedPageStylePreset) {
        const mockNotesStore = useMockNotesStore.getState()
        const notes = mockNotesStore.getAllNotes(moduleType)
        const filterPreset = filterSortPresets.find(p => p.id === selectedFilterPreset)
        const pageStylePreset = pageStylePresets.find(p => p.id === selectedPageStylePreset)

        if (filterPreset && pageStylePreset) {
          const pdfService = PDFGenerationService.getInstance()
          const result = await pdfService.generatePDF({
            moduleType,
            filterPreset,
            pageStylePreset,
            notes,
            productionName,
            productionLogo
          })

          if (result.success && result.pdfBlob) {
            pdfBlob = result.pdfBlob
          }
        }
      }

      // In a real implementation, this would send the email with the PDF attachment
      if (pdfBlob) {
        // Create a temporary download link to show the PDF was generated
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${moduleType}_notes_attachment.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        alert(`Email would be sent with PDF attachment!\n\nTo: ${recipients}\nSubject: ${subject}`)
      } else {
        alert(`Email would be sent!\n\nTo: ${recipients}\nSubject: ${subject}`)
      }

      onClose()
    } catch (error) {
      console.error('Email send error:', error)
      alert('Failed to prepare email. Please try again.')
    }
  }

  const handleFilterPresetCreated = (preset: FilterSortPreset) => {
    setSelectedFilterPreset(preset.id)
    setShowFilterQuickCreate(false)
  }

  const handlePageStylePresetCreated = (preset: PageStylePreset) => {
    setSelectedPageStylePreset(preset.id)
    setShowPageStyleQuickCreate(false)
  }

  const handleEmailPresetCreated = (preset: EmailMessagePreset) => {
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

  // Resolve placeholders in email content for preview
  const previewSubject = selectedEmailPreset
    ? resolvePlaceholders(subject, getPreviewData())
    : subject

  const previewMessage = selectedEmailPreset
    ? resolvePlaceholders(message, getPreviewData())
    : message

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-3xl flex flex-col overflow-hidden p-0">
          <SheetHeader className="p-6 pb-4 border-b border-bg-tertiary">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-text-primary" />
              <SheetTitle>Email {moduleName}</SheetTitle>
            </div>
            <SheetDescription>
              Send notes via email with optional PDF attachment
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Email Message Preset */}
              <div className="space-y-3">
                <h3 className="font-medium text-text-primary flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Template
                </h3>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Email Message Preset (optional)
                  </label>
                  <p className="text-xs text-text-muted">
                    Use a saved template or create a custom message
                  </p>
                  <PresetSelector
                    presets={emailPresets}
                    selectedId={selectedEmailPreset?.id || null}
                    onSelect={(preset) => handlePresetLoad(preset as EmailMessagePreset)}
                    placeholder="Create custom message or select template..."
                    enableQuickCreate={true}
                    presetType="email_message"
                    onQuickCreate={() => setShowEmailMessageQuickCreate(true)}
                    onEdit={(preset) => handleEditEmailPreset(preset as EmailMessagePreset)}
                    canEdit={() => true}
                  />
                </div>
              </div>

              {/* Manual Email Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipients">
                    Recipients <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="recipients"
                    type="email"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    placeholder="user@example.com, user2@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject line..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Email message..."
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* Email Options */}
              <div className="space-y-3">
                <h3 className="font-medium text-text-primary">Options</h3>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeNotesInBody"
                      checked={includeNotesInBody}
                      onChange={(e) => setIncludeNotesInBody(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="includeNotesInBody" className="text-sm">
                      Include notes summary in email body
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="attachPdf"
                      checked={attachPdf}
                      onChange={(e) => setAttachPdf(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="attachPdf" className="text-sm">
                      Attach PDF report
                    </Label>
                  </div>
                </div>
              </div>

              {/* PDF Configuration (if attachment enabled) */}
              {attachPdf && (
                <div className="space-y-3 p-4 bg-bg-secondary rounded-lg">
                  <h4 className="font-medium text-text-primary">PDF Attachment Settings</h4>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Filter & Sort Preset</Label>
                      <PresetSelector
                        presets={moduleFilterPresets}
                        selectedId={selectedFilterPreset}
                        onSelect={(preset) => setSelectedFilterPreset(preset?.id || null)}
                        placeholder="Select filtering options..."
                        enableQuickCreate={true}
                        presetType="filter_sort"
                        moduleType={moduleType}
                        onQuickCreate={() => setShowFilterQuickCreate(true)}
                        onEdit={(preset) => handleEditFilterPreset(preset as FilterSortPreset)}
                        canEdit={() => true}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Page Style Preset</Label>
                      <PresetSelector
                        presets={pageStylePresets}
                        selectedId={selectedPageStylePreset}
                        onSelect={(preset) => setSelectedPageStylePreset(preset?.id || null)}
                        placeholder="Select page formatting..."
                        enableQuickCreate={true}
                        presetType="page_style"
                        onQuickCreate={() => setShowPageStyleQuickCreate(true)}
                        onEdit={(preset) => handleEditPageStylePreset(preset as PageStylePreset)}
                        canEdit={() => true}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              {(recipients || subject || message) && (
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
                    <div className="border border-bg-tertiary rounded-lg p-4 bg-white text-black">
                      <div className="space-y-3">
                        <div className="border-b border-gray-300 pb-2">
                          <div className="text-sm text-gray-600">To: {recipients || 'No recipients'}</div>
                          <div className="text-sm text-gray-600">Subject: {previewSubject || 'No subject'}</div>
                        </div>

                        <div className="whitespace-pre-wrap text-sm">
                          {previewMessage || 'No message content'}
                        </div>

                        {includeNotesInBody && (
                          <div className="border-t border-gray-300 pt-2">
                            <div className="text-xs text-gray-500">Notes Summary:</div>
                            <div className="text-sm">• 15 total notes (8 todo, 7 complete)</div>
                          </div>
                        )}

                        {attachPdf && (
                          <div className="border-t border-gray-300 pt-2">
                            <div className="text-xs text-gray-500">📎 PDF attachment will be included</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="bg-bg-tertiary rounded-lg p-4">
                <h4 className="font-medium text-text-primary mb-2">Email Summary</h4>
                <div className="space-y-1 text-sm text-text-secondary">
                  <p>• Module: {moduleName}</p>
                  <p>• Recipients: {recipients || 'Not specified (required)'}</p>
                  <p>• Subject: {subject || 'Not specified (required)'}</p>
                  <p>• Include notes in body: {includeNotesInBody ? 'Yes' : 'No'}</p>
                  <p>• Attach PDF: {attachPdf ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

          {/* Sticky Footer */}
          <div className="border-t border-bg-tertiary p-6">
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!recipients || !subject || !message}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Email
                </Button>
              </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quick Create Sidebars */}
      {showFilterQuickCreate && (
        <QuickCreateFilterSortSidebar
          isOpen={showFilterQuickCreate}
          onClose={() => {
            setShowFilterQuickCreate(false)
            setEditingFilterPreset(null)
          }}
          onPresetCreated={handleFilterPresetCreated}
          moduleType={moduleType}
          editingPreset={editingFilterPreset}
        />
      )}

      {showPageStyleQuickCreate && (
        <QuickCreatePageStyleSidebar
          isOpen={showPageStyleQuickCreate}
          onClose={() => {
            setShowPageStyleQuickCreate(false)
            setEditingPageStylePreset(null)
          }}
          onPresetCreated={handlePageStylePresetCreated}
          editingPreset={editingPageStylePreset}
        />
      )}

      {showEmailMessageQuickCreate && (
        <QuickCreateEmailMessageSidebar
          isOpen={showEmailMessageQuickCreate}
          onClose={() => {
            setShowEmailMessageQuickCreate(false)
            setEditingEmailPreset(null)
          }}
          onPresetCreated={handleEmailPresetCreated}
        />
      )}
    </>
  )
}