import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PageStylePreset, ModuleType } from '@/types'

interface PageStylePresetsState {
  presets: PageStylePreset[]
  loading: boolean
  
  // CRUD operations
  addPreset: (preset: Omit<PageStylePreset, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePreset: (id: string, updates: Partial<PageStylePreset['config']>) => void
  deletePreset: (id: string) => void
  getPreset: (id: string) => PageStylePreset | undefined
  
  // System defaults
  getSystemDefaults: () => PageStylePreset[]
  
  // Utilities
  setLoading: (loading: boolean) => void
}

// System default page style presets
const getSystemDefaults = (): PageStylePreset[] => {
  const baseDate = new Date()
  const productionId = 'prod-1' // TODO: Replace with actual production ID
  
  return [
    {
      id: 'sys-page-style-1',
      productionId,
      type: 'page_style',
      moduleType: 'all',
      name: 'Letter Portrait',
      config: {
        paperSize: 'letter',
        orientation: 'portrait',
        includeCheckboxes: true,
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
    {
      id: 'sys-page-style-2',
      productionId,
      type: 'page_style',
      moduleType: 'all',
      name: 'Letter Landscape',
      config: {
        paperSize: 'letter',
        orientation: 'landscape',
        includeCheckboxes: true,
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
    {
      id: 'sys-page-style-3',
      productionId,
      type: 'page_style',
      moduleType: 'all',
      name: 'A4 Portrait',
      config: {
        paperSize: 'a4',
        orientation: 'portrait',
        includeCheckboxes: true,
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
  ]
}

export const usePageStylePresetsStore = create<PageStylePresetsState>()(
  persist(
    (set, get) => ({
      presets: getSystemDefaults(),
      loading: false,
      
      addPreset: (presetData) => {
        const timestamp = new Date()
        const newPreset: PageStylePreset = {
          ...presetData,
          id: `page-style-${Math.random().toString(36).substr(2, 9)}`,
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
              ? { 
                  ...preset, 
                  config: { ...preset.config, ...updates },
                  updatedAt: new Date() 
                }
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
      
      getSystemDefaults: () => {
        return getSystemDefaults()
      },
      
      setLoading: (loading) => {
        set({ loading })
      },
    }),
    {
      name: 'page-style-presets-storage',
      skipHydration: true,
    }
  )
)