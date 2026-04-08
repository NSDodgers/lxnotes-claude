import { describe, it, expect } from 'vitest'
import { WorkNotesPDFStrategy } from '@/lib/services/pdf/strategies/WorkNotesPDFStrategy'
import { ElectricianNotesPDFStrategy } from '@/lib/services/pdf/strategies/ElectricianNotesPDFStrategy'
import { ProductionNotesPDFStrategy } from '@/lib/services/pdf/strategies/ProductionNotesPDFStrategy'
import type { Note, FixtureAggregate } from '@/types'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    moduleType: 'electrician',
    description: 'Move thse units',
    type: 'work',
    priority: 'high',
    status: 'todo',
    createdAt: new Date('2026-04-01T00:00:00Z'),
    updatedAt: new Date('2026-04-01T00:00:00Z'),
    channelNumbers: '101-105',
    positionUnit: 'TORM 3 SR, U#: 1',
    ...overrides,
  } as Note
}

function makeAggregate(overrides: Partial<FixtureAggregate> = {}): FixtureAggregate {
  return {
    workNoteId: 'note-1',
    channels: '455, 455',
    positions: ['TORM 3 SL', 'TORM 3 SR'],
    positionsWithUnits: ['TORM 3 SL, U#: 1', 'TORM 3 SR, U#: 1'],
    fixtureTypes: ['ETC S4 26°'],
    purposes: ['HEADER HIGHLIGHT <<', 'HEADER HIGHLIGHT >>'],
    universeAddresses: [],
    hasInactive: false,
    ...overrides,
  }
}

describe('ElectricianNotesPDFStrategy (regression: bug where electrician PDFs rendered as Production Notes)', () => {
  it('is NOT a ProductionNotesPDFStrategy — regression guard for the reported bug', () => {
    const strategy = new ElectricianNotesPDFStrategy()
    expect(strategy).not.toBeInstanceOf(ProductionNotesPDFStrategy)
  })

  it('extends WorkNotesPDFStrategy so it shares the fixture-aware layout', () => {
    const strategy = new ElectricianNotesPDFStrategy()
    expect(strategy).toBeInstanceOf(WorkNotesPDFStrategy)
  })

  it('reports module title as "Electrician Notes"', () => {
    const strategy = new ElectricianNotesPDFStrategy()
    expect(strategy.getModuleTitle()).toBe('Electrician Notes')
  })

  it('includes Fixture Type and Purpose columns', () => {
    const headers = new ElectricianNotesPDFStrategy().getColumnHeaders()
    expect(headers).toContain('Channels')
    expect(headers).toContain('Fixture Type')
    expect(headers).toContain('Purpose')
    expect(headers).toContain('Position/Unit')
  })
})

describe('WorkNotesPDFStrategy unified fixture-aware layout', () => {
  it('reports module title as "Work Notes"', () => {
    expect(new WorkNotesPDFStrategy().getModuleTitle()).toBe('Work Notes')
  })

  it('headers include the new Fixture Type and Purpose columns (shared with electrician)', () => {
    const headers = new WorkNotesPDFStrategy().getColumnHeaders()
    expect(headers).toEqual([
      '',
      'Priority',
      'Type',
      'Channels',
      'Fixture Type',
      'Purpose',
      'Position/Unit',
      'Note',
      'Created',
    ])
  })

  describe('formatNotes', () => {
    it('surfaces channels, fixtureType, purpose, and positionUnit from the aggregate', () => {
      const strategy = new WorkNotesPDFStrategy()
      const note = makeNote()
      const aggregates: Record<string, FixtureAggregate> = { 'note-1': makeAggregate() }

      const [formatted] = strategy.formatNotes([note], aggregates)

      expect(formatted.moduleSpecificData).toMatchObject({
        channels: '455, 455',
        fixtureType: 'ETC S4 26°',
        purpose: 'HEADER HIGHLIGHT <<\nHEADER HIGHLIGHT >>',
        positionUnit: 'TORM 3 SL, U#: 1\nTORM 3 SR, U#: 1',
      })
    })

    it('falls back to note fields and "-" when aggregates are missing', () => {
      const strategy = new WorkNotesPDFStrategy()
      const note = makeNote()

      const [formatted] = strategy.formatNotes([note], undefined)

      expect(formatted.moduleSpecificData).toMatchObject({
        channels: '101-105',
        fixtureType: '-',
        purpose: '-',
        positionUnit: 'TORM 3 SR, U#: 1',
      })
    })

    it('falls back to "-" when aggregate has empty fixtureTypes/purposes arrays', () => {
      const strategy = new WorkNotesPDFStrategy()
      const note = makeNote()
      const aggregates: Record<string, FixtureAggregate> = {
        'note-1': makeAggregate({ fixtureTypes: [], purposes: [] }),
      }

      const [formatted] = strategy.formatNotes([note], aggregates)

      expect(formatted.moduleSpecificData?.fixtureType).toBe('-')
      expect(formatted.moduleSpecificData?.purpose).toBe('-')
    })
  })

  it('ElectricianNotesPDFStrategy inherits the same formatting behavior', () => {
    const strategy = new ElectricianNotesPDFStrategy()
    const note = makeNote()
    const aggregates: Record<string, FixtureAggregate> = { 'note-1': makeAggregate() }

    const [formatted] = strategy.formatNotes([note], aggregates)

    expect(formatted.moduleSpecificData?.fixtureType).toBe('ETC S4 26°')
    expect(formatted.moduleSpecificData?.purpose).toBe('HEADER HIGHLIGHT <<\nHEADER HIGHLIGHT >>')
  })
})
