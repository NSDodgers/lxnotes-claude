import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { MODULE_COLUMN_REGISTRY, getDefaultColumnOrder } from '@/lib/config/column-registry'
import type { ModuleType } from '@/types'
import { toast } from 'sonner'

const COLUMN_LAYOUT_VERSION = 3

function userSettingsTable() {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from('user_settings')
}

interface SortingEntry {
  id: string
  desc: boolean
}

interface ColumnLayoutEntry {
  version: number
  widths: Record<string, number>
  frozenCount: number
  columnOrder: string[] | null
  hiddenColumns: string[]
  shownColumns: string[]
  sorting: SortingEntry[] | null
  timestamp: number
}

interface ColumnLayoutState {
  profileKey: string
  setProfileKey: (profileKey: string) => void
  layouts: Record<string, Record<string, ColumnLayoutEntry>>

  // Getters
  getModuleLayout: (moduleType: ModuleType) => ColumnLayoutEntry | undefined
  getFrozenCount: (moduleType: ModuleType) => number
  getColumnOrder: (moduleType: ModuleType) => string[] | null
  getHiddenColumns: (moduleType: ModuleType) => string[]
  getSorting: (moduleType: ModuleType) => SortingEntry[] | null

  // Column width actions
  setColumnWidth: (moduleType: ModuleType, columnId: string, width: number) => void
  setColumnWidths: (moduleType: ModuleType, widths: Record<string, number>) => void

  // Freeze actions
  setFrozenCount: (moduleType: ModuleType, count: number) => void

  // Column visibility/order actions
  setColumnOrder: (moduleType: ModuleType, order: string[]) => void
  toggleColumnVisibility: (moduleType: ModuleType, columnId: string) => void
  setColumnVisibility: (moduleType: ModuleType, columnId: string, visible: boolean) => void
  setHiddenColumns: (moduleType: ModuleType, hidden: string[]) => void

  // Sorting actions
  setSorting: (moduleType: ModuleType, sorting: SortingEntry[]) => void

  // Reset
  resetModuleLayout: (moduleType: ModuleType) => void

  // Supabase sync
  fetchColumnConfigFromSupabase: (userId: string) => Promise<void>
  saveColumnConfigToSupabase: (userId: string) => Promise<void>
}

/** Ensure entry has all v2 fields */
function ensureV2(entry: ColumnLayoutEntry | undefined): ColumnLayoutEntry {
  if (!entry) {
    return {
      version: COLUMN_LAYOUT_VERSION,
      widths: {},
      frozenCount: 0,
      columnOrder: null,
      hiddenColumns: [],
      shownColumns: [],
      sorting: null,
      timestamp: Date.now(),
    }
  }
  return {
    ...entry,
    version: COLUMN_LAYOUT_VERSION,
    columnOrder: entry.columnOrder ?? null,
    hiddenColumns: entry.hiddenColumns ?? [],
    shownColumns: entry.shownColumns ?? [],
    sorting: entry.sorting ?? null,
  }
}

/**
 * Merge stored column order with registry, appending any new columns
 * not yet in the user's order list.
 */
function mergeColumnOrderWithRegistry(
  storedOrder: string[] | null,
  moduleType: ModuleType
): string[] {
  const defaults = getDefaultColumnOrder(moduleType)
  if (!storedOrder) return defaults

  const registryIds = new Set(defaults)
  // Keep stored columns that still exist in registry, in stored order
  const merged = storedOrder.filter((id) => registryIds.has(id))
  // Append any new registry columns not in stored order
  for (const id of defaults) {
    if (!merged.includes(id)) {
      merged.push(id)
    }
  }
  return merged
}

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null

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

      getFrozenCount: (moduleType) => {
        const state = get()
        return state.layouts[state.profileKey]?.[moduleType]?.frozenCount ?? 0
      },

      getColumnOrder: (moduleType) => {
        const state = get()
        return state.layouts[state.profileKey]?.[moduleType]?.columnOrder ?? null
      },

      getHiddenColumns: (moduleType) => {
        const state = get()
        return state.layouts[state.profileKey]?.[moduleType]?.hiddenColumns ?? []
      },

      getSorting: (moduleType) => {
        const state = get()
        return state.layouts[state.profileKey]?.[moduleType]?.sorting ?? null
      },

      setColumnWidth: (moduleType, columnId, width) => {
        set((state) => {
          const profileKey = state.profileKey
          const profileLayouts = state.layouts[profileKey] ?? {}
          const existing = ensureV2(profileLayouts[moduleType])

          return {
            layouts: {
              ...state.layouts,
              [profileKey]: {
                ...profileLayouts,
                [moduleType]: {
                  ...existing,
                  widths: { ...existing.widths, [columnId]: width },
                  timestamp: Date.now(),
                },
              },
            },
          }
        })
      },

      setColumnWidths: (moduleType, widths) => {
        set((state) => {
          const profileKey = state.profileKey
          const profileLayouts = state.layouts[profileKey] ?? {}
          const existing = ensureV2(profileLayouts[moduleType])

          return {
            layouts: {
              ...state.layouts,
              [profileKey]: {
                ...profileLayouts,
                [moduleType]: {
                  ...existing,
                  widths: { ...existing.widths, ...widths },
                  timestamp: Date.now(),
                },
              },
            },
          }
        })
      },

      setFrozenCount: (moduleType, count) => {
        set((state) => {
          const profileKey = state.profileKey
          const profileLayouts = state.layouts[profileKey] ?? {}
          const existing = ensureV2(profileLayouts[moduleType])

          return {
            layouts: {
              ...state.layouts,
              [profileKey]: {
                ...profileLayouts,
                [moduleType]: {
                  ...existing,
                  frozenCount: count,
                  timestamp: Date.now(),
                },
              },
            },
          }
        })
      },

      setColumnOrder: (moduleType, order) => {
        set((state) => {
          const profileKey = state.profileKey
          const profileLayouts = state.layouts[profileKey] ?? {}
          const existing = ensureV2(profileLayouts[moduleType])

          return {
            layouts: {
              ...state.layouts,
              [profileKey]: {
                ...profileLayouts,
                [moduleType]: {
                  ...existing,
                  columnOrder: order,
                  timestamp: Date.now(),
                },
              },
            },
          }
        })
      },

      toggleColumnVisibility: (moduleType, columnId) => {
        // Check canHide
        const meta = MODULE_COLUMN_REGISTRY[moduleType]?.find((c) => c.id === columnId)
        if (meta && !meta.canHide) return

        set((state) => {
          const profileKey = state.profileKey
          const profileLayouts = state.layouts[profileKey] ?? {}
          const existing = ensureV2(profileLayouts[moduleType])
          const hiddenSet = new Set(existing.hiddenColumns)

          if (hiddenSet.has(columnId)) {
            hiddenSet.delete(columnId)
          } else {
            hiddenSet.add(columnId)
          }

          return {
            layouts: {
              ...state.layouts,
              [profileKey]: {
                ...profileLayouts,
                [moduleType]: {
                  ...existing,
                  hiddenColumns: Array.from(hiddenSet),
                  timestamp: Date.now(),
                },
              },
            },
          }
        })
      },

      setColumnVisibility: (moduleType, columnId, visible) => {
        const meta = MODULE_COLUMN_REGISTRY[moduleType]?.find((c) => c.id === columnId)
        if (meta && !meta.canHide && !visible) return

        set((state) => {
          const profileKey = state.profileKey
          const profileLayouts = state.layouts[profileKey] ?? {}
          const existing = ensureV2(profileLayouts[moduleType])
          const hiddenSet = new Set(existing.hiddenColumns)
          const shownSet = new Set(existing.shownColumns)

          if (visible) {
            hiddenSet.delete(columnId)
            shownSet.add(columnId)
          } else {
            shownSet.delete(columnId)
            hiddenSet.add(columnId)
          }

          return {
            layouts: {
              ...state.layouts,
              [profileKey]: {
                ...profileLayouts,
                [moduleType]: {
                  ...existing,
                  hiddenColumns: Array.from(hiddenSet),
                  shownColumns: Array.from(shownSet),
                  timestamp: Date.now(),
                },
              },
            },
          }
        })
      },

      setHiddenColumns: (moduleType, hidden) => {
        set((state) => {
          const profileKey = state.profileKey
          const profileLayouts = state.layouts[profileKey] ?? {}
          const existing = ensureV2(profileLayouts[moduleType])

          return {
            layouts: {
              ...state.layouts,
              [profileKey]: {
                ...profileLayouts,
                [moduleType]: {
                  ...existing,
                  hiddenColumns: hidden,
                  timestamp: Date.now(),
                },
              },
            },
          }
        })
      },

      setSorting: (moduleType, sorting) => {
        set((state) => {
          const profileKey = state.profileKey
          const profileLayouts = state.layouts[profileKey] ?? {}
          const existing = ensureV2(profileLayouts[moduleType])

          return {
            layouts: {
              ...state.layouts,
              [profileKey]: {
                ...profileLayouts,
                [moduleType]: {
                  ...existing,
                  sorting,
                  timestamp: Date.now(),
                },
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

      fetchColumnConfigFromSupabase: async (userId: string) => {
        try {
          const { data, error } = await userSettingsTable()
            .select('column_config')
            .eq('user_id', userId)
            .single()

          if (error) {
            if (error.code === 'PGRST116') return // no rows
            throw error
          }

          if (data?.column_config && typeof data.column_config === 'object') {
            const remote = data.column_config as Record<string, Record<string, ColumnLayoutEntry>>
            // Merge remote layouts with local, preferring more recent timestamps
            set((state) => {
              const merged = { ...state.layouts }
              for (const [profileKey, modules] of Object.entries(remote)) {
                if (!merged[profileKey]) {
                  merged[profileKey] = modules
                } else {
                  for (const [mod, entry] of Object.entries(modules)) {
                    const local = merged[profileKey][mod]
                    if (!local || (entry.timestamp ?? 0) > (local.timestamp ?? 0)) {
                      merged[profileKey][mod] = ensureV2(entry)
                    }
                  }
                }
              }
              return { layouts: merged }
            })
          }
        } catch {
          // Fall back to localStorage cache
        }
      },

      saveColumnConfigToSupabase: async (userId: string) => {
        try {
          const { layouts } = get()
          const { error } = await userSettingsTable()
            .upsert(
              {
                user_id: userId,
                column_config: layouts,
              },
              { onConflict: 'user_id' }
            )

          if (error) throw error
        } catch {
          toast.error("Couldn't save column settings")
        }
      },
    }),
    {
      name: 'notes-table-column-layout',
      version: COLUMN_LAYOUT_VERSION,
      partialize: (state) => ({
        profileKey: state.profileKey,
        layouts: state.layouts,
      }),
      migrate: (persisted, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persisted as any
        const layouts = state.layouts ?? {}
        if (version < 2) {
          // Migrate v1 entries: add columnOrder and hiddenColumns
          for (const profileKey of Object.keys(layouts)) {
            for (const moduleType of Object.keys(layouts[profileKey])) {
              const entry = layouts[profileKey][moduleType]
              if (!entry.columnOrder) entry.columnOrder = null
              if (!entry.hiddenColumns) entry.hiddenColumns = []
              entry.version = COLUMN_LAYOUT_VERSION
            }
          }
        }
        if (version < 3) {
          // Migrate v2 entries: add sorting
          for (const profileKey of Object.keys(layouts)) {
            for (const moduleType of Object.keys(layouts[profileKey])) {
              const entry = layouts[profileKey][moduleType]
              if (!entry.sorting) entry.sorting = null
              entry.version = COLUMN_LAYOUT_VERSION
            }
          }
        }
        return state
      },
    }
  )
)

/** Debounced save to Supabase (500ms) */
export function debouncedSaveColumnConfig(userId: string) {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
  saveDebounceTimer = setTimeout(() => {
    useColumnLayoutStore.getState().saveColumnConfigToSupabase(userId)
  }, 500)
}

/** Immediate save to Supabase */
export function immediateSaveColumnConfig(userId: string) {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
  useColumnLayoutStore.getState().saveColumnConfigToSupabase(userId)
}

export { mergeColumnOrderWithRegistry }
