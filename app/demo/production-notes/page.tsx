/**
 * Demo Production Notes Page
 *
 * Initializes demo session and renders the production notes interface in demo mode
 */
'use client'

import { useEffect } from 'react'
import { initializeDemoSession } from '@/lib/demo-data'
import ProductionNotesPage from '@/app/production-notes/page'

export default function DemoProductionNotesPage() {
  useEffect(() => {
    // Initialize demo data once when demo is entered
    const initialize = async () => {
      try {
        await initializeDemoSession()
      } catch (error) {
        console.error('Failed to initialize demo:', error)
      }
    }

    initialize()
  }, [])

  // Render the actual production notes page
  // The storage adapter will automatically use sessionStorage because of the /demo URL
  return <ProductionNotesPage />
}