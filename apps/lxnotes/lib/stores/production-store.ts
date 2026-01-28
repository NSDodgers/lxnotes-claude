import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafeStorage } from '@/lib/storage/safe-storage'
import { usePathname } from 'next/navigation'

export const DEFAULT_PRODUCTION_LOGO = '/images/production-placeholder.svg'

interface ProductionState {
  name: string
  abbreviation: string
  logo: string
  updateProduction: (updates: Partial<Pick<ProductionState, 'name' | 'abbreviation' | 'logo'>>) => void
  clearLogo: () => void
}

// Check if we're in demo mode
export const isDemoMode = () => {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
}

// Regular production store - persists to localStorage
// Used for user's actual production settings
export const useProductionStore = create<ProductionState>()(
  persist(
    (set) => ({
      name: '',
      abbreviation: '',
      logo: DEFAULT_PRODUCTION_LOGO,
      updateProduction: (updates) => set((state) => {
        // If name is changing, reset logo to default (unless logo is explicitly provided)
        // This ensures each production starts with a clean slate without the previous logo
        if (updates.name && updates.name !== state.name && !updates.logo) {
          return { ...state, ...updates, logo: DEFAULT_PRODUCTION_LOGO }
        }
        return { ...state, ...updates }
      }),
      clearLogo: () => set((state) => ({ ...state, logo: DEFAULT_PRODUCTION_LOGO })),
    }),
    {
      name: 'production-settings',
      storage: createJSONStorage(() =>
        createSafeStorage('production-settings', 'local')
      ),
    }
  )
)

// Demo production store - persists to sessionStorage
// Isolated store for demo mode to prevent contaminating regular production settings
export const useDemoProductionStore = create<ProductionState>()(
  persist(
    (set) => ({
      name: 'The Pirates Of Penzance',
      abbreviation: 'TPOP',
      logo: DEFAULT_PRODUCTION_LOGO,
      updateProduction: (updates) => set((state) => {
        if (updates.name && updates.name !== state.name && !updates.logo) {
          return { ...state, ...updates, logo: DEFAULT_PRODUCTION_LOGO }
        }
        return { ...state, ...updates }
      }),
      clearLogo: () => set((state) => ({ ...state, logo: DEFAULT_PRODUCTION_LOGO })),
    }),
    {
      name: 'demo-production-settings',
      storage: createJSONStorage(() =>
        createSafeStorage('demo-production-settings', 'session')
      ),
    }
  )
)

/**
 * Unified hook that returns the appropriate store based on current route.
 * Uses usePathname() for reactive route detection - re-renders on navigation.
 * Components should use this hook to automatically get correct production data.
 */
export function useCurrentProductionStore() {
  const pathname = usePathname()
  const demoStore = useDemoProductionStore()
  const regularStore = useProductionStore()

  // Derive demo mode from pathname (reactive)
  // Falls back to non-demo for SSR (pathname can be null during SSR)
  const isDemo = pathname?.startsWith('/demo') ?? false

  return isDemo ? demoStore : regularStore
}
