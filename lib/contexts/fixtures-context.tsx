'use client'

/**
 * Fixtures Context Provider
 * 
 * Manages fixtures data flow:
 * - Production Mode: Fetches from Supabase, subscribes to Realtime, syncs to FixtureStore
 * - Demo Mode: Relies purely on FixtureStore
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { FixtureInfo } from '@/types'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { createSupabaseStorageAdapter } from '@/lib/supabase/supabase-storage-adapter'
import { subscribeToFixtureChanges } from '@/lib/supabase/realtime'

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

    // Detemine mode
    const isDemoMode = pathname.startsWith('/demo')
    const isProductionMode = !!productionId || pathname.startsWith('/production/')

    const resolvedProductionId = productionId || (
        isProductionMode && !isDemoMode
            ? pathname.split('/')[2]
            : undefined
    )

    const [isLoading, setIsLoading] = useState(isProductionMode && !isDemoMode)
    const [isSyncing, setIsSyncing] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
    const [adapter, setAdapter] = useState<ReturnType<typeof createSupabaseStorageAdapter> | null>(null)

    // Initialize Adapter & Load Initial Data
    useEffect(() => {
        if (resolvedProductionId && !isDemoMode) {
            const storageAdapter = createSupabaseStorageAdapter(resolvedProductionId)
            setAdapter(storageAdapter)

            const loadFixtures = async () => {
                try {
                    setIsLoading(true)
                    setError(null)

                    const fixtures = await storageAdapter.fixtures.getAll()

                    // Sync to store
                    // map DbFixture to FixtureInfo if necessary, or ensure types match
                    // The storage adapter returns FixtureInfo[], so we are good
                    fixtureStore.syncFixtures(resolvedProductionId, fixtures)

                } catch (err) {
                    console.error('[FixturesContext] Failed to load fixtures:', err)
                    setError(err instanceof Error ? err : new Error('Failed to load fixtures'))
                } finally {
                    setIsLoading(false)
                }
            }

            loadFixtures()

            // Realtime Subscription
            setConnectionStatus('connecting')
            const unsubscribe = subscribeToFixtureChanges(resolvedProductionId, {
                onStatusChange: (status) => {
                    if (status === 'SUBSCRIBED') setConnectionStatus('connected')
                    else if (status === 'CLOSED') setConnectionStatus('disconnected')
                    else if (status === 'CHANNEL_ERROR') setConnectionStatus('error')
                },
                onFixtureInsert: (newFixture) => {
                    handleRealtimeUpdate()
                },
                onFixtureUpdate: (updatedFixture) => {
                    handleRealtimeUpdate()
                },
                onFixtureDelete: (deletedFixture) => {
                    handleRealtimeUpdate()
                },
                onError: (err) => {
                    console.error('[FixturesContext] Subscription error', err)
                    setConnectionStatus('error')
                }
            })

            // Helper to just re-fetch everything on change for simplicity/safety first
            // Since fixtures can be large sets and "syncFixtures" replaces the whole list for the production,
            // it might be better to do differential updates later. 
            // For now, to guarantee consistency with aggregations involving positions/linking,
            // re-fetching the list ensures we have the full correct state.
            // OPTIMIZATION TODO: Handle granular updates to avoid full refetch
            const handleRealtimeUpdate = async () => {
                setIsSyncing(true)
                try {
                    // We use the ADAPTER to get the fresh list from DB
                    const freshFixtures = await storageAdapter.fixtures.getAll()
                    fixtureStore.syncFixtures(resolvedProductionId, freshFixtures)
                } catch (e) {
                    console.error('Failed to sync fixture update', e)
                } finally {
                    setIsSyncing(false)
                }
            }

            return () => {
                unsubscribe()
            }
        }
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
