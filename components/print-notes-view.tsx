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
  PresetDialog, 
  PresetDialogContent, 
  PresetDialogActions,
  PresetFormField
} from './preset-dialog'
import type { ModuleType, FilterSortPreset, PageStylePreset, Note } from '@/types'
import { cn } from '@/lib/utils'
import { generatePDF, downloadPDF, createPDFFilename } from '@/lib/services/pdf/pdf-generator'

interface PrintNotesViewProps {
  moduleType: ModuleType
  isOpen: boolean
  onClose: () => void
  notes: Note[] // Add notes prop
}

export function PrintNotesView({ moduleType, isOpen, onClose, notes }: PrintNotesViewProps) {
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

  if (!isOpen) return null

  const moduleFilterPresets = getPresetsByModule(moduleType)

  const handleGenerate = async () => {
    if (!selectedFilterPreset || !selectedPageStylePreset) {
      return
    }
    
    setIsGenerating(true)
    
    try {
      // Generate PDF (lookup data will be handled within the generator if needed)
      const pdfBlob = await generatePDF({
        notes,
        moduleType,
        filterPreset: selectedFilterPreset,
        pageStylePreset: selectedPageStylePreset,
        productionName: productionName || 'Production',
        productionLogo: productionLogo,
      })
      
      // Download PDF
      const filename = createPDFFilename(moduleType, productionName)
      downloadPDF(pdfBlob, filename)
      
      onClose()
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      console.error('Full error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        filterPreset: {
          name: selectedFilterPreset?.name,
          config: selectedFilterPreset?.config
        },
        pageStylePreset: {
          name: selectedPageStylePreset?.name,
          config: selectedPageStylePreset?.config
        },
        notesCount: notes.length,
        moduleType,
        productionName
      })
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to generate PDF: ${errorMessage}`)
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
    <PresetDialog
      open={isOpen}
      onClose={onClose}
      title={`Print ${moduleName}`}
      description="Generate PDF report with custom formatting and filtering"
      className="max-w-3xl"
    >
      <PresetDialogContent className="space-y-6">
        {/* Filter Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text-primary flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content Filtering
            </h3>
          </div>
          
          <PresetFormField 
            label="Filter & Sort Preset" 
            description="Choose which notes to include and how to organize them"
            required
          >
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
          </PresetFormField>
          
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
          
          <PresetFormField 
            label="Page Style Preset" 
            description="Choose PDF layout and formatting options"
            required
          >
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
          </PresetFormField>
          
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
      </PresetDialogContent>

      <PresetDialogActions>
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedFilterPreset || !selectedPageStylePreset}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
            isGenerating || !selectedFilterPreset || !selectedPageStylePreset
              ? "bg-bg-tertiary text-text-muted cursor-not-allowed"
              : "bg-modules-production text-white hover:bg-modules-production/90"
          )}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Generate PDF
            </>
          )}
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
    </PresetDialog>
  )
}