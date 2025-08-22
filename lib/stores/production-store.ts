import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProductionState {
  name: string
  abbreviation: string
  logo: string
  updateProduction: (updates: Partial<Pick<ProductionState, 'name' | 'abbreviation' | 'logo'>>) => void
}

export const useProductionStore = create<ProductionState>()(
  persist(
    (set) => ({
      name: 'Joy!',
      abbreviation: 'Joy', 
      logo: '🎭',
      updateProduction: (updates) => set((state) => ({ ...state, ...updates })),
    }),
    {
      name: 'production-settings',
    }
  )
)