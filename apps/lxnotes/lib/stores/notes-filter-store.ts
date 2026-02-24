import { create } from 'zustand'
import type { NoteStatus } from '@/types'

interface NotesFilterState {
  filterStatus: NoteStatus
  searchTerm: string
  onAddNote: (() => void) | null
  filterTypes: string[]
  filterPriorities: string[]
  sortField: string | null
  sortDirection: 'asc' | 'desc'
  setFilterStatus: (status: NoteStatus) => void
  setSearchTerm: (term: string) => void
  setOnAddNote: (fn: (() => void) | null) => void
  setFilterTypes: (types: string[]) => void
  setFilterPriorities: (priorities: string[]) => void
  setSortField: (field: string | null) => void
  setSortDirection: (direction: 'asc' | 'desc') => void
  clearAllFilters: () => void
}

export const useNotesFilterStore = create<NotesFilterState>()((set) => ({
  filterStatus: 'todo',
  searchTerm: '',
  onAddNote: null,
  filterTypes: [],
  filterPriorities: [],
  sortField: null,
  sortDirection: 'asc',
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setOnAddNote: (fn) => set({ onAddNote: fn }),
  setFilterTypes: (types) => set({ filterTypes: types }),
  setFilterPriorities: (priorities) => set({ filterPriorities: priorities }),
  setSortField: (field) => set({ sortField: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  clearAllFilters: () => set({ filterTypes: [], filterPriorities: [], sortField: null, sortDirection: 'asc' }),
}))
