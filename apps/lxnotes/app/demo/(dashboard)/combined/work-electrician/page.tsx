/**
 * Demo Combined Work + Electrician Notes Page
 *
 * Initializes demo session and renders the combined view in demo mode
 */
'use client'

import { useEffect, useState } from 'react'
import { initializeDemoSession } from '@/lib/demo-data'
import CombinedWorkElectricianPage from '@/components/combined/work-electrician-page'
import { Loader2 } from 'lucide-react'

export default function DemoCombinedWorkElectricianPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDemoSession()
      } catch (error) {
        console.error('Failed to initialize demo:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
          <p className="text-text-secondary">Loading demo...</p>
        </div>
      </div>
    )
  }

  return <CombinedWorkElectricianPage />
}
