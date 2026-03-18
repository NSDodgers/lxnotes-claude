import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DesignerModeState {
  isDesignerMode: boolean
  designerSidebarOpen: boolean
  toggleDesignerMode: () => void
  setDesignerSidebarOpen: (open: boolean) => void
  toggleDesignerSidebar: () => void
}

export const useDesignerModeStore = create<DesignerModeState>()(
  persist(
    (set) => ({
      isDesignerMode: false,
      designerSidebarOpen: false,
      toggleDesignerMode: () => set((state) => ({ isDesignerMode: !state.isDesignerMode })),
      setDesignerSidebarOpen: (open) => set({ designerSidebarOpen: open }),
      toggleDesignerSidebar: () => set((state) => ({ designerSidebarOpen: !state.designerSidebarOpen })),
    }),
    {
      name: 'designer-mode-settings',
      partialize: (state) => ({ isDesignerMode: state.isDesignerMode }),
    }
  )
)
