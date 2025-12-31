import { z } from 'zod'

// Base preset schema
export const basePresetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  productionId: z.string().min(1, 'Production ID is required'),
})

// Page Style Preset schema
export const pageStylePresetConfigSchema = z.object({
  paperSize: z.enum(['a4', 'letter', 'legal'], {
    message: 'Paper size is required',
  }),
  orientation: z.enum(['portrait', 'landscape'], {
    message: 'Orientation is required',
  }),
  includeCheckboxes: z.boolean({
    message: 'Include checkboxes setting is required',
  }),
})

export const pageStylePresetSchema = basePresetSchema.extend({
  type: z.literal('page_style'),
  moduleType: z.literal('all'),
  config: pageStylePresetConfigSchema,
})

export const createPageStylePresetSchema = pageStylePresetSchema.omit({
  productionId: true, // Will be added by the store
})

// Filter Sort Preset schema
export const filterSortPresetConfigSchema = z.object({
  statusFilter: z.enum(['todo', 'complete', 'cancelled']).nullable(),
  typeFilters: z.array(z.string()).default([]),
  priorityFilters: z.array(z.string()).default([]),
  sortBy: z.string().min(1, 'Sort field is required'),
  sortOrder: z.enum(['asc', 'desc'], {
    message: 'Sort order is required',
  }),
  groupByType: z.boolean().default(false),
})

export const filterSortPresetSchema = basePresetSchema.extend({
  type: z.literal('filter_sort'),
  moduleType: z.enum(['cue', 'work', 'production', 'actor'], {
    message: 'Module type is required',
  }),
  config: filterSortPresetConfigSchema,
})

export const createFilterSortPresetSchema = filterSortPresetSchema.omit({
  productionId: true,
})

// Email Message Preset schema
export const emailMessagePresetConfigSchema = z.object({
  recipients: z.string()
    .refine((val) => {
      if (!val.trim()) return true // Allow empty string
      const emails = val.split(',').map(email => email.trim())
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emails.every(email => emailRegex.test(email))
    }, 'Please enter valid email addresses separated by commas'),
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject must be less than 500 characters'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message must be less than 5000 characters'),
  filterAndSortPresetId: z.string().nullable(),
  pageStylePresetId: z.string().nullable(),
  includeNotesInBody: z.boolean().default(true),
  attachPdf: z.boolean().default(false),
})

export const emailMessagePresetSchema = basePresetSchema.extend({
  type: z.literal('email_message'),
  moduleType: z.literal('all'),
  config: emailMessagePresetConfigSchema,
})

export const createEmailMessagePresetSchema = emailMessagePresetSchema.omit({
  productionId: true,
})

// Union schema for any preset type
export const anyPresetSchema = z.discriminatedUnion('type', [
  pageStylePresetSchema,
  filterSortPresetSchema,
  emailMessagePresetSchema,
])

// Preset update schemas (for editing existing presets)
export const updatePageStylePresetSchema = pageStylePresetConfigSchema.partial()
export const updateFilterSortPresetSchema = filterSortPresetConfigSchema.partial()
export const updateEmailMessagePresetSchema = emailMessagePresetConfigSchema.partial()

// Module-specific sort field validation
const cueNotesSortFields = ['cue_number', 'priority', 'type', 'created_at', 'completed_at', 'cancelled_at'] as const
const workNotesSortFields = ['priority', 'type', 'channel', 'position', 'created_at', 'completed_at', 'cancelled_at'] as const
const productionNotesSortFields = ['priority', 'department', 'created_at', 'completed_at', 'cancelled_at'] as const
const actorNotesSortFields = ['priority', 'type', 'created_at', 'completed_at', 'cancelled_at'] as const // For Director Notes

const sortFieldsMap = {
  cue: cueNotesSortFields,
  work: workNotesSortFields,
  production: productionNotesSortFields,
  actor: actorNotesSortFields,
} as const satisfies Record<'cue' | 'work' | 'production' | 'actor', readonly [string, ...string[]]>

type ModuleSortFieldsMap = typeof sortFieldsMap

export const getSortFieldsForModule = <T extends keyof ModuleSortFieldsMap>(moduleType: T) =>
  sortFieldsMap[moduleType]

export const validateSortFieldForModule = (sortBy: string, moduleType: 'cue' | 'work' | 'production' | 'actor') => {
  const validFields = getSortFieldsForModule(moduleType)
  return validFields.includes(sortBy as any)
}

// Helper function to validate filter/sort preset config based on module
export const createModuleSpecificFilterSortSchema = (moduleType: 'cue' | 'work' | 'production' | 'actor') => {
  const validSortFields = getSortFieldsForModule(moduleType)

  return filterSortPresetConfigSchema.extend({
    sortBy: z.enum(validSortFields, {
      message: `Sort field must be one of: ${validSortFields.join(', ')}`,
    }),
  })
}

// Form validation schemas (for use with react-hook-form)
export const pageStyleFormSchema = z.object({
  name: basePresetSchema.shape.name,
  paperSize: pageStylePresetConfigSchema.shape.paperSize,
  orientation: pageStylePresetConfigSchema.shape.orientation,
  includeCheckboxes: pageStylePresetConfigSchema.shape.includeCheckboxes,
})

export const filterSortFormSchema = z.object({
  name: basePresetSchema.shape.name,
  moduleType: filterSortPresetSchema.shape.moduleType,
  statusFilter: filterSortPresetConfigSchema.shape.statusFilter,
  typeFilters: z.array(z.string()),
  priorityFilters: z.array(z.string()),
  sortBy: filterSortPresetConfigSchema.shape.sortBy,
  sortOrder: filterSortPresetConfigSchema.shape.sortOrder,
  groupByType: z.boolean(),
})

export const emailMessageFormSchema = z.object({
  name: basePresetSchema.shape.name,
  recipients: emailMessagePresetConfigSchema.shape.recipients,
  subject: emailMessagePresetConfigSchema.shape.subject,
  message: emailMessagePresetConfigSchema.shape.message,
  filterAndSortPresetId: emailMessagePresetConfigSchema.shape.filterAndSortPresetId,
  pageStylePresetId: emailMessagePresetConfigSchema.shape.pageStylePresetId,
  includeNotesInBody: z.boolean(),
  attachPdf: z.boolean(),
})

// Type exports for use in components
export type PageStyleFormData = z.infer<typeof pageStyleFormSchema>
export type FilterSortFormData = z.infer<typeof filterSortFormSchema>
export type EmailMessageFormData = z.infer<typeof emailMessageFormSchema>
export type CreatePageStylePresetData = z.infer<typeof createPageStylePresetSchema>
export type CreateFilterSortPresetData = z.infer<typeof createFilterSortPresetSchema>
export type CreateEmailMessagePresetData = z.infer<typeof createEmailMessagePresetSchema>
