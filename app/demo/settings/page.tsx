/**
 * Demo Settings Page
 *
 * Initializes demo session and renders the settings interface in demo mode
 */
'use client'

import { useEffect } from 'react'
import { initializeDemoSession } from '@/lib/demo-data'
import SettingsPage from '@/app/settings/page'

export default function DemoSettingsPage() {
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

  // Render the actual settings page
  // The storage adapter will automatically use sessionStorage because of the /demo URL
  return <SettingsPage />
}
