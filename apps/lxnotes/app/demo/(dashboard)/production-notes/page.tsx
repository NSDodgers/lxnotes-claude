/**
 * Demo Production Notes Page
 *
 * Initializes demo session and renders the production notes interface in demo mode
 */
'use client'

import { useEffect, useState } from 'react'
import { initializeDemoSession } from '@/lib/demo-data'
import ProductionNotesPage from '@/app/(dashboard)/production-notes/page'
import { Loader2 } from 'lucide-react'

export default function DemoProductionNotesPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize demo data once when demo is entered
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

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-modules-production animate-spin" />
          <p className="text-text-secondary">Loading Pirates of Penzance demo...</p>
        </div>
      </div>
    )
  }

  // Render the actual production notes page once data is loaded
  // The storage adapter will automatically use sessionStorage because of the /demo URL
  return <ProductionNotesPage />
}