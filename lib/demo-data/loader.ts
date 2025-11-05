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
import generateDemoNotes from './notes/demo-notes-data'
import { PIRATES_PRODUCTION } from './production/pirates-info'
import { DEMO_METADATA } from './version'
import { PIRATES_PAGES, PIRATES_SONGS, PIRATES_ACTS } from './script/pirates-pages-songs'
import { getPiratesFixtures } from './fixtures/pirates-fixtures'

/**
 * Initialize demo session with Pirates of Penzance data
 */
export async function initializeDemoSession(): Promise<void> {
  const storage = new SessionStorageAdapter()

  // Check if already initialized
  const isInitialized = await storage.isInitialized()

  try {
    // First-time initialization only
    if (!isInitialized) {
      // Load production info
      await storage.production.set(PIRATES_PRODUCTION)

      // Also set production data for the Zustand production store
      // The production store uses sessionStorage in demo mode with key 'production-settings'
      const productionSettingsStorage = createSafeStorage('production-settings', 'session')
      productionSettingsStorage.setItem(
        'production-settings',
        JSON.stringify({
          state: PIRATES_PRODUCTION,
          version: 0
        })
      )

      // Load script data (pages, songs, acts)
      await storage.script.setPages(PIRATES_PAGES)
      await storage.script.setScenesSongs([...PIRATES_ACTS, ...PIRATES_SONGS])
    }

    // Load demo notes into the in-memory notes store (session-scoped)
    const notesStore = useMockNotesStore.getState()
    const { workNotes, cueNotes, productionNotes } = generateDemoNotes()

    // Helper to strip id/timestamps for createMany
    const toPayload = (note: any) => {
      const { id, createdAt, updatedAt, ...rest } = note
      return rest
    }

    // Work notes
    {
      const existing = await storage.notes.getAll('work')
      if (existing.length > 0) {
        notesStore.setNotes('work', existing)
      } else if (workNotes.length > 0) {
        const created = await storage.notes.createMany(workNotes.map(toPayload))
        notesStore.setNotes('work', created)
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
