'use client'

/**
 * Fixtures Context Provider
 *
 * Manages fixtures data flow:
 * - Production Mode: Fetches from Supabase, subscribes to Realtime, syncs to FixtureStore
 * - Demo Mode: Relies purely on FixtureStore
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { FixtureInfo } from '@/types'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { createSupabaseStorageAdapter } from '@/lib/supabase/supabase-storage-adapter'
import { subscribeToFixtureChanges } from '@/lib/supabase/realtime'

const isDev = process.env.NODE_ENV === 'development'

/** Validate UUID format to prevent injection attacks */
const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

interface FixturesContextType {
    isLoading: boolean
    error: Error | null
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
    isSyncing: boolean
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
    productionId?: string
}

export function FixturesProvider({ children, productionId }: FixturesProviderProps) {
    const pathname = usePathname()
    const fixtureStore = useFixtureStore()

    // Track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true)

    // Determine mode
    const isDemoMode = pathname.startsWith('/demo')
    const isProductionMode = !!productionId || pathname.startsWith('/production/')

    // SECURITY: Validate UUID format to prevent injection attacks
    const extractedId = isProductionMode && !isDemoMode ? pathname.split('/')[2] : undefined
    const resolvedProductionId = productionId || (
        extractedId && isValidUUID(extractedId) ? extractedId : undefined
    )

    const [isLoading, setIsLoading] = useState(isProductionMode && !isDemoMode)
    const [isSyncing, setIsSyncing] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
    const [adapter, setAdapter] = useState<ReturnType<typeof createSupabaseStorageAdapter> | null>(null)

    // FIX: Move handleRealtimeUpdate outside useEffect to prevent stale closures
    // Use useCallback without fixtureStore dependency (Zustand stores are stable)
    const handleRealtimeUpdate = useCallback(async (storageAdapter: ReturnType<typeof createSupabaseStorageAdapter>, prodId: string) => {
        if (!isMountedRef.current) return

        setIsSyncing(true)
        try {
            // Re-fetch everything on change for simplicity/safety
            // OPTIMIZATION TODO: Handle granular updates to avoid full refetch
            const freshFixtures = await storageAdapter.fixtures.getAll()
            if (isMountedRef.current) {
                fixtureStore.syncFixtures(prodId, freshFixtures)
            }
        } catch (e) {
            if (isDev) console.error('[FixturesContext] Failed to sync fixture update', e)
        } finally {
            if (isMountedRef.current) {
                setIsSyncing(false)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Initialize Adapter & Load Initial Data
    useEffect(() => {
        isMountedRef.current = true

        if (resolvedProductionId && !isDemoMode) {
            const storageAdapter = createSupabaseStorageAdapter(resolvedProductionId)
            setAdapter(storageAdapter)

            const loadFixtures = async () => {
                try {
                    setIsLoading(true)
                    setError(null)

                    const fixtures = await storageAdapter.fixtures.getAll()

                    // Sync to store
                    if (isMountedRef.current) {
                        fixtureStore.syncFixtures(resolvedProductionId, fixtures)
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
            }

            loadFixtures()

            // Realtime Subscription
            setConnectionStatus('connecting')
            const unsubscribe = subscribeToFixtureChanges(resolvedProductionId, {
                onFixtureInsert: () => {
                    handleRealtimeUpdate(storageAdapter, resolvedProductionId)
                },
                onFixtureUpdate: () => {
                    handleRealtimeUpdate(storageAdapter, resolvedProductionId)
                },
                onFixtureDelete: () => {
                    handleRealtimeUpdate(storageAdapter, resolvedProductionId)
                },
                onError: (err) => {
                    if (isDev) console.error('[FixturesContext] Subscription error', err)
                    if (isMountedRef.current) {
                        setConnectionStatus('error')
                    }
                }
            })

            return () => {
                isMountedRef.current = false
                unsubscribe()
            }
        }

        return () => {
            isMountedRef.current = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedProductionId, isDemoMode])

    return (
        <FixturesContext.Provider value={{
            isLoading,
            error,
            connectionStatus,
            isSyncing
        }}>
            {children}
        </FixturesContext.Provider>
    )
}
