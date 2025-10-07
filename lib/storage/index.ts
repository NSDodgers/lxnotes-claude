/**
 * Storage Mode Detection and Adapter Selection
 *
 * Automatically selects the appropriate storage adapter based on:
 * 1. URL path (demo mode if /demo/*)
 * 2. Environment variable (dev mode if NEXT_PUBLIC_DEV_MODE=true)
 * 3. Authentication state (production mode if authenticated - future)
 */

import { SessionStorageAdapter } from './session-storage'
import { LocalStorageAdapter } from './local-storage'
import type { StorageAdapter, StorageMode } from './adapter'

// Export types
export type { StorageAdapter, StorageMode, ProductionData, ScriptPage, SceneSong } from './adapter'

// Export adapter classes
export { SessionStorageAdapter } from './session-storage'
export { LocalStorageAdapter } from './local-storage'

/**
 * Detect current storage mode
 */
export function detectStorageMode(): StorageMode {
  if (typeof window === 'undefined') {
    // Server-side: default to dev mode
    return 'dev'
  }

  // Priority 1: Check if we're in a demo route
  if (window.location.pathname.startsWith('/demo')) {
    return 'demo'
  }

  // Priority 2: Check dev mode environment variable
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    return 'dev'
  }

  // Priority 3: Future - check authentication state
  // if (isAuthenticated()) return 'production'

  // Default: development mode
  return 'dev'
}

/**
 * Check if currently in demo mode
 */
export function isDemoMode(): boolean {
  return detectStorageMode() === 'demo'
}

/**
 * Check if currently in dev mode
 */
export function isDevMode(): boolean {
  return detectStorageMode() === 'dev'
}

/**
 * Get the appropriate storage adapter for the current mode
 */
export function getStorageAdapter(): StorageAdapter {
  const mode = detectStorageMode()

  switch (mode) {
    case 'demo':
      return new SessionStorageAdapter()

    case 'dev':
      return new LocalStorageAdapter()

    case 'production':
      // Future: return new SupabaseStorageAdapter()
      // For now, fall back to localStorage in production
      return new LocalStorageAdapter()

    default:
      return new LocalStorageAdapter()
  }
}

/**
 * Singleton instance of the storage adapter
 * Use this for consistent access throughout the app
 */
let storageInstance: StorageAdapter | null = null

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = getStorageAdapter()
  }
  return storageInstance
}

/**
 * Reset the storage singleton (useful for testing or mode switches)
 */
export function resetStorageInstance(): void {
  storageInstance = null
}