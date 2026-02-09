'use client'

/**
 * Fixtures Context Provider
 *
 * Manages fixtures data flow:
 * - Production Mode: Fetches from Supabase on load, syncs to FixtureStore
 * - Demo Mode: Relies purely on FixtureStore
 *
 * Exposes refreshFixtures() for on-demand re-fetch (e.g. sidebar open).
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { createSupabaseStorageAdapter } from '@/lib/supabase/supabase-storage-adapter'
import { useAuthContext } from '@/components/auth/auth-provider'

const isDev = process.env.NODE_ENV === 'development'

/** Validate UUID format to prevent injection attacks */
const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

interface FixturesContextType {
  isLoading: boolean
  error: Error | null
  refreshFixtures: () => Promise<void>
}

const FixturesContext = createContext<FixturesContextType | null>(null)

export function useFixtures() {
  const context = useContext(FixturesContext)
  if (!context) {
    throw new Error('useFixtures must be used within a FixturesProvider')
  }
  return context
}

interface FixturesProviderProps {
  children: ReactNode
  productionId: string
}

export function FixturesProvider({ children, productionId }: FixturesProviderProps) {
  const { isAuthenticated } = useAuthContext()
  const syncFixtures = useFixtureStore((state) => state.syncFixtures)

  const isMountedRef = useRef(true)

  // SECURITY: Validate UUID format
  const isValidId = isValidUUID(productionId)

  const [isLoading, setIsLoading] = useState(isValidId)
  const [error, setError] = useState<Error | null>(null)

  const refreshFixtures = useCallback(async () => {
    if (!isValidId || !isAuthenticated) return

    try {
      setIsLoading(true)
      setError(null)

      const adapter = createSupabaseStorageAdapter(productionId)
      const fixtures = await adapter.fixtures.getAll()

      if (isMountedRef.current) {
        syncFixtures(productionId, fixtures)
      }
    } catch (err) {
      if (isDev) console.error('[FixturesContext] Failed to load fixtures:', err)
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to load fixtures'))
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productionId, isAuthenticated, isValidId])

  // Fetch fixtures on mount / production change
  useEffect(() => {
    isMountedRef.current = true

    if (isValidId && isAuthenticated) {
      refreshFixtures()
    }

    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productionId, isAuthenticated, isValidId])

  return (
    <FixturesContext.Provider value={{ isLoading, error, refreshFixtures }}>
      {children}
    </FixturesContext.Provider>
  )
}
