'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useEffect } from 'react'
import { DemoDataService } from '@/lib/services/demo-data-service'

interface DemoState {
  // Demo session info
  sessionId: string | null
  isDemo: boolean
  
  // Demo data
  demoData: any | null
  
  // Actions
  initializeDemo: () => void
  exitDemo: () => void
  updateDemoData: (data: any) => void
  getDemoStats: () => {
    lightingNotes: number
    scriptPages: number
    equipmentItems: number
    totalNotes: number
    workItems: number
    productionNotes: number
  }
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      isDemo: false,
      demoData: null,

      initializeDemo: () => {
        // Initialize fresh demo data
        DemoDataService.initializeDemoData()
        const sessionId = DemoDataService.getCurrentDemoSession()
        const demoData = DemoDataService.getDemoData()

        set({
          sessionId,
          isDemo: true,
          demoData,
        })

        // Note: URL handling is now managed by Next.js router navigation
        // No need to manipulate URL here to avoid conflicts
      },

      exitDemo: () => {
        // Clear demo data and session
        DemoDataService.clearDemoData()
        
        set({
          sessionId: null,
          isDemo: false,
          demoData: null,
        })

        // Remove demo flag from URL
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.delete('demo')
          window.history.pushState({}, '', url.toString())
        }
      },

      updateDemoData: (data) => {
        // Update both store and localStorage
        DemoDataService.updateDemoData(data)
        set({ demoData: data })
      },

      getDemoStats: () => {
        return DemoDataService.getDemoStats()
      },
    }),
    {
      name: 'lxnotes-demo-store',
      // Only persist demo state, not the actual data (that's in DemoDataService)
      partialize: (state) => ({
        sessionId: state.sessionId,
        isDemo: state.isDemo,
      }),
    }
  )
)

// Helper hook to check if we're in demo mode
export const useIsDemo = () => {
  const isDemo = useDemoStore((state) => state.isDemo)
  const [isClient, setIsClient] = useState(false)
  
  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Only check URL params after hydration to avoid SSR mismatch
  if (isClient && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    return isDemo || urlParams.has('demo')
  }
  
  return isDemo
}

// Helper to initialize demo on page load if demo param is present
export const initializeDemoFromUrl = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('demo')) {
      const store = useDemoStore.getState()
      if (!store.isDemo) {
        store.initializeDemo()
      }
    }
  }
}