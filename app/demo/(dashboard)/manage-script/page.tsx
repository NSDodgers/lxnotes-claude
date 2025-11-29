/**
 * Demo Manage Script Page
 *
 * Initializes demo session and renders the script management interface in demo mode
 */
'use client'

import { useEffect } from 'react'
import { initializeDemoSession } from '@/lib/demo-data'
import ManageScriptPage from '@/app/(dashboard)/manage-script/page'

export default function DemoManageScriptPage() {
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

  // Render the actual manage script page
  // The storage adapter will automatically use sessionStorage because of the /demo URL
  return <ManageScriptPage />
}
