'use client'

import { useEffect, useState } from 'react'
import { subscribeToProductionsList } from '@/lib/supabase/realtime'
import { ProductionCard } from './production-card'

interface Production {
  id: string
  name: string
  abbreviation: string
  logo?: string
  description?: string
  startDate?: Date
  endDate?: Date
  isDemo?: boolean
  createdAt: Date
  updatedAt: Date
}

interface ProductionListProps {
  initialProductions?: Production[]
}

export function ProductionList({ initialProductions = [] }: ProductionListProps) {
  const [productions, setProductions] = useState<Production[]>(initialProductions)

  useEffect(() => {
    // Update state if initialProductions changes (e.g., after navigation)
    setProductions(initialProductions)
  }, [initialProductions])

  useEffect(() => {

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
