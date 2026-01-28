'use client'

import { useState, useMemo } from 'react'
import { Mail, Send, Loader2 } from 'lucide-react'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { useCurrentProductionStore } from '@/lib/stores/production-store'
import { useProductionOptional } from '@/components/production/production-provider'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { filterAndSortNotes } from '@/lib/utils/filter-sort-notes'
import { PresetCardGrid } from './preset-card-grid'
import { ConfirmSendPanel, EmailOverrides } from './confirm-send-panel'
import { PresetWizard } from './preset-wizard'
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
import type { ModuleType, EmailMessagePreset } from '@/types'
import { PDFGenerationService } from '@/lib/services/pdf'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { PlaceholderData } from '@/lib/utils/placeholders'

interface EmailNotesSidebarProps {
  moduleType: ModuleType
  isOpen: boolean
  onClose: () => void
}

type SidebarView = 'cards' | 'confirm' | 'wizard' | 'custom'

const moduleDisplayNames: Record<ModuleType, string> = {
  cue: 'Cue Notes',
  work: 'Work Notes',
  production: 'Production Notes',
  actor: 'Actor Notes',
}

export function EmailNotesSidebar({ moduleType, isOpen, onClose }: EmailNotesSidebarProps) {
  const { getPresetsByModule: getEmailPresetsByModule, resolvePlaceholders } = useEmailMessagePresetsStore()
  const { getPreset: getFilterPreset } = useFilterSortPresetsStore()
  const { presets: pageStylePresets } = usePageStylePresetsStore()
  const localProductionStore = useCurrentProductionStore()
  const productionContext = useProductionOptional()
  // Prefer production context (Supabase) if available, otherwise use local store
  // Crucially, if we have a production context, use its values even if falsy/undefined (e.g. no logo)
  // to avoid falling back to local store defaults when we shouldn't.
  const activeProduction = productionContext?.production
  const productionName = activeProduction ? activeProduction.name : localProductionStore.name
  const productionLogo = activeProduction ? activeProduction.logo : localProductionStore.logo
  const productionId = productionContext?.productionId
  const { getPriorities } = useCustomPrioritiesStore()
  const mockNotesStore = useMockNotesStore()

  const [view, setView] = useState<SidebarView>('cards')
  const [selectedPreset, setSelectedPreset] = useState<EmailMessagePreset | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // Custom one-off form state
  const [recipients, setRecipients] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [includeNotesInBody, setIncludeNotesInBody] = useState(true)
  const [attachPdf, setAttachPdf] = useState(false)

  const moduleEmailPresets = getEmailPresetsByModule(moduleType)
  const notes = mockNotesStore.getAllNotes(moduleType)
  const moduleName = moduleDisplayNames[moduleType]

  const placeholderData: PlaceholderData = useMemo(() => {
    const todoNotes = notes.filter(n => n.status === 'todo')
    const completeNotes = notes.filter(n => n.status === 'complete')
    const cancelledNotes = notes.filter(n => n.status === 'cancelled')

    return {
      productionTitle: productionName || 'Production',
      userFullName: 'Dev User',
      userFirstName: 'Dev',
      userLastName: 'User',
      moduleName,
      noteCount: notes.length,
      todoCount: todoNotes.length,
      completeCount: completeNotes.length,
      cancelledCount: cancelledNotes.length,
      filterDescription: 'All notes',
      sortDescription: 'Default order',
      dateRange: 'All dates',
    }
  }, [notes, productionName, moduleName])

  const handleSelectPreset = (preset: EmailMessagePreset | any) => {
    setSelectedPreset(preset as EmailMessagePreset)
    setView('confirm')
  }

  const handleSendFromConfirm = async (overrides?: EmailOverrides) => {
    if (!selectedPreset) return

    const config = selectedPreset.config
    const finalRecipients = overrides?.recipients ?? config.recipients
    const finalSubject = overrides?.subject ?? config.subject
    const finalMessage = overrides?.message ?? config.message

    await doSend(
      finalRecipients,
      resolvePlaceholders(finalSubject, placeholderData),
      resolvePlaceholders(finalMessage, placeholderData),
      config.includeNotesInBody,
      config.attachPdf,
      config.filterAndSortPresetId,
      config.pageStylePresetId,
    )
  }

  const handleSendCustom = async () => {
    if (!recipients || !subject || !message) return
    await doSend(recipients, subject, message, includeNotesInBody, attachPdf, null, null)
  }

  const doSend = async (
    recipientList: string,
    subjectLine: string,
    messageBody: string,
    withNotesInBody: boolean,
    withPdf: boolean,
    filterPresetId: string | null,
    pageStylePresetId: string | null,
  ) => {
    setIsSending(true)
    setSendError(null)

    try {
      const filterPreset = filterPresetId
        ? getFilterPreset(filterPresetId)
        : null
      const customPriorities = getPriorities(moduleType)
      const filteredNotes = filterPreset
        ? filterAndSortNotes(notes, filterPreset, customPriorities)
        : notes

      const noteStats = {
        total: filteredNotes.length,
        todo: filteredNotes.filter(n => n.status === 'todo').length,
        complete: filteredNotes.filter(n => n.status === 'complete').length,
        cancelled: filteredNotes.filter(n => n.status === 'cancelled').length,
      }

      let pdfBase64: string | undefined
      let pdfFilename: string | undefined

      if (withPdf && filterPreset && pageStylePresetId) {
        const pageStylePreset = pageStylePresets.find(p => p.id === pageStylePresetId)
        if (pageStylePreset) {
          const pdfService = PDFGenerationService.getInstance()
          const result = await pdfService.generatePDF({
            moduleType,
            filterPreset,
            pageStylePreset,
            notes,
            productionName,
            productionLogo,
          })

          if (result.success && result.pdfBlob) {
            const arrayBuffer = await result.pdfBlob.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            let binary = ''
            for (let i = 0; i < uint8Array.length; i++) {
              binary += String.fromCharCode(uint8Array[i])
            }
            pdfBase64 = btoa(binary)
            pdfFilename = result.filename || `${moduleType}_notes.pdf`
          }
        }
      }

      const payload = {
        productionId,
        moduleType,
        recipients: recipientList,
        subject: subjectLine,
        message: messageBody,
        includeNotesInBody: withNotesInBody,
        attachPdf: withPdf,
        pdfBase64,
        pdfFilename,
        noteStats,
        filterDescription: filterPreset?.name || 'All notes',
        sortDescription: filterPreset?.config.sortBy
          ? `Sorted by ${filterPreset.config.sortBy}`
          : 'Default order',
        dateRange: 'All dates',
      }

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }

      const result = await response.json()
      alert(`Email sent successfully to ${result.recipientCount} recipient(s)!`)
      onClose()
    } catch (error) {
      console.error('Email send error:', error)
      setSendError(error instanceof Error ? error.message : 'Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setView('cards')
    setSelectedPreset(null)
    setSendError(null)
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col overflow-hidden p-0">
        {view === 'cards' && (
          <>
            <SheetHeader className="p-6 pb-4 border-b border-bg-tertiary">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-text-primary" />
                <SheetTitle>Send Email</SheetTitle>
              </div>
              <SheetDescription>
                Send {moduleName.toLowerCase()} via email
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <PresetCardGrid
                presets={moduleEmailPresets}
                moduleType={moduleType}
                notes={notes}
                variant="email"
                onSelectPreset={handleSelectPreset}
                onCreateNew={() => setView('wizard')}
                onCustomOneOff={() => setView('custom')}
              />
            </div>
          </>
        )}

        {view === 'confirm' && selectedPreset && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <ConfirmSendPanel
              preset={selectedPreset}
              moduleType={moduleType}
              notes={notes}
              placeholderData={placeholderData}
              variant="email"
              isSubmitting={isSending}
              submitError={sendError}
              onBack={() => {
                setView('cards')
                setSelectedPreset(null)
                setSendError(null)
              }}
              onSubmit={handleSendFromConfirm}
            />
          </div>
        )}

        {view === 'wizard' && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <PresetWizard
              variant="email"
              moduleType={moduleType}
              onComplete={() => setView('cards')}
              onBack={() => setView('cards')}
            />
          </div>
        )}

        {view === 'custom' && (
          <>
            <SheetHeader className="p-6 pb-4 border-b border-bg-tertiary">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-text-primary" />
                <SheetTitle>Custom Email</SheetTitle>
              </div>
              <SheetDescription>
                One-off email — this won&apos;t be saved as a preset
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-recipients">
                  Recipients <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="custom-recipients"
                  type="email"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="user@example.com, user2@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-subject">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="custom-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-message">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="custom-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Email message..."
                  rows={4}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="custom-includeNotes"
                    checked={includeNotesInBody}
                    onChange={(e) => setIncludeNotesInBody(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="custom-includeNotes" className="text-sm">
                    Include notes summary in email body
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="custom-attachPdf"
                    checked={attachPdf}
                    onChange={(e) => setAttachPdf(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="custom-attachPdf" className="text-sm">
                    Attach PDF report
                  </Label>
                </div>
              </div>
            </div>
            <div className="border-t border-bg-tertiary p-6">
              {sendError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-sm">
                  {sendError}
                </div>
              )}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => { setView('cards'); setSendError(null) }}>
                  Back
                </Button>
                <Button
                  onClick={handleSendCustom}
                  disabled={!recipients || !subject || !message || isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
