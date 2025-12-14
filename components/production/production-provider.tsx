'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getProduction } from '@/lib/supabase/supabase-storage-adapter'
import { subscribeToProduction } from '@/lib/supabase/realtime'

export interface Production {
  id: string
  name: string
  abbreviation: string
  logo?: string
  description?: string
  startDate?: Date
  endDate?: Date
  isDemo: boolean
  createdAt: Date
  updatedAt: Date
}

interface ProductionContextType {
  production: Production | null
  productionId: string
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
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

interface ProductionProviderProps {
  productionId: string
  children: ReactNode
}

export function ProductionProvider({ productionId, children }: ProductionProviderProps) {
  const [production, setProduction] = useState<Production | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProduction = async () => {
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
  }

  useEffect(() => {
    fetchProduction()

    // Subscribe to realtime updates
    const unsubscribe = subscribeToProduction(productionId, {
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
  }, [productionId])

  return (
    <ProductionContext.Provider
      value={{
        production,
        productionId,
        isLoading,
        error,
        refetch: fetchProduction,
      }}
    >
      {children}
    </ProductionContext.Provider>
  )
}
