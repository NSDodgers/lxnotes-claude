import { describe, it, expect } from 'vitest'
import { MODULE_COLUMN_REGISTRY, getDefaultColumnOrder, getColumnMeta } from '@/lib/config/column-registry'
import type { ModuleType } from '@/types'

const ALL_MODULES: ModuleType[] = ['cue', 'work', 'production', 'electrician']

describe('MODULE_COLUMN_REGISTRY', () => {
  it('has entries for all module types', () => {
    for (const mod of ALL_MODULES) {
      expect(MODULE_COLUMN_REGISTRY[mod]).toBeDefined()
      expect(MODULE_COLUMN_REGISTRY[mod].length).toBeGreaterThan(0)
    }
  })

  it('every module has actions column marked canHide=false', () => {
    for (const mod of ALL_MODULES) {
      const actions = MODULE_COLUMN_REGISTRY[mod].find((c) => c.id === 'actions')
      expect(actions).toBeDefined()
      expect(actions?.canHide).toBe(false)
    }
  })

  it('every module has description column marked canHide=false', () => {
    for (const mod of ALL_MODULES) {
      const desc = MODULE_COLUMN_REGISTRY[mod].find((c) => c.id === 'description')
      expect(desc).toBeDefined()
      expect(desc?.canHide).toBe(false)
    }
  })

  it('has no duplicate column IDs within a module', () => {
    for (const mod of ALL_MODULES) {
      const ids = MODULE_COLUMN_REGISTRY[mod].map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(ids.length).toBe(uniqueIds.size)
    }
  })

  it('every column has a non-empty label', () => {
    for (const mod of ALL_MODULES) {
      for (const col of MODULE_COLUMN_REGISTRY[mod]) {
        expect(col.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('cue module has expected columns', () => {
    const ids = MODULE_COLUMN_REGISTRY.cue.map((c) => c.id)
    expect(ids).toContain('actions')
    expect(ids).toContain('priority')
    expect(ids).toContain('type')
    expect(ids).toContain('cueNumber')
    expect(ids).toContain('description')
    expect(ids).toContain('scriptLookup')
    expect(ids).toContain('createdBy')
    expect(ids).toContain('createdAt')
  })

  it('work module has expected columns', () => {
    const ids = MODULE_COLUMN_REGISTRY.work.map((c) => c.id)
    expect(ids).toContain('channels')
    expect(ids).toContain('fixtureTypes')
    expect(ids).toContain('purposes')
    expect(ids).toContain('positions')
    expect(ids).toContain('orders')
  })
})

describe('getDefaultColumnOrder', () => {
  it('returns column IDs in registry order', () => {
    const order = getDefaultColumnOrder('cue')
    expect(order[0]).toBe('actions')
    expect(order).toContain('description')
    expect(order[order.length - 1]).toBe('createdAt')
  })
})

describe('getColumnMeta', () => {
  it('returns metadata for existing column', () => {
    const meta = getColumnMeta('cue', 'priority')
    expect(meta).toBeDefined()
    expect(meta?.label).toBe('Priority')
    expect(meta?.canHide).toBe(true)
  })

  it('returns undefined for non-existent column', () => {
    const meta = getColumnMeta('cue', 'nonexistent')
    expect(meta).toBeUndefined()
  })
})
