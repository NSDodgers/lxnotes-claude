'use client'

import { useState, useMemo } from 'react'
import { Plus, ChevronDown, ChevronUp, Filter, CheckSquare, Square } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
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
import { filterSortFormSchema, type FilterSortFormData, getSortFieldsForModule } from '@/lib/validation/preset-schemas'
import type { FilterSortPreset, ModuleType } from '@/types'
import { cn } from '@/lib/utils'

export function FilterSortPresetsManager() {
  const { presets, addPreset, updatePreset, deletePreset, getPresetsByModule } = useFilterSortPresetsStore()
  const { getTypes } = useCustomTypesStore()
  const { getPriorities } = useCustomPrioritiesStore()
  
  const [collapsed, setCollapsed] = useState(false)
  const [selectedModule, setSelectedModule] = useState<ModuleType | 'all'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<FilterSortPreset | null>(null)

  const form = useForm<FilterSortFormData>({
    resolver: zodResolver(filterSortFormSchema),
    defaultValues: {
      name: '',
      moduleType: 'cue',
      statusFilter: 'todo',
      typeFilters: [],
      priorityFilters: [],
      sortBy: 'priority',
      sortOrder: 'desc',
      groupByType: false,
    },
  })

  const watchedModuleType = form.watch('moduleType')

  // Get filtered presets based on selected module
  const filteredPresets = useMemo(() => {
    if (selectedModule === 'all') return presets
    return getPresetsByModule(selectedModule)
  }, [presets, selectedModule, getPresetsByModule])

  // Get available types and priorities for the selected module in form
  const availableTypes = useMemo(() => {
    return getTypes(watchedModuleType)
  }, [watchedModuleType, getTypes])

  const availablePriorities = useMemo(() => {
    return getPriorities(watchedModuleType)
  }, [watchedModuleType, getPriorities])

  // Get available sort fields for the selected module in form
  const availableSortFields = useMemo(() => {
    const fields = getSortFieldsForModule(watchedModuleType)
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
  }, [watchedModuleType])

  const handleCreate = () => {
    setEditingPreset(null)
    const targetModule = selectedModule !== 'all' ? selectedModule : 'cue'
    const types = getTypes(targetModule)
    const priorities = getPriorities(targetModule)

    form.reset({
      name: '',
      moduleType: targetModule,
      statusFilter: 'todo',
      typeFilters: types.map(t => t.value),
      priorityFilters: priorities.map(p => p.value),
      sortBy: 'priority',
      sortOrder: 'desc',
      groupByType: false,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (preset: FilterSortPreset) => {
    setEditingPreset(preset)
    form.reset({
      name: preset.name,
      moduleType: preset.moduleType,
      statusFilter: preset.config.statusFilter,
      typeFilters: preset.config.typeFilters,
      priorityFilters: preset.config.priorityFilters,
      sortBy: preset.config.sortBy,
      sortOrder: preset.config.sortOrder,
      groupByType: preset.config.groupByType,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    deletePreset(id)
  }

  const handleSubmit = (data: FilterSortFormData) => {
    if (editingPreset) {
      // Update existing preset
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
    } else {
      // Create new preset
      addPreset({
        type: 'filter_sort',
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

      {/* Create/Edit Dialog */}
      <PresetDialog
        open={isDialogOpen}
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
                    onClick={handleSelectAllTypes}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <CheckSquare className="h-3 w-3" />
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectNoneTypes}
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
                    onClick={handleSelectAllPriorities}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <CheckSquare className="h-3 w-3" />
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectNonePriorities}
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
    </>
  )
}