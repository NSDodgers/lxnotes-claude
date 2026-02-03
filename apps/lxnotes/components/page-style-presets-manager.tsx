'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { useProductionOptional } from '@/components/production/production-provider'
import { PresetCard } from './preset-card'
import { PageStylePresetDialog } from './page-style-preset-dialog'
import type { PageStylePreset } from '@/types'

export function PageStylePresetsManager() {
  // Production context - null when in demo mode or outside ProductionProvider
  const productionContext = useProductionOptional()

  // Local store as fallback for demo mode
  const store = usePageStylePresetsStore()

  // Use production presets when available, otherwise fall back to local store
  const presets = productionContext?.production?.pageStylePresets ?? store.presets
  const [collapsed, setCollapsed] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<PageStylePreset | null>(null)

  const handleCreate = () => {
    setEditingPreset(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (preset: PageStylePreset) => {
    setEditingPreset(preset)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (productionContext?.deletePageStylePreset) {
      await productionContext.deletePageStylePreset(id)
    } else {
      // Demo mode fallback
      store.deletePreset(id)
    }
  }

  const nonSystemPresets = presets.filter(p => !p.isDefault)
  const systemPresets = presets.filter(p => p.isDefault)

  return (
    <>
      <div className="rounded-lg bg-bg-secondary p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <h2 className="text-lg font-semibold text-text-primary">Page Style Presets</h2>
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="text-sm">({presets.length})</span>
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
          <div className="space-y-3">
            {presets.length === 0 ? (
              <p className="text-text-secondary text-sm py-4">
                No page style presets created yet. Click &quot;Add Preset&quot; to create your first one.
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
                        onEdit={(p) => handleEdit(p as PageStylePreset)}
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
                        onEdit={(p) => handleEdit(p as PageStylePreset)}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <PageStylePresetDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingPreset(null)
        }}
        editingPreset={editingPreset}
        onProductionSave={productionContext?.updatePageStylePreset}
        productionId={productionContext?.productionId}
      />
    </>
  )
}
