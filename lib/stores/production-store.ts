import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const DEFAULT_PRODUCTION_LOGO = '/images/pirates-of-penzance-logo.png'

interface ProductionState {
  name: string
  abbreviation: string
  logo: string
  updateProduction: (updates: Partial<Pick<ProductionState, 'name' | 'abbreviation' | 'logo'>>) => void
  clearLogo: () => void
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
    }
  )
)
