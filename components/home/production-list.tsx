'use client'

import { useEffect, useState } from 'react'
import { getAllProductions } from '@/lib/supabase/supabase-storage-adapter'
import { subscribeToProductionsList } from '@/lib/supabase/realtime'
import { ProductionCard } from './production-card'
import { Loader2 } from 'lucide-react'

interface Production {
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

export function ProductionList() {
  const [productions, setProductions] = useState<Production[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProductions = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getAllProductions()
        setProductions(data)
      } catch (err) {
        console.error('Failed to fetch productions:', err)
        setError('Failed to load productions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductions()

    // Subscribe to realtime updates
    const unsubscribe = subscribeToProductionsList({
      onInsert: (newProduction) => {
        if (!newProduction.is_demo) {
          setProductions(prev => [{
            id: newProduction.id,
            name: newProduction.name,
            abbreviation: newProduction.abbreviation,
            logo: newProduction.logo ?? undefined,
            description: newProduction.description ?? undefined,
            startDate: newProduction.start_date ? new Date(newProduction.start_date) : undefined,
            endDate: newProduction.end_date ? new Date(newProduction.end_date) : undefined,
            isDemo: newProduction.is_demo ?? false,
            createdAt: new Date(newProduction.created_at!),
            updatedAt: new Date(newProduction.updated_at!),
          }, ...prev])
        }
      },
      onUpdate: (updatedProduction) => {
        setProductions(prev =>
          prev.map(p =>
            p.id === updatedProduction.id
              ? {
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
                }
              : p
          )
        )
      },
      onDelete: (oldProduction) => {
        setProductions(prev => prev.filter(p => p.id !== oldProduction.id))
      },
      onError: (err) => {
        console.error('Realtime subscription error:', err)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-text-muted animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-emerald-400 hover:text-emerald-300"
        >
          Try again
        </button>
      </div>
    )
  }

  if (productions.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        <p>No productions yet</p>
        <p className="text-sm mt-1">Create your first production to get started</p>
      </div>
    )
  }

  return (
    <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-bg-tertiary scrollbar-track-transparent">
      {productions.map((production) => (
        <ProductionCard key={production.id} production={production} />
      ))}
    </div>
  )
}
