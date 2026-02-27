'use client'

import { useState, useCallback, useMemo } from 'react'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  NameStep,
  StatusFilterStep,
  TypeFilterStep,
  PriorityFilterStep,
  SortOptionsStep,
  GroupByStep,
  PageLayoutStep,
  RecipientsStep,
  SubjectStep,
  MessageStep,
  EmailFormatStep,
} from './preset-wizard-steps/atomic'
// Replace direct store imports with production-aware hooks
import { useProductionFilterSortPresets } from '@/lib/hooks/use-production-filter-sort-presets'
import { useProductionPageStylePresets } from '@/lib/hooks/use-production-page-style-presets'
import { useProductionEmailPresets } from '@/lib/hooks/use-production-email-presets'
import { useProductionPrintPresets } from '@/lib/hooks/use-production-print-presets'
import { useProductionId } from '@/components/production/production-provider'

import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import type { ModuleType, EmailMessagePreset, PrintPreset, FilterSortPreset, PageStylePreset } from '@/types'

// Safe useProductionId that doesn't throw if outside provider (for demo mode)
function useSafeProductionId() {
  try {
    return useProductionId()
  } catch {
    return 'demo'
  }
}

interface PresetWizardProps {
  variant: 'email' | 'print'
  moduleType: ModuleType
  editingPreset?: EmailMessagePreset | PrintPreset | null
  onComplete: () => void
  onBack: () => void
}

// Step definitions
const PRINT_STEPS = [
  'Name',
  'Status',
  'Types',
  'Priorities',
  'Sorting',
  'Grouping',
  'Page Layout',
] as const

const EMAIL_STEPS = [
  'Name',
  'Status',
  'Types',
  'Priorities',
  'Sorting',
  'Grouping',
  'Page Layout',
  'Recipients',
  'Subject',
  'Message',
  'Email Format',
] as const

// Unified wizard state
interface WizardState {
  // Common
  presetName: string
  // Filter options
  statusFilter: 'todo' | 'complete' | 'cancelled' | null
  typeFilters: string[]
  priorityFilters: string[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
  groupByType: boolean
  // Page style
  paperSize: 'letter' | 'a4' | 'legal'
  orientation: 'portrait' | 'landscape'
  includeCheckboxes: boolean
  // Email-specific
  recipients: string
  subject: string
  message: string
  includeNotesInBody: boolean
  attachPdf: boolean
}

export function PresetWizard({
  variant,
  moduleType,
  editingPreset,
  onComplete,
  onBack,
}: PresetWizardProps) {
  const steps = variant === 'email' ? EMAIL_STEPS : PRINT_STEPS
  const totalSteps = steps.length
  const [currentStep, setCurrentStep] = useState(0)
  const productionId = useSafeProductionId()

  const { savePreset: saveFilterPreset } = useProductionFilterSortPresets(moduleType)
  const { savePreset: savePageStylePreset } = useProductionPageStylePresets()
  const { savePreset: saveEmailPreset } = useProductionEmailPresets(moduleType)
  const { savePreset: savePrintPreset } = useProductionPrintPresets(moduleType)

  const { getTypes } = useCustomTypesStore()
  const { getPriorities } = useCustomPrioritiesStore()

  // Initialize state from editing preset or defaults
  const initialState = useMemo((): WizardState => {
    const types = getTypes(moduleType)
    const priorities = getPriorities(moduleType)

    // Default state
    const defaults: WizardState = {
      presetName: '',
      statusFilter: 'todo',
      typeFilters: types.map(t => t.value),
      priorityFilters: priorities.map(p => p.value),
      sortBy: 'priority',
      sortOrder: 'desc',
      groupByType: false,
      paperSize: 'letter',
      orientation: 'portrait',
      includeCheckboxes: true,
      recipients: '',
      subject: `{{PRODUCTION_TITLE}} - {{MODULE_NAME}} for {{CURRENT_DATE}}`,
      message: '',
      includeNotesInBody: true,
      attachPdf: true,
    }

    if (!editingPreset) return defaults

    // Populate from editing preset
    if (editingPreset.type === 'email_message') {
      const email = editingPreset as EmailMessagePreset
      // Ideally we would look up the referenced filter/page presets to populate their fields
      // For now we keep the defaults or would need to fetch them
      // This is a known limitation that might need addressing in a future task if deeper editing is required

      return {
        ...defaults,
        presetName: email.name,
        recipients: email.config.recipients,
        subject: email.config.subject,
        message: email.config.message,
        includeNotesInBody: email.config.includeNotesInBody,
        attachPdf: email.config.attachPdf,
      }
    } else if (editingPreset.type === 'print') {
      const print = editingPreset as PrintPreset
      return {
        ...defaults,
        presetName: print.name,
      }
    }

    return defaults
  }, [moduleType, editingPreset, getTypes, getPriorities])

  const [state, setState] = useState<WizardState>(initialState)

  // Update individual state fields
  const updateState = useCallback(<K extends keyof WizardState>(
    field: K,
    value: WizardState[K]
  ) => {
    setState(prev => ({ ...prev, [field]: value }))
  }, [])

  // Validation for current step
  const canAdvance = useCallback(() => {
    switch (currentStep) {
      case 0: // Name
        return state.presetName.trim().length > 0
      case 8: // Subject (email only)
        if (variant === 'email') {
          return state.subject.trim().length > 0
        }
        return true
      default:
        return true // All other steps have valid defaults
    }
  }, [currentStep, state.presetName, state.subject, variant])

  // Handle save - creates filter + page style presets, then the main preset
  const handleSave = useCallback(async () => {
    if (!state.presetName.trim()) return

    // Generate IDs for new presets if they are new, or reuse if we were consistently editing
    // But here we are creating dependent presets on the fly.
    // simpler to generate new IDs for the dependencies
    const newFilterId = `filter-sort-${Math.random().toString(36).substr(2, 9)}`
    const newPageStyleId = `page-style-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date()

    // 1. Create Filter/Sort Preset
    const filterPreset: FilterSortPreset = {
      id: newFilterId,
      type: 'filter_sort',
      moduleType,
      name: `Filter: ${state.presetName}`,
      productionId,
      config: {
        statusFilter: state.statusFilter,
        typeFilters: state.typeFilters,
        priorityFilters: state.priorityFilters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        groupByType: state.groupByType,
      },
      isDefault: false,
      createdBy: 'user',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await saveFilterPreset(filterPreset)

    // 2. Create Page Style Preset
    const pageStylePreset: PageStylePreset = {
      id: newPageStyleId,
      type: 'page_style',
      moduleType: 'all',
      name: `Style: ${state.presetName}`,
      productionId,
      config: {
        paperSize: state.paperSize,
        orientation: state.orientation,
        includeCheckboxes: state.includeCheckboxes,
      },
      isDefault: false,
      createdBy: 'user',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await savePageStylePreset(pageStylePreset)

    // 3. Create the main preset (Email or Print)
    if (variant === 'email') {
      const config: EmailMessagePreset['config'] = {
        recipients: state.recipients,
        subject: state.subject,
        message: state.message,
        filterAndSortPresetId: newFilterId,
        pageStylePresetId: newPageStyleId,
        includeNotesInBody: state.includeNotesInBody,
        attachPdf: state.attachPdf,
      }

      if (editingPreset && editingPreset.type === 'email_message') {
        await saveEmailPreset({
          ...editingPreset,
          name: state.presetName,
          config: { ...editingPreset.config, ...config },
          updatedAt: new Date()
        })
      } else {
        await saveEmailPreset({
          id: `email-${Math.random().toString(36).substr(2, 9)}`,
          productionId,
          type: 'email_message',
          moduleType,
          name: state.presetName,
          config,
          isDefault: false,
          createdBy: 'user',
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    } else {
      const config: PrintPreset['config'] = {
        filterSortPresetId: newFilterId,
        pageStylePresetId: newPageStyleId,
      }

      if (editingPreset && editingPreset.type === 'print') {
        await savePrintPreset({
          ...editingPreset,
          name: state.presetName,
          config: { ...editingPreset.config, ...config },
          updatedAt: new Date()
        })
      } else {
        await savePrintPreset({
          id: `print-${Math.random().toString(36).substr(2, 9)}`,
          productionId,
          type: 'print',
          moduleType,
          name: state.presetName,
          config,
          isDefault: false,
          createdBy: 'user',
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    }

    onComplete()
  }, [
    state, variant, moduleType, editingPreset, productionId,
    saveFilterPreset, savePageStylePreset, saveEmailPreset, savePrintPreset,
    onComplete
  ])

  const handleNext = useCallback(() => {
    if (currentStep === totalSteps - 1) {
      handleSave()
    } else {
      setCurrentStep(s => s + 1)
    }
  }, [currentStep, totalSteps, handleSave])

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      onBack()
    } else {
      setCurrentStep(s => s - 1)
    }
  }, [currentStep, onBack])

  // Render current step content
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <NameStep
            value={state.presetName}
            onChange={(v) => updateState('presetName', v)}
          />
        )
      case 1:
        return (
          <StatusFilterStep
            value={state.statusFilter}
            onChange={(v) => updateState('statusFilter', v)}
          />
        )
      case 2:
        return (
          <TypeFilterStep
            value={state.typeFilters}
            onChange={(v) => updateState('typeFilters', v)}
            moduleType={moduleType}
          />
        )
      case 3:
        return (
          <PriorityFilterStep
            value={state.priorityFilters}
            onChange={(v) => updateState('priorityFilters', v)}
            moduleType={moduleType}
          />
        )
      case 4:
        return (
          <SortOptionsStep
            sortBy={state.sortBy}
            sortOrder={state.sortOrder}
            onSortByChange={(v) => updateState('sortBy', v)}
            onSortOrderChange={(v) => updateState('sortOrder', v)}
            moduleType={moduleType}
          />
        )
      case 5:
        return (
          <GroupByStep
            value={state.groupByType}
            onChange={(v) => updateState('groupByType', v)}
          />
        )
      case 6:
        return (
          <PageLayoutStep
            paperSize={state.paperSize}
            orientation={state.orientation}
            includeCheckboxes={state.includeCheckboxes}
            onPaperSizeChange={(v) => updateState('paperSize', v)}
            onOrientationChange={(v) => updateState('orientation', v)}
            onIncludeCheckboxesChange={(v) => updateState('includeCheckboxes', v)}
          />
        )
      // Email-only steps (7-10)
      case 7:
        if (variant !== 'email') return null
        return (
          <RecipientsStep
            value={state.recipients}
            onChange={(v) => updateState('recipients', v)}
          />
        )
      case 8:
        if (variant !== 'email') return null
        return (
          <SubjectStep
            value={state.subject}
            onChange={(v) => updateState('subject', v)}
          />
        )
      case 9:
        if (variant !== 'email') return null
        return (
          <MessageStep
            value={state.message}
            onChange={(v) => updateState('message', v)}
          />
        )
      case 10:
        if (variant !== 'email') return null
        return (
          <EmailFormatStep
            includeNotesInBody={state.includeNotesInBody}
            attachPdf={state.attachPdf}
            onIncludeNotesInBodyChange={(v) => updateState('includeNotesInBody', v)}
            onAttachPdfChange={(v) => updateState('attachPdf', v)}
          />
        )
      default:
        return null
    }
  }

  // Get button content
  const getNextButtonContent = () => {
    if (currentStep === totalSteps - 1) {
      return (
        <>
          <Save className="h-4 w-4 mr-2" />
          Save Preset
        </>
      )
    }
    return (
      <>
        Next
        <ArrowRight className="h-4 w-4 ml-2" />
      </>
    )
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

        {/* Progress bar */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i <= currentStep ? 'bg-primary' : 'bg-bg-tertiary'
              )}
            />
          ))}
        </div>

        {/* Step label */}
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span className="font-medium">{steps[currentStep]}</span>
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
          {getNextButtonContent()}
        </Button>
      </div>
    </div>
  )
}
