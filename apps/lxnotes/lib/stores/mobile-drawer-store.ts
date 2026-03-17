import { create } from 'zustand'

interface MobileDrawerState {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

export const useMobileDrawerStore = create<MobileDrawerState>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
