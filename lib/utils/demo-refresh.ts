'use client'

import { DemoDataService } from '@/lib/services/demo-data-service'
import { useDemoStore } from '@/lib/stores/demo-store'

/**
 * Utility to force refresh demo data - useful during development
 * when demo data files have been updated.
 */
export const refreshDemoData = () => {
  // Clear all demo-related data
  DemoDataService.clearDemoData()
  
  // Clear the Zustand store
  const { exitDemo, initializeDemo } = useDemoStore.getState()
  exitDemo()
  
  // Reinitialize with fresh data
  setTimeout(() => {
    initializeDemo()
    console.log('✅ Demo data refreshed successfully')
    
    // Force page reload to ensure all components pick up new data
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }, 100)
}

/**
 * Add this function to browser console for easy demo refresh during development:
 * window.refreshDemo = () => refreshDemoData()
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).refreshDemo = refreshDemoData
}