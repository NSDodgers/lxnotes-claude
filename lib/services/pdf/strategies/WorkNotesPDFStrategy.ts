import type { Note } from '@/types'
import type { PDFStrategy, PDFFormattedNote } from '../types'

export class WorkNotesPDFStrategy implements PDFStrategy {
  formatNotes(notes: Note[]): PDFFormattedNote[] {
    return notes.map(note => ({
      id: note.id,
      title: note.title,
      description: note.description,
      type: note.type,
      priority: note.priority,
      status: note.status,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      completedAt: note.completedAt,
      dueDate: note.dueDate,
      assignedTo: note.assignedTo,
      moduleSpecificData: this.formatModuleSpecificData(note)
    }))
  }

  getColumnHeaders(): string[] {
    return [
      '', // Checkbox column
      'Priority',
      'Type',
      'Channels',
      'Position/Unit',
      'Note',
      'Created'
    ]
  }

  getModuleTitle(): string {
    return 'Work Notes'
  }

  formatModuleSpecificData(note: Note): Record<string, any> {
    return {
      channels: note.channelNumbers || '-',
      positionUnit: note.positionUnit || '-',
      lightwrightId: note.lightwrightItemId || '-',
      sceneryNeeds: note.sceneryNeeds || '-'
    }
  }
}