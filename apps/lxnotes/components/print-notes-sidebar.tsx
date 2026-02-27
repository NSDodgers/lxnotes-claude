'use client'

import { useState, useMemo } from 'react'
import { Printer, Download, Loader2 } from 'lucide-react'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { usePrintPresetsStore } from '@/lib/stores/print-presets-store'
import { useCurrentProductionStore } from '@/lib/stores/production-store'
import { useProductionOptional } from '@/components/production/production-provider'
import { PresetCardGrid } from './preset-card-grid'
import { ConfirmSendPanel } from './confirm-send-panel'
import { PresetWizard } from './preset-wizard'
import { PresetSelector } from './preset-selector'
import { FilterSortPresetDialog } from './filter-sort-preset-dialog'
import { PageStylePresetDialog } from './page-style-preset-dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { ModuleType, PrintPreset, FilterSortPreset, PageStylePreset, Note } from '@/types'
import { PDFGenerationService } from '@/lib/services/pdf'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { PlaceholderData } from '@/lib/utils/placeholders'
import { useAuthContext } from '@/components/auth/auth-provider'

interface PrintNotesSidebarProps {
  moduleType: ModuleType
  isOpen: boolean
  onClose: () => void
  notes?: Note[]
}

type SidebarView = 'cards' | 'confirm' | 'wizard' | 'custom'

const moduleDisplayNames: Record<ModuleType, string> = {
  cue: 'Cue Notes',
  work: 'Work Notes',
  production: 'Production Notes',
  actor: 'Actor Notes',
}

export function PrintNotesSidebar({ moduleType, isOpen, onClose, notes: propNotes }: PrintNotesSidebarProps) {
  const { getPreset: getFilterPreset, getPresetsByModule } = useFilterSortPresetsStore()
  const { presets: pageStylePresets } = usePageStylePresetsStore()
  const { getPresetsByModule: getPrintPresetsByModule } = usePrintPresetsStore()
  const localProductionStore = useCurrentProductionStore()
  const productionContext = useProductionOptional()
  const { user } = useAuthContext()
  // Prefer production context (Supabase) if available, otherwise use local store
  // Crucially, if we have a production context, use its values even if falsy/undefined (e.g. no logo)
  // to avoid falling back to local store defaults when we shouldn't.
  const activeProduction = productionContext?.production
  const productionName = activeProduction ? activeProduction.name : localProductionStore.name
  const productionLogo = activeProduction ? activeProduction.logo : localProductionStore.logo
  const mockNotesStore = useMockNotesStore()

  // Get user's name from auth metadata
  const userFullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'

  const [view, setView] = useState<SidebarView>('cards')
  const [selectedPreset, setSelectedPreset] = useState<PrintPreset | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Custom one-off state
  const [customFilterPreset, setCustomFilterPreset] = useState<FilterSortPreset | null>(null)
  const [customPageStylePreset, setCustomPageStylePreset] = useState<PageStylePreset | null>(null)

  // Inline create/edit dialog state
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [pageStyleDialogOpen, setPageStyleDialogOpen] = useState(false)
  const [editingFilterPreset, setEditingFilterPreset] = useState<FilterSortPreset | null>(null)
  const [editingPageStylePreset, setEditingPageStylePreset] = useState<PageStylePreset | null>(null)

  const printPresets = getPrintPresetsByModule(moduleType)
  const moduleFilterPresets = getPresetsByModule(moduleType)
  const notes = propNotes || mockNotesStore.getAllNotes(moduleType)
  const moduleName = moduleDisplayNames[moduleType]

  const placeholderData: PlaceholderData = useMemo(() => ({
    productionTitle: productionName || 'Production',
    userFullName,
    moduleName,
    noteCount: notes.length,
  }), [productionName, moduleName, notes.length, userFullName])

  const [generatingPresetId, setGeneratingPresetId] = useState<string | null>(null)

  const handleSelectPreset = async (preset: PrintPreset) => {
    const printPreset = preset as PrintPreset
    setGeneratingPresetId(printPreset.id)
    setGenerateError(null)

    try {
      await doGenerate(
        printPreset.config.filterSortPresetId,
        printPreset.config.pageStylePresetId,
      )
    } finally {
      setGeneratingPresetId(null)
    }
  }

  const doGenerate = async (filterPresetId: string | null, pageStylePresetId: string | null) => {
    const filterPreset = filterPresetId
      ? getFilterPreset(filterPresetId)
      : null
    const pageStylePreset = pageStylePresetId
      ? pageStylePresets.find(p => p.id === pageStylePresetId)
      : null

    if (!filterPreset || !pageStylePreset) {
      setGenerateError('Both filter and page style presets are required')
      return
    }

    setIsGenerating(true)
    setGenerateError(null)

    try {
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
      selectedPreset.config.pageStylePresetId,
    )
  }

  const handleGenerateCustom = async () => {
    if (!customFilterPreset || !customPageStylePreset) return
    await doGenerate(customFilterPreset.id, customPageStylePreset.id)
  }

  const handleClose = () => {
    setView('cards')
    setSelectedPreset(null)
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
                onCreateNew={() => setView('wizard')}
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
              onComplete={() => setView('cards')}
              onBack={() => setView('cards')}
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
              <div className="space-y-2">
                <Label>Page Style Preset <span className="text-red-500">*</span></Label>
                <PresetSelector
                  presets={pageStylePresets}
                  selectedId={customPageStylePreset?.id || null}
                  onSelect={(preset) => setCustomPageStylePreset(preset as PageStylePreset)}
                  placeholder="Select page formatting..."
                  presetType="page_style"
                  enableQuickCreate
                  onQuickCreate={() => {
                    setEditingPageStylePreset(null)
                    setPageStyleDialogOpen(true)
                  }}
                  onEdit={(preset) => {
                    setEditingPageStylePreset(preset as PageStylePreset)
                    setPageStyleDialogOpen(true)
                  }}
                  canEdit={(preset) => !preset.isDefault}
                />
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
                  disabled={!customFilterPreset || !customPageStylePreset || isGenerating}
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
          const preset = useFilterSortPresetsStore.getState().getPreset(presetId)
          if (preset) setCustomFilterPreset(preset)
        }}
      />

      <PageStylePresetDialog
        open={pageStyleDialogOpen}
        onOpenChange={(open) => {
          setPageStyleDialogOpen(open)
          if (!open) setEditingPageStylePreset(null)
        }}
        editingPreset={editingPageStylePreset}
        onSave={(presetId) => {
          const preset = pageStylePresets.find(p => p.id === presetId)
            || usePageStylePresetsStore.getState().presets.find(p => p.id === presetId)
          if (preset) setCustomPageStylePreset(preset)
        }}
      />
    </Sheet>
  )
}
