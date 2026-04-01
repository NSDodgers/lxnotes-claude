import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSidebarConfigStore } from '@/lib/stores/sidebar-config-store'
import type { SidebarConfig } from '@/lib/stores/sidebar-config-store'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
        }),
      }),
      upsert: () => Promise.resolve({ error: null }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  }),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

describe('useSidebarConfigStore', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useSidebarConfigStore.setState({
      config: {
        modules: [
          { id: 'cue', visible: true },
          { id: 'work', visible: true },
          { id: 'electrician', visible: true },
          { id: 'production', visible: true },
        ],
        combinedViews: [
          { id: 'work-electrician', visible: false, moduleTypes: ['work', 'electrician'] },
        ],
      },
      isLoaded: false,
    })
  })

  describe('getVisibleModules', () => {
    it('returns all modules when all are visible', () => {
      const visible = useSidebarConfigStore.getState().getVisibleModules()
      expect(visible).toHaveLength(4)
      expect(visible.map(m => m.id)).toEqual(['cue', 'work', 'electrician', 'production'])
    })

    it('returns only visible modules', () => {
      useSidebarConfigStore.getState().setModuleVisibility('cue', false)
      useSidebarConfigStore.getState().setModuleVisibility('production', false)
      const visible = useSidebarConfigStore.getState().getVisibleModules()
      expect(visible).toHaveLength(2)
      expect(visible.map(m => m.id)).toEqual(['work', 'electrician'])
    })

    it('returns empty combined views by default', () => {
      const views = useSidebarConfigStore.getState().getVisibleCombinedViews()
      expect(views).toHaveLength(0)
    })
  })

  describe('setModuleVisibility', () => {
    it('hides a module', () => {
      useSidebarConfigStore.getState().setModuleVisibility('cue', false)
      const mod = useSidebarConfigStore.getState().config.modules.find(m => m.id === 'cue')
      expect(mod?.visible).toBe(false)
    })

    it('shows a hidden module', () => {
      useSidebarConfigStore.getState().setModuleVisibility('cue', false)
      useSidebarConfigStore.getState().setModuleVisibility('cue', true)
      const mod = useSidebarConfigStore.getState().config.modules.find(m => m.id === 'cue')
      expect(mod?.visible).toBe(true)
    })

    it('prevents hiding the last visible module', () => {
      // Hide 3 of 4
      useSidebarConfigStore.getState().setModuleVisibility('cue', false)
      useSidebarConfigStore.getState().setModuleVisibility('work', false)
      useSidebarConfigStore.getState().setModuleVisibility('electrician', false)

      // Try to hide the last one
      useSidebarConfigStore.getState().setModuleVisibility('production', false)

      // Production should still be visible
      const mod = useSidebarConfigStore.getState().config.modules.find(m => m.id === 'production')
      expect(mod?.visible).toBe(true)

      const visibleCount = useSidebarConfigStore.getState().config.modules.filter(m => m.visible).length
      expect(visibleCount).toBe(1)
    })

    it('does not affect other modules', () => {
      useSidebarConfigStore.getState().setModuleVisibility('cue', false)
      const work = useSidebarConfigStore.getState().config.modules.find(m => m.id === 'work')
      expect(work?.visible).toBe(true)
    })
  })

  describe('reorderModules', () => {
    it('moves a module from one position to another', () => {
      // Move electrician (index 2) to first position (index 0)
      useSidebarConfigStore.getState().reorderModules(2, 0)
      const ids = useSidebarConfigStore.getState().config.modules.map(m => m.id)
      expect(ids).toEqual(['electrician', 'cue', 'work', 'production'])
    })

    it('preserves visibility when reordering', () => {
      useSidebarConfigStore.getState().setModuleVisibility('cue', false)
      useSidebarConfigStore.getState().reorderModules(0, 3)
      const cue = useSidebarConfigStore.getState().config.modules.find(m => m.id === 'cue')
      expect(cue?.visible).toBe(false)
    })
  })

  describe('setCombinedViewVisibility', () => {
    it('enables a combined view', () => {
      useSidebarConfigStore.getState().setCombinedViewVisibility('work-electrician', true)
      const view = useSidebarConfigStore.getState().config.combinedViews.find(v => v.id === 'work-electrician')
      expect(view?.visible).toBe(true)
    })

    it('disables a combined view', () => {
      useSidebarConfigStore.getState().setCombinedViewVisibility('work-electrician', true)
      useSidebarConfigStore.getState().setCombinedViewVisibility('work-electrician', false)
      const view = useSidebarConfigStore.getState().config.combinedViews.find(v => v.id === 'work-electrician')
      expect(view?.visible).toBe(false)
    })

    it('appears in getVisibleCombinedViews when enabled', () => {
      useSidebarConfigStore.getState().setCombinedViewVisibility('work-electrician', true)
      const views = useSidebarConfigStore.getState().getVisibleCombinedViews()
      expect(views).toHaveLength(1)
      expect(views[0].id).toBe('work-electrician')
    })
  })

  describe('resetToDefaults', () => {
    it('resets config to defaults', async () => {
      // Customize
      useSidebarConfigStore.getState().setModuleVisibility('cue', false)
      useSidebarConfigStore.getState().setCombinedViewVisibility('work-electrician', true)
      useSidebarConfigStore.getState().reorderModules(2, 0)

      // Reset
      await useSidebarConfigStore.getState().resetToDefaults(null)

      const state = useSidebarConfigStore.getState()
      expect(state.config.modules.every(m => m.visible)).toBe(true)
      expect(state.config.modules.map(m => m.id)).toEqual(['cue', 'work', 'electrician', 'production'])
      expect(state.config.combinedViews.every(v => v.visible)).toBe(true)
    })
  })

  describe('fetchFromSupabase', () => {
    it('sets isLoaded to true even when no row exists', async () => {
      await useSidebarConfigStore.getState().fetchFromSupabase('user-1')
      expect(useSidebarConfigStore.getState().isLoaded).toBe(true)
    })

    it('keeps default config when no row exists', async () => {
      await useSidebarConfigStore.getState().fetchFromSupabase('user-1')
      const visible = useSidebarConfigStore.getState().getVisibleModules()
      expect(visible).toHaveLength(4)
    })
  })
})
