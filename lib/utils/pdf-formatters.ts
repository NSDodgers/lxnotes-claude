/**
 * Shared formatting utilities for PDF generation and preview
 */

/**
 * Format cue number for display (ONLY shows actual cue numbers)
 * Examples:
 * - "cue-127" → "127"
 * - "page-78" → "-" (page references not shown in Cue # column)
 * - Other formats → "-"
 */
export function formatCueNumber(scriptPageId: string | undefined | null): string {
  if (!scriptPageId) return '-'

  if (scriptPageId.startsWith('cue-')) {
    // Remove "cue-" prefix: "cue-127" → "127"
    return scriptPageId.substring(4)
  }

  // Don't show page references or other formats in Cue # column
  return '-'
}

/**
 * Format script page ID for display (shows both cue numbers and page references)
 * Examples:
 * - "cue-127" → "127"
 * - "page-78" → "Pg. 78"
 * - Other formats → unchanged
 */
export function formatScriptPageId(scriptPageId: string | undefined | null): string {
  if (!scriptPageId) return '-'

  if (scriptPageId.startsWith('cue-')) {
    // Remove "cue-" prefix: "cue-127" → "127"
    return scriptPageId.substring(4)
  } else if (scriptPageId.startsWith('page-')) {
    // Format page references: "page-78" → "Pg. 78"
    return `Pg. ${scriptPageId.substring(5)}`
  }

  // Keep as-is for other formats
  return scriptPageId
}

/**
 * Format scene/song ID for display
 */
export function formatSceneSongId(sceneSongId: string | undefined | null): string {
  return sceneSongId || '-'
}

/**
 * Format channel numbers for display
 */
export function formatChannels(channelNumbers: string | undefined | null): string {
  return channelNumbers || '-'
}

/**
 * Format position unit for display
 */
export function formatPositionUnit(positionUnit: string | undefined | null): string {
  return positionUnit || '-'
}

/**
 * Format department for display (production notes)
 */
export function formatDepartment(type: string | undefined | null): string {
  return type || 'General'
}
