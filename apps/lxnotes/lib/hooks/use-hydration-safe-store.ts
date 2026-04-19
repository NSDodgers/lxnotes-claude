import { useSyncExternalStore } from 'react'

const EMPTY_SUBSCRIBE = () => () => {}
const getServerSnapshot = () => false
const getClientSnapshot = () => true

/**
 * Hook to prevent hydration mismatches with Zustand stores
 * Returns null on server/initial render, actual store data after hydration
 */
export function useHydrationSafeStore<T>(storeHook: () => T): T | null {
  const store = storeHook()
  const isHydrated = useSyncExternalStore(EMPTY_SUBSCRIBE, getClientSnapshot, getServerSnapshot)
  return isHydrated ? store : null
}
