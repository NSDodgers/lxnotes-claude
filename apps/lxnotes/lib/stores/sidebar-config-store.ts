import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { MODULE_REGISTRY, COMBINED_VIEW_REGISTRY, DEFAULT_MODULE_ORDER } from '@/lib/config/modules'
import type { ModuleType } from '@/types'
import { toast } from 'sonner'

// user_settings table is not yet in the generated Supabase types.
// This helper wraps the client to access the new table without `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function userSettingsTable() {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from('user_settings')
}

export interface ModuleEntry {
  id: ModuleType
  visible: boolean
}

export interface CombinedViewEntry {
  id: string
  visible: boolean
  moduleTypes: ModuleType[]
}

export interface SidebarConfig {
  modules: ModuleEntry[]
  combinedViews: CombinedViewEntry[]
}

const DEFAULT_CONFIG: SidebarConfig = {
  modules: DEFAULT_MODULE_ORDER.map((id) => ({ id, visible: true })),
  combinedViews: COMBINED_VIEW_REGISTRY.map((v) => ({
    id: v.id,
    visible: true,
    moduleTypes: v.moduleTypes,
  })),
}

/** Merge stored config with registry, appending any new modules not yet in the user's list */
function mergeWithRegistry(stored: SidebarConfig): SidebarConfig {
  const storedModuleIds = new Set(stored.modules.map((m) => m.id))
  const missingModules = MODULE_REGISTRY
    .filter((m) => !storedModuleIds.has(m.id))
    .map((m) => ({ id: m.id, visible: true }))

  const storedViewIds = new Set(stored.combinedViews.map((v) => v.id))
  const missingViews = COMBINED_VIEW_REGISTRY
    .filter((v) => !storedViewIds.has(v.id))
    .map((v) => ({ id: v.id, visible: true, moduleTypes: v.moduleTypes }))

  return {
    modules: [...stored.modules, ...missingModules],
    combinedViews: [...stored.combinedViews, ...missingViews],
  }
}

interface SidebarConfigState {
  config: SidebarConfig
  isLoaded: boolean

  /** Fetch config from Supabase. Falls back to cache/defaults on error. */
  fetchFromSupabase: (userId: string) => Promise<void>

  /** Save config to Supabase. Shows toast on error, keeps local state. */
  saveToSupabase: (userId: string) => Promise<void>

  /** Toggle a module's visibility. Prevents hiding the last visible module. */
  setModuleVisibility: (moduleId: ModuleType, visible: boolean) => void

  /** Reorder modules using array indices */
  reorderModules: (oldIndex: number, newIndex: number) => void

  /** Toggle a combined view's visibility */
  setCombinedViewVisibility: (viewId: string, visible: boolean) => void

  /** Reset to default config and delete Supabase row */
  resetToDefaults: (userId: string | null) => Promise<void>

  /** Get visible modules in order */
  getVisibleModules: () => ModuleEntry[]

  /** Get visible combined views */
  getVisibleCombinedViews: () => CombinedViewEntry[]
}

// Debounce timer for saves
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null

export const useSidebarConfigStore = create<SidebarConfigState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      isLoaded: false,

      fetchFromSupabase: async (userId: string) => {
        try {
          const { data, error } = await userSettingsTable()
            .select('sidebar_config')
            .eq('user_id', userId)
            .single()

          if (error) {
            // PGRST116 = no rows found, treat as "use defaults"
            if (error.code === 'PGRST116') {
              set({ isLoaded: true })
              return
            }
            throw error
          }

          if (data?.sidebar_config && typeof data.sidebar_config === 'object') {
            const raw = data.sidebar_config as SidebarConfig
            const merged = mergeWithRegistry(raw)
            set({ config: merged, isLoaded: true })
          } else {
            set({ isLoaded: true })
          }
        } catch {
          // On any error, fall back to whatever's in the Zustand persist cache
          set({ isLoaded: true })
        }
      },

      saveToSupabase: async (userId: string) => {
        try {
          const { error } = await userSettingsTable()
            .upsert(
              {
                user_id: userId,
                sidebar_config: get().config,
              },
              { onConflict: 'user_id' }
            )

          if (error) throw error
        } catch {
          toast.error("Couldn't save sidebar settings")
        }
      },

      setModuleVisibility: (moduleId: ModuleType, visible: boolean) => {
        const { config } = get()
        const visibleCount = config.modules.filter((m) => m.visible).length

        // Prevent hiding the last visible module
        if (!visible && visibleCount <= 1) return

        set({
          config: {
            ...config,
            modules: config.modules.map((m) =>
              m.id === moduleId ? { ...m, visible } : m
            ),
          },
        })
      },

      reorderModules: (oldIndex: number, newIndex: number) => {
        const { config } = get()
        const newModules = [...config.modules]
        const [removed] = newModules.splice(oldIndex, 1)
        newModules.splice(newIndex, 0, removed)
        set({ config: { ...config, modules: newModules } })
      },

      setCombinedViewVisibility: (viewId: string, visible: boolean) => {
        const { config } = get()
        set({
          config: {
            ...config,
            combinedViews: config.combinedViews.map((v) =>
              v.id === viewId ? { ...v, visible } : v
            ),
          },
        })
      },

      resetToDefaults: async (userId: string | null) => {
        set({ config: DEFAULT_CONFIG })
        if (userId) {
          try {
            await userSettingsTable()
              .delete()
              .eq('user_id', userId)
          } catch {
            toast.error("Couldn't reset sidebar settings")
          }
        }
      },

      getVisibleModules: () => {
        return get().config.modules.filter((m) => m.visible)
      },

      getVisibleCombinedViews: () => {
        return get().config.combinedViews.filter((v) => v.visible)
      },
    }),
    {
      name: 'sidebar-config',
      skipHydration: true,
    }
  )
)

/** Helper to trigger a debounced save after config changes */
export function debouncedSaveToSupabase(userId: string, delayMs = 500) {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
  saveDebounceTimer = setTimeout(() => {
    useSidebarConfigStore.getState().saveToSupabase(userId)
  }, delayMs)
}

/** Helper to trigger an immediate save (for drag-drop reorder) */
export function immediateSaveToSupabase(userId: string) {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
  useSidebarConfigStore.getState().saveToSupabase(userId)
}
