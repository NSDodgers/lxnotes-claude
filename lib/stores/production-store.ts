import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafeStorage } from '@/lib/storage/safe-storage'

export const DEFAULT_PRODUCTION_LOGO = '/images/pirates-of-penzance-logo.png'

interface ProductionState {
  name: string
  abbreviation: string
  logo: string
  updateProduction: (updates: Partial<Pick<ProductionState, 'name' | 'abbreviation' | 'logo'>>) => void
  clearLogo: () => void
}

// Check if we're in demo mode
const isDemoMode = () => {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
}

export const useProductionStore = create<ProductionState>()(
  persist(
    (set) => ({
      name: 'The Pirates Of Penzance',
      abbreviation: 'TPOP',
      logo: DEFAULT_PRODUCTION_LOGO,
      updateProduction: (updates) => set((state) => ({ ...state, ...updates })),
      clearLogo: () => set((state) => ({ ...state, logo: DEFAULT_PRODUCTION_LOGO })),
    }),
    {
      name: 'production-settings',
      storage: createJSONStorage(() =>
        createSafeStorage(
          'production-settings',
          isDemoMode() ? 'session' : 'local'
        )
      ),
    }
  )
)
