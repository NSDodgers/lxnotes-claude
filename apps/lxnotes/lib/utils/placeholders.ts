/**
 * Shared utility for resolving placeholders
 */
export interface PlaceholderData {
    productionTitle: string
    userFullName: string
    userFirstName?: string
    userLastName?: string
    noteStats?: {
        total: number
        todo: number
        complete: number
        cancelled: number
    }
    noteCount?: number
    todoCount?: number
    completeCount?: number
    cancelledCount?: number
    filterDescription?: string
    sortDescription?: string
    dateRange?: string
}

/**
 * Resolve placeholders in text
 */
export function resolvePlaceholders(text: string, data: PlaceholderData): string {
    if (!text) return ''

    // Handle stats shorthands if full object is not provided or vice versa
    const total = data.noteStats?.total ?? data.noteCount ?? 0
    const todo = data.noteStats?.todo ?? data.todoCount ?? 0
    const complete = data.noteStats?.complete ?? data.completeCount ?? 0
    const cancelled = data.noteStats?.cancelled ?? data.cancelledCount ?? 0

    return text
        .replace(/\{\{PRODUCTION_TITLE\}\}/g, data.productionTitle || '')
        .replace(/\{\{USER_FULL_NAME\}\}/g, data.userFullName || '')
        .replace(/\{\{USER_FIRST_NAME\}\}/g, data.userFirstName || data.userFullName?.split(' ')[0] || '')
        .replace(/\{\{USER_LAST_NAME\}\}/g, data.userLastName || data.userFullName?.split(' ').slice(1).join(' ') || '')
        .replace(/\{\{CURRENT_DATE\}\}/g, new Date().toLocaleDateString())
        .replace(/\{\{CURRENT_TIME\}\}/g, new Date().toLocaleTimeString())
        .replace(/\{\{NOTE_COUNT\}\}/g, String(total))
        .replace(/\{\{TODO_COUNT\}\}/g, String(todo))
        .replace(/\{\{COMPLETE_COUNT\}\}/g, String(complete))
        .replace(/\{\{CANCELLED_COUNT\}\}/g, String(cancelled))
        .replace(/\{\{FILTER_DESCRIPTION\}\}/g, data.filterDescription || '')
        .replace(/\{\{SORT_DESCRIPTION\}\}/g, data.sortDescription || '')
        .replace(/\{\{DATE_RANGE\}\}/g, data.dateRange || '')
}
