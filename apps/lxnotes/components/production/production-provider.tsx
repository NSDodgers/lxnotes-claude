'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { getProduction } from '@/lib/supabase/supabase-storage-adapter'
import { subscribeToProductionChanges } from '@/lib/supabase/realtime'
import { useScriptStore } from '@/lib/stores/script-store'
import { usePositionStore } from '@/lib/stores/position-store'
import type { EmailMessagePreset, FilterSortPreset, PageStylePreset, PrintPreset } from '@/types'

export interface Production {
  id: string
  name: string
  abbreviation: string
  logo?: string
  description?: string
  startDate?: Date
  endDate?: Date
  isDemo: boolean
  emailPresets: EmailMessagePreset[]
  filterSortPresets: FilterSortPreset[]
  pageStylePresets: PageStylePreset[]
  printPresets: PrintPreset[]
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, RotateCcw, Loader2 } from 'lucide-react'

export interface Production {
  id: string
  name: string
  abbreviation: string
  logo?: string
  description?: string
  startDate?: Date
  endDate?: Date
  isDemo: boolean
  emailPresets: EmailMessagePreset[]
  filterSortPresets: FilterSortPreset[]
  pageStylePresets: PageStylePreset[]
  printPresets: PrintPreset[]
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}

interface ProductionContextType {
  production: Production | null
  productionId: string
  isLoading: boolean
  error: Error | null
  isAdmin: boolean
  refetch: () => Promise<void>
  updateEmailPreset: (preset: EmailMessagePreset) => Promise<void>
  deleteEmailPreset: (presetId: string) => Promise<void>
  updateFilterSortPreset: (preset: FilterSortPreset) => Promise<void>
  deleteFilterSortPreset: (presetId: string) => Promise<void>
  updatePageStylePreset: (preset: PageStylePreset) => Promise<void>
  deletePageStylePreset: (presetId: string) => Promise<void>
  updatePrintPreset: (preset: PrintPreset) => Promise<void>
  deletePrintPreset: (presetId: string) => Promise<void>
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
  const [production, setProduction] = useState<Production | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const previousProductionIdRef = useRef<string | null>(null)
  const resetScriptStore = useScriptStore((state) => state.reset)
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
          const { data: userData } = await supabase
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

          // Determine if admin (either explicit role OR super admin email check if we had it client-side)
          // Currently relying on role 'admin'
          setIsAdmin(member?.role === 'admin')
        }
      } else {
        setError(new Error('Production not found'))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load production'))
    } finally {
      setIsLoading(false)
    }
  }, [productionId])

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

  const updatePageStylePreset = useCallback(async (preset: PageStylePreset) => {
    try {
      const response = await fetch(`/api/productions/${productionId}/page-style-presets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      })

      if (!response.ok) {
        throw new Error('Failed to update page style preset')
      }

      const { pageStylePresets } = await response.json()

      // Update local state
      setProduction(prev => prev ? { ...prev, pageStylePresets } : null)
    } catch (err) {
      console.error('Error updating page style preset:', err)
      throw err
    }
  }, [productionId])

  const deletePageStylePreset = useCallback(async (presetId: string) => {
    try {
      const response = await fetch(`/api/productions/${productionId}/page-style-presets/${presetId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete page style preset')
      }

      const { pageStylePresets } = await response.json()

      // Update local state
      setProduction(prev => prev ? { ...prev, pageStylePresets } : null)
    } catch (err) {
      console.error('Error deleting page style preset:', err)
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

  // Reset stores when switching to a different production
  // This ensures new/different productions don't inherit data from previous productions or demo mode
  // NOTE: We don't clear fixture data here because FixturesProvider.syncFixtures() already handles
  // per-production data replacement. Clearing here would cause a race condition where fixtures
  // are cleared AFTER FixturesProvider has already synced them from Supabase.
  useEffect(() => {
    // Reset on first mount or when production ID changes
    // ProductionProvider is only used for non-demo productions, so always reset
    // Demo mode has its own initialization that populates the stores
    if (previousProductionIdRef.current !== productionId) {
      resetScriptStore()
      // Note: clearFixtureData() removed - FixturesProvider handles per-production sync
      clearPositionOrder(productionId)
    }
    previousProductionIdRef.current = productionId
  }, [productionId, resetScriptStore, clearPositionOrder])

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
    fetchProduction()

    // Subscribe to realtime updates
    const unsubscribe = subscribeToProductionChanges(productionId, {
      onProductionUpdate: (updatedProduction) => {
        setProduction({
          id: updatedProduction.id,
          name: updatedProduction.name,
          abbreviation: updatedProduction.abbreviation,
          logo: updatedProduction.logo ?? undefined,
          description: updatedProduction.description ?? undefined,
          startDate: updatedProduction.start_date ? new Date(updatedProduction.start_date) : undefined,
          endDate: updatedProduction.end_date ? new Date(updatedProduction.end_date) : undefined,
          isDemo: updatedProduction.is_demo ?? false,
          emailPresets: ((updatedProduction as Record<string, unknown>).email_presets as EmailMessagePreset[]) ?? [],
          filterSortPresets: ((updatedProduction as Record<string, unknown>).filter_sort_presets as FilterSortPreset[]) ?? [],
          pageStylePresets: ((updatedProduction as Record<string, unknown>).page_style_presets as PageStylePreset[]) ?? [],
          printPresets: ((updatedProduction as Record<string, unknown>).print_presets as PrintPreset[]) ?? [],
          createdAt: new Date(updatedProduction.created_at!),
          updatedAt: new Date(updatedProduction.updated_at!),
          deletedAt: updatedProduction.deleted_at ? new Date(updatedProduction.deleted_at) : undefined,
          deletedBy: updatedProduction.deleted_by ?? undefined,
        })
      },
      onError: (err) => {
        console.error('Realtime subscription error:', err)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [productionId, fetchProduction])

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
        updatePageStylePreset,
        deletePageStylePreset,
        updatePrintPreset,
        deletePrintPreset,
      }}
    >
      {children}
    </ProductionContext.Provider>
  )
}
