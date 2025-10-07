'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Printer } from 'lucide-react'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import { 
  QuickCreatePresetDialog, 
  QuickCreatePresetDialogContent, 
  QuickCreatePresetDialogActions 
} from './quick-create-preset-dialog'
import { 
  PresetFormField,
  PresetFormInput,
  PresetFormSelect,
  PresetFormToggle
} from './preset-dialog'
import { pageStyleFormSchema, type PageStyleFormData } from '@/lib/validation/preset-schemas'
import type { PageStylePreset } from '@/types'
import { cn } from '@/lib/utils'

interface QuickCreatePageStyleDialogProps {
  isOpen: boolean
  onClose: () => void
  onPresetCreated: (preset: PageStylePreset) => void
  defaultValues?: Partial<PageStyleFormData>
  editingPreset?: PageStylePreset | null
}

export function QuickCreatePageStyleDialog({
  isOpen,
  onClose,
  onPresetCreated,
  defaultValues = {},
  editingPreset = null
}: QuickCreatePageStyleDialogProps) {
  const { addPreset, updatePreset } = usePageStylePresetsStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!editingPreset

  const form = useForm<PageStyleFormData>({
    resolver: zodResolver(pageStyleFormSchema),
    defaultValues: {
      name: '',
      paperSize: 'letter',
      orientation: 'portrait',
      includeCheckboxes: true,
      ...defaultValues,
    },
  })

  // Reset form when editingPreset changes
  useEffect(() => {
    if (editingPreset) {
      form.reset({
        name: editingPreset.name,
        paperSize: editingPreset.config.paperSize,
        orientation: editingPreset.config.orientation,
        includeCheckboxes: editingPreset.config.includeCheckboxes,
        ...defaultValues,
      })
    } else {
      form.reset({
        name: '',
        paperSize: 'letter',
        orientation: 'portrait',
        includeCheckboxes: true,
        ...defaultValues,
      })
    }
  }, [editingPreset]) // Removed form and defaultValues from dependencies

  const handleSubmit = async (data: PageStyleFormData) => {
    setIsSubmitting(true)

    try {
      if (isEditing && editingPreset) {
        if (editingPreset.isDefault) {
          // Create new preset based on system default (don't modify original)
          const newPresetData = {
            type: 'page_style' as const,
            moduleType: 'all' as const,
            name: data.name,
            productionId: 'prod-1', // TODO: Get from production context
            config: {
              paperSize: data.paperSize,
              orientation: data.orientation,
              includeCheckboxes: data.includeCheckboxes,
            },
            isDefault: false,
            createdBy: 'user', // TODO: Get from auth
          }

          addPreset(newPresetData)

          // Create the preset object to return
          const createdPreset: PageStylePreset = {
            id: `page-style-${Math.random().toString(36).substr(2, 9)}`,
            productionId: 'prod-1', // TODO: Get from production context
            type: 'page_style',
            moduleType: 'all',
            name: data.name,
            config: newPresetData.config,
            isDefault: false,
            createdBy: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          onPresetCreated(createdPreset)
        } else {
          // Update existing user preset
          const updatedConfig = {
            paperSize: data.paperSize,
            orientation: data.orientation,
            includeCheckboxes: data.includeCheckboxes,
          }

          updatePreset(editingPreset.id, {
            name: data.name,
            config: updatedConfig,
          })

          // Create updated preset object for callback
          const updatedPreset: PageStylePreset = {
            ...editingPreset,
            name: data.name,
            config: updatedConfig,
            updatedAt: new Date(),
          }

          onPresetCreated(updatedPreset)
        }
      } else {
        // Create new preset
        const newPresetData = {
          type: 'page_style' as const,
          moduleType: 'all' as const,
          name: data.name,
          productionId: 'prod-1', // TODO: Get from production context
          config: {
            paperSize: data.paperSize,
            orientation: data.orientation,
            includeCheckboxes: data.includeCheckboxes,
          },
          isDefault: false,
          createdBy: 'user', // TODO: Get from auth
        }

        addPreset(newPresetData)

        // Create the preset object to return
        const createdPreset: PageStylePreset = {
          id: `page-style-${Math.random().toString(36).substr(2, 9)}`,
          productionId: 'prod-1', // TODO: Get from production context
          type: 'page_style',
          moduleType: 'all',
          name: data.name,
          config: newPresetData.config,
          isDefault: false,
          createdBy: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        onPresetCreated(createdPreset)
      }

      onClose()
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} preset:`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.reset()
    onClose()
  }

  // Generate a default name based on selections
  const generateDefaultName = () => {
    const paperSize = form.watch('paperSize').toUpperCase()
    const orientation = form.watch('orientation').charAt(0).toUpperCase() + form.watch('orientation').slice(1)
    const checkboxes = form.watch('includeCheckboxes') ? 'with Checkboxes' : 'without Checkboxes'
    return `${paperSize} ${orientation} ${checkboxes}`
  }

  const handleAutoFillName = () => {
    const defaultName = generateDefaultName()
    form.setValue('name', defaultName)
  }

  return (
    <QuickCreatePresetDialog
      open={isOpen}
      onClose={handleCancel}
      title={isEditing && editingPreset?.isDefault ? "Copy System Page Style" :
             isEditing ? "Edit Page Style Preset" : "Create Page Style Preset"}
      description={isEditing && editingPreset?.isDefault ?
                   `Create a custom copy of "${editingPreset?.name}" for PDF formatting` :
                   isEditing ? 'Edit PDF formatting options' :
                   'Quick create for PDF formatting options'}
      className="max-w-md"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <QuickCreatePresetDialogContent>
          <div className="space-y-4">
            {/* Preset Name */}
            <PresetFormField label="Preset Name" required>
              <div className="space-y-2">
                <PresetFormInput
                  {...form.register('name')}
                  placeholder="e.g., Letter Portrait with Checkboxes"
                  disabled={isSubmitting}
                />
                {!form.watch('name') && (
                  <button
                    type="button"
                    onClick={handleAutoFillName}
                    className="text-xs text-modules-production hover:text-modules-production/80"
                    disabled={isSubmitting}
                  >
                    Auto-fill name based on selections
                  </button>
                )}
              </div>
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </PresetFormField>

            {/* Paper Size */}
            <PresetFormField 
              label="Paper Size" 
              description="Choose the paper size for PDF generation"
              required
            >
              <PresetFormSelect {...form.register('paperSize')} disabled={isSubmitting}>
                <option value="letter">Letter (8.5&quot; × 11&quot;)</option>
                <option value="a4">A4 (210mm × 297mm)</option>
                <option value="legal">Legal (8.5&quot; × 14&quot;)</option>
              </PresetFormSelect>
            </PresetFormField>

            {/* Orientation */}
            <PresetFormField 
              label="Orientation" 
              description="Choose page orientation"
              required
            >
              <PresetFormSelect {...form.register('orientation')} disabled={isSubmitting}>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </PresetFormSelect>
            </PresetFormField>

            {/* Include Checkboxes */}
            <PresetFormToggle
              checked={form.watch('includeCheckboxes')}
              onCheckedChange={(checked) => form.setValue('includeCheckboxes', checked)}
              label="Include Checkboxes"
              description="Add checkboxes next to each note for marking completion"
            />

            {/* Preview */}
            <div className="bg-bg-tertiary rounded p-3">
              <p className="text-sm font-medium text-text-secondary mb-2">Preview:</p>
              <div className="text-xs text-text-muted space-y-1">
                <p>• Paper: {form.watch('paperSize').toUpperCase()}</p>
                <p>• Orientation: {form.watch('orientation').charAt(0).toUpperCase() + form.watch('orientation').slice(1)}</p>
                <p>• Checkboxes: {form.watch('includeCheckboxes') ? 'Included' : 'Not included'}</p>
              </div>
            </div>
          </div>
        </QuickCreatePresetDialogContent>

        <QuickCreatePresetDialogActions>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !form.watch('name')}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
              isSubmitting || !form.watch('name')
                ? "bg-bg-tertiary text-text-muted cursor-not-allowed"
                : "bg-modules-production text-white hover:bg-modules-production/90"
            )}
          >
            {isSubmitting ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isEditing && editingPreset?.isDefault ? 'Saving Copy...' :
                 isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Printer className="h-3 w-3" />
                {isEditing && editingPreset?.isDefault ? 'Save as Copy' :
                 isEditing ? 'Update Preset' : 'Create Preset'}
              </>
            )}
          </button>
        </QuickCreatePresetDialogActions>
      </form>
    </QuickCreatePresetDialog>
  )
}
