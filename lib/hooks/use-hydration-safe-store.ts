import { useEffect, useState } from 'react'

/**
 * Hook to prevent hydration mismatches with Zustand stores
 * Returns null on server/initial render, actual store data after hydration
 */
export function useHydrationSafeStore<T>(storeHook: () => T): T | null {
  const [isHydrated, setIsHydrated] = useState(false)
  const store = storeHook()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated ? store : null
}