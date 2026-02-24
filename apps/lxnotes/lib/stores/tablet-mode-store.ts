import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TabletModeState {
  isTabletMode: boolean
  tabletSidebarOpen: boolean
  toggleTabletMode: () => void
  setTabletSidebarOpen: (open: boolean) => void
  toggleTabletSidebar: () => void
}

export const useTabletModeStore = create<TabletModeState>()(
  persist(
    (set) => ({
      isTabletMode: false,
      tabletSidebarOpen: false,
      toggleTabletMode: () => set((state) => ({ isTabletMode: !state.isTabletMode })),
      setTabletSidebarOpen: (open) => set({ tabletSidebarOpen: open }),
      toggleTabletSidebar: () => set((state) => ({ tabletSidebarOpen: !state.tabletSidebarOpen })),
    }),
    {
      name: 'tablet-mode-settings',
      partialize: (state) => ({ isTabletMode: state.isTabletMode }),
    }
  )
)