'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { PresetCard } from './preset-card'
import { 
  PresetDialog, 
  PresetDialogContent, 
  PresetDialogActions,
  PresetFormField,
  PresetFormInput,
  PresetFormSelect,
  PresetFormToggle
} from './preset-dialog'
import { pageStyleFormSchema, type PageStyleFormData } from '@/lib/validation/preset-schemas'
import type { PageStylePreset } from '@/types'
import { cn } from '@/lib/utils'

export function PageStylePresetsManager() {
  const { presets, addPreset, updatePreset, deletePreset } = usePageStylePresetsStore()
  const [collapsed, setCollapsed] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<PageStylePreset | null>(null)

  const form = useForm<PageStyleFormData>({
    resolver: zodResolver(pageStyleFormSchema),
    defaultValues: {
      name: '',
      paperSize: 'letter',
      orientation: 'portrait',
      includeCheckboxes: true,
    },
  })

  const handleCreate = () => {
    setEditingPreset(null)
    form.reset({
      name: '',
      paperSize: 'letter',
      orientation: 'portrait',
      includeCheckboxes: true,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (preset: PageStylePreset) => {
    setEditingPreset(preset)
    form.reset({
      name: preset.name,
      paperSize: preset.config.paperSize,
      orientation: preset.config.orientation,
      includeCheckboxes: preset.config.includeCheckboxes,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    deletePreset(id)
  }

  const handleSubmit = (data: PageStyleFormData) => {
    if (editingPreset) {
      // Update existing preset
      updatePreset(editingPreset.id, {
        paperSize: data.paperSize,
        orientation: data.orientation,
        includeCheckboxes: data.includeCheckboxes,
      })
    } else {
      // Create new preset
      addPreset({
        type: 'page_style',
        moduleType: 'all',
        name: data.name,
        productionId: 'prod-1', // TODO: Get from production context
        config: {
          paperSize: data.paperSize,
          orientation: data.orientation,
          includeCheckboxes: data.includeCheckboxes,
        },
        isDefault: false,
        createdBy: 'user', // TODO: Get from auth
      })
    }
    
    setIsDialogOpen(false)
    setEditingPreset(null)
    form.reset()
  }

  const handleCancel = () => {
    setIsDialogOpen(false)
    setEditingPreset(null)
    form.reset()
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
                No page style presets created yet. Click "Add Preset" to create your first one.
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

      {/* Create/Edit Dialog */}
      <PresetDialog
        open={isDialogOpen}
        onClose={handleCancel}
        title={editingPreset ? 'Edit Page Style Preset' : 'Create Page Style Preset'}
        description="Configure PDF formatting options for reports and exports"
        className="max-w-md"
      >
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <PresetDialogContent>
            <div className="space-y-4">
              <PresetFormField 
                label="Preset Name" 
                required
                description="A descriptive name for this page style configuration"
              >
                <PresetFormInput
                  {...form.register('name')}
                  placeholder="e.g., Letter Portrait with Checkboxes"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </PresetFormField>

              <PresetFormField 
                label="Paper Size" 
                required
                description="Choose the paper size for PDF generation"
              >
                <PresetFormSelect {...form.register('paperSize')}>
                  <option value="letter">Letter (8.5" × 11")</option>
                  <option value="a4">A4 (210mm × 297mm)</option>
                  <option value="legal">Legal (8.5" × 14")</option>
                </PresetFormSelect>
                {form.formState.errors.paperSize && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.paperSize.message}
                  </p>
                )}
              </PresetFormField>

              <PresetFormField 
                label="Orientation" 
                required
                description="Choose page orientation for the PDF"
              >
                <PresetFormSelect {...form.register('orientation')}>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </PresetFormSelect>
                {form.formState.errors.orientation && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.orientation.message}
                  </p>
                )}
              </PresetFormField>

              <PresetFormToggle
                checked={form.watch('includeCheckboxes')}
                onCheckedChange={(checked) => form.setValue('includeCheckboxes', checked)}
                label="Include Checkboxes"
                description="Add checkboxes next to each note for printing and manual completion tracking"
              />
            </div>
          </PresetDialogContent>

          <PresetDialogActions>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-modules-production text-white rounded-lg hover:bg-modules-production/90 transition-colors"
            >
              {editingPreset ? 'Update' : 'Create'} Preset
            </button>
          </PresetDialogActions>
        </form>
      </PresetDialog>
    </>
  )
}