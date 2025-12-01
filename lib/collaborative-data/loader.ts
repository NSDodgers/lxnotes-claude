/**
 * Collaborative Session Loader
 *
 * Initializes the collaborative session by loading data from GitHub
 * or seeding initial data if this is the first run.
 */

import { gitHubStorageAdapter } from '@/lib/github/github-storage-adapter'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { useProductionStore } from '@/lib/stores/production-store'
import { useSyncStore } from '@/lib/github/sync-manager'

// Import initial data
import { ROMEO_JULIET_PRODUCTION } from './production/romeo-juliet-info'
import { RJ_CUE_NOTES, RJ_WORK_NOTES, RJ_PRODUCTION_NOTES } from './notes'

/**
 * Initialize the collaborative session
 *
 * This function:
 * 1. Checks if data exists in GitHub
 * 2. If not, seeds initial Romeo & Juliet data
 * 3. Loads all data into Zustand stores
 */
export async function initializeCollaborativeSession(): Promise<void> {
  console.log('Collaborative: Initializing session...')

  const syncStore = useSyncStore.getState()

  try {
    // Check if data is already initialized in GitHub
    const isInitialized = await gitHubStorageAdapter.isInitialized()

    if (!isInitialized) {
      console.log('Collaborative: First-time setup - seeding initial data...')
      await seedInitialData()
    }

    // Load data from GitHub into stores
    await loadDataIntoStores()

    syncStore.setInitialized(true)
    console.log('Collaborative: Session initialized successfully')
  } catch (error) {
    console.error('Collaborative: Failed to initialize session:', error)
    throw error
  }
}

/**
 * Seed initial Romeo & Juliet data to GitHub
 */
async function seedInitialData(): Promise<void> {
  console.log('Collaborative: Seeding production info...')
  await gitHubStorageAdapter.production.set(ROMEO_JULIET_PRODUCTION)

  console.log('Collaborative: Seeding notes data...')
  const allNotes = [...RJ_CUE_NOTES, ...RJ_WORK_NOTES, ...RJ_PRODUCTION_NOTES]
  await gitHubStorageAdapter.notes.createMany(allNotes)

  console.log('Collaborative: Initial data seeded successfully')
}

/**
 * Load data from GitHub into Zustand stores
 */
async function loadDataIntoStores(): Promise<void> {
  // Load production info
  const productionData = await gitHubStorageAdapter.production.get()
  if (productionData) {
    useProductionStore.getState().updateProduction(productionData)
  }

  // Note: Script data (pages, scenes/songs) is currently initialized from
  // the Pirates of Penzance demo data in the script store. For collaborative
  // mode, we're focusing on notes which are the primary collaborative content.
  // Script structure updates could be added in a future version.

  // Load notes
  const cueNotes = await gitHubStorageAdapter.notes.getAll('cue')
  const workNotes = await gitHubStorageAdapter.notes.getAll('work')
  const productionNotes = await gitHubStorageAdapter.notes.getAll('production')

  const notesStore = useMockNotesStore.getState()
  notesStore.setNotes('cue', cueNotes)
  notesStore.setNotes('work', workNotes)
  notesStore.setNotes('production', productionNotes)

  // Load fixtures (if any)
  const fixtures = await gitHubStorageAdapter.fixtures.getAll()
  if (fixtures.length > 0) {
    console.log(`Collaborative: Loaded ${fixtures.length} fixtures`)
  }
}

/**
 * Reset collaborative session (for debugging/admin)
 */
export async function resetCollaborativeSession(): Promise<void> {
  console.log('Collaborative: Resetting session...')

  // Clear adapter cache
  await gitHubStorageAdapter.clear()

  // Reseed data
  await seedInitialData()

  // Reload into stores
  await loadDataIntoStores()

  console.log('Collaborative: Session reset complete')
}
