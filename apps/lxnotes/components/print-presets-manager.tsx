'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Printer, Edit2, Trash2 } from 'lucide-react'
import { usePrintPresetsStore } from '@/lib/stores/print-presets-store'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { useProductionOptional } from '@/components/production/production-provider'
import { PresetSelector } from './preset-selector'
import {
  PresetDialog,
  PresetDialogContent,
  PresetDialogActions,
  PresetFormField,
  PresetFormInput,
} from './preset-dialog'
import type { PrintPreset, ModuleType } from '@/types'
import { cn } from '@/lib/utils'

const moduleDisplayNames: Record<ModuleType, string> = {
  cue: 'Cue Notes',
  work: 'Work Notes',
  production: 'Production Notes',
  actor: 'Actor Notes',
}

const moduleOptions: ModuleType[] = ['cue', 'work', 'production']

export function PrintPresetsManager() {
  // Production context - null when in demo mode or outside ProductionProvider
  const productionContext = useProductionOptional()

  // Local store as fallback for demo mode
  const store = usePrintPresetsStore()

  // Use production presets when available, otherwise fall back to local store
  const presets = productionContext?.production?.printPresets ?? store.presets

  // Filter sort presets - use production when available
  const filterSortStore = useFilterSortPresetsStore()
  const filterSortPresets = productionContext?.production?.filterSortPresets ?? filterSortStore.presets
  const getFilterPresetsByModule = (module: ModuleType) => filterSortPresets.filter(p => p.moduleType === module)

  // Page style presets - use production when available
  const pageStyleStore = usePageStylePresetsStore()
  const pageStylePresets = productionContext?.production?.pageStylePresets ?? pageStyleStore.presets

  const [collapsed, setCollapsed] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingPreset, setEditingPreset] = useState<PrintPreset | null>(null)
  const [moduleFilter, setModuleFilter] = useState<ModuleType | 'all'>('all')

  // Form state
  const [formName, setFormName] = useState('')
  const [formModuleType, setFormModuleType] = useState<ModuleType>('cue')
  const [formFilterPresetId, setFormFilterPresetId] = useState<string | null>(null)
  const [formPageStylePresetId, setFormPageStylePresetId] = useState<string | null>(null)

  const filteredPresets = moduleFilter === 'all'
    ? presets
    : presets.filter(p => p.moduleType === moduleFilter)

  const systemPresets = filteredPresets.filter(p => p.isDefault)
  const customPresets = filteredPresets.filter(p => !p.isDefault)

  const openCreateDialog = () => {
    setEditingPreset(null)
    setFormName('')
    setFormModuleType('cue')
    setFormFilterPresetId(null)
    setFormPageStylePresetId(null)
    setShowDialog(true)
  }

  const openEditDialog = (preset: PrintPreset) => {
    setEditingPreset(preset)
    setFormName(preset.isDefault ? `Copy of ${preset.name}` : preset.name)
    setFormModuleType(preset.moduleType as ModuleType)
    setFormFilterPresetId(preset.config.filterSortPresetId)
    setFormPageStylePresetId(preset.config.pageStylePresetId)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) return

    const config: PrintPreset['config'] = {
      filterSortPresetId: formFilterPresetId,
      pageStylePresetId: formPageStylePresetId,
    }

    if (productionContext?.updatePrintPreset) {
      // Production mode - use API
      const now = new Date()
      const existingCreatedAt = editingPreset?.createdAt
      const createdAt = existingCreatedAt instanceof Date
        ? existingCreatedAt
        : existingCreatedAt
          ? new Date(existingCreatedAt)
          : now

      const preset: PrintPreset = {
        id: (editingPreset && !editingPreset.isDefault) ? editingPreset.id : crypto.randomUUID(),
        type: 'print',
        moduleType: formModuleType,
        name: formName,
        productionId: productionContext.productionId,
        config,
        isDefault: false,
        createdBy: editingPreset?.createdBy ?? 'user',
        createdAt,
        updatedAt: now,
      }
      await productionContext.updatePrintPreset(preset)
    } else {
      // Demo mode fallback - use local store
      if (editingPreset && !editingPreset.isDefault) {
        store.updatePreset(editingPreset.id, { name: formName, config })
      } else {
        store.addPreset({
          productionId: 'prod-1',
          type: 'print',
          moduleType: formModuleType,
          name: formName,
          config,
          isDefault: false,
          createdBy: 'user',
        })
      }
    }

    setShowDialog(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      if (productionContext?.deletePrintPreset) {
        await productionContext.deletePrintPreset(id)
      } else {
        // Demo mode fallback
        store.deletePreset(id)
      }
    }
  }

  return (
    <div className="rounded-lg bg-bg-secondary">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-6"
      >
        <div className="flex items-center gap-3">
          <Printer className="h-5 w-5 text-modules-production" />
          <h2 className="text-lg font-semibold text-text-primary">Print Presets</h2>
          <span className="text-sm text-text-muted">({presets.length})</span>
        </div>
        {collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
      </button>

      {!collapsed && (
        <div className="px-6 pb-6 space-y-4">
          {/* Module filter + Add button */}
          <div className="flex items-center justify-between">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value as ModuleType | 'all')}
              className="rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-1.5 text-sm text-text-primary"
            >
              <option value="all">All modules</option>
              {moduleOptions.map(m => (
                <option key={m} value={m}>{moduleDisplayNames[m]}</option>
              ))}
            </select>
            <button
              onClick={openCreateDialog}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-modules-production text-white text-sm hover:bg-modules-production/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Print Preset
            </button>
          </div>

          {/* System presets */}
          {systemPresets.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">System Defaults</h3>
              {systemPresets.map(preset => (
                <PresetRow
                  key={preset.id}
                  preset={preset}
                  onEdit={() => openEditDialog(preset)}
                  onDelete={() => handleDelete(preset.id)}
                />
              ))}
            </div>
          )}

          {/* Custom presets */}
          {customPresets.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">Custom</h3>
              {customPresets.map(preset => (
                <PresetRow
                  key={preset.id}
                  preset={preset}
                  onEdit={() => openEditDialog(preset)}
                  onDelete={() => handleDelete(preset.id)}
                />
              ))}
            </div>
          )}

          {filteredPresets.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">No print presets yet</p>
          )}
        </div>
      )}

      {/* Edit/Create Dialog */}
      {showDialog && (
        <PresetDialog
          open={showDialog}
          onClose={() => setShowDialog(false)}
          title={editingPreset?.isDefault ? 'Copy System Preset' : editingPreset ? 'Edit Print Preset' : 'New Print Preset'}
        >
          <PresetDialogContent>
            <PresetFormField label="Name" required>
              <PresetFormInput
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Preset name..."
              />
            </PresetFormField>

            {!editingPreset && (
              <PresetFormField label="Module">
                <select
                  value={formModuleType}
                  onChange={(e) => setFormModuleType(e.target.value as ModuleType)}
                  className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary"
                >
                  {moduleOptions.map(m => (
                    <option key={m} value={m}>{moduleDisplayNames[m]}</option>
                  ))}
                </select>
              </PresetFormField>
            )}

            <PresetFormField label="Filter & Sort Preset">
              <PresetSelector
                presets={getFilterPresetsByModule(formModuleType)}
                selectedId={formFilterPresetId}
                onSelect={(p) => setFormFilterPresetId(p?.id || null)}
                placeholder="Select filter..."
                presetType="filter_sort"
                moduleType={formModuleType}
              />
            </PresetFormField>

            <PresetFormField label="Page Style Preset">
              <PresetSelector
                presets={pageStylePresets}
                selectedId={formPageStylePresetId}
                onSelect={(p) => setFormPageStylePresetId(p?.id || null)}
                placeholder="Select page style..."
                presetType="page_style"
              />
            </PresetFormField>
          </PresetDialogContent>

          <PresetDialogActions>
            <button
              onClick={() => setShowDialog(false)}
              className="px-4 py-2 rounded-lg bg-bg-tertiary text-text-secondary hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formName.trim()}
              className="px-4 py-2 rounded-lg bg-modules-production text-white hover:bg-modules-production/90 transition-colors disabled:opacity-50"
            >
              {editingPreset?.isDefault ? 'Save as Copy' : editingPreset ? 'Save Changes' : 'Create Preset'}
            </button>
          </PresetDialogActions>
        </PresetDialog>
      )}
    </div>
  )
}

function PresetRow({
  preset,
  onEdit,
  onDelete,
}: {
  preset: PrintPreset
  onEdit: () => void
  onDelete: () => void
}) {
  const moduleColors: Record<string, string> = {
    cue: 'bg-modules-cue/20 text-modules-cue border-modules-cue/30',
    work: 'bg-modules-work/20 text-modules-work border-modules-work/30',
    production: 'bg-modules-production/20 text-modules-production border-modules-production/30',
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-bg-tertiary bg-bg-primary hover:bg-bg-hover transition-colors">
      <div className="flex items-center gap-3">
        <Printer className="h-4 w-4 text-modules-production" />
        <span className="text-sm font-medium text-text-primary">{preset.name}</span>
        {preset.isDefault && (
          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-secondary rounded">System</span>
        )}
        <span className={cn(
          'px-2 py-0.5 text-xs rounded-full border',
          moduleColors[preset.moduleType] || 'bg-bg-tertiary text-text-secondary'
        )}>
          {preset.moduleType} notes
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onEdit} className="p-1 hover:bg-bg-tertiary rounded" title="Edit">
          <Edit2 className="h-4 w-4 text-text-secondary" />
        </button>
        {!preset.isDefault && (
          <button onClick={onDelete} className="p-1 hover:bg-bg-tertiary rounded" title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        )}
      </div>
    </div>
  )
}
