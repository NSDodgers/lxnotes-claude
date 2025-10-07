import type { Note } from '@/types'
import type { PDFStrategy, PDFFormattedNote } from '../types'

export class ProductionNotesPDFStrategy implements PDFStrategy {
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
      'Department',
      'Note',
      'Created'
    ]
  }

  getModuleTitle(): string {
    return 'Production Notes'
  }

  formatModuleSpecificData(note: Note): Record<string, unknown> {
    return {
      department: note.type || 'General'
    }
  }
}
