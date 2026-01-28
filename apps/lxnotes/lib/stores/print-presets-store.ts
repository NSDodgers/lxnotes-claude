import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafeStorage } from '@/lib/storage/safe-storage'
import type { PrintPreset, ModuleType } from '@/types'

interface PrintPresetsState {
  presets: PrintPreset[]
  loading: boolean

  // CRUD operations
  addPreset: (preset: Omit<PrintPreset, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePreset: (id: string, updates: Partial<PrintPreset>) => void
  deletePreset: (id: string) => void
  getPreset: (id: string) => PrintPreset | undefined

  // Module-specific operations
  getPresetsByModule: (moduleType: ModuleType) => PrintPreset[]

  // System defaults
  getSystemDefaults: () => PrintPreset[]

  // Utilities
  setLoading: (loading: boolean) => void
}

const moduleDisplayNames: Record<ModuleType, string> = {
  cue: 'Cue Notes',
  work: 'Work Notes',
  production: 'Production Notes',
  actor: 'Actor Notes',
}

// Map module types to their first system default filter/sort preset ID
const moduleFilterPresetIds: Record<string, string> = {
  cue: 'sys-filter-cue-1',
  work: 'sys-filter-work-1',
  production: 'sys-filter-prod-1',
}

const getSystemDefaults = (): PrintPreset[] => {
  const baseDate = new Date()
  const productionId = 'prod-1'

  const modules: ModuleType[] = ['cue', 'work', 'production']
  const presets: PrintPreset[] = []

  modules.forEach((moduleType) => {
    const moduleName = moduleDisplayNames[moduleType]

    presets.push({
      id: `sys-print-outstanding-${moduleType}`,
      productionId,
      type: 'print',
      moduleType,
      name: `Outstanding ${moduleName} - Letter Portrait`,
      config: {
        filterSortPresetId: moduleFilterPresetIds[moduleType] || null,
        pageStylePresetId: 'sys-page-style-1',
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: baseDate,
      updatedAt: baseDate,
    })
  })

  return presets
}

const isDemoMode = () => {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
}

export const usePrintPresetsStore = create<PrintPresetsState>()(
  persist(
    (set, get) => ({
      presets: getSystemDefaults(),
      loading: false,

      addPreset: (presetData) => {
        const timestamp = new Date()
        const newPreset: PrintPreset = {
          ...presetData,
          id: `print-${Math.random().toString(36).substr(2, 9)}`,
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

      getSystemDefaults: () => {
        return getSystemDefaults()
      },

      setLoading: (loading) => {
        set({ loading })
      },
    }),
    {
      name: 'print-presets-storage',
      version: 1,
      storage: createJSONStorage(() =>
        createSafeStorage(
          'print-presets-storage',
          isDemoMode() ? 'session' : 'local'
        )
      ),
      skipHydration: true,
    }
  )
)
