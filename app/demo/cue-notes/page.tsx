/**
 * Demo Cue Notes Page
 *
 * Initializes demo session and renders the cue notes interface in demo mode
 */
'use client'

import { useEffect } from 'react'
import { initializeDemoSession } from '@/lib/demo-data'
import CueNotesPage from '@/app/cue-notes/page'

export default function DemoCueNotesPage() {
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

  // Render the actual cue notes page
  // The storage adapter will automatically use sessionStorage because of the /demo URL
  return <CueNotesPage />
}