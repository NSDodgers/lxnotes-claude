'use client'

import { useEffect, useState } from 'react'
import { initializeDemoSession } from '@/lib/demo-data'
import ElectricianNotesPage from '@/app/(dashboard)/electrician-notes/page'
import { Loader2 } from 'lucide-react'

export default function DemoElectricianNotesPage() {
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
          <Loader2 className="h-8 w-8 text-modules-electrician animate-spin" />
          <p className="text-text-secondary">Loading Pirates of Penzance demo...</p>
        </div>
      </div>
    )
  }

  return <ElectricianNotesPage />
}
