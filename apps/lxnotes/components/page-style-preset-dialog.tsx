'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
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

interface PageStylePresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPreset?: PageStylePreset | null
  /** Called after successful save with the preset id */
  onSave?: (presetId: string) => void
}

export function PageStylePresetDialog({
  open,
  onOpenChange,
  editingPreset,
  onSave,
}: PageStylePresetDialogProps) {
  const { addPreset, updatePreset } = usePageStylePresetsStore()

  const form = useForm<PageStyleFormData>({
    resolver: zodResolver(pageStyleFormSchema),
    defaultValues: {
      name: '',
      paperSize: 'letter',
      orientation: 'portrait',
      includeCheckboxes: true,
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return
    if (editingPreset) {
      form.reset({
        name: editingPreset.name,
        paperSize: editingPreset.config.paperSize,
        orientation: editingPreset.config.orientation,
        includeCheckboxes: editingPreset.config.includeCheckboxes,
      })
    } else {
      form.reset({
        name: '',
        paperSize: 'letter',
        orientation: 'portrait',
        includeCheckboxes: true,
      })
    }
  }, [open, editingPreset, form])

  const handleSubmit = (data: PageStyleFormData) => {
    let presetId: string
    if (editingPreset) {
      updatePreset(editingPreset.id, {
        name: data.name,
        config: {
          paperSize: data.paperSize,
          orientation: data.orientation,
          includeCheckboxes: data.includeCheckboxes,
        }
      })
      presetId = editingPreset.id
    } else {
      addPreset({
        type: 'page_style',
        moduleType: 'all',
        name: data.name,
        productionId: 'prod-1',
        config: {
          paperSize: data.paperSize,
          orientation: data.orientation,
          includeCheckboxes: data.includeCheckboxes,
        },
        isDefault: false,
        createdBy: 'user',
      })
      const storePresets = usePageStylePresetsStore.getState().presets
      presetId = storePresets[storePresets.length - 1].id
    }

    onOpenChange(false)
    onSave?.(presetId)
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
  }

  return (
    <PresetDialog
      open={open}
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
                <option value="letter">Letter (8.5&quot; &times; 11&quot;)</option>
                <option value="a4">A4 (210mm &times; 297mm)</option>
                <option value="legal">Legal (8.5&quot; &times; 14&quot;)</option>
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
  )
}
