import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafeStorage } from '@/lib/storage/safe-storage'
import type { EmailMessagePreset, PlaceholderDefinition, ModuleType } from '@/types'
import { generateSystemEmailPresets } from '@/lib/utils/generate-dynamic-presets'
import { useFilterSortPresetsStore } from './filter-sort-presets-store'
import { resolvePlaceholders, PlaceholderData } from '@/lib/utils/placeholders'

interface EmailMessagePresetsState {
  // Only stores user-created presets (system presets are computed dynamically)
  presets: EmailMessagePreset[]
  loading: boolean

  // CRUD operations for user presets
  addPreset: (preset: Omit<EmailMessagePreset, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePreset: (id: string, updates: Partial<EmailMessagePreset>) => void
  deletePreset: (id: string) => void
  getPreset: (id: string) => EmailMessagePreset | undefined

  // Returns all presets (system + user) for a module
  getPresetsByModule: (moduleType: ModuleType) => EmailMessagePreset[]

  // Placeholder management
  getAvailablePlaceholders: () => PlaceholderDefinition[]
  resolvePlaceholders: (text: string, data?: PlaceholderData) => string

  // Returns only dynamically generated system presets
  getSystemDefaults: () => EmailMessagePreset[]

  // Utilities
  setLoading: (loading: boolean) => void
}

// Available placeholders for email templates
const getAvailablePlaceholders = (): PlaceholderDefinition[] => [
  // Production placeholders
  { key: '{{PRODUCTION_TITLE}}', label: 'Production Title', description: 'Current production name', category: 'production' },
  { key: '{{MODULE_NAME}}', label: 'Module Name', description: 'Current module (e.g., Cue Notes, Work Notes)', category: 'production' },

  // User placeholders
  { key: '{{USER_FIRST_NAME}}', label: 'User First Name', description: 'Sender\'s first name', category: 'user' },
  { key: '{{USER_LAST_NAME}}', label: 'User Last Name', description: 'Sender\'s last name', category: 'user' },
  { key: '{{USER_FULL_NAME}}', label: 'User Full Name', description: 'Sender\'s full name', category: 'user' },

  // Date placeholders
  { key: '{{CURRENT_DATE}}', label: 'Current Date', description: 'Today\'s date in readable format', category: 'date' },
  { key: '{{CURRENT_TIME}}', label: 'Current Time', description: 'Current time', category: 'date' },

  // Notes placeholders
  { key: '{{NOTE_COUNT}}', label: 'Note Count', description: 'Number of notes matching filter criteria', category: 'notes' },
  { key: '{{TODO_COUNT}}', label: 'Todo Count', description: 'Number of outstanding todo notes', category: 'notes' },
  { key: '{{COMPLETE_COUNT}}', label: 'Complete Count', description: 'Number of completed notes', category: 'notes' },
  { key: '{{CANCELLED_COUNT}}', label: 'Cancelled Count', description: 'Number of cancelled notes', category: 'notes' },
  { key: '{{FILTER_DESCRIPTION}}', label: 'Filter Description', description: 'Human-readable description of active filters', category: 'notes' },
  { key: '{{SORT_DESCRIPTION}}', label: 'Sort Description', description: 'Description of sort method applied', category: 'notes' },
  { key: '{{DATE_RANGE}}', label: 'Date Range', description: 'Date range of included notes (if date filters applied)', category: 'notes' },
]

/**
 * Compute system email presets dynamically based on current filter presets.
 * Each filter preset gets a corresponding email preset.
 */
function computeSystemEmailPresets(moduleType: ModuleType): EmailMessagePreset[] {
  // Get the dynamically generated filter presets for this module
  const filterPresets = useFilterSortPresetsStore.getState().getSystemDefaults(moduleType)

  return generateSystemEmailPresets(moduleType, filterPresets)
}

// Check if we're in demo mode
const isDemoMode = () => {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
}

export const useEmailMessagePresetsStore = create<EmailMessagePresetsState>()(
  persist(
    (set, get) => ({
      // Only user-created presets are stored (system presets computed on demand)
      presets: [],
      loading: false,

      addPreset: (presetData) => {
        const timestamp = new Date()
        const newPreset: EmailMessagePreset = {
          ...presetData,
          id: `email-message-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        set(state => ({
          presets: [...state.presets, newPreset]
        }))
      },

      updatePreset: (id, updates) => {
        // Don't allow updating system presets
        if (id.startsWith('sys-')) return

        set(state => ({
          presets: state.presets.map(preset =>
            preset.id === id
              ? { ...preset, ...updates, updatedAt: new Date() }
              : preset
          )
        }))
      },

      deletePreset: (id) => {
        // Don't allow deleting system presets
        if (id.startsWith('sys-')) return

        set(state => ({
          presets: state.presets.filter(preset => preset.id !== id)
        }))
      },

      getPreset: (id) => {
        // Check user presets first
        const userPreset = get().presets.find(preset => preset.id === id)
        if (userPreset) return userPreset

        // Check system presets across all modules
        const modules: ModuleType[] = ['cue', 'work', 'production']
        for (const moduleType of modules) {
          const systemPresets = computeSystemEmailPresets(moduleType)
          const systemPreset = systemPresets.find(p => p.id === id)
          if (systemPreset) return systemPreset
        }

        return undefined
      },

      getPresetsByModule: (moduleType) => {
        // Compute system presets dynamically (respects visible types/priorities)
        const systemPresets = computeSystemEmailPresets(moduleType)

        // Get user presets for this module
        const userPresets = get().presets.filter(preset => preset.moduleType === moduleType)

        // Return system presets first, then user presets
        return [...systemPresets, ...userPresets]
      },

      getAvailablePlaceholders: () => {
        return getAvailablePlaceholders()
      },

      resolvePlaceholders: (text, data) => {
        return resolvePlaceholders(text, data || {
          productionTitle: 'Sample Production',
          userFullName: 'Dev User',
          userFirstName: 'Dev',
          userLastName: 'User'
        } as PlaceholderData)
      },

      getSystemDefaults: () => {
        // Return all system presets across all modules
        const modules: ModuleType[] = ['cue', 'work', 'production']
        return modules.flatMap(moduleType => computeSystemEmailPresets(moduleType))
      },

      setLoading: (loading) => {
        set({ loading })
      },
    }),
    {
      name: 'email-message-presets-storage',
      version: 3, // Bumped for dynamic presets migration
      storage: createJSONStorage(() =>
        createSafeStorage(
          'email-message-presets-storage',
          isDemoMode() ? 'session' : 'local'
        )
      ),
      skipHydration: true,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { presets?: EmailMessagePreset[] }

        if (version < 3) {
          // Migration: Remove system presets from stored data
          // They'll now be computed dynamically based on visible types
          if (state?.presets) {
            state.presets = state.presets.filter(p => !p.id.startsWith('sys-'))
          }
        }

        return state as EmailMessagePresetsState
      },
    }
  )
)
