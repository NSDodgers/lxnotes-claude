'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { getProduction, createSupabaseStorageAdapter, mapDbRowToFullProduction } from '@/lib/supabase/supabase-storage-adapter'
import { subscribeToProductionChanges } from '@/lib/supabase/realtime'
import { useScriptStore } from '@/lib/stores/script-store'
import { usePositionStore } from '@/lib/stores/position-store'
import { useAuthContext } from '@/components/auth/auth-provider'
import { FixturesProvider } from '@/lib/contexts/fixtures-context'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import type { FullProduction, EmailMessagePreset, FilterSortPreset, PrintPreset, CustomTypesConfig, CustomPrioritiesConfig } from '@/types'

export type { FullProduction as Production }

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, RotateCcw, Loader2 } from 'lucide-react'

interface ProductionContextType {
  production: FullProduction | null
  productionId: string
  isLoading: boolean
  error: Error | null
  isAdmin: boolean
  refetch: () => Promise<void>
  updateEmailPreset: (preset: EmailMessagePreset) => Promise<void>
  deleteEmailPreset: (presetId: string) => Promise<void>
  updateFilterSortPreset: (preset: FilterSortPreset) => Promise<void>
  deleteFilterSortPreset: (presetId: string) => Promise<void>
  updatePrintPreset: (preset: PrintPreset) => Promise<void>
  deletePrintPreset: (presetId: string) => Promise<void>
  updateCustomTypesConfig: (config: CustomTypesConfig) => Promise<void>
  updateCustomPrioritiesConfig: (config: CustomPrioritiesConfig) => Promise<void>
  updateProductionInfo: (info: { name?: string; abbreviation?: string; logo?: string }) => Promise<void>
}

const ProductionContext = createContext<ProductionContextType | null>(null)

export function useProduction() {
  const context = useContext(ProductionContext)
  if (!context) {
    throw new Error('useProduction must be used within a ProductionProvider')
  }
  return context
}

export function useProductionId() {
  const context = useContext(ProductionContext)
  if (!context) {
    throw new Error('useProductionId must be used within a ProductionProvider')
  }
  return context.productionId
}

/**
 * Safe version of useProduction that returns null when outside ProductionProvider
 * Use this in components that need to work in both production and demo/default modes
 */
export function useProductionOptional() {
  return useContext(ProductionContext)
}

interface ProductionProviderProps {
  productionId: string
  children: ReactNode
}

export function ProductionProvider({ productionId, children }: ProductionProviderProps) {
  const router = useRouter()
  const { isAuthenticated, isSuperAdmin, isLoading: isAuthLoading } = useAuthContext()
  const [production, setProduction] = useState<FullProduction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const previousProductionIdRef = useRef<string | null>(null)
  const resetScriptStore = useScriptStore((state) => state.reset)
  const setScriptData = useScriptStore((state) => state.setScriptData)
  const clearPositionOrder = usePositionStore((state) => state.clearOrder)

  const fetchProduction = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getProduction(productionId)

      if (data) {
        setProduction(data)

        // Check admin status for access control on deleted items
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Check if super admin
          await supabase
            .from('users')
            .select('email')
            .eq('id', user.id)
            .single()

          // Import SUPER_ADMIN_EMAIL constant dynamically or hardcode for client-side check if needed
          // For now, let's rely on database role check which is safer

          const { data: member } = await supabase
            .from('production_members')
            .select('role')
            .eq('production_id', productionId)
            .eq('user_id', user.id)
            .single()

          setIsAdmin(member?.role === 'admin' || isSuperAdmin)
        }
      } else {
        setError(new Error('Production not found'))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load production'))
    } finally {
      setIsLoading(false)
    }
  }, [productionId, isSuperAdmin])

  const restoreProduction = async () => {
    if (!production) return

    try {
      setIsRestoring(true)
      const response = await fetch(`/api/productions/${productionId}/restore`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to restore production')
      }

      toast.success('Production restored')
      // Refetch to clear deleted status
      await fetchProduction()
    } catch (err) {
      console.error('Failed to restore:', err)
      toast.error('Failed to restore production')
    } finally {
      setIsRestoring(false)
    }
  }

  const updateEmailPreset = useCallback(async (preset: EmailMessagePreset) => {
    try {
      const response = await fetch(`/api/productions/${productionId}/email-presets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      })

      if (!response.ok) {
        throw new Error('Failed to update email preset')
      }

      const { emailPresets } = await response.json()

      // Update local state
      setProduction(prev => prev ? { ...prev, emailPresets } : null)
    } catch (err) {
      console.error('Error updating email preset:', err)
      throw err
    }
  }, [productionId])

  const deleteEmailPreset = useCallback(async (presetId: string) => {
    try {
      const response = await fetch(`/api/productions/${productionId}/email-presets/${presetId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete email preset')
      }

      const { emailPresets } = await response.json()

      // Update local state
      setProduction(prev => prev ? { ...prev, emailPresets } : null)
    } catch (err) {
      console.error('Error deleting email preset:', err)
      throw err
    }
  }, [productionId])

  const updateFilterSortPreset = useCallback(async (preset: FilterSortPreset) => {
    try {
      const response = await fetch(`/api/productions/${productionId}/filter-sort-presets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      })

      if (!response.ok) {
        throw new Error('Failed to update filter/sort preset')
      }

      const { filterSortPresets } = await response.json()

      // Update local state
      setProduction(prev => prev ? { ...prev, filterSortPresets } : null)
    } catch (err) {
      console.error('Error updating filter/sort preset:', err)
      throw err
    }
  }, [productionId])

  const deleteFilterSortPreset = useCallback(async (presetId: string) => {
    try {
      const response = await fetch(`/api/productions/${productionId}/filter-sort-presets/${presetId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete filter/sort preset')
      }

      const { filterSortPresets } = await response.json()

      // Update local state
      setProduction(prev => prev ? { ...prev, filterSortPresets } : null)
    } catch (err) {
      console.error('Error deleting filter/sort preset:', err)
      throw err
    }
  }, [productionId])

  const updatePrintPreset = useCallback(async (preset: PrintPreset) => {
    try {
      const response = await fetch(`/api/productions/${productionId}/print-presets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      })

      if (!response.ok) {
        throw new Error('Failed to update print preset')
      }

      const { printPresets } = await response.json()

      // Update local state
      setProduction(prev => prev ? { ...prev, printPresets } : null)
    } catch (err) {
      console.error('Error updating print preset:', err)
      throw err
    }
  }, [productionId])

  const deletePrintPreset = useCallback(async (presetId: string) => {
    try {
      const response = await fetch(`/api/productions/${productionId}/print-presets/${presetId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete print preset')
      }

      const { printPresets } = await response.json()

      // Update local state
      setProduction(prev => prev ? { ...prev, printPresets } : null)
    } catch (err) {
      console.error('Error deleting print preset:', err)
      throw err
    }
  }, [productionId])

  const updateCustomTypesConfig = useCallback(async (config: CustomTypesConfig) => {
    try {
      const response = await fetch(`/api/productions/${productionId}/custom-types-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(`Failed to update custom types config: ${response.status} ${errorBody.error || ''}`)
      }

      const { customTypesConfig } = await response.json()

      // Update local state
      setProduction(prev => prev ? { ...prev, customTypesConfig } : null)
    } catch (err) {
      console.error('Error updating custom types config:', err)
      throw err
    }
  }, [productionId])

  const updateCustomPrioritiesConfig = useCallback(async (config: CustomPrioritiesConfig) => {
    try {
      const response = await fetch(`/api/productions/${productionId}/custom-priorities-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(`Failed to update custom priorities config: ${response.status} ${errorBody.error || ''}`)
      }

      const { customPrioritiesConfig } = await response.json()

      // Update local state
      setProduction(prev => prev ? { ...prev, customPrioritiesConfig } : null)
    } catch (err) {
      console.error('Error updating custom priorities config:', err)
      throw err
    }
  }, [productionId])

  const updateProductionInfo = useCallback(async (info: { name?: string; abbreviation?: string; logo?: string }) => {
    try {
      const response = await fetch(`/api/productions/${productionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      })

      if (!response.ok) {
        throw new Error('Failed to update production info')
      }

      const data = await response.json()

      // Update local state with response
      setProduction(prev => prev ? {
        ...prev,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.abbreviation !== undefined && { abbreviation: data.abbreviation }),
        ...(data.logo !== undefined ? { logo: data.logo } : info.logo === '' ? { logo: undefined } : {}),
      } : null)
    } catch (err) {
      console.error('Error updating production info:', err)
      throw err
    }
  }, [productionId])

  // Reset stores when switching to a different production
  // This ensures new/different productions don't inherit data from previous productions or demo mode
  // NOTE: We don't clear fixture data here because syncFixtures() already handles
  // per-production data replacement. Clearing here would cause a race condition where fixtures
  // are cleared AFTER ProductionProvider has already synced them from the database.
  useEffect(() => {
    // Reset on first mount or when production ID changes
    // ProductionProvider is only used for non-demo productions, so always reset
    // Demo mode has its own initialization that populates the stores
    if (previousProductionIdRef.current !== productionId) {
      resetScriptStore()
      clearPositionOrder(productionId)
    }
    previousProductionIdRef.current = productionId
  }, [productionId, resetScriptStore, clearPositionOrder])

  // Fetch script data from Supabase and sync to local store
  // This runs after resetScriptStore clears the store on production change
  useEffect(() => {
    // Skip if not authenticated (avoids 401 errors)
    if (!isAuthenticated) {
      return
    }

    const fetchScriptData = async () => {
      try {
        const adapter = createSupabaseStorageAdapter(productionId)
        const [pages, scenesSongs] = await Promise.all([
          adapter.script.getPages(),
          adapter.script.getScenesSongs(),
        ])

        const scenes = scenesSongs.filter(s => s.type === 'scene')
        const songs = scenesSongs.filter(s => s.type === 'song')
        setScriptData(pages, scenes, songs)
      } catch (error) {
        console.error('[ProductionProvider] Failed to fetch script data from Supabase:', error)
      }
    }

    fetchScriptData()
  }, [productionId, isAuthenticated, setScriptData])

  // Sync custom types and priorities config from production into Zustand stores
  useEffect(() => {
    if (!production) return

    if (production.customTypesConfig) {
      useCustomTypesStore.getState().loadFromProduction(production.customTypesConfig)
    }
    if (production.customPrioritiesConfig) {
      useCustomPrioritiesStore.getState().loadFromProduction(production.customPrioritiesConfig)
    }
  }, [production])

  // Auth guard: redirect unauthenticated or unauthorized users
  useEffect(() => {
    if (isAuthLoading || isLoading) return

    // Not signed in → redirect to home
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    // Signed in but no access (RLS returned null)
    if (!production && error) {
      toast.error('You do not have access to this production')
      router.push('/')
    }
  }, [isAuthLoading, isLoading, isAuthenticated, production, error, router])

  // Access Control Effect
  useEffect(() => {
    if (!isLoading && production?.deletedAt) {
      // If deleted and not admin, prompt/redirect
      if (!isAdmin) {
        toast.error('This production has been deleted')
        router.push('/')
      }
    }
  }, [isLoading, production, isAdmin, router])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    fetchProduction()
  }, [fetchProduction, isAuthenticated])

  // Subscribe to realtime updates (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const unsubscribe = subscribeToProductionChanges(productionId, {
      onProductionUpdate: (updatedProduction) => {
        setProduction(mapDbRowToFullProduction(updatedProduction as unknown as Record<string, unknown>))
      },
      onError: (err) => {
        console.error('Realtime subscription error:', err)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [productionId, isAuthenticated])

  // Don't render while auth is loading or user is unauthenticated
  if (isAuthLoading || (!isAuthenticated && !isLoading)) {
    return null
  }

  // Render "Deleted" state for admins who are allowed to stay and restore
  if (!isLoading && production?.deletedAt && isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
        <div className="max-w-md w-full bg-bg-secondary rounded-lg border border-border p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Production Deleted</h1>
            <p className="text-text-secondary">
              This production is currently in the trash. You can restore it to continue working, or it will be permanently deleted in 30 days.
            </p>
          </div>

          <button
            onClick={restoreProduction}
            disabled={isRestoring}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Restore Production
              </>
            )}
          </button>

          <div className="pt-4 border-t border-border">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // For non-admins who are deleted, we return null while redirection happens
  if (!isLoading && production?.deletedAt && !isAdmin) {
    return null
  }

  return (
    <ProductionContext.Provider
      value={{
        production,
        productionId,
        isLoading,
        error,
        isAdmin,
        refetch: fetchProduction,
        updateEmailPreset,
        deleteEmailPreset,
        updateFilterSortPreset,
        deleteFilterSortPreset,
        updatePrintPreset,
        deletePrintPreset,
        updateCustomTypesConfig,
        updateCustomPrioritiesConfig,
        updateProductionInfo,
      }}
    >
      <FixturesProvider productionId={productionId}>
        {children}
      </FixturesProvider>
    </ProductionContext.Provider>
  )
}
