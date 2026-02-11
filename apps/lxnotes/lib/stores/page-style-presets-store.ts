import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafeStorage } from '@/lib/storage/safe-storage'
import type { PageStylePreset, ModuleType } from '@/types'

interface PageStylePresetsState {
  presets: PageStylePreset[]
  loading: boolean
  
  // CRUD operations
  addPreset: (preset: Omit<PageStylePreset, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePreset: (id: string, updates: Partial<PageStylePreset>) => void
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
  const productionId = 'system' // System defaults; production-scoped presets loaded via store hydration
  
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

// Check if we're in demo mode
const isDemoMode = () => {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
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
      
      getSystemDefaults: () => {
        return getSystemDefaults()
      },
      
      setLoading: (loading) => {
        set({ loading })
      },
    }),
    {
      name: 'page-style-presets-storage',
      version: 1,
      storage: createJSONStorage(() =>
        createSafeStorage(
          'page-style-presets-storage',
          isDemoMode() ? 'session' : 'local'
        )
      ),
      skipHydration: true,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { presets: PageStylePreset[] }
        const systemDefaults = getSystemDefaults()
        const systemDefaultIds = new Set(systemDefaults.map(p => p.id))

        // Ensure system defaults are always present
        const userPresets = (state.presets || []).filter(p => !systemDefaultIds.has(p.id) && !p.isDefault)

        return {
          ...state,
          presets: [...systemDefaults, ...userPresets]
        }
      },
    }
  )
)
