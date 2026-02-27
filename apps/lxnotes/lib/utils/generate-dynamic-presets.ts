import type { FilterSortPreset, PrintPreset, EmailMessagePreset, ModuleType, CustomType, CustomPriority } from '@/types'

/**
 * Sentinel value indicating "all types" - when present in typeFilters,
 * the filter should include all notes regardless of type
 */
export const ALL_TYPES_SENTINEL = '__all__'

/**
 * Get the default sort field for a module
 */
function getModuleSortField(moduleType: ModuleType): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  switch (moduleType) {
    case 'cue':
      return { sortBy: 'cue_number', sortOrder: 'asc' }
    case 'work':
    case 'production':
    default:
      return { sortBy: 'priority', sortOrder: 'desc' }
  }
}

/**
 * Get the sort field label for display names
 */
function getSortLabel(moduleType: ModuleType): string {
  switch (moduleType) {
    case 'cue':
      return 'Cue #'
    case 'work':
    case 'production':
    default:
      return 'Priority'
  }
}

/**
 * Generate deterministic preset ID for system presets
 */
function generateFilterPresetId(moduleType: ModuleType, suffix: string): string {
  return `sys-filter-${moduleType}-${suffix}`
}

function generatePrintPresetId(moduleType: ModuleType, suffix: string): string {
  return `sys-print-${moduleType}-${suffix}`
}

function generateEmailPresetId(moduleType: ModuleType, suffix: string): string {
  return `sys-email-${moduleType}-${suffix}`
}

/**
 * Generates system filter/sort presets dynamically based on visible types and priorities.
 *
 * Standard presets (4):
 * - All To-Do (by [Sort])
 * - All To-Do Grouped (by [Sort]) - groupByType: true
 * - All Complete (by Date)
 * - All Cancelled (by Date)
 *
 * Type-specific presets (one per visible type):
 * - [TypeLabel] To-Do (by [Sort])
 */
export function generateSystemFilterPresets(
  moduleType: ModuleType,
  types: CustomType[],
  priorities: CustomPriority[]
): FilterSortPreset[] {
  const baseDate = new Date()
  const productionId = 'prod-1'
  const { sortBy, sortOrder } = getModuleSortField(moduleType)
  const sortLabel = getSortLabel(moduleType)

  // Get all priority values for filter config
  const allPriorityValues = priorities.map(p => p.value)

  const presets: FilterSortPreset[] = []

  // 1. All To-Do (by Sort)
  presets.push({
    id: generateFilterPresetId(moduleType, 'all-to-do'),
    productionId,
    type: 'filter_sort',
    moduleType,
    name: `All To-Do (by ${sortLabel})`,
    config: {
      statusFilter: 'todo',
      typeFilters: [ALL_TYPES_SENTINEL],
      priorityFilters: allPriorityValues,
      sortBy,
      sortOrder,
      groupByType: false,
    },
    isDefault: true,
    createdBy: 'system',
    createdAt: baseDate,
    updatedAt: baseDate,
  })

  // 2. All To-Do Grouped (by Sort)
  presets.push({
    id: generateFilterPresetId(moduleType, 'all-to-do-grouped'),
    productionId,
    type: 'filter_sort',
    moduleType,
    name: `All To-Do Grouped (by ${sortLabel})`,
    config: {
      statusFilter: 'todo',
      typeFilters: [ALL_TYPES_SENTINEL],
      priorityFilters: allPriorityValues,
      sortBy,
      sortOrder,
      groupByType: true,
    },
    isDefault: true,
    createdBy: 'system',
    createdAt: baseDate,
    updatedAt: baseDate,
  })

  // 3. All Complete (by Date)
  presets.push({
    id: generateFilterPresetId(moduleType, 'all-complete'),
    productionId,
    type: 'filter_sort',
    moduleType,
    name: 'All Complete (by Date)',
    config: {
      statusFilter: 'complete',
      typeFilters: [ALL_TYPES_SENTINEL],
      priorityFilters: allPriorityValues,
      sortBy: 'completed_at',
      sortOrder: 'desc',
      groupByType: false,
    },
    isDefault: true,
    createdBy: 'system',
    createdAt: baseDate,
    updatedAt: baseDate,
  })

  // 4. All Cancelled (by Date)
  presets.push({
    id: generateFilterPresetId(moduleType, 'all-cancelled'),
    productionId,
    type: 'filter_sort',
    moduleType,
    name: 'All Cancelled (by Date)',
    config: {
      statusFilter: 'cancelled',
      typeFilters: [ALL_TYPES_SENTINEL],
      priorityFilters: allPriorityValues,
      sortBy: 'cancelled_at',
      sortOrder: 'desc',
      groupByType: false,
    },
    isDefault: true,
    createdBy: 'system',
    createdAt: baseDate,
    updatedAt: baseDate,
  })

  // 5. Type-specific presets (one per visible type)
  for (const type of types) {
    presets.push({
      id: generateFilterPresetId(moduleType, `type-${type.value}`),
      productionId,
      type: 'filter_sort',
      moduleType,
      name: `${type.label} To-Do (by ${sortLabel})`,
      config: {
        statusFilter: 'todo',
        typeFilters: [type.value],
        priorityFilters: allPriorityValues,
        sortBy,
        sortOrder,
        groupByType: false,
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: baseDate,
      updatedAt: baseDate,
    })
  }

  return presets
}

/**
 * Generates system print presets that correspond to filter presets.
 * Each filter preset gets a matching print preset with Letter Landscape style.
 */
export function generateSystemPrintPresets(
  moduleType: ModuleType,
  filterPresets: FilterSortPreset[]
): PrintPreset[] {
  const baseDate = new Date()
  const productionId = 'prod-1'

  return filterPresets.map((filterPreset) => {
    // Extract suffix from filter preset ID for deterministic print preset ID
    const idSuffix = filterPreset.id.replace(`sys-filter-${moduleType}-`, '')

    return {
      id: generatePrintPresetId(moduleType, idSuffix),
      productionId,
      type: 'print' as const,
      moduleType,
      name: filterPreset.name,
      config: {
        filterSortPresetId: filterPreset.id,
        pageStylePresetId: 'sys-page-style-2', // Letter Landscape with checkboxes
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: baseDate,
      updatedAt: baseDate,
    }
  })
}

/**
 * Generates system email presets that correspond to filter presets.
 * Each filter preset gets a matching email preset with standard subject/body templates.
 *
 * Email presets per module:
 * - 4 "All" presets (To-Do, To-Do Grouped, Complete, Cancelled)
 * - 1 preset per visible type (e.g., "SM Notes", "Director Notes")
 */
export function generateSystemEmailPresets(
  moduleType: ModuleType,
  filterPresets: FilterSortPreset[]
): EmailMessagePreset[] {
  const baseDate = new Date()
  const productionId = 'prod-1'

  return filterPresets.map((filterPreset) => {
    // Extract suffix from filter preset ID for deterministic email preset ID
    const idSuffix = filterPreset.id.replace(`sys-filter-${moduleType}-`, '')

    // Create a cleaner preset name for email (remove the "(by X)" suffix)
    const emailName = filterPreset.name.replace(/\s*\(by [^)]+\)$/, '')

    return {
      id: generateEmailPresetId(moduleType, idSuffix),
      productionId,
      type: 'email_message' as const,
      moduleType,
      name: emailName,
      config: {
        recipients: '', // User fills in once, saved in preset
        subject: `{{PRODUCTION_TITLE}} - {{MODULE_NAME}} - ${emailName} - {{CURRENT_DATE}} {{CURRENT_TIME}}`,
        message: `Please find the attached notes report.

{{USER_FULL_NAME}}`,
        filterAndSortPresetId: filterPreset.id,
        pageStylePresetId: 'sys-page-style-2', // Letter Landscape with checkboxes
        includeNotesInBody: false,
        attachPdf: true,
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: baseDate,
      updatedAt: baseDate,
    }
  })
}
