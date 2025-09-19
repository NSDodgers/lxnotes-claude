import type { Note } from '@/types'
import type { PDFStrategy, PDFFormattedNote } from '../types'

export class CueNotesPDFStrategy implements PDFStrategy {
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
      'Cue #',
      'Scene/Song',
      'Note',
      'Created'
    ]
  }

  getModuleTitle(): string {
    return 'Cue Notes'
  }

  formatModuleSpecificData(note: Note): Record<string, any> {
    let scriptPage = '-'

    if (note.scriptPageId) {
      if (note.scriptPageId.startsWith('cue-')) {
        // Remove "cue-" prefix: "cue-127" → "127"
        scriptPage = note.scriptPageId.substring(4)
      } else if (note.scriptPageId.startsWith('page-')) {
        // Format page references: "page-78" → "Pg. 78"
        scriptPage = `Pg. ${note.scriptPageId.substring(5)}`
      } else {
        // Keep as-is for other formats
        scriptPage = note.scriptPageId
      }
    }

    return {
      scriptPage,
      sceneSong: note.sceneSongId || '-'
    }
  }
}