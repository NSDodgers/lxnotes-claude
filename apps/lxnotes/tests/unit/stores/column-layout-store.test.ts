import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useColumnLayoutStore, mergeColumnOrderWithRegistry } from '@/lib/stores/column-layout-store'

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
    }),
  }),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

describe('useColumnLayoutStore', () => {
  beforeEach(() => {
    useColumnLayoutStore.setState({
      profileKey: 'test-user',
      layouts: {},
    })
  })

  describe('column order', () => {
    it('returns null for module with no stored order', () => {
      const order = useColumnLayoutStore.getState().getColumnOrder('cue')
      expect(order).toBeNull()
    })

    it('stores and retrieves column order', () => {
      const store = useColumnLayoutStore.getState()
      store.setColumnOrder('cue', ['actions', 'description', 'priority'])
      const order = useColumnLayoutStore.getState().getColumnOrder('cue')
      expect(order).toEqual(['actions', 'description', 'priority'])
    })

    it('stores order per module independently', () => {
      const store = useColumnLayoutStore.getState()
      store.setColumnOrder('cue', ['a', 'b'])
      store.setColumnOrder('work', ['x', 'y', 'z'])
      expect(useColumnLayoutStore.getState().getColumnOrder('cue')).toEqual(['a', 'b'])
      expect(useColumnLayoutStore.getState().getColumnOrder('work')).toEqual(['x', 'y', 'z'])
    })
  })

  describe('column visibility', () => {
    it('returns empty array for module with no hidden columns', () => {
      const hidden = useColumnLayoutStore.getState().getHiddenColumns('cue')
      expect(hidden).toEqual([])
    })

    it('toggles column visibility on', () => {
      const store = useColumnLayoutStore.getState()
      store.toggleColumnVisibility('cue', 'priority')
      expect(useColumnLayoutStore.getState().getHiddenColumns('cue')).toContain('priority')
    })

    it('toggles column visibility off', () => {
      const store = useColumnLayoutStore.getState()
      store.toggleColumnVisibility('cue', 'priority')
      store.toggleColumnVisibility('cue', 'priority')
      expect(useColumnLayoutStore.getState().getHiddenColumns('cue')).not.toContain('priority')
    })

    it('prevents hiding non-hideable columns', () => {
      const store = useColumnLayoutStore.getState()
      store.toggleColumnVisibility('cue', 'actions')
      expect(useColumnLayoutStore.getState().getHiddenColumns('cue')).not.toContain('actions')
    })

    it('prevents hiding description column', () => {
      const store = useColumnLayoutStore.getState()
      store.toggleColumnVisibility('cue', 'description')
      expect(useColumnLayoutStore.getState().getHiddenColumns('cue')).not.toContain('description')
    })

    it('sets hidden columns directly', () => {
      const store = useColumnLayoutStore.getState()
      store.setHiddenColumns('cue', ['priority', 'type'])
      expect(useColumnLayoutStore.getState().getHiddenColumns('cue')).toEqual(['priority', 'type'])
    })
  })

  describe('column widths', () => {
    it('sets individual column width', () => {
      const store = useColumnLayoutStore.getState()
      store.setColumnWidth('cue', 'priority', 150)
      const layout = useColumnLayoutStore.getState().getModuleLayout('cue')
      expect(layout?.widths['priority']).toBe(150)
    })

    it('sets multiple column widths', () => {
      const store = useColumnLayoutStore.getState()
      store.setColumnWidths('cue', { priority: 100, type: 120 })
      const layout = useColumnLayoutStore.getState().getModuleLayout('cue')
      expect(layout?.widths['priority']).toBe(100)
      expect(layout?.widths['type']).toBe(120)
    })
  })

  describe('frozen count', () => {
    it('defaults to 0', () => {
      expect(useColumnLayoutStore.getState().getFrozenCount('cue')).toBe(0)
    })

    it('sets and gets frozen count', () => {
      const store = useColumnLayoutStore.getState()
      store.setFrozenCount('cue', 3)
      expect(useColumnLayoutStore.getState().getFrozenCount('cue')).toBe(3)
    })
  })

  describe('resetModuleLayout', () => {
    it('clears all layout data for a module', () => {
      const store = useColumnLayoutStore.getState()
      store.setColumnOrder('cue', ['a', 'b'])
      store.setHiddenColumns('cue', ['priority'])
      store.setColumnWidth('cue', 'priority', 150)
      store.setFrozenCount('cue', 2)

      store.resetModuleLayout('cue')

      expect(useColumnLayoutStore.getState().getColumnOrder('cue')).toBeNull()
      expect(useColumnLayoutStore.getState().getHiddenColumns('cue')).toEqual([])
      expect(useColumnLayoutStore.getState().getFrozenCount('cue')).toBe(0)
      expect(useColumnLayoutStore.getState().getModuleLayout('cue')).toBeUndefined()
    })

    it('does not affect other modules', () => {
      const store = useColumnLayoutStore.getState()
      store.setColumnOrder('cue', ['a', 'b'])
      store.setColumnOrder('work', ['x', 'y'])

      store.resetModuleLayout('cue')

      expect(useColumnLayoutStore.getState().getColumnOrder('work')).toEqual(['x', 'y'])
    })
  })
})

describe('mergeColumnOrderWithRegistry', () => {
  it('returns defaults when stored order is null', () => {
    const result = mergeColumnOrderWithRegistry(null, 'production')
    expect(result).toEqual(['actions', 'priority', 'type', 'description', 'createdBy', 'createdAt'])
  })

  it('preserves stored order for known columns', () => {
    const stored = ['description', 'priority', 'actions', 'type', 'createdBy', 'createdAt']
    const result = mergeColumnOrderWithRegistry(stored, 'production')
    expect(result).toEqual(stored)
  })

  it('appends new registry columns not in stored order', () => {
    // Simulate stored order missing 'createdAt'
    const stored = ['actions', 'priority', 'type', 'description', 'createdBy']
    const result = mergeColumnOrderWithRegistry(stored, 'production')
    expect(result).toEqual(['actions', 'priority', 'type', 'description', 'createdBy', 'createdAt'])
  })

  it('removes stored columns no longer in registry', () => {
    const stored = ['actions', 'priority', 'type', 'REMOVED_COLUMN', 'description', 'createdBy', 'createdAt']
    const result = mergeColumnOrderWithRegistry(stored, 'production')
    expect(result).not.toContain('REMOVED_COLUMN')
    expect(result).toEqual(['actions', 'priority', 'type', 'description', 'createdBy', 'createdAt'])
  })
})
