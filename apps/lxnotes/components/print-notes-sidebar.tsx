'use client'

import { useState, useMemo } from 'react'
import { Printer, Download, Loader2 } from 'lucide-react'
import { useProductionFilterSortPresets } from '@/lib/hooks/use-production-filter-sort-presets'
import { useProductionPrintPresets } from '@/lib/hooks/use-production-print-presets'
import { useCurrentProductionStore } from '@/lib/stores/production-store'
import { useProductionOptional } from '@/components/production/production-provider'
import { PresetCardGrid } from './preset-card-grid'
import { ConfirmSendPanel } from './confirm-send-panel'
import { PresetWizard } from './preset-wizard'
import { PresetEditor } from './preset-editor'
import { PresetSelector } from './preset-selector'
import { FilterSortPresetDialog } from './filter-sort-preset-dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { ModuleType, PresetModuleType, PrintPreset, EmailMessagePreset, FilterSortPreset, PageStyleConfig, Note } from '@/types'
import { PDFGenerationService } from '@/lib/services/pdf'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { PlaceholderData } from '@/lib/utils/placeholders'
import { useAuthContext } from '@/components/auth/auth-provider'
import { isFixtureModule, getPdfModuleType } from '@/lib/utils/module-helpers'

interface PrintNotesSidebarProps {
  moduleType: PresetModuleType
  isOpen: boolean
  onClose: () => void
  notes?: Note[]
}

type SidebarView = 'cards' | 'confirm' | 'wizard' | 'editor' | 'custom'

const moduleDisplayNames: Record<PresetModuleType, string> = {
  cue: 'Cue Notes',
  work: 'Work Notes',
  production: 'Production Notes',
  electrician: 'Electrician Notes',
  'combined-work-electrician': 'Work + Electrician Notes',
}

export function PrintNotesSidebar({ moduleType, isOpen, onClose, notes: propNotes }: PrintNotesSidebarProps) {
  const { getPreset: getFilterPreset, presets: moduleFilterPresets } = useProductionFilterSortPresets(moduleType)
  const { presets: printPresets, deletePreset } = useProductionPrintPresets(moduleType)
  const localProductionStore = useCurrentProductionStore()
  const productionContext = useProductionOptional()
  const { user } = useAuthContext()
  // Prefer production context (Supabase) if available, otherwise use local store
  // Crucially, if we have a production context, use its values even if falsy/undefined (e.g. no logo)
  // to avoid falling back to local store defaults when we shouldn't.
  const activeProduction = productionContext?.production
  const productionName = activeProduction ? activeProduction.name : localProductionStore.name
  const productionLogo = activeProduction ? activeProduction.logo : localProductionStore.logo
  const { aggregates: fixtureAggregates } = useFixtureStore()
  const mockNotesStore = useMockNotesStore()

  // Get user's name from auth metadata
  const userFullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'

  const [view, setView] = useState<SidebarView>('cards')
  const [selectedPreset, setSelectedPreset] = useState<PrintPreset | null>(null)
  const [editingPreset, setEditingPreset] = useState<PrintPreset | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Custom one-off state
  const [customFilterPreset, setCustomFilterPreset] = useState<FilterSortPreset | null>(null)
  const [customPaperSize, setCustomPaperSize] = useState<'letter' | 'a4' | 'legal'>('letter')
  const [customOrientation, setCustomOrientation] = useState<'portrait' | 'landscape'>('landscape')
  const [customIncludeCheckboxes, setCustomIncludeCheckboxes] = useState(true)

  // Inline create/edit dialog state
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [editingFilterPreset, setEditingFilterPreset] = useState<FilterSortPreset | null>(null)

  // For PDF generation and preset creation, use the base module type
  const pdfModuleType = getPdfModuleType(moduleType)
  const notes = propNotes || mockNotesStore.getAllNotes(pdfModuleType)
  const moduleName = moduleDisplayNames[moduleType]

  const placeholderData: PlaceholderData = useMemo(() => ({
    productionTitle: productionName || 'Production',
    userFullName,
    moduleName,
    noteCount: notes.length,
  }), [productionName, moduleName, notes.length, userFullName])

  const [generatingPresetId, setGeneratingPresetId] = useState<string | null>(null)

  const handleSelectPreset = async (preset: PrintPreset | EmailMessagePreset) => {
    const printPreset = preset as PrintPreset
    setGeneratingPresetId(printPreset.id)
    setGenerateError(null)

    try {
      await doGenerate(
        printPreset.config.filterSortPresetId,
        printPreset.config.pageStyle,
      )
    } finally {
      setGeneratingPresetId(null)
    }
  }

  const doGenerate = async (filterPresetId: string | null, pageStyle: PageStyleConfig) => {
    const filterPreset = filterPresetId
      ? getFilterPreset(filterPresetId)
      : null

    if (!filterPreset) {
      setGenerateError('Filter preset is required')
      return
    }

    setIsGenerating(true)
    setGenerateError(null)

    try {
      const pdfService = PDFGenerationService.getInstance()
      const result = await pdfService.generatePDF({
        moduleType: pdfModuleType,
        filterPreset,
        pageStyle,
        notes,
        productionName,
        productionLogo,
        ...(isFixtureModule(moduleType) && { fixtureAggregates }),
        ...(moduleType !== pdfModuleType && { moduleTitleOverride: moduleName }),
      })

      if (result.success && result.pdfBlob) {
        const url = URL.createObjectURL(result.pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        onClose()
      } else {
        setGenerateError(result.error || 'PDF generation failed')
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      setGenerateError('PDF generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateFromConfirm = async () => {
    if (!selectedPreset) return
    await doGenerate(
      selectedPreset.config.filterSortPresetId,
      selectedPreset.config.pageStyle,
    )
  }

  const handleGenerateCustom = async () => {
    if (!customFilterPreset) return
    await doGenerate(customFilterPreset.id, {
      paperSize: customPaperSize,
      orientation: customOrientation,
      includeCheckboxes: customIncludeCheckboxes,
    })
  }

  const handleClose = () => {
    setView('cards')
    setSelectedPreset(null)
    setEditingPreset(null)
    setGenerateError(null)
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col overflow-hidden p-0">
        {view === 'cards' && (
          <>
            <SheetHeader className="p-6 pb-4 border-b border-bg-tertiary">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-text-primary" />
                <SheetTitle>Print {moduleName}</SheetTitle>
              </div>
              <SheetDescription>
                Generate PDF report
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              {generateError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-sm">
                  {generateError}
                </div>
              )}
              <PresetCardGrid
                presets={printPresets}
                moduleType={moduleType}
                notes={notes}
                variant="print"
                onSelectPreset={handleSelectPreset}
                onEditPreset={(preset) => {
                  setEditingPreset(preset as PrintPreset)
                  setView('editor')
                }}
                onDeletePreset={deletePreset}
                onCreateNew={() => { setEditingPreset(null); setView('wizard') }}
                onCustomOneOff={() => setView('custom')}
                loadingPresetId={generatingPresetId}
              />
            </div>
          </>
        )}

        {view === 'confirm' && selectedPreset && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <SheetTitle className="sr-only">Confirm Print</SheetTitle>
            <ConfirmSendPanel
              preset={selectedPreset}
              moduleType={moduleType}
              notes={notes}
              placeholderData={placeholderData}
              variant="print"
              isSubmitting={isGenerating}
              submitError={generateError}
              onBack={() => {
                setView('cards')
                setSelectedPreset(null)
                setGenerateError(null)
              }}
              onSubmit={handleGenerateFromConfirm}
            />
          </div>
        )}

        {view === 'wizard' && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <SheetTitle className="sr-only">Create Print Preset</SheetTitle>
            <PresetWizard
              variant="print"
              moduleType={moduleType}
              onComplete={() => { setView('cards') }}
              onBack={() => { setView('cards') }}
            />
          </div>
        )}

        {view === 'editor' && editingPreset && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <SheetTitle className="sr-only">Edit Print Preset</SheetTitle>
            <PresetEditor
              variant="print"
              moduleType={moduleType}
              editingPreset={editingPreset}
              onComplete={() => { setEditingPreset(null); setView('cards') }}
              onBack={() => { setEditingPreset(null); setView('cards') }}
            />
          </div>
        )}

        {view === 'custom' && (
          <>
            <SheetHeader className="p-6 pb-4 border-b border-bg-tertiary">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-text-primary" />
                <SheetTitle>Custom Print</SheetTitle>
              </div>
              <SheetDescription>
                One-off PDF — this won&apos;t be saved as a preset
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-2">
                <Label>Filter & Sort Preset <span className="text-red-500">*</span></Label>
                <PresetSelector
                  presets={moduleFilterPresets}
                  selectedId={customFilterPreset?.id || null}
                  onSelect={(preset) => setCustomFilterPreset(preset as FilterSortPreset)}
                  placeholder="Select filtering options..."
                  presetType="filter_sort"
                  moduleType={moduleType}
                  enableQuickCreate
                  onQuickCreate={() => {
                    setEditingFilterPreset(null)
                    setFilterDialogOpen(true)
                  }}
                  onEdit={(preset) => {
                    setEditingFilterPreset(preset as FilterSortPreset)
                    setFilterDialogOpen(true)
                  }}
                  canEdit={(preset) => !preset.isDefault}
                />
              </div>
              <div className="space-y-3">
                <Label>Page Layout</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-text-secondary">Paper Size</Label>
                    <select
                      value={customPaperSize}
                      onChange={(e) => setCustomPaperSize(e.target.value as 'letter' | 'a4' | 'legal')}
                      className="w-full rounded-md border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary"
                    >
                      <option value="letter">Letter</option>
                      <option value="a4">A4</option>
                      <option value="legal">Legal</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-text-secondary">Orientation</Label>
                    <select
                      value={customOrientation}
                      onChange={(e) => setCustomOrientation(e.target.value as 'portrait' | 'landscape')}
                      className="w-full rounded-md border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={customIncludeCheckboxes}
                    onChange={(e) => setCustomIncludeCheckboxes(e.target.checked)}
                    className="rounded"
                  />
                  Include checkboxes
                </label>
              </div>
            </div>
            <div className="border-t border-bg-tertiary p-6">
              {generateError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-sm">
                  {generateError}
                </div>
              )}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => { setView('cards'); setGenerateError(null) }}>
                  Back
                </Button>
                <Button
                  onClick={handleGenerateCustom}
                  disabled={!customFilterPreset || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>

      <FilterSortPresetDialog
        open={filterDialogOpen}
        onOpenChange={(open) => {
          setFilterDialogOpen(open)
          if (!open) setEditingFilterPreset(null)
        }}
        editingPreset={editingFilterPreset}
        moduleType={moduleType}
        onSave={(presetId) => {
          const preset = getFilterPreset(presetId)
          if (preset) setCustomFilterPreset(preset)
        }}
      />

    </Sheet>
  )
}
