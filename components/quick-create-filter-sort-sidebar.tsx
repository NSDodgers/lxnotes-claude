'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Filter, CheckSquare, Square } from 'lucide-react'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
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
import { filterSortFormSchema, type FilterSortFormData, getSortFieldsForModule } from '@/lib/validation/preset-schemas'
import type { FilterSortPreset, ModuleType } from '@/types'
import { cn } from '@/lib/utils'

interface QuickCreateFilterSortSidebarProps {
  isOpen: boolean
  onClose: () => void
  onPresetCreated: (preset: FilterSortPreset) => void
  moduleType: ModuleType
  defaultValues?: Partial<FilterSortFormData>
  editingPreset?: FilterSortPreset | null
}

export function QuickCreateFilterSortSidebar({
  isOpen,
  onClose,
  onPresetCreated,
  moduleType,
  defaultValues = {},
  editingPreset = null
}: QuickCreateFilterSortSidebarProps) {
  const { addPreset, updatePreset } = useFilterSortPresetsStore()
  const { getTypes } = useCustomTypesStore()
  const { getPriorities } = useCustomPrioritiesStore()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingPreset

  // Get all type and priority values for default selection
  const allTypeValues = useMemo(() => {
    return getTypes(moduleType).map(t => t.value)
  }, [moduleType, getTypes])

  const allPriorityValues = useMemo(() => {
    return getPriorities(moduleType).map(p => p.value)
  }, [moduleType, getPriorities])

  const form = useForm<FilterSortFormData>({
    resolver: zodResolver(filterSortFormSchema),
    defaultValues: {
      name: '',
      moduleType,
      statusFilter: 'todo',
      typeFilters: allTypeValues,
      priorityFilters: allPriorityValues,
      sortBy: 'priority',
      sortOrder: 'desc',
      groupByType: false,
      ...defaultValues,
    },
  })

  // Reset form when editingPreset changes
  useEffect(() => {
    if (editingPreset) {
      form.reset({
        name: editingPreset.name,
        moduleType,
        statusFilter: editingPreset.config.statusFilter,
        typeFilters: editingPreset.config.typeFilters,
        priorityFilters: editingPreset.config.priorityFilters,
        sortBy: editingPreset.config.sortBy,
        sortOrder: editingPreset.config.sortOrder,
        groupByType: editingPreset.config.groupByType,
        ...defaultValues,
      })
    } else {
      form.reset({
        name: '',
        moduleType,
        statusFilter: 'todo',
        typeFilters: allTypeValues,
        priorityFilters: allPriorityValues,
        sortBy: 'priority',
        sortOrder: 'desc',
        groupByType: false,
        ...defaultValues,
      })
    }
  }, [editingPreset, moduleType, allTypeValues, allPriorityValues, defaultValues])

  // Get available types and priorities for this module
  const availableTypes = useMemo(() => {
    return getTypes(moduleType)
  }, [moduleType, getTypes])

  const availablePriorities = useMemo(() => {
    return getPriorities(moduleType)
  }, [moduleType, getPriorities])

  // Get available sort fields for this module
  const availableSortFields = useMemo(() => {
    const fields = getSortFieldsForModule(moduleType)
    const fieldLabels: Record<string, string> = {
      // Cue notes
      cue_number: 'Cue Number',
      // Work notes
      channel: 'Channel',
      position: 'Position',
      // Production notes
      department: 'Department',
      // Common fields
      priority: 'Priority',
      type: 'Type',
      created_at: 'Date Created',
      completed_at: 'Date Completed',
      cancelled_at: 'Date Cancelled',
    }
    return fields.map(field => ({ value: field, label: fieldLabels[field] || field }))
  }, [moduleType])

  const handleSubmit = async (data: FilterSortFormData) => {
    setIsSubmitting(true)

    try {
      if (isEditing && editingPreset) {
        if (editingPreset.isDefault) {
          // Create new preset based on system default (don't modify original)
          const newPresetData = {
            type: 'filter_sort' as const,
            moduleType: data.moduleType,
            name: data.name,
            productionId: 'prod-1', // TODO: Get from production context
            config: {
              statusFilter: data.statusFilter,
              typeFilters: data.typeFilters,
              priorityFilters: data.priorityFilters,
              sortBy: data.sortBy,
              sortOrder: data.sortOrder,
              groupByType: data.groupByType,
            },
            isDefault: false,
            createdBy: 'user', // TODO: Get from auth
          }

          addPreset(newPresetData)

          // Create mock preset with the expected structure for callback
          const createdPreset: FilterSortPreset = {
            id: `filter-sort-${Math.random().toString(36).substr(2, 9)}`,
            productionId: 'prod-1', // TODO: Get from production context
            type: 'filter_sort',
            moduleType: data.moduleType,
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
            statusFilter: data.statusFilter,
            typeFilters: data.typeFilters,
            priorityFilters: data.priorityFilters,
            sortBy: data.sortBy,
            sortOrder: data.sortOrder,
            groupByType: data.groupByType,
          }

          updatePreset(editingPreset.id, {
            name: data.name,
            config: updatedConfig,
          })

          // Create updated preset object for callback
          const updatedPreset: FilterSortPreset = {
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
          type: 'filter_sort' as const,
          moduleType: data.moduleType,
          name: data.name,
          productionId: 'prod-1', // TODO: Get from production context
          config: {
            statusFilter: data.statusFilter,
            typeFilters: data.typeFilters,
            priorityFilters: data.priorityFilters,
            sortBy: data.sortBy,
            sortOrder: data.sortOrder,
            groupByType: data.groupByType,
          },
          isDefault: false,
          createdBy: 'user', // TODO: Get from auth
        }

        addPreset(newPresetData)

        // Create mock preset with the expected structure for callback
        const createdPreset: FilterSortPreset = {
          id: `filter-sort-${Math.random().toString(36).substr(2, 9)}`,
          productionId: 'prod-1', // TODO: Get from production context
          type: 'filter_sort',
          moduleType: data.moduleType,
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

  const handleSelectAllTypes = () => {
    const allTypeValues = availableTypes.map(t => t.value)
    form.setValue('typeFilters', allTypeValues)
  }

  const handleSelectNoneTypes = () => {
    form.setValue('typeFilters', [])
  }

  const handleSelectAllPriorities = () => {
    const allPriorityValues = availablePriorities.map(p => p.value)
    form.setValue('priorityFilters', allPriorityValues)
  }

  const handleSelectNonePriorities = () => {
    form.setValue('priorityFilters', [])
  }

  const moduleNames = {
    cue: 'Cue Notes',
    work: 'Work Notes',
    production: 'Production Notes'
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col overflow-hidden p-0">
        <SheetHeader className="p-6 pb-4 border-b border-bg-tertiary">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-text-primary" />
            <SheetTitle>
              {isEditing && editingPreset?.isDefault ? "Copy System Preset" :
                isEditing ? "Edit Filter & Sort Preset" : "Create Filter & Sort Preset"}
            </SheetTitle>
          </div>
          <SheetDescription>
            {isEditing && editingPreset?.isDefault ?
              `Create a custom copy of "${editingPreset?.name}" for ${moduleNames[moduleType]}` :
              isEditing ? `Edit preset for ${moduleNames[moduleType]}` :
                `Quick create for ${moduleNames[moduleType]}`}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Preset Name */}
            <PresetFormField label="Preset Name" required>
              <PresetFormInput
                {...form.register('name')}
                placeholder="e.g., Outstanding High Priority Items"
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </PresetFormField>

            {/* Module Type (locked) */}
            <PresetFormField
              label="Module Type"
              description={`Locked to ${moduleNames[moduleType]}`}
            >
              <PresetFormInput
                value={moduleNames[moduleType]}
                disabled={true}
                className="bg-bg-hover text-text-muted"
              />
            </PresetFormField>

            {/* Status Filter */}
            <PresetFormField label="Status Filter" description="Filter notes by completion status">
              <PresetFormSelect {...form.register('statusFilter')} disabled={isSubmitting}>
                <option value="">All Statuses</option>
                <option value="todo">Todo Only</option>
                <option value="complete">Complete Only</option>
                <option value="cancelled">Cancelled Only</option>
              </PresetFormSelect>
            </PresetFormField>

            {/* Type Filters */}
            {availableTypes.length > 0 && (
              <PresetFormField
                label="Type Filters"
                description="Select specific types (leave all unchecked for all types)"
              >
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={handleSelectAllTypes}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    disabled={isSubmitting}
                  >
                    <CheckSquare className="h-3 w-3" />
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectNoneTypes}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    disabled={isSubmitting}
                  >
                    <Square className="h-3 w-3" />
                    Select None
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {availableTypes.map((type) => (
                    <label key={type.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.watch('typeFilters').includes(type.value)}
                        onChange={(e) => handleTypeToggle(type.value, e.target.checked)}
                        className="rounded"
                        disabled={isSubmitting}
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
            )}

            {/* Priority Filters */}
            {availablePriorities.length > 0 && (
              <PresetFormField
                label="Priority Filters"
                description="Select specific priorities (leave all unchecked for all priorities)"
              >
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={handleSelectAllPriorities}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    disabled={isSubmitting}
                  >
                    <CheckSquare className="h-3 w-3" />
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectNonePriorities}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    disabled={isSubmitting}
                  >
                    <Square className="h-3 w-3" />
                    Select None
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {availablePriorities.map((priority) => (
                    <label key={priority.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.watch('priorityFilters').includes(priority.value)}
                        onChange={(e) => handlePriorityToggle(priority.value, e.target.checked)}
                        className="rounded"
                        disabled={isSubmitting}
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
            )}

            {/* Sort Settings */}
            <div className="grid gap-4 md:grid-cols-2">
              <PresetFormField label="Sort By" required>
                <PresetFormSelect {...form.register('sortBy')} disabled={isSubmitting}>
                  {availableSortFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </PresetFormSelect>
              </PresetFormField>

              <PresetFormField label="Sort Order" required>
                <PresetFormSelect {...form.register('sortOrder')} disabled={isSubmitting}>
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
                  <Filter className="h-3 w-3" />
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