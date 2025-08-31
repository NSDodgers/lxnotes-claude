'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Filter, CheckSquare, Square } from 'lucide-react'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
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
import { filterSortFormSchema, type FilterSortFormData, getSortFieldsForModule } from '@/lib/validation/preset-schemas'
import type { FilterSortPreset, ModuleType } from '@/types'
import { cn } from '@/lib/utils'

interface QuickCreateFilterSortDialogProps {
  isOpen: boolean
  onClose: () => void
  onPresetCreated: (preset: FilterSortPreset) => void
  moduleType: ModuleType
  defaultValues?: Partial<FilterSortFormData>
}

export function QuickCreateFilterSortDialog({
  isOpen,
  onClose,
  onPresetCreated,
  moduleType,
  defaultValues = {}
}: QuickCreateFilterSortDialogProps) {
  const { addPreset } = useFilterSortPresetsStore()
  const { getTypes } = useCustomTypesStore()
  const { getPriorities } = useCustomPrioritiesStore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FilterSortFormData>({
    resolver: zodResolver(filterSortFormSchema),
    defaultValues: {
      name: '',
      moduleType,
      statusFilter: null,
      typeFilters: [],
      priorityFilters: [],
      sortBy: 'priority',
      sortOrder: 'desc',
      groupByType: false,
      ...defaultValues,
    },
  })

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
      // Create preset using store
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
      
      // Get the created preset from store - it will have the generated ID
      // For now, we'll create a mock preset with the expected structure
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
      onClose()
    } catch (error) {
      console.error('Failed to create preset:', error)
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
    <QuickCreatePresetDialog
      open={isOpen}
      onClose={handleCancel}
      title="Create Filter & Sort Preset"
      description={`Quick create for ${moduleNames[moduleType]}`}
      className="max-w-lg"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <QuickCreatePresetDialogContent>
          <div className="space-y-4">
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
                Creating...
              </>
            ) : (
              <>
                <Filter className="h-3 w-3" />
                Create Preset
              </>
            )}
          </button>
        </QuickCreatePresetDialogActions>
      </form>
    </QuickCreatePresetDialog>
  )
}