/**
 * Demo Work Notes Page
 *
 * Initializes demo session and renders the work notes interface in demo mode
 */
'use client'

import { useEffect } from 'react'
import { initializeDemoSession } from '@/lib/demo-data'
import WorkNotesPage from '@/app/work-notes/page'

export default function DemoWorkNotesPage() {
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

  // Render the actual work notes page
  // The storage adapter will automatically use sessionStorage because of the /demo URL
  return <WorkNotesPage />
}