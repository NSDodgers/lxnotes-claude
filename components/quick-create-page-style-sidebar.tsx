'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Printer } from 'lucide-react'
import { usePageStylePresetsStore } from '@/lib/stores/page-style-presets-store'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  PresetFormField,
  PresetFormInput,
  PresetFormSelect,
  PresetFormToggle
} from './preset-dialog'
import { pageStyleFormSchema, type PageStyleFormData } from '@/lib/validation/preset-schemas'
import type { PageStylePreset } from '@/types'

interface QuickCreatePageStyleSidebarProps {
  isOpen: boolean
  onClose: () => void
  onPresetCreated: (preset: PageStylePreset) => void
  defaultValues?: Partial<PageStyleFormData>
  editingPreset?: PageStylePreset | null
}

export function QuickCreatePageStyleSidebar({
  isOpen,
  onClose,
  onPresetCreated,
  defaultValues = {},
  editingPreset = null
}: QuickCreatePageStyleSidebarProps) {
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
  }, [editingPreset])

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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col overflow-hidden p-0">
        <SheetHeader className="p-6 pb-4 border-b border-bg-tertiary">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-text-primary" />
            <SheetTitle>
              {isEditing && editingPreset?.isDefault ? "Copy System Page Style" :
               isEditing ? "Edit Page Style Preset" : "Create Page Style Preset"}
            </SheetTitle>
          </div>
          <SheetDescription>
            {isEditing && editingPreset?.isDefault ?
             `Create a custom copy of "${editingPreset?.name}" for PDF formatting` :
             isEditing ? 'Edit PDF formatting options' :
             'Quick create for PDF formatting options'}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                <option value="letter">Letter (8.5" × 11")</option>
                <option value="a4">A4 (210mm × 297mm)</option>
                <option value="legal">Legal (8.5" × 14")</option>
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
            <div className="bg-bg-tertiary rounded-lg p-4">
              <p className="text-sm font-medium text-text-secondary mb-3">Preview:</p>
              <div className="text-sm text-text-muted space-y-2">
                <p>• Paper: {form.watch('paperSize').toUpperCase()}</p>
                <p>• Orientation: {form.watch('orientation').charAt(0).toUpperCase() + form.watch('orientation').slice(1)}</p>
                <p>• Checkboxes: {form.watch('includeCheckboxes') ? 'Included' : 'Not included'}</p>
              </div>
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-bg-tertiary p-6">
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isSubmitting || !form.watch('name')}
              className="flex items-center gap-2"
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
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}