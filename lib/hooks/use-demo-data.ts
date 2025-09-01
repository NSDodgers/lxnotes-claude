'use client'

import { useEffect, useState } from 'react'
import { useIsDemo, useDemoStore, initializeDemoFromUrl } from '@/lib/stores/demo-store'
import { DemoDataService } from '@/lib/services/demo-data-service'
import type { Note, ScriptPage, SceneSong, Production, LightwrightInfo } from '@/types'

export function useDemoData() {
  const isDemo = useIsDemo()
  const demoData = useDemoStore(state => state.demoData)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize demo from URL if needed
    initializeDemoFromUrl()
    setIsInitialized(true)
  }, [])

  const getDemoNotes = (moduleType: 'cue' | 'work' | 'production'): Note[] => {
    if (!isDemo || !demoData) return []
    
    switch (moduleType) {
      case 'cue':
        return demoData.cueNotes || []
      case 'work':
        return demoData.workNotes || []
      case 'production':
        return demoData.productionNotes || []
      default:
        return []
    }
  }

  const getDemoProduction = (): Production | null => {
    if (!isDemo || !demoData) return null
    return demoData.production || null
  }

  const getDemoScriptPages = (): ScriptPage[] => {
    if (!isDemo || !demoData) return []
    return demoData.scriptPages || []
  }

  const getDemoSceneSongs = (): SceneSong[] => {
    if (!isDemo || !demoData) return []
    return demoData.sceneSongs || []
  }

  const getDemoLightwright = (): LightwrightInfo[] => {
    if (!isDemo || !demoData) return []
    return demoData.lightwright || []
  }

  return {
    isDemo: isDemo && isInitialized,
    isInitialized,
    getDemoNotes,
    getDemoProduction,
    getDemoScriptPages,
    getDemoSceneSongs,
    getDemoLightwright,
    demoStats: DemoDataService.getDemoStats(),
  }
}