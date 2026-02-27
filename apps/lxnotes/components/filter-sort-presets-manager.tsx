'use client'

import { useState, useMemo } from 'react'
import { Plus, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { useProductionOptional } from '@/components/production/production-provider'
import { PresetCard } from './preset-card'
import { FilterSortPresetDialog } from './filter-sort-preset-dialog'
import type { FilterSortPreset, ModuleType } from '@/types'

export function FilterSortPresetsManager() {
  // Production context - null when in demo mode or outside ProductionProvider
  const productionContext = useProductionOptional()

  // Local store as fallback for demo mode
  const store = useFilterSortPresetsStore()

  // Use production presets when available, otherwise fall back to local store
  const presets = productionContext?.production?.filterSortPresets ?? store.presets
  const getPresetsByModule = (module: ModuleType) => presets.filter(p => p.moduleType === module)

  const [collapsed, setCollapsed] = useState(false)
  const [selectedModule, setSelectedModule] = useState<ModuleType | 'all'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<FilterSortPreset | null>(null)

  // Get filtered presets based on selected module
  const filteredPresets = useMemo(() => {
    if (selectedModule === 'all') return presets
    return presets.filter(p => p.moduleType === selectedModule)
  }, [presets, selectedModule])

  const handleCreate = () => {
    setEditingPreset(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (preset: FilterSortPreset) => {
    setEditingPreset(preset)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (productionContext?.deleteFilterSortPreset) {
      await productionContext.deleteFilterSortPreset(id)
    } else {
      // Demo mode fallback
      store.deletePreset(id)
    }
  }

  const dialogModuleType: ModuleType = selectedModule !== 'all' ? selectedModule : 'cue'

  const nonSystemPresets = filteredPresets.filter(p => !p.isDefault)
  const systemPresets = filteredPresets.filter(p => p.isDefault)

  return (
    <>
      <div className="rounded-lg bg-bg-secondary p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <h2 className="text-lg font-semibold text-text-primary">Filter & Sort Presets</h2>
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="text-sm">({filteredPresets.length})</span>
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </div>
          </button>
          <button
            onClick={handleCreate}
            className="text-sm text-modules-production hover:text-modules-production/80 font-medium flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Preset
          </button>
        </div>

        {!collapsed && (
          <div className="space-y-4">
            {/* Module filter */}
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-text-secondary" />
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value as ModuleType | 'all')}
                className="text-sm bg-bg-tertiary border border-bg-hover rounded px-3 py-1 text-text-primary"
              >
                <option value="all">All Modules ({presets.length})</option>
                <option value="cue">Cue Notes ({getPresetsByModule('cue').length})</option>
                <option value="work">Work Notes ({getPresetsByModule('work').length})</option>
                <option value="production">Production Notes ({getPresetsByModule('production').length})</option>
              </select>
            </div>

            {/* Presets list */}
            <div className="space-y-3">
              {filteredPresets.length === 0 ? (
                <p className="text-text-secondary text-sm py-4">
                  {selectedModule === 'all'
                    ? 'No filter & sort presets created yet. Click "Add Preset" to create your first one.'
                    : `No presets for ${selectedModule} notes yet.`}
                </p>
              ) : (
                <>
                  {/* System presets */}
                  {systemPresets.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-text-secondary">System Defaults</h3>
                      {systemPresets.map((preset) => (
                        <PresetCard
                          key={preset.id}
                          preset={preset}
                          onEdit={(p) => handleEdit(p as FilterSortPreset)}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}

                  {/* Custom presets */}
                  {nonSystemPresets.length > 0 && (
                    <div className="space-y-2">
                      {systemPresets.length > 0 && (
                        <h3 className="text-sm font-medium text-text-secondary mt-6">Custom Presets</h3>
                      )}
                      {nonSystemPresets.map((preset) => (
                        <PresetCard
                          key={preset.id}
                          preset={preset}
                          onEdit={(p) => handleEdit(p as FilterSortPreset)}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <FilterSortPresetDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingPreset(null)
        }}
        editingPreset={editingPreset}
        moduleType={dialogModuleType}
        onProductionSave={productionContext?.updateFilterSortPreset}
        productionId={productionContext?.productionId}
      />
    </>
  )
}
