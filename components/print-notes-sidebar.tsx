'use client'

import { useState } from 'react'
import { Printer, FileText, Eye, Download } from 'lucide-react'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { useProductionStore } from '@/lib/stores/production-store'
import { PresetSelector } from './preset-selector'
import { QuickCreateFilterSortDialog } from './quick-create-filter-sort-dialog'
import { QuickCreatePageStyleDialog } from './quick-create-page-style-dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { ModuleType, FilterSortPreset, PageStylePreset, Note } from '@/types'
import { cn } from '@/lib/utils'
import { PDFGenerationService } from '@/lib/services/pdf'
import { getMockNotes } from '@/lib/utils/mockNotesData'

interface PrintNotesSidebarProps {
  moduleType: ModuleType
  isOpen: boolean
  onClose: () => void
  notes?: Note[] // Optional: if provided, use these notes instead of mock data
}

export function PrintNotesSidebar({ moduleType, isOpen, onClose, notes }: PrintNotesSidebarProps) {
  const { presets: filterSortPresets, getPresetsByModule } = useFilterSortPresetsStore()
  const { presets: pageStylePresets } = usePageStylePresetsStore()
  const { name: productionName, logo: productionLogo } = useProductionStore()

  const [selectedFilterPreset, setSelectedFilterPreset] = useState<FilterSortPreset | null>(null)
  const [selectedPageStylePreset, setSelectedPageStylePreset] = useState<PageStylePreset | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showFilterQuickCreate, setShowFilterQuickCreate] = useState(false)
  const [showPageStyleQuickCreate, setShowPageStyleQuickCreate] = useState(false)
  const [editingFilterPreset, setEditingFilterPreset] = useState<FilterSortPreset | null>(null)
  const [editingPageStylePreset, setEditingPageStylePreset] = useState<PageStylePreset | null>(null)

  const moduleFilterPresets = getPresetsByModule(moduleType)

  const handleGenerate = async () => {
    if (!selectedFilterPreset || !selectedPageStylePreset) {
      return
    }

    setIsGenerating(true)

    try {
      // Use provided notes or fall back to mock data
      const notesToUse = notes || getMockNotes(moduleType)

      // Generate PDF using the service
      const pdfService = PDFGenerationService.getInstance()
      const result = await pdfService.generatePDF({
        moduleType,
        filterPreset: selectedFilterPreset,
        pageStylePreset: selectedPageStylePreset,
        notes: notesToUse,
        productionName,
        productionLogo
      })

      if (result.success && result.pdfBlob) {
        // Create download link and trigger download
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
        alert(`PDF generation failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('PDF generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFilterPresetCreated = (preset: FilterSortPreset) => {
    setSelectedFilterPreset(preset)
    setShowFilterQuickCreate(false)
  }

  const handlePageStylePresetCreated = (preset: PageStylePreset) => {
    setSelectedPageStylePreset(preset)
    setShowPageStyleQuickCreate(false)
  }

  const handleEditFilterPreset = (preset: FilterSortPreset) => {
    setEditingFilterPreset(preset)
    setShowFilterQuickCreate(true)
  }

  const handleEditPageStylePreset = (preset: PageStylePreset) => {
    setEditingPageStylePreset(preset)
    setShowPageStyleQuickCreate(true)
  }

  const getFilterSummary = () => {
    if (!selectedFilterPreset) return 'Please select a filter preset'

    const config = selectedFilterPreset.config
    const parts = []

    if (config.statusFilter) {
      parts.push(`Status: ${config.statusFilter.toUpperCase()}`)
    } else {
      parts.push('Status: ALL')
    }

    if (config.typeFilters.length > 0) {
      parts.push(`Types: ${config.typeFilters.length} selected`)
    } else {
      parts.push('Types: ALL')
    }

    if (config.priorityFilters.length > 0) {
      parts.push(`Priorities: ${config.priorityFilters.length} selected`)
    } else {
      parts.push('Priorities: ALL')
    }

    parts.push(`Sort: ${config.sortBy} (${config.sortOrder})`)

    if (config.groupByType) {
      parts.push('Grouped by type')
    }

    return parts.join(' • ')
  }

  const getPageStyleSummary = () => {
    if (!selectedPageStylePreset) return 'Please select a page style preset'

    const config = selectedPageStylePreset.config
    return `${config.paperSize.toUpperCase()} • ${config.orientation} • ${config.includeCheckboxes ? 'Checkboxes' : 'No checkboxes'}`
  }

  const moduleName = {
    cue: 'Cue Notes',
    work: 'Work Notes',
    production: 'Production Notes'
  }[moduleType]

  const moduleColor = {
    cue: 'modules-cue',
    work: 'modules-work',
    production: 'modules-production'
  }[moduleType]

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-3xl flex flex-col overflow-hidden p-0">
          <SheetHeader className="p-6 pb-4 border-b border-bg-tertiary">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-text-primary" />
              <SheetTitle>Print {moduleName}</SheetTitle>
            </div>
            <SheetDescription>
              Generate PDF report with custom formatting and filtering
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Filter Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-text-primary flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content Filtering
                  </h3>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Filter & Sort Preset <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-text-muted">
                    Choose which notes to include and how to organize them
                  </p>
                  <PresetSelector
                    presets={moduleFilterPresets}
                    selectedId={selectedFilterPreset?.id || null}
                    onSelect={(preset) => setSelectedFilterPreset(preset as FilterSortPreset)}
                    placeholder="Select filtering options..."
                    enableQuickCreate={true}
                    presetType="filter_sort"
                    moduleType={moduleType}
                    onQuickCreate={() => setShowFilterQuickCreate(true)}
                    onEdit={(preset) => handleEditFilterPreset(preset as FilterSortPreset)}
                    canEdit={() => true}
                  />
                </div>

                <div className="bg-bg-tertiary rounded p-3">
                  <p className="text-sm text-text-secondary">{getFilterSummary()}</p>
                </div>
              </div>

              {/* Page Style Selection */}
              <div className="space-y-3">
                <h3 className="font-medium text-text-primary flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Page Formatting
                </h3>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Page Style Preset <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-text-muted">
                    Choose PDF layout and formatting options
                  </p>
                  <PresetSelector
                    presets={pageStylePresets}
                    selectedId={selectedPageStylePreset?.id || null}
                    onSelect={(preset) => setSelectedPageStylePreset(preset as PageStylePreset)}
                    placeholder="Select page formatting..."
                    enableQuickCreate={true}
                    presetType="page_style"
                    onQuickCreate={() => setShowPageStyleQuickCreate(true)}
                    onEdit={(preset) => handleEditPageStylePreset(preset as PageStylePreset)}
                    canEdit={() => true}
                  />
                </div>

                <div className="bg-bg-tertiary rounded p-3">
                  <p className="text-sm text-text-secondary">{getPageStyleSummary()}</p>
                </div>
              </div>

              {/* Preview Toggle */}
              {(selectedFilterPreset || selectedPageStylePreset) && (
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
                      <div className="space-y-2">
                        <div className="text-center border-b border-gray-300 pb-2">
                          <h1 className="text-xl font-bold">Sample Production - {moduleName}</h1>
                          <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                        </div>

                        {selectedPageStylePreset?.config.includeCheckboxes && (
                          <div className="text-xs text-gray-500 mb-2">☐ = Todo | ☑ = Complete | ☒ = Cancelled</div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            {selectedPageStylePreset?.config.includeCheckboxes && <span>☐</span>}
                            <span className="font-medium">Sample Note Title</span>
                            <span className={`px-2 py-1 rounded text-xs text-white bg-${moduleColor}`}>High</span>
                          </div>
                          <p className="text-xs text-gray-600 ml-4">Sample note description would appear here...</p>
                        </div>

                        <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-200">
                          Page 1 of 1 • {selectedPageStylePreset?.config.paperSize.toUpperCase() || 'LETTER'} • {selectedPageStylePreset?.config.orientation.toUpperCase() || 'PORTRAIT'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="bg-bg-tertiary rounded-lg p-4">
                <h4 className="font-medium text-text-primary mb-2">Report Summary</h4>
                <div className="space-y-1 text-sm text-text-secondary">
                  <p>• Module: {moduleName}</p>
                  <p>• Filter: {selectedFilterPreset?.name || 'Not selected (required)'}</p>
                  <p>• Page Style: {selectedPageStylePreset?.name || 'Not selected (required)'}</p>
                  <p>• Estimated notes: ~15 items</p>
                </div>
              </div>
            </div>

          {/* Sticky Footer */}
          <div className="border-t border-bg-tertiary p-6">
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedFilterPreset || !selectedPageStylePreset || isGenerating}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Generate PDF'}
                </Button>
              </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quick Create Dialogs */}
      {showFilterQuickCreate && (
        <QuickCreateFilterSortDialog
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
        <QuickCreatePageStyleDialog
          isOpen={showPageStyleQuickCreate}
          onClose={() => {
            setShowPageStyleQuickCreate(false)
            setEditingPageStylePreset(null)
          }}
          onPresetCreated={handlePageStylePresetCreated}
          editingPreset={editingPageStylePreset}
        />
      )}
    </>
  )
}