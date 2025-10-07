import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafeStorage } from '@/lib/storage/safe-storage'
import type { FilterSortPreset, ModuleType, NoteStatus } from '@/types'

interface FilterSortPresetsState {
  presets: FilterSortPreset[]
  loading: boolean
  
  // CRUD operations
  addPreset: (preset: Omit<FilterSortPreset, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePreset: (id: string, updates: Partial<FilterSortPreset>) => void
  deletePreset: (id: string) => void
  getPreset: (id: string) => FilterSortPreset | undefined
  
  // Filtering by module
  getPresetsByModule: (moduleType: ModuleType) => FilterSortPreset[]
  
  // System defaults
  getSystemDefaults: (moduleType: ModuleType) => FilterSortPreset[]
  
  // Utilities
  setLoading: (loading: boolean) => void
}

// System default filter/sort presets for each module
const getSystemDefaults = (moduleType: ModuleType): FilterSortPreset[] => {
  const baseDate = new Date()
  const productionId = 'prod-1' // TODO: Replace with actual production ID

  switch (moduleType) {
    case 'cue':
      return [
        {
          id: 'sys-filter-cue-1',
          productionId,
          type: 'filter_sort',
          moduleType: 'cue',
          name: 'Outstanding Cues',
          config: {
            statusFilter: 'todo',
            typeFilters: ['cue', 'director', 'choreographer', 'designer', 'stage_manager', 'associate', 'assistant', 'spot', 'programmer', 'production', 'paperwork', 'think'],
            priorityFilters: ['critical', 'very_high', 'medium', 'low', 'very_low'],
            sortBy: 'priority',
            sortOrder: 'desc',
            groupByType: false,
          },
          isDefault: true,
          createdBy: 'system',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: 'sys-filter-cue-2',
          productionId,
          type: 'filter_sort',
          moduleType: 'cue',
          name: 'High Priority First',
          config: {
            statusFilter: null,
            typeFilters: ['cue', 'director', 'choreographer', 'designer', 'stage_manager', 'associate', 'assistant', 'spot', 'programmer', 'production', 'paperwork', 'think'],
            priorityFilters: ['critical', 'very_high', 'medium', 'low', 'very_low'],
            sortBy: 'priority',
            sortOrder: 'desc',
            groupByType: true,
          },
          isDefault: true,
          createdBy: 'system',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: 'sys-filter-cue-3',
          productionId,
          type: 'filter_sort',
          moduleType: 'cue',
          name: 'All Todo Notes',
          config: {
            statusFilter: 'todo',
            typeFilters: ['cue', 'director', 'choreographer', 'designer', 'stage_manager', 'associate', 'assistant', 'spot', 'programmer', 'production', 'paperwork', 'think'],
            priorityFilters: ['critical', 'very_high', 'medium', 'low', 'very_low'],
            sortBy: 'cue_number',
            sortOrder: 'asc',
            groupByType: false,
          },
          isDefault: true,
          createdBy: 'system',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
      ]

    case 'production':
      return [
        {
          id: 'sys-filter-prod-1',
          productionId,
          type: 'filter_sort',
          moduleType: 'production',
          name: 'Outstanding Issues',
          config: {
            statusFilter: 'todo',
            typeFilters: ['scenic', 'costumes', 'lighting', 'props', 'sound', 'video', 'stage_management', 'directing', 'choreography', 'production_management'],
            priorityFilters: ['critical', 'very_high', 'medium', 'low', 'very_low'],
            sortBy: 'priority',
            sortOrder: 'desc',
            groupByType: false,
          },
          isDefault: true,
          createdBy: 'system',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: 'sys-filter-prod-2',
          productionId,
          type: 'filter_sort',
          moduleType: 'production',
          name: 'By Department',
          config: {
            statusFilter: null,
            typeFilters: ['scenic', 'costumes', 'lighting', 'props', 'sound', 'video', 'stage_management', 'directing', 'choreography', 'production_management'],
            priorityFilters: ['critical', 'very_high', 'medium', 'low', 'very_low'],
            sortBy: 'department',
            sortOrder: 'asc',
            groupByType: true,
          },
          isDefault: true,
          createdBy: 'system',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: 'sys-filter-prod-3',
          productionId,
          type: 'filter_sort',
          moduleType: 'production',
          name: 'All Todo Notes',
          config: {
            statusFilter: 'todo',
            typeFilters: ['scenic', 'costumes', 'lighting', 'props', 'sound', 'video', 'stage_management', 'directing', 'choreography', 'production_management'],
            priorityFilters: ['critical', 'very_high', 'medium', 'low', 'very_low'],
            sortBy: 'created_at',
            sortOrder: 'desc',
            groupByType: false,
          },
          isDefault: true,
          createdBy: 'system',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
      ]

    case 'work':
      return [
        {
          id: 'sys-filter-work-1',
          productionId,
          type: 'filter_sort',
          moduleType: 'work',
          name: 'Outstanding Work',
          config: {
            statusFilter: 'todo',
            typeFilters: ['work', 'focus', 'paperwork', 'electrician', 'think'],
            priorityFilters: ['critical', 'very_high', 'high', 'medium_high', 'medium', 'medium_low', 'low', 'very_low', 'uncritical'],
            sortBy: 'priority',
            sortOrder: 'desc',
            groupByType: false,
          },
          isDefault: true,
          createdBy: 'system',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: 'sys-filter-work-2',
          productionId,
          type: 'filter_sort',
          moduleType: 'work',
          name: 'By Channel',
          config: {
            statusFilter: null,
            typeFilters: ['work', 'focus', 'paperwork', 'electrician', 'think'],
            priorityFilters: ['critical', 'very_high', 'high', 'medium_high', 'medium', 'medium_low', 'low', 'very_low', 'uncritical'],
            sortBy: 'channel',
            sortOrder: 'asc',
            groupByType: false,
          },
          isDefault: true,
          createdBy: 'system',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          id: 'sys-filter-work-3',
          productionId,
          type: 'filter_sort',
          moduleType: 'work',
          name: 'All Todo Notes',
          config: {
            statusFilter: 'todo',
            typeFilters: ['work', 'focus', 'paperwork', 'electrician', 'think'],
            priorityFilters: ['critical', 'very_high', 'high', 'medium_high', 'medium', 'medium_low', 'low', 'very_low', 'uncritical'],
            sortBy: 'position',
            sortOrder: 'asc',
            groupByType: false,
          },
          isDefault: true,
          createdBy: 'system',
          createdAt: baseDate,
          updatedAt: baseDate,
        },
      ]

    default:
      return []
  }
}

// Check if we're in demo mode
const isDemoMode = () => {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
}

export const useFilterSortPresetsStore = create<FilterSortPresetsState>()(
  persist(
    (set, get) => ({
      presets: [
        ...getSystemDefaults('cue'),
        ...getSystemDefaults('production'),
        ...getSystemDefaults('work'),
      ],
      loading: false,
      
      addPreset: (presetData) => {
        const timestamp = new Date()
        const newPreset: FilterSortPreset = {
          ...presetData,
          id: `filter-sort-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        
        set(state => ({
          presets: [...state.presets, newPreset]
        }))
      },
      
      updatePreset: (id, updates) => {
        set(state => ({
          presets: state.presets.map(preset =>
            preset.id === id
              ? { ...preset, ...updates, updatedAt: new Date() }
              : preset
          )
        }))
      },
      
      deletePreset: (id) => {
        set(state => ({
          presets: state.presets.filter(preset => preset.id !== id)
        }))
      },
      
      getPreset: (id) => {
        return get().presets.find(preset => preset.id === id)
      },
      
      getPresetsByModule: (moduleType) => {
        return get().presets.filter(preset => preset.moduleType === moduleType)
      },
      
      getSystemDefaults: (moduleType) => {
        return getSystemDefaults(moduleType)
      },
      
      setLoading: (loading) => {
        set({ loading })
      },
    }),
    {
      name: 'filter-sort-presets-storage',
      storage: createJSONStorage(() =>
        createSafeStorage(
          'filter-sort-presets-storage',
          isDemoMode() ? 'session' : 'local'
        )
      ),
      skipHydration: true,
    }
  )
)
