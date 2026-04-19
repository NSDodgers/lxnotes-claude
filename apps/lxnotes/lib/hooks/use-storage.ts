/**
 * Storage Hook
 *
 * Provides access to the appropriate storage adapter based on current mode
 */

import { useSyncExternalStore } from 'react'
import { getStorageAdapter, type StorageAdapter } from '@/lib/storage'

// Cache the adapter across renders so useSyncExternalStore's snapshot is stable.
let cached: StorageAdapter | null = null

function getClientSnapshot(): StorageAdapter | null {
  if (cached) return cached
  if (typeof window === 'undefined') return null
  cached = getStorageAdapter()
  return cached
}

function getServerSnapshot(): StorageAdapter | null {
  return null
}

const EMPTY_SUBSCRIBE = () => () => {}

export function useStorage(): StorageAdapter | null {
  return useSyncExternalStore(EMPTY_SUBSCRIBE, getClientSnapshot, getServerSnapshot)
}
