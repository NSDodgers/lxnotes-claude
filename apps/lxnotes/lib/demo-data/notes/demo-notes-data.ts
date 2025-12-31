/**
 * Demo Notes Data for Pirates of Penzance
 *
 * Generates realistic production notes for demo purposes.
 * This data can be used in both demo mode and dev mode.
 */

import type { Note } from '@/types'
import { PIRATES_WORK_NOTES } from './pirates-work-notes'
import { DEMO_CUE_NOTES } from './cue-notes'
import { DEMO_PRODUCTION_NOTES } from './production-notes'

export function generateDemoNotes(): {
  cueNotes: Note[]
  workNotes: Note[]
  productionNotes: Note[]
} {
  // For now we provide the comprehensive Work Notes dataset.
  // Cue and Production demo notes can be added as needed.
  return {
    cueNotes: DEMO_CUE_NOTES,
    workNotes: PIRATES_WORK_NOTES,
    productionNotes: DEMO_PRODUCTION_NOTES,
  }
}

export default generateDemoNotes
