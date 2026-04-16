import type { Note, FixtureAggregate } from '@/types'
import type { PDFStrategy, PDFFormattedNote } from '../types'

export class WorkNotesPDFStrategy implements PDFStrategy {
  formatNotes(notes: Note[], fixtureAggregates?: Record<string, FixtureAggregate>): PDFFormattedNote[] {
    return notes.map(note => ({
      id: note.id,
      description: note.description,
      type: note.type,
      priority: note.priority,
      status: note.status,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      completedAt: note.completedAt,
      dueDate: note.dueDate,
      assignedTo: note.assignedTo,
      moduleSpecificData: this.formatModuleSpecificData(note, fixtureAggregates)
    }))
  }

  getColumnHeaders(): string[] {
    return [
      '', // Checkbox column
      'Priority',
      'Type',
      'Channels',
      'Address',
      'Position/Unit',
      'Fixture Type',
      'Purpose',
      'Note',
      'Created'
    ]
  }

  getModuleTitle(): string {
    return 'Work Notes'
  }

  formatModuleSpecificData(note: Note, fixtureAggregates?: Record<string, FixtureAggregate>): Record<string, string | number | boolean | null | undefined> {
    const aggregate = fixtureAggregates?.[note.id]
    return {
      channels: aggregate?.channels || note.channelNumbers || '-',
      address: aggregate?.universeAddresses?.length ? aggregate.universeAddresses.join('\n') : '-',
      fixtureType: aggregate?.fixtureTypes?.length ? aggregate.fixtureTypes.join(', ') : '-',
      purpose: aggregate?.purposes?.length ? aggregate.purposes.join('\n') : '-',
      positionUnit: (aggregate?.positionsWithUnits?.length ? aggregate.positionsWithUnits.join('\n') : null) || note.positionUnit || '-',
      lightwrightId: note.lightwrightItemId || '-',
      sceneryNeeds: note.sceneryNeeds || '-'
    }
  }
}
