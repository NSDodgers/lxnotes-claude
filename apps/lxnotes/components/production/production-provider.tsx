'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { getProduction } from '@/lib/supabase/supabase-storage-adapter'
import { subscribeToProductionChanges } from '@/lib/supabase/realtime'
import type { EmailMessagePreset } from '@/types'

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
  createdAt: Date
  updatedAt: Date
}

interface ProductionContextType {
  production: Production | null
  productionId: string
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updateEmailPreset: (preset: EmailMessagePreset) => Promise<void>
  deleteEmailPreset: (presetId: string) => Promise<void>
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
  const [production, setProduction] = useState<Production | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProduction = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getProduction(productionId)
      if (data) {
        setProduction(data)
      } else {
        setError(new Error('Production not found'))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load production'))
    } finally {
      setIsLoading(false)
    }
  }, [productionId])

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
          createdAt: new Date(updatedProduction.created_at!),
          updatedAt: new Date(updatedProduction.updated_at!),
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

  return (
    <ProductionContext.Provider
      value={{
        production,
        productionId,
        isLoading,
        error,
        refetch: fetchProduction,
        updateEmailPreset,
        deleteEmailPreset,
      }}
    >
      {children}
    </ProductionContext.Provider>
  )
}
