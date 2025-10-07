import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModuleType } from '@/types'

const COLUMN_LAYOUT_VERSION = 1

interface ColumnLayoutEntry {
  version: number
  widths: Record<string, number>
  timestamp: number
}

interface ColumnLayoutState {
  profileKey: string
  setProfileKey: (profileKey: string) => void
  layouts: Record<string, Record<ModuleType, ColumnLayoutEntry>>
  getModuleLayout: (moduleType: ModuleType) => ColumnLayoutEntry | undefined
  setColumnWidth: (
    moduleType: ModuleType,
    columnId: string,
    width: number
  ) => void
  resetModuleLayout: (moduleType: ModuleType) => void
}

export const useColumnLayoutStore = create<ColumnLayoutState>()(
  persist(
    (set, get) => ({
      profileKey: 'anon',
      setProfileKey: (profileKey) => set({ profileKey }),
      layouts: {},
      getModuleLayout: (moduleType) => {
        const state = get()
        return state.layouts[state.profileKey]?.[moduleType]
      },
      setColumnWidth: (moduleType, columnId, width) => {
        set((state) => {
          const profileKey = state.profileKey
          const profileLayouts = state.layouts[profileKey] ?? {}
          const existing = profileLayouts[moduleType]

          const updatedEntry: ColumnLayoutEntry = {
            version: COLUMN_LAYOUT_VERSION,
            widths: {
              ...(existing?.widths ?? {}),
              [columnId]: width,
            },
            timestamp: Date.now(),
          }

          return {
            layouts: {
              ...state.layouts,
              [profileKey]: {
                ...profileLayouts,
                [moduleType]: updatedEntry,
              },
            },
          }
        })
      },
      resetModuleLayout: (moduleType) => {
        set((state) => {
          const profileKey = state.profileKey
          const profileLayouts = state.layouts[profileKey]

          if (!profileLayouts || !profileLayouts[moduleType]) {
            return state
          }

          const rest = { ...profileLayouts }
          delete rest[moduleType]

          return {
            layouts: {
              ...state.layouts,
              [profileKey]: rest,
            },
          }
        })
      },
    }),
    {
      name: 'notes-table-column-layout',
      version: COLUMN_LAYOUT_VERSION,
      partialize: (state) => ({
        profileKey: state.profileKey,
        layouts: state.layouts,
      }),
    }
  )
)
