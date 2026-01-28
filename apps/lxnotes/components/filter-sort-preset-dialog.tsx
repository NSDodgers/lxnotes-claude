'use client'

import { useState, useMemo, useEffect } from 'react'
import { CheckSquare, Square } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import {
  PresetDialog,
  PresetDialogContent,
  PresetDialogActions,
  PresetFormField,
  PresetFormInput,
  PresetFormSelect,
  PresetFormToggle
} from './preset-dialog'
import { filterSortFormSchema, type FilterSortFormData, getSortFieldsForModule } from '@/lib/validation/preset-schemas'
import type { FilterSortPreset, ModuleType } from '@/types'

interface FilterSortPresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPreset?: FilterSortPreset | null
  moduleType: ModuleType
  /** Called after successful save with the preset id */
  onSave?: (presetId: string) => void
}

export function FilterSortPresetDialog({
  open,
  onOpenChange,
  editingPreset,
  moduleType,
  onSave,
}: FilterSortPresetDialogProps) {
  const { addPreset, updatePreset, presets } = useFilterSortPresetsStore()
  const { getTypes } = useCustomTypesStore()
  const { getPriorities } = useCustomPrioritiesStore()

  const form = useForm<FilterSortFormData>({
    resolver: zodResolver(filterSortFormSchema),
    defaultValues: {
      name: '',
      moduleType,
      statusFilter: 'todo',
      typeFilters: [],
      priorityFilters: [],
      sortBy: 'priority',
      sortOrder: 'desc',
      groupByType: false,
    },
  })

  const watchedModuleType = form.watch('moduleType')

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return
    if (editingPreset) {
      form.reset({
        name: editingPreset.name,
        moduleType: editingPreset.moduleType,
        statusFilter: editingPreset.config.statusFilter,
        typeFilters: editingPreset.config.typeFilters,
        priorityFilters: editingPreset.config.priorityFilters,
        sortBy: editingPreset.config.sortBy,
        sortOrder: editingPreset.config.sortOrder,
        groupByType: editingPreset.config.groupByType,
      })
    } else {
      const types = getTypes(moduleType)
      const priorities = getPriorities(moduleType)
      form.reset({
        name: '',
        moduleType,
        statusFilter: 'todo',
        typeFilters: types.map(t => t.value),
        priorityFilters: priorities.map(p => p.value),
        sortBy: 'priority',
        sortOrder: 'desc',
        groupByType: false,
      })
    }
  }, [open, editingPreset, moduleType, form, getTypes, getPriorities])

  const availableTypes = useMemo(() => getTypes(watchedModuleType), [watchedModuleType, getTypes])
  const availablePriorities = useMemo(() => getPriorities(watchedModuleType), [watchedModuleType, getPriorities])
  const availableSortFields = useMemo(() => {
    const fields = getSortFieldsForModule(watchedModuleType)
    const fieldLabels: Record<string, string> = {
      cue_number: 'Cue Number',
      channel: 'Channel',
      position: 'Position',
      department: 'Department',
      priority: 'Priority',
      type: 'Type',
      created_at: 'Date Created',
      completed_at: 'Date Completed',
      cancelled_at: 'Date Cancelled',
    }
    return fields.map(field => ({ value: field, label: fieldLabels[field] || field }))
  }, [watchedModuleType])

  const handleSubmit = (data: FilterSortFormData) => {
    let presetId: string
    if (editingPreset) {
      updatePreset(editingPreset.id, {
        name: data.name,
        config: {
          statusFilter: data.statusFilter,
          typeFilters: data.typeFilters,
          priorityFilters: data.priorityFilters,
          sortBy: data.sortBy,
          sortOrder: data.sortOrder,
          groupByType: data.groupByType,
        }
      })
      presetId = editingPreset.id
    } else {
      addPreset({
        type: 'filter_sort',
        moduleType: data.moduleType,
        name: data.name,
        productionId: 'prod-1',
        config: {
          statusFilter: data.statusFilter,
          typeFilters: data.typeFilters,
          priorityFilters: data.priorityFilters,
          sortBy: data.sortBy,
          sortOrder: data.sortOrder,
          groupByType: data.groupByType,
        },
        isDefault: false,
        createdBy: 'user',
      })
      // Get the newly added preset (last one in the store)
      const storePresets = useFilterSortPresetsStore.getState().presets
      presetId = storePresets[storePresets.length - 1].id
    }

    onOpenChange(false)
    onSave?.(presetId)
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
  }

  const handleTypeToggle = (typeValue: string, checked: boolean) => {
    const currentTypes = form.getValues('typeFilters')
    if (checked) {
      form.setValue('typeFilters', [...currentTypes, typeValue])
    } else {
      form.setValue('typeFilters', currentTypes.filter(t => t !== typeValue))
    }
  }

  const handlePriorityToggle = (priorityValue: string, checked: boolean) => {
    const currentPriorities = form.getValues('priorityFilters')
    if (checked) {
      form.setValue('priorityFilters', [...currentPriorities, priorityValue])
    } else {
      form.setValue('priorityFilters', currentPriorities.filter(p => p !== priorityValue))
    }
  }

  return (
    <PresetDialog
      open={open}
      onClose={handleCancel}
      title={editingPreset ? 'Edit Filter & Sort Preset' : 'Create Filter & Sort Preset'}
      description="Configure filtering and sorting options for notes"
      className="max-w-2xl"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <PresetDialogContent>
          <div className="space-y-6">
            {/* Basic info */}
            <div className="grid gap-4 md:grid-cols-2">
              <PresetFormField label="Preset Name" required>
                <PresetFormInput
                  {...form.register('name')}
                  placeholder="e.g., Outstanding High Priority Items"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </PresetFormField>

              <PresetFormField label="Module Type" required>
                <PresetFormSelect {...form.register('moduleType')}>
                  <option value="cue">Cue Notes</option>
                  <option value="work">Work Notes</option>
                  <option value="production">Production Notes</option>
                </PresetFormSelect>
              </PresetFormField>
            </div>

            {/* Status filter */}
            <PresetFormField label="Status Filter" description="Filter notes by completion status">
              <PresetFormSelect {...form.register('statusFilter')}>
                <option value="">All Statuses</option>
                <option value="todo">Todo Only</option>
                <option value="complete">Complete Only</option>
                <option value="cancelled">Cancelled Only</option>
              </PresetFormSelect>
            </PresetFormField>

            {/* Type filters */}
            <PresetFormField
              label="Type Filters"
              description="Select which note types to include (leave all unchecked for all types)"
            >
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => form.setValue('typeFilters', availableTypes.map(t => t.value))}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <CheckSquare className="h-3 w-3" />
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue('typeFilters', [])}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Square className="h-3 w-3" />
                  Select None
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {availableTypes.map((type) => (
                  <label key={type.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.watch('typeFilters').includes(type.value)}
                      onChange={(e) => handleTypeToggle(type.value, e.target.checked)}
                      className="rounded"
                    />
                    <span className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </PresetFormField>

            {/* Priority filters */}
            <PresetFormField
              label="Priority Filters"
              description="Select which priorities to include (leave all unchecked for all priorities)"
            >
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => form.setValue('priorityFilters', availablePriorities.map(p => p.value))}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <CheckSquare className="h-3 w-3" />
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue('priorityFilters', [])}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Square className="h-3 w-3" />
                  Select None
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {availablePriorities.map((priority) => (
                  <label key={priority.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.watch('priorityFilters').includes(priority.value)}
                      onChange={(e) => handlePriorityToggle(priority.value, e.target.checked)}
                      className="rounded"
                    />
                    <span className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: priority.color }}
                      />
                      {priority.label}
                    </span>
                  </label>
                ))}
              </div>
            </PresetFormField>

            {/* Sort settings */}
            <div className="grid gap-4 md:grid-cols-2">
              <PresetFormField label="Sort By" required>
                <PresetFormSelect {...form.register('sortBy')}>
                  {availableSortFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </PresetFormSelect>
              </PresetFormField>

              <PresetFormField label="Sort Order" required>
                <PresetFormSelect {...form.register('sortOrder')}>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </PresetFormSelect>
              </PresetFormField>
            </div>

            <PresetFormToggle
              checked={form.watch('groupByType')}
              onCheckedChange={(checked) => form.setValue('groupByType', checked)}
              label="Group by Type"
              description="Group notes by their type before sorting"
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
