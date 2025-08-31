import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EmailMessagePreset, PlaceholderDefinition } from '@/types'

interface EmailMessagePresetsState {
  presets: EmailMessagePreset[]
  loading: boolean
  
  // CRUD operations
  addPreset: (preset: Omit<EmailMessagePreset, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePreset: (id: string, updates: Partial<EmailMessagePreset>) => void
  deletePreset: (id: string) => void
  getPreset: (id: string) => EmailMessagePreset | undefined
  
  // Placeholder management
  getAvailablePlaceholders: () => PlaceholderDefinition[]
  resolvePlaceholders: (text: string, data?: Record<string, any>) => string
  
  // System defaults
  getSystemDefaults: () => EmailMessagePreset[]
  
  // Utilities
  setLoading: (loading: boolean) => void
}

// Available placeholders for email templates
const getAvailablePlaceholders = (): PlaceholderDefinition[] => [
  // Production placeholders
  { key: '{{PRODUCTION_TITLE}}', label: 'Production Title', description: 'Current production name', category: 'production' },
  
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

// System default email message presets
const getSystemDefaults = (): EmailMessagePreset[] => {
  const baseDate = new Date()
  const productionId = 'prod-1' // TODO: Replace with actual production ID
  
  return [
    {
      id: 'sys-email-1',
      productionId,
      type: 'email_message',
      moduleType: 'all',
      name: 'Daily Report',
      config: {
        recipients: '',
        subject: '{{PRODUCTION_TITLE}} - Daily Report for {{CURRENT_DATE}}',
        message: `Hello team,

Here's the daily report for {{PRODUCTION_TITLE}} as of {{CURRENT_DATE}}.

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
    },
    {
      id: 'sys-email-2',
      productionId,
      type: 'email_message',
      moduleType: 'all',
      name: 'Tech Rehearsal Notes',
      config: {
        recipients: '',
        subject: '{{PRODUCTION_TITLE}} - Tech Rehearsal Notes {{CURRENT_DATE}}',
        message: `Team,

Tech rehearsal notes for {{PRODUCTION_TITLE}} from {{CURRENT_DATE}}.

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
    },
  ]
}

// Simple placeholder resolution (in a real app, this would use actual data)
const resolvePlaceholders = (text: string, data?: Record<string, any>): string => {
  const placeholders: Record<string, string> = {
    '{{PRODUCTION_TITLE}}': data?.productionTitle || 'Sample Production',
    '{{USER_FIRST_NAME}}': data?.userFirstName || 'Dev',
    '{{USER_LAST_NAME}}': data?.userLastName || 'User',
    '{{USER_FULL_NAME}}': data?.userFullName || 'Dev User',
    '{{CURRENT_DATE}}': new Date().toLocaleDateString(),
    '{{CURRENT_TIME}}': new Date().toLocaleTimeString(),
    '{{NOTE_COUNT}}': data?.noteCount?.toString() || '0',
    '{{TODO_COUNT}}': data?.todoCount?.toString() || '0',
    '{{COMPLETE_COUNT}}': data?.completeCount?.toString() || '0',
    '{{CANCELLED_COUNT}}': data?.cancelledCount?.toString() || '0',
    '{{FILTER_DESCRIPTION}}': data?.filterDescription || 'All notes',
    '{{SORT_DESCRIPTION}}': data?.sortDescription || 'Default sort',
    '{{DATE_RANGE}}': data?.dateRange || 'All dates',
  }
  
  let resolved = text
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    resolved = resolved.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
  })
  
  return resolved
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
      
      getAvailablePlaceholders: () => {
        return getAvailablePlaceholders()
      },
      
      resolvePlaceholders: (text, data) => {
        return resolvePlaceholders(text, data)
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
      skipHydration: true,
    }
  )
)