import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafeStorage } from '@/lib/storage/safe-storage'
import type { EmailMessagePreset, PlaceholderDefinition, ModuleType } from '@/types'

import { resolvePlaceholders, PlaceholderData } from '@/lib/utils/placeholders'

interface EmailMessagePresetsState {
  presets: EmailMessagePreset[]
  loading: boolean

  // CRUD operations
  addPreset: (preset: Omit<EmailMessagePreset, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePreset: (id: string, updates: Partial<EmailMessagePreset>) => void
  deletePreset: (id: string) => void
  getPreset: (id: string) => EmailMessagePreset | undefined

  // Module-specific operations
  getPresetsByModule: (moduleType: ModuleType) => EmailMessagePreset[]

  // Placeholder management
  getAvailablePlaceholders: () => PlaceholderDefinition[]
  resolvePlaceholders: (text: string, data?: PlaceholderData) => string

  // System defaults
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

// Module display names for system default naming
const moduleDisplayNames: Record<ModuleType, string> = {
  cue: 'Cue Notes',
  work: 'Work Notes',
  production: 'Production Notes',
  actor: 'Actor Notes',
}

// System default email message presets (module-specific)
const getSystemDefaults = (): EmailMessagePreset[] => {
  const baseDate = new Date()
  const productionId = 'prod-1' // TODO: Replace with actual production ID

  const modules: ModuleType[] = ['cue', 'work', 'production']
  const presets: EmailMessagePreset[] = []

  modules.forEach((moduleType, moduleIndex) => {
    const moduleName = moduleDisplayNames[moduleType]

    // Daily Report preset for each module
    presets.push({
      id: `sys-email-daily-${moduleType}`,
      productionId,
      type: 'email_message',
      moduleType,
      name: `Daily Report - ${moduleName}`,
      config: {
        recipients: '',
        subject: `{{PRODUCTION_TITLE}} - ${moduleName} Daily Report for {{CURRENT_DATE}}`,
        message: `Hello team,

Here's the ${moduleName.toLowerCase()} daily report for {{PRODUCTION_TITLE}} as of {{CURRENT_DATE}}.

Summary:
- Outstanding items: {{TODO_COUNT}}
- Completed today: {{COMPLETE_COUNT}}
- Total notes: {{NOTE_COUNT}}

{{FILTER_DESCRIPTION}}

Best regards,
{{USER_FULL_NAME}}`,
        filterAndSortPresetId: null,
        pageStylePresetId: null,
        includeNotesInBody: true,
        attachPdf: true,
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: baseDate,
      updatedAt: baseDate,
    })

    // Tech Rehearsal preset for each module
    presets.push({
      id: `sys-email-tech-${moduleType}`,
      productionId,
      type: 'email_message',
      moduleType,
      name: `Tech Rehearsal - ${moduleName}`,
      config: {
        recipients: '',
        subject: `{{PRODUCTION_TITLE}} - ${moduleName} Tech Rehearsal {{CURRENT_DATE}}`,
        message: `Team,

${moduleName} tech rehearsal notes for {{PRODUCTION_TITLE}} from {{CURRENT_DATE}}.

Priority items requiring attention: {{TODO_COUNT}}

Notes are attached as PDF.

Thanks,
{{USER_FULL_NAME}}`,
        filterAndSortPresetId: null,
        pageStylePresetId: null,
        includeNotesInBody: false,
        attachPdf: true,
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: baseDate,
      updatedAt: baseDate,
    })
  })

  return presets
}

// Simple placeholder resolution is now handled by shared utility

// Check if we're in demo mode
const isDemoMode = () => {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/demo')
}

export const useEmailMessagePresetsStore = create<EmailMessagePresetsState>()(
  persist(
    (set, get) => ({
      presets: getSystemDefaults(),
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
        set(state => ({
          presets: state.presets.map(preset =>
            preset.id === id
              ? { ...preset, ...updates, updatedAt: new Date() }
              : preset
          )
        }))
      },

      deletePreset: (id) => {
        set(state => ({
          presets: state.presets.filter(preset => preset.id !== id)
        }))
      },

      getPreset: (id) => {
        return get().presets.find(preset => preset.id === id)
      },

      getPresetsByModule: (moduleType) => {
        return get().presets.filter(preset => preset.moduleType === moduleType)
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
        return getSystemDefaults()
      },

      setLoading: (loading) => {
        set({ loading })
      },
    }),
    {
      name: 'email-message-presets-storage',
      version: 2, // Bumped for module-specific presets migration
      storage: createJSONStorage(() =>
        createSafeStorage(
          'email-message-presets-storage',
          isDemoMode() ? 'session' : 'local'
        )
      ),
      skipHydration: true,
      migrate: (persistedState: unknown, version: number) => {
        // Type for v1 presets that may have moduleType: 'all'
        type V1Preset = Omit<EmailMessagePreset, 'moduleType'> & { moduleType: ModuleType | 'all' }
        const state = persistedState as { presets: V1Preset[] }

        if (version < 2) {
          // Migration from version 1: Convert moduleType: 'all' to module-specific
          // Keep user presets (convert 'all' to 'cue' as default)
          // Replace system defaults with new module-specific versions
          const userPresets = state.presets
            .filter(p => !p.isDefault)
            .map(p => ({
              ...p,
              // If moduleType is 'all', convert to 'cue' as a sensible default
              moduleType: (p.moduleType === 'all' ? 'cue' : p.moduleType) as ModuleType
            }))

          // Get fresh module-specific system defaults
          const systemDefaults = getSystemDefaults()

          return {
            ...state,
            presets: [...systemDefaults, ...userPresets]
          }
        }

        return state
      },
    }
  )
)
