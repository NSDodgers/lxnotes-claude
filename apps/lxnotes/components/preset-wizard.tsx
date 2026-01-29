'use client'

import { useState, useCallback } from 'react'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { WhatToSendStep } from './preset-wizard-steps/what-to-send-step'
import { EmailContentStep } from './preset-wizard-steps/email-content-step'
import { NameAndSaveStep } from './preset-wizard-steps/name-and-save-step'
import { FilterSortPresetDialog } from './filter-sort-preset-dialog'
import { PageStylePresetDialog } from './page-style-preset-dialog'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'
import { usePrintPresetsStore } from '@/lib/stores/print-presets-store'
import { useCurrentProductionStore } from '@/lib/stores/production-store'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { PlaceholderData } from '@/lib/utils/placeholders'
import { useAuthContext } from '@/components/auth/auth-provider'
import type { ModuleType, EmailMessagePreset, PrintPreset } from '@/types'

interface PresetWizardProps {
  variant: 'email' | 'print'
  moduleType: ModuleType
  editingPreset?: EmailMessagePreset | PrintPreset | null
  onComplete: () => void
  onBack: () => void
}

const moduleDisplayNames: Record<ModuleType, string> = {
  cue: 'Cue Notes',
  work: 'Work Notes',
  production: 'Production Notes',
  actor: 'Actor Notes',
}

export function PresetWizard({
  variant,
  moduleType,
  editingPreset,
  onComplete,
  onBack,
}: PresetWizardProps) {
  const totalSteps = variant === 'email' ? 3 : 2
  const [currentStep, setCurrentStep] = useState(0)

  const { getPresetsByModule: getFilterPresets } = useFilterSortPresetsStore()
  const { presets: pageStylePresets } = usePageStylePresetsStore()
  const { addPreset: addEmailPreset, updatePreset: updateEmailPreset } = useEmailMessagePresetsStore()
  const { addPreset: addPrintPreset, updatePreset: updatePrintPreset } = usePrintPresetsStore()
  const { name: productionName } = useCurrentProductionStore()
  const mockNotesStore = useMockNotesStore()
  const { user } = useAuthContext()

  // Get user's name from auth metadata
  const userFullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const nameParts = userFullName.split(' ')
  const userFirstName = nameParts[0] || 'User'
  const userLastName = nameParts.slice(1).join(' ') || ''

  const filterPresets = getFilterPresets(moduleType)
  const notes = mockNotesStore.getAllNotes(moduleType)

  // Wizard form state
  const [filterPresetId, setFilterPresetId] = useState<string | null>(
    editingPreset?.type === 'email_message'
      ? (editingPreset as EmailMessagePreset).config.filterAndSortPresetId
      : editingPreset?.type === 'print'
        ? (editingPreset as PrintPreset).config.filterSortPresetId
        : null
  )
  const [pageStylePresetId, setPageStylePresetId] = useState<string | null>(
    editingPreset?.type === 'email_message'
      ? (editingPreset as EmailMessagePreset).config.pageStylePresetId
      : editingPreset?.type === 'print'
        ? (editingPreset as PrintPreset).config.pageStylePresetId
        : null
  )
  const [includeNotesInBody, setIncludeNotesInBody] = useState(
    editingPreset?.type === 'email_message'
      ? (editingPreset as EmailMessagePreset).config.includeNotesInBody
      : true
  )
  const [attachPdf, setAttachPdf] = useState(
    editingPreset?.type === 'email_message'
      ? (editingPreset as EmailMessagePreset).config.attachPdf
      : true
  )

  // Email-specific fields
  const [recipients, setRecipients] = useState(
    editingPreset?.type === 'email_message'
      ? (editingPreset as EmailMessagePreset).config.recipients
      : ''
  )
  const [subject, setSubject] = useState(
    editingPreset?.type === 'email_message'
      ? (editingPreset as EmailMessagePreset).config.subject
      : `{{PRODUCTION_TITLE}} - ${moduleDisplayNames[moduleType]} for {{CURRENT_DATE}}`
  )
  const [message, setMessage] = useState(
    editingPreset?.type === 'email_message'
      ? (editingPreset as EmailMessagePreset).config.message
      : ''
  )

  // Inline create dialog state
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [pageStyleDialogOpen, setPageStyleDialogOpen] = useState(false)

  // Name (last step)
  const [presetName, setPresetName] = useState(editingPreset?.name ?? '')

  const placeholderData: PlaceholderData = {
    productionTitle: productionName || 'Production',
    userFullName,
    userFirstName,
    userLastName,
    moduleName: moduleDisplayNames[moduleType],
    noteCount: notes.length,
  }

  const handleSave = useCallback(() => {
    if (!presetName.trim()) return

    if (variant === 'email') {
      const config: EmailMessagePreset['config'] = {
        recipients,
        subject,
        message,
        filterAndSortPresetId: filterPresetId,
        pageStylePresetId,
        includeNotesInBody,
        attachPdf,
      }

      if (editingPreset && editingPreset.type === 'email_message') {
        updateEmailPreset(editingPreset.id, { name: presetName, config })
      } else {
        addEmailPreset({
          productionId: 'prod-1',
          type: 'email_message',
          moduleType,
          name: presetName,
          config,
          isDefault: false,
          createdBy: 'user',
        })
      }
    } else {
      const config: PrintPreset['config'] = {
        filterSortPresetId: filterPresetId,
        pageStylePresetId,
      }

      if (editingPreset && editingPreset.type === 'print') {
        updatePrintPreset(editingPreset.id, { name: presetName, config })
      } else {
        addPrintPreset({
          productionId: 'prod-1',
          type: 'print',
          moduleType,
          name: presetName,
          config,
          isDefault: false,
          createdBy: 'user',
        })
      }
    }

    onComplete()
  }, [
    variant, presetName, recipients, subject, message,
    filterPresetId, pageStylePresetId, includeNotesInBody, attachPdf,
    moduleType, editingPreset,
    addEmailPreset, updateEmailPreset, addPrintPreset, updatePrintPreset,
    onComplete,
  ])

  const canAdvance = () => {
    if (currentStep === totalSteps - 1) {
      return presetName.trim().length > 0
    }
    return true
  }

  const handleNext = () => {
    if (currentStep === totalSteps - 1) {
      handleSave()
    } else {
      setCurrentStep(s => s + 1)
    }
  }

  const handleBack = () => {
    if (currentStep === 0) {
      onBack()
    } else {
      setCurrentStep(s => s - 1)
    }
  }

  // Step labels
  const getStepLabel = (step: number): string => {
    if (variant === 'email') {
      return ['What to send', 'Email content', 'Name & save'][step]
    }
    return ['What to print', 'Name & save'][step]
  }

  // Render current step
  const renderStep = () => {
    if (variant === 'email') {
      switch (currentStep) {
        case 0:
          return (
            <WhatToSendStep
              filterPresets={filterPresets}
              pageStylePresets={pageStylePresets}
              selectedFilterPresetId={filterPresetId}
              selectedPageStylePresetId={pageStylePresetId}
              includeNotesInBody={includeNotesInBody}
              attachPdf={attachPdf}
              variant="email"
              onFilterPresetChange={setFilterPresetId}
              onPageStylePresetChange={setPageStylePresetId}
              onIncludeNotesInBodyChange={setIncludeNotesInBody}
              onAttachPdfChange={setAttachPdf}
              onCreateFilterPreset={() => setFilterDialogOpen(true)}
              onCreatePageStylePreset={() => setPageStyleDialogOpen(true)}
            />
          )
        case 1:
          return (
            <EmailContentStep
              recipients={recipients}
              subject={subject}
              message={message}
              onRecipientsChange={setRecipients}
              onSubjectChange={setSubject}
              onMessageChange={setMessage}
            />
          )
        case 2:
          return (
            <NameAndSaveStep
              name={presetName}
              onNameChange={setPresetName}
              variant="email"
              recipients={recipients}
              subject={subject}
              filterPresetId={filterPresetId}
              pageStylePresetId={pageStylePresetId}
              moduleType={moduleType}
              notes={notes}
              placeholderData={placeholderData}
            />
          )
      }
    } else {
      // Print wizard: 2 steps
      switch (currentStep) {
        case 0:
          return (
            <WhatToSendStep
              filterPresets={filterPresets}
              pageStylePresets={pageStylePresets}
              selectedFilterPresetId={filterPresetId}
              selectedPageStylePresetId={pageStylePresetId}
              includeNotesInBody={false}
              attachPdf={true}
              variant="print"
              onFilterPresetChange={setFilterPresetId}
              onPageStylePresetChange={setPageStylePresetId}
              onIncludeNotesInBodyChange={() => {}}
              onAttachPdfChange={() => {}}
              onCreateFilterPreset={() => setFilterDialogOpen(true)}
              onCreatePageStylePreset={() => setPageStyleDialogOpen(true)}
            />
          )
        case 1:
          return (
            <NameAndSaveStep
              name={presetName}
              onNameChange={setPresetName}
              variant="print"
              filterPresetId={filterPresetId}
              pageStylePresetId={pageStylePresetId}
              moduleType={moduleType}
              notes={notes}
              placeholderData={placeholderData}
            />
          )
      }
    }
  }

  return (
    <div className="flex flex-col h-full" data-testid="preset-wizard">
      {/* Header with step indicator */}
      <div className="pb-4 border-b border-bg-tertiary space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-bg-hover rounded transition-colors"
            data-testid="wizard-back"
          >
            <ArrowLeft className="h-4 w-4 text-text-secondary" />
          </button>
          <h3 className="font-medium text-text-primary">
            {editingPreset ? 'Edit Preset' : 'New Preset'}
          </h3>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i <= currentStep ? 'bg-primary' : 'bg-bg-tertiary'
              )} />
            </div>
          ))}
        </div>
        <div className="text-xs text-text-secondary">
          Step {currentStep + 1} of {totalSteps}: {getStepLabel(currentStep)}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto py-4">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="pt-4 border-t border-bg-tertiary flex justify-between">
        <Button variant="outline" onClick={handleBack} data-testid="wizard-back-btn">
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canAdvance()}
          data-testid="wizard-next-btn"
        >
          {currentStep === totalSteps - 1 ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Card
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      <FilterSortPresetDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        moduleType={moduleType}
        onSave={(presetId) => setFilterPresetId(presetId)}
      />

      <PageStylePresetDialog
        open={pageStyleDialogOpen}
        onOpenChange={setPageStyleDialogOpen}
        onSave={(presetId) => setPageStylePresetId(presetId)}
      />
    </div>
  )
}
