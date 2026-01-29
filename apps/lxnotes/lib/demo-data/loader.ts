/**
 * Demo Data Loader
 *
 * Initializes demo data into sessionStorage for demo mode.
 * Provides functions to load, reset, and manage demo data.
 */

import { SessionStorageAdapter } from '@/lib/storage/session-storage'
import { createSafeStorage } from '@/lib/storage/safe-storage'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { useDemoProductionStore } from '@/lib/stores/production-store'
import { useScriptStore } from '@/lib/stores/script-store'
import generateDemoNotes from './notes/demo-notes-data'
import type { Note } from '@/types'
import { PIRATES_PRODUCTION } from './production/pirates-info'
import { DEMO_METADATA } from './version'
import { PIRATES_PAGES, PIRATES_SONGS, PIRATES_ACTS } from './script/pirates-pages-songs'
import { getPiratesFixtures } from './fixtures/pirates-fixtures'

/**
 * Parse a channel expression like "101-116" or "1, 3, 5, 7" into an array of channel numbers
 */
function parseChannelExpression(expression: string): number[] {
  const channels: number[] = []
  const parts = expression.split(',').map(p => p.trim())

  for (const part of parts) {
    if (part.includes('-')) {
      // Range expression like "101-116"
      const [start, end] = part.split('-').map(s => parseInt(s.trim(), 10))
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          channels.push(i)
        }
      }
    } else {
      // Single channel like "5"
      const channel = parseInt(part, 10)
      if (!isNaN(channel)) {
        channels.push(channel)
      }
    }
  }

  return channels
}

/**
 * Initialize demo session with Pirates of Penzance data
 */
export async function initializeDemoSession(): Promise<void> {
  const storage = new SessionStorageAdapter()

  // Check if already initialized
  const isInitialized = await storage.isInitialized()

  // Always set production data for the demo-specific Zustand production store
  // This ensures the Pirates logo/info appears even if storage was already initialized
  // Using the isolated demo store prevents contaminating the user's regular production settings
  useDemoProductionStore.getState().updateProduction(PIRATES_PRODUCTION)

  try {
    // First-time initialization only
    if (!isInitialized) {
      // Load production info
      await storage.production.set(PIRATES_PRODUCTION)

      // Load script data (pages, songs, acts) to session storage
      await storage.script.setPages(PIRATES_PAGES)
      await storage.script.setScenesSongs([...PIRATES_ACTS, ...PIRATES_SONGS])
    }

    // Always populate the script store with Pirates data for demo mode
    // This ensures the in-memory store has the data regardless of session storage state
    useScriptStore.getState().setScriptData(PIRATES_PAGES, PIRATES_ACTS, PIRATES_SONGS)

    // Load demo notes into the in-memory notes store (session-scoped)
    const notesStore = useMockNotesStore.getState()
    const { workNotes, cueNotes, productionNotes } = generateDemoNotes()

    // Helper to strip id/timestamps for createMany
    const toPayload = (note: Note) => {
      const { id, createdAt, updatedAt, ...rest } = note
      return rest
    }

    // Work notes (store for fixture linking later)
    let storedWorkNotes: Note[] = []
    {
      const existing = await storage.notes.getAll('work')
      if (existing.length > 0) {
        notesStore.setNotes('work', existing)
        storedWorkNotes = existing
      } else if (workNotes.length > 0) {
        const created = await storage.notes.createMany(workNotes.map(toPayload))
        notesStore.setNotes('work', created)
        storedWorkNotes = created
      }
    }

    // Cue notes
    {
      const existing = await storage.notes.getAll('cue')
      if (existing.length > 0) {
        notesStore.setNotes('cue', existing)
      } else if (cueNotes.length > 0) {
        const created = await storage.notes.createMany(cueNotes.map(toPayload))
        notesStore.setNotes('cue', created)
      }
    }

    // Production notes
    {
      const existing = await storage.notes.getAll('production')
      if (existing.length > 0) {
        notesStore.setNotes('production', existing)
      } else if (productionNotes.length > 0) {
        const created = await storage.notes.createMany(productionNotes.map(toPayload))
        notesStore.setNotes('production', created)
      }
    }

    // Load fixtures into the fixture store
    const fixtureStore = useFixtureStore.getState()

    // Only load if fixtures haven't been loaded yet
    if (fixtureStore.fixtures.length === 0) {
      const piratesFixtures = getPiratesFixtures()

      // Convert FixtureInfo to ParsedHookupRow format
      const parsedRows = piratesFixtures.map(f => ({
        lwid: f.lwid,
        channel: f.channel,
        position: f.position,
        unitNumber: f.unitNumber,
        fixtureType: f.fixtureType,
        purpose: f.purpose,
        universe: f.universe,
        address: f.address,
        universeAddressRaw: f.universeAddressRaw || '',
        positionOrder: f.positionOrder
      }))

      const result = fixtureStore.uploadFixtures('prod-1', parsedRows, false)
      console.log(`  - ${result.inserted} fixtures inserted, ${result.updated} updated`)

      // Link fixtures to work notes based on channelNumbers expressions
      const workNotesWithChannels = storedWorkNotes.filter(note => note.channelNumbers)
      console.log(`  - Processing ${workNotesWithChannels.length} work notes with channel expressions`)

      // Get fresh state after upload to access the newly uploaded fixtures
      const updatedFixtureStore = useFixtureStore.getState()

      let linkedCount = 0
      let totalFixturesLinked = 0
      const notesWithoutMatches: string[] = []

      for (const note of workNotesWithChannels) {
        const channelNumbers = parseChannelExpression(note.channelNumbers!)
        const matchingFixtures = updatedFixtureStore.fixtures.filter(f =>
          channelNumbers.includes(f.channel)
        )

        if (matchingFixtures.length > 0) {
          fixtureStore.linkFixturesToWorkNote(note.id, matchingFixtures.map(f => f.id))
          linkedCount++
          totalFixturesLinked += matchingFixtures.length
          console.log(`    ✓ Note "${note.title?.substring(0, 40)}..." (${note.channelNumbers}) → ${matchingFixtures.length} fixtures`)
        } else {
          notesWithoutMatches.push(`"${note.title}" (${note.channelNumbers})`)
          console.warn(`    ⚠ No fixtures found for note "${note.title}" with channels: ${note.channelNumbers}`)
        }
      }

      console.log(`  - Successfully linked ${totalFixturesLinked} fixtures to ${linkedCount} work notes`)
      if (notesWithoutMatches.length > 0) {
        console.warn(`  - ${notesWithoutMatches.length} notes had no matching fixtures`)
      }
    }

    // Mark as initialized (idempotent)
    if (!isInitialized) {
      storage.markInitialized()
    }

    console.log(`✅ Demo data initialized: ${DEMO_METADATA.productionName} v${DEMO_METADATA.version}`)
    console.log(`  - ${PIRATES_PAGES.length} pages`)
    console.log(`  - ${PIRATES_SONGS.length} songs`)
    console.log(`  - ${PIRATES_ACTS.length} acts`)
    console.log(`  - ${workNotes.length} work notes`)
    console.log(`  - ${cueNotes.length} cue notes`)
    console.log(`  - ${productionNotes.length} production notes`)
  } catch (error) {
    console.error('❌ Failed to initialize demo data:', error)
    throw error
  }
}

/**
 * Reset demo data to original state
 */
export async function resetDemoData(): Promise<void> {
  const storage = new SessionStorageAdapter()

  // Clear all demo data
  await storage.clear()

  // Clear fixture store data
  const fixtureStore = useFixtureStore.getState()
  fixtureStore.clearData()

  // Clear script store data
  const scriptStore = useScriptStore.getState()
  scriptStore.reset()

  console.log('🔄 Demo data cleared')

  // Re-initialize
  await initializeDemoSession()

  console.log('✅ Demo data reset complete')
}

/**
 * Check if currently in demo mode
 */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
}

/**
 * Get demo metadata
 */
export function getDemoMetadata() {
  return DEMO_METADATA
}
