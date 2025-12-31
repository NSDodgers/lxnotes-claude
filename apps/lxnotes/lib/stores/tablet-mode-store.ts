import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TabletModeState {
  isTabletMode: boolean
  toggleTabletMode: () => void
}

export const useTabletModeStore = create<TabletModeState>()(
  persist(
    (set) => ({
      isTabletMode: false,
      toggleTabletMode: () => set((state) => ({ isTabletMode: !state.isTabletMode })),
    }),
    {
      name: 'tablet-mode-settings',
    }
  )
)