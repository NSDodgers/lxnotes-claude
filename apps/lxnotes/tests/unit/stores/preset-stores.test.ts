import { describe, it, expect, beforeEach } from 'vitest'
import { useFilterSortPresetsStore } from '@/lib/stores/filter-sort-presets-store'
import { usePrintPresetsStore } from '@/lib/stores/print-presets-store'
import { useEmailMessagePresetsStore } from '@/lib/stores/email-message-presets-store'
import type { FilterSortPreset, PrintPreset, EmailMessagePreset } from '@/types'

function makeFilterSortPreset(overrides: Partial<FilterSortPreset> = {}): Omit<FilterSortPreset, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: Date; updatedAt?: Date } {
  return {
    productionId: 'prod-1',
    type: 'filter_sort',
    moduleType: 'work',
    name: 'Test Filter',
    config: {
      statusFilter: 'todo',
      typeFilters: [],
      priorityFilters: [],
      sortBy: 'priority',
      sortOrder: 'desc',
      groupByType: false,
    },
    isDefault: false,
    createdBy: 'user',
    ...overrides,
  }
}

function makePrintPreset(overrides: Partial<PrintPreset> = {}): Omit<PrintPreset, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: Date; updatedAt?: Date } {
  return {
    productionId: 'prod-1',
    type: 'print',
    moduleType: 'work',
    name: 'Test Print',
    config: {
      filterSortPresetId: 'filter-123',
      pageStyle: { paperSize: 'letter', orientation: 'landscape', includeCheckboxes: true },
    },
    isDefault: false,
    createdBy: 'user',
    ...overrides,
  }
}

function makeEmailPreset(overrides: Partial<EmailMessagePreset> = {}): Omit<EmailMessagePreset, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: Date; updatedAt?: Date } {
  return {
    productionId: 'prod-1',
    type: 'email_message',
    moduleType: 'work',
    name: 'Test Email',
    config: {
      recipients: 'test@example.com',
      subject: 'Test',
      message: 'Body',
      filterAndSortPresetId: null,
      pageStyle: { paperSize: 'letter', orientation: 'landscape', includeCheckboxes: true },
      includeNotesInBody: true,
      attachPdf: false,
    },
    isDefault: false,
    createdBy: 'user',
    ...overrides,
  }
}

describe('Filter Sort Presets Store', () => {
  beforeEach(() => {
    useFilterSortPresetsStore.setState({ presets: [] })
  })

  describe('addPreset', () => {
    it('preserves caller-provided id', () => {
      const store = useFilterSortPresetsStore.getState()
      store.addPreset(makeFilterSortPreset({ id: 'my-custom-id' }))

      const presets = useFilterSortPresetsStore.getState().presets
      expect(presets).toHaveLength(1)
      expect(presets[0].id).toBe('my-custom-id')
    })

    it('generates id when none provided', () => {
      const store = useFilterSortPresetsStore.getState()
      store.addPreset(makeFilterSortPreset())

      const presets = useFilterSortPresetsStore.getState().presets
      expect(presets).toHaveLength(1)
      expect(presets[0].id).toMatch(/^filter-sort-/)
    })

    it('preserves caller-provided timestamps', () => {
      const customDate = new Date('2025-01-01')
      const store = useFilterSortPresetsStore.getState()
      store.addPreset(makeFilterSortPreset({ id: 'ts-test', createdAt: customDate, updatedAt: customDate }))

      const presets = useFilterSortPresetsStore.getState().presets
      expect(presets[0].createdAt).toEqual(customDate)
      expect(presets[0].updatedAt).toEqual(customDate)
    })
  })

  describe('getPreset', () => {
    it('finds system presets for combined-work-electrician module', () => {
      const store = useFilterSortPresetsStore.getState()
      const systemPresets = store.getSystemDefaults('combined-work-electrician')
      expect(systemPresets.length).toBeGreaterThan(0)

      const found = store.getPreset(systemPresets[0].id)
      expect(found).toBeDefined()
      expect(found!.id).toBe(systemPresets[0].id)
    })

    it('finds system presets for electrician module', () => {
      const store = useFilterSortPresetsStore.getState()
      const systemPresets = store.getSystemDefaults('electrician')
      expect(systemPresets.length).toBeGreaterThan(0)

      const found = store.getPreset(systemPresets[0].id)
      expect(found).toBeDefined()
      expect(found!.id).toBe(systemPresets[0].id)
    })
  })
})

describe('Print Presets Store', () => {
  beforeEach(() => {
    usePrintPresetsStore.setState({ presets: [] })
  })

  describe('addPreset', () => {
    it('preserves caller-provided id', () => {
      const store = usePrintPresetsStore.getState()
      store.addPreset(makePrintPreset({ id: 'my-print-id' }))

      const presets = usePrintPresetsStore.getState().presets
      expect(presets).toHaveLength(1)
      expect(presets[0].id).toBe('my-print-id')
    })

    it('generates id when none provided', () => {
      const store = usePrintPresetsStore.getState()
      store.addPreset(makePrintPreset())

      const presets = usePrintPresetsStore.getState().presets
      expect(presets).toHaveLength(1)
      expect(presets[0].id).toMatch(/^print-/)
    })
  })

  describe('getPreset', () => {
    it('finds system presets for combined-work-electrician module', () => {
      const store = usePrintPresetsStore.getState()
      const systemPresets = store.getPresetsByModule('combined-work-electrician').filter(p => p.id.startsWith('sys-'))
      expect(systemPresets.length).toBeGreaterThan(0)

      const found = store.getPreset(systemPresets[0].id)
      expect(found).toBeDefined()
      expect(found!.id).toBe(systemPresets[0].id)
    })
  })
})

describe('Email Message Presets Store', () => {
  beforeEach(() => {
    useEmailMessagePresetsStore.setState({ presets: [] })
  })

  describe('addPreset', () => {
    it('preserves caller-provided id', () => {
      const store = useEmailMessagePresetsStore.getState()
      store.addPreset(makeEmailPreset({ id: 'my-email-id' }))

      const presets = useEmailMessagePresetsStore.getState().presets
      expect(presets).toHaveLength(1)
      expect(presets[0].id).toBe('my-email-id')
    })

    it('generates id when none provided', () => {
      const store = useEmailMessagePresetsStore.getState()
      store.addPreset(makeEmailPreset())

      const presets = useEmailMessagePresetsStore.getState().presets
      expect(presets).toHaveLength(1)
      expect(presets[0].id).toMatch(/^email-message-/)
    })
  })

  describe('getPreset', () => {
    it('finds system presets for combined-work-electrician module', () => {
      const store = useEmailMessagePresetsStore.getState()
      const systemPresets = store.getPresetsByModule('combined-work-electrician').filter(p => p.id.startsWith('sys-'))
      expect(systemPresets.length).toBeGreaterThan(0)

      const found = store.getPreset(systemPresets[0].id)
      expect(found).toBeDefined()
      expect(found!.id).toBe(systemPresets[0].id)
    })
  })
})
