/**
 * Demo Notes Data for Pirates of Penzance
 *
 * Generates realistic production notes for demo purposes.
 * This data can be used in both demo mode and dev mode.
 */

import type { Note } from '@/types'

export function generateDemoNotes() {
  const baseDate = new Date()

  return {
    cueNotes,
    workNotes,
    productionNotes
  }
}

// Re-export the existing mock data from mock-notes-store for now
// In the future, this can be refactored to separate files

export { generateDemoNotes as default }