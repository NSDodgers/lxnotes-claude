import { create } from 'zustand'

interface NoteCommentsState {
  counts: Record<string, number>
  setCounts: (counts: Record<string, number>) => void
  incrementCount: (noteId: string) => void
  decrementCount: (noteId: string) => void
  removeCount: (noteId: string) => void

  openNoteId: string | null
  setOpenNoteId: (noteId: string | null) => void
}

export const useNoteCommentsStore = create<NoteCommentsState>()((set) => ({
  counts: {},

  setCounts: (counts) => set({ counts }),

  incrementCount: (noteId) =>
    set(state => ({
      counts: { ...state.counts, [noteId]: (state.counts[noteId] || 0) + 1 },
    })),

  decrementCount: (noteId) =>
    set(state => ({
      counts: {
        ...state.counts,
        [noteId]: Math.max(0, (state.counts[noteId] || 0) - 1),
      },
    })),

  removeCount: (noteId) =>
    set(state => {
      const { [noteId]: _, ...rest } = state.counts
      return { counts: rest }
    }),

  openNoteId: null,

  setOpenNoteId: (noteId) => set({ openNoteId: noteId }),
}))
