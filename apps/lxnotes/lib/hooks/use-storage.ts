/**
 * Storage Hook
 *
 * Provides access to the appropriate storage adapter based on current mode
 */

import { useEffect, useState } from 'react'
import { getStorageAdapter, type StorageAdapter } from '@/lib/storage'

export function useStorage(): StorageAdapter | null {
  const [storage, setStorage] = useState<StorageAdapter | null>(null)

  useEffect(() => {
    // Only initialize storage on client side
    setStorage(getStorageAdapter())
  }, [])

  return storage
}