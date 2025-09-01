'use client'

import { romeoJulietDemoData } from '@/lib/data/romeo-juliet-demo'

export class DemoDataService {
  private static readonly DEMO_SESSION_KEY = 'lxnotes-demo-session'
  private static readonly DEMO_DATA_KEY = 'lxnotes-demo-data'

  // Generate a unique session ID for this demo instance
  static generateDemoSession(): string {
    const sessionId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.DEMO_SESSION_KEY, sessionId)
    }
    return sessionId
  }

  // Get current demo session ID
  static getCurrentDemoSession(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.DEMO_SESSION_KEY)
  }

  // Initialize fresh demo data for a new session
  static initializeDemoData(): void {
    if (typeof window === 'undefined') return

    // Generate new session
    this.generateDemoSession()

    // Store fresh demo data
    localStorage.setItem(this.DEMO_DATA_KEY, JSON.stringify(romeoJulietDemoData))

    // Clear any existing app state that might interfere
    this.clearExistingAppState()
  }

  // Get demo data (returns fresh copy each time)
  static getDemoData() {
    if (typeof window === 'undefined') {
      return romeoJulietDemoData
    }

    const stored = localStorage.getItem(this.DEMO_DATA_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.warn('Failed to parse demo data, returning fresh copy')
        return romeoJulietDemoData
      }
    }

    return romeoJulietDemoData
  }

  // Update demo data (for any changes made during demo)
  static updateDemoData(data: typeof romeoJulietDemoData): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.DEMO_DATA_KEY, JSON.stringify(data))
  }

  // Check if we're currently in a demo session
  static isDemoSession(): boolean {
    if (typeof window === 'undefined') return false
    return this.getCurrentDemoSession() !== null
  }

  // Clear demo session and data
  static clearDemoData(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.DEMO_SESSION_KEY)
    localStorage.removeItem(this.DEMO_DATA_KEY)
  }

  // Clear any existing app state that might conflict with demo
  private static clearExistingAppState(): void {
    if (typeof window === 'undefined') return

    // Clear any existing Zustand stores that might have persisted data
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith('lxnotes-') ||
        key.includes('store') ||
        key.includes('notes') ||
        key.includes('production')
      )) {
        // Don't remove demo-specific keys
        if (!key.includes('demo')) {
          keysToRemove.push(key)
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  // Get demo statistics for homepage display
  static getDemoStats() {
    const data = this.getDemoData()
    return {
      lightingNotes: data.cueNotes.length,
      scriptPages: data.scriptPages.length,
      equipmentItems: data.lightwright.length,
      totalNotes: data.cueNotes.length + data.workNotes.length + data.productionNotes.length,
      workItems: data.workNotes.length,
      productionNotes: data.productionNotes.length,
    }
  }

  // Check if demo data needs refresh (for development)
  static needsRefresh(): boolean {
    const stored = localStorage.getItem(this.DEMO_DATA_KEY)
    if (!stored) return true

    try {
      const data = JSON.parse(stored)
      return !data.production || data.production.id !== 'demo-production'
    } catch {
      return true
    }
  }

  // Force refresh demo data (useful for development)
  static refreshDemoData(): void {
    this.clearDemoData()
    this.initializeDemoData()
  }
}