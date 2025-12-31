import type { ScriptPage, SceneSong } from '@/types'

export interface ScriptExportRow {
  pageNumber: string
  pageFirstCue: string
  itemType: 'PAGE_HEADER' | 'scene' | 'song'
  name: string
  firstCueNumber: string
  continuesFrom: string
  originalItemId: string
}

/**
 * Escapes a CSV field value by wrapping in quotes if needed
 * and escaping any quotes within the value
 */
function escapeCSVField(value: string): string {
  if (!value) return ''

  // If the value contains comma, quote, or newline, wrap in quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escape quotes by doubling them
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

/**
 * Converts script data to CSV format
 * Creates a flat structure where each row is either a page header or a scene/song
 * Continuation chains are represented with "Yes" in the Continues From column
 */
export function convertScriptToCSV(
  pages: ScriptPage[],
  getPageScenes: (pageId: string) => SceneSong[],
  getPageSongs: (pageId: string) => SceneSong[]
): string {
  const rows: ScriptExportRow[] = []

  // Process each page in order
  for (const page of pages) {
    // Add page header row
    rows.push({
      pageNumber: page.pageNumber,
      pageFirstCue: page.firstCueNumber || '',
      itemType: 'PAGE_HEADER',
      name: '',
      firstCueNumber: '',
      continuesFrom: '',
      originalItemId: '',
    })

    // Get all scenes and songs for this page
    const scenes = getPageScenes(page.id)
    const songs = getPageSongs(page.id)

    // Combine and sort by cue number
    const allItems = [...scenes, ...songs].sort((a, b) => {
      const cueA = a.firstCueNumber ? parseFloat(a.firstCueNumber.match(/^(\d+(?:\.\d+)?)/)?.[1] || '0') : 0
      const cueB = b.firstCueNumber ? parseFloat(b.firstCueNumber.match(/^(\d+(?:\.\d+)?)/)?.[1] || '0') : 0
      return cueA - cueB
    })

    // Add scene/song rows
    for (const item of allItems) {
      rows.push({
        pageNumber: page.pageNumber,
        pageFirstCue: page.firstCueNumber || '',
        itemType: item.type,
        name: item.name,
        firstCueNumber: item.firstCueNumber || '',
        continuesFrom: item.continuesFromId ? 'Yes' : '',
        originalItemId: item.continuesFromId || '',
      })
    }
  }

  // Build CSV string
  const headers = [
    'Page Number',
    'Page First Cue',
    'Item Type',
    'Name',
    'First Cue Number',
    'Continues From',
    'Original Item ID',
  ]

  let csv = headers.join(',') + '\n'

  for (const row of rows) {
    const fields = [
      escapeCSVField(row.pageNumber),
      escapeCSVField(row.pageFirstCue),
      escapeCSVField(row.itemType),
      escapeCSVField(row.name),
      escapeCSVField(row.firstCueNumber),
      escapeCSVField(row.continuesFrom),
      escapeCSVField(row.originalItemId),
    ]
    csv += fields.join(',') + '\n'
  }

  return csv
}
