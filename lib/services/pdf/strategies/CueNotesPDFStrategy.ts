import type { Note } from '@/types'
import type { PDFStrategy, PDFFormattedNote } from '../types'
import { useScriptStore } from '@/lib/stores/script-store'

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
      'Script Page - Scene/Song',
      'Note',
      'Created'
    ]
  }

  getModuleTitle(): string {
    return 'Cue Notes'
  }

  formatModuleSpecificData(note: Note): Record<string, string | number | boolean | null | undefined> {
    // Cue # comes from the cueNumber field
    const cueNumber = note.cueNumber || '-'

    // Build Script Page - Scene/Song display (matches main table logic)
    const scriptPageSceneSong = this.buildCueLocationDisplay(note)

    return {
      scriptPage: cueNumber,
      sceneSong: scriptPageSceneSong
    }
  }

  private buildCueLocationDisplay(note: Note): string {
    const { findCueLocation, getSceneSongById, getSceneSongByName } = useScriptStore.getState()

    const formatLookup = (cueNum: string): string => {
      if (!cueNum?.trim()) {
        return '-'
      }

      const location = findCueLocation(cueNum.trim())

      if (!location.page) {
        return `Cue ${cueNum} (Page not found)`
      }

      let display = `Pg. ${location.page.pageNumber}`

      // Determine which item to show based on priority: song > scene > page only
      if (location.song) {
        const songDisplay = location.song.continuesFromId
          ? `${location.song.name} (cont.)`
          : location.song.name
        display += ` – ${songDisplay}`
      } else if (location.scene) {
        display += ` – ${location.scene.name}`
      }

      return display
    }

    if (note.cueNumber) {
      return formatLookup(note.cueNumber)
    }

    if (note.scriptPageId) {
      if (note.scriptPageId.startsWith('cue-')) {
        return formatLookup(note.scriptPageId.replace('cue-', ''))
      }

      if (note.scriptPageId.startsWith('page-')) {
        const pageLabel = `Pg. ${note.scriptPageId.replace('page-', '')}`

        // Look up actual scene/song name by ID or name (for backwards compatibility)
        if (note.sceneSongId) {
          // Try ID-based lookup first
          let sceneSong = getSceneSongById(note.sceneSongId)

          // Fallback to name-based lookup (for legacy data where sceneSongId stores names)
          if (!sceneSong) {
            sceneSong = getSceneSongByName(note.sceneSongId)
          }

          if (sceneSong) {
            const sceneSongDisplay = !!sceneSong.continuesFromId
              ? `${sceneSong.name} (cont.)`
              : sceneSong.name
            return `${pageLabel} – ${sceneSongDisplay}`
          }

          // Final fallback if neither lookup works
          return `${pageLabel} – ${note.sceneSongId}`
        }

        return pageLabel
      }

      return note.scriptPageId
    }

    return '-'
  }
}
