import Papa from 'papaparse'
import type { ScriptPage, SceneSong } from '@/types'

// Header mapping with synonyms
const SCRIPT_HEADER_SYNONYMS: Record<string, string[]> = {
  pageNumber: ['Page Number', 'Page', 'Page #', 'Page No', 'PDF Page'],
  pageFirstCue: ['Page First Cue', 'Page Cue', 'First Cue'],
  act: ['Act', 'Act Name', 'Act Number'],
  actContinues: ['Act continues', 'Act Continues', 'Act Continue'],
  scene: ['Scene', 'Scene Name', 'Scene Title'],
  sceneContinues: ['Scene continues', 'Scene Continues'],
  sceneFirstCue: ['Scene First Cue', 'Scene Cue'],
  song: ['Song', 'Song Name', 'Song Title', 'Musical Number'],
  songContinues: ['Song continues', 'Song Continues'],
  songFirstCue: ['Song First Cue', 'Song Cue'],
}

export interface ScriptCSVRow {
  [key: string]: string
}

export interface ScriptParseResult {
  pages: ScriptPage[]
  scenes: SceneSong[]
  songs: SceneSong[]
  warnings: Array<{ row: number; message: string }>
  stats: {
    totalRows: number
    pageCount: number
    sceneCount: number
    songCount: number
    continuationCount: number
    actsDetected: string[]
    skippedRows: number
  }
}

export class ScriptCSVParser {
  /**
   * Parse CSV file and return structured data
   */
  static async parseCSV(file: File): Promise<{
    headers: string[]
    rows: ScriptCSVRow[]
    headerMapping: Record<string, string>
  }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
            return
          }

          const headers = results.meta.fields || []
          const rows = results.data as ScriptCSVRow[]
          const headerMapping = ScriptCSVParser.detectHeaderMapping(headers)

          resolve({ headers, rows, headerMapping })
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`))
        }
      })
    })
  }

  /**
   * Parse pasted text (tab-separated from spreadsheet copy)
   */
  static parsePastedText(text: string): {
    headers: string[]
    rows: ScriptCSVRow[]
    headerMapping: Record<string, string>
  } {
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: '\t',
      transformHeader: (header: string) => header.trim(),
    })

    if (result.errors.length > 0) {
      throw new Error(`Parse error: ${result.errors[0].message}`)
    }

    const headers = result.meta.fields || []
    const rows = result.data as ScriptCSVRow[]
    const headerMapping = ScriptCSVParser.detectHeaderMapping(headers)

    return { headers, rows, headerMapping }
  }

  /**
   * Detect header mapping based on synonyms
   */
  static detectHeaderMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {}
    const claimedHeaders = new Set<string>()

    // Pass 1: Exact matches only (case-insensitive) — prevents partial matches from stealing headers
    for (const [fieldName, synonyms] of Object.entries(SCRIPT_HEADER_SYNONYMS)) {
      const exactMatch = headers.find(header =>
        !claimedHeaders.has(header) &&
        synonyms.some(synonym => header.toLowerCase() === synonym.toLowerCase())
      )

      if (exactMatch) {
        mapping[fieldName] = exactMatch
        claimedHeaders.add(exactMatch)
      }
    }

    // Pass 2: Partial matches for remaining unmapped fields, skipping already-claimed headers
    for (const [fieldName, synonyms] of Object.entries(SCRIPT_HEADER_SYNONYMS)) {
      if (mapping[fieldName]) continue

      const partialMatch = headers.find(header =>
        !claimedHeaders.has(header) &&
        synonyms.some(synonym =>
          header.toLowerCase().includes(synonym.toLowerCase()) ||
          synonym.toLowerCase().includes(header.toLowerCase())
        )
      )

      if (partialMatch) {
        mapping[fieldName] = partialMatch
        claimedHeaders.add(partialMatch)
      }
    }

    return mapping
  }

  /**
   * Get field value from a row using header mapping
   */
  private static getFieldValue(
    row: ScriptCSVRow,
    headerMapping: Record<string, string>,
    fieldName: string
  ): string {
    const headerName = headerMapping[fieldName]
    if (!headerName) return ''

    const value = row[headerName]
    return typeof value === 'string' ? value.trim() : ''
  }

  /**
   * Parse boolean values from CSV
   */
  private static parseBoolean(value: string): boolean {
    const lower = value.toLowerCase().trim()
    return lower === 'true' || lower === '1' || lower === 'yes'
  }

  /**
   * Core parsing algorithm: process rows into ScriptPages and SceneSongs
   */
  static parseRows(
    rows: ScriptCSVRow[],
    headerMapping: Record<string, string>,
    productionId: string
  ): ScriptParseResult {
    const warnings: Array<{ row: number; message: string }> = []
    const now = new Date()

    // Track pages by pageNumber
    const pageMap = new Map<string, ScriptPage>()
    // Track scenes and songs
    const allScenes: SceneSong[] = []
    const allSongs: SceneSong[] = []
    // Track current scene/song for continuation chains
    let lastScene: SceneSong | null = null
    let lastSong: SceneSong | null = null
    // Track order per page
    const pageOrderMap = new Map<string, number>()
    // Track detected acts
    const actsDetected = new Set<string>()
    let skippedRows = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 for 1-indexed + header row

      const pageNumber = ScriptCSVParser.getFieldValue(row, headerMapping, 'pageNumber')

      // Skip rows without page number
      if (!pageNumber) {
        warnings.push({ row: rowNum, message: 'Missing page number, row skipped' })
        skippedRows++
        continue
      }

      const pageFirstCue = ScriptCSVParser.getFieldValue(row, headerMapping, 'pageFirstCue')
      const act = ScriptCSVParser.getFieldValue(row, headerMapping, 'act')
      const sceneName = ScriptCSVParser.getFieldValue(row, headerMapping, 'scene')
      const sceneContinuesRaw = ScriptCSVParser.getFieldValue(row, headerMapping, 'sceneContinues')
      const sceneFirstCue = ScriptCSVParser.getFieldValue(row, headerMapping, 'sceneFirstCue')
      const songName = ScriptCSVParser.getFieldValue(row, headerMapping, 'song')
      const songContinuesRaw = ScriptCSVParser.getFieldValue(row, headerMapping, 'songContinues')
      const songFirstCue = ScriptCSVParser.getFieldValue(row, headerMapping, 'songFirstCue')

      const sceneContinues = sceneContinuesRaw ? ScriptCSVParser.parseBoolean(sceneContinuesRaw) : false
      const songContinues = songContinuesRaw ? ScriptCSVParser.parseBoolean(songContinuesRaw) : false

      // Track acts
      if (act) {
        actsDetected.add(act)
      }

      // Get or create page
      let page = pageMap.get(pageNumber)
      if (!page) {
        page = {
          id: crypto.randomUUID(),
          productionId,
          pageNumber,
          firstCueNumber: pageFirstCue || undefined,
          createdAt: now,
          updatedAt: now,
        }
        pageMap.set(pageNumber, page)
        pageOrderMap.set(page.id, 0)
      } else if (pageFirstCue && !page.firstCueNumber) {
        // First row for this page with a cue number wins
        page.firstCueNumber = pageFirstCue
      }

      // Get current order index for this page
      let orderIndex = pageOrderMap.get(page.id) || 0

      // Process song BEFORE scene — within a single row, the song is the new event;
      // the scene continuation is ongoing context. This ensures correct interleaving.
      if (songName && !songContinues) {
        // Case 1: New song (name present, not a continuation)
        const song: SceneSong = {
          id: crypto.randomUUID(),
          productionId,
          moduleType: 'cue',
          scriptPageId: page.id,
          name: songName,
          type: 'song',
          firstCueNumber: songFirstCue || undefined,
          orderIndex,
          createdAt: now,
          updatedAt: now,
        }
        allSongs.push(song)
        lastSong = song
        orderIndex++
        pageOrderMap.set(page.id, orderIndex)
      } else if (songContinues && lastSong) {
        // Case 2+3: Continuation — use songName if provided, else inherit lastSong.name
        const name = songName || lastSong.name
        const continuation: SceneSong = {
          id: crypto.randomUUID(),
          productionId,
          moduleType: 'cue',
          scriptPageId: page.id,
          name,
          type: 'song',
          orderIndex,
          continuesFromId: lastSong.id,
          createdAt: now,
          updatedAt: now,
        }

        if (songFirstCue) {
          warnings.push({
            row: rowNum,
            message: `Song cue number "${songFirstCue}" on continuation row will be imported but is unusual`,
          })
          continuation.firstCueNumber = songFirstCue
        }

        allSongs.push(continuation)
        lastSong.continuesOnPageId = page.id
        lastSong = continuation
        orderIndex++
        pageOrderMap.set(page.id, orderIndex)
      } else if (songName && songContinues && !lastSong) {
        // Edge case: marked as continuation but no previous song — treat as new song
        warnings.push({
          row: rowNum,
          message: `Song "${songName}" marked as continuation but no previous song exists, treating as new song`,
        })
        const song: SceneSong = {
          id: crypto.randomUUID(),
          productionId,
          moduleType: 'cue',
          scriptPageId: page.id,
          name: songName,
          type: 'song',
          firstCueNumber: songFirstCue || undefined,
          orderIndex,
          createdAt: now,
          updatedAt: now,
        }
        allSongs.push(song)
        lastSong = song
        orderIndex++
        pageOrderMap.set(page.id, orderIndex)
      }

      // Process scene
      if (sceneName && !sceneContinues) {
        // Case 1: New scene (name present, not a continuation)
        const scene: SceneSong = {
          id: crypto.randomUUID(),
          productionId,
          moduleType: 'cue',
          scriptPageId: page.id,
          name: sceneName,
          type: 'scene',
          firstCueNumber: sceneFirstCue || undefined,
          orderIndex,
          createdAt: now,
          updatedAt: now,
        }
        allScenes.push(scene)
        lastScene = scene
        orderIndex++
        pageOrderMap.set(page.id, orderIndex)
      } else if (sceneContinues && lastScene) {
        // Case 2+3: Continuation — use sceneName if provided, else inherit lastScene.name
        const name = sceneName || lastScene.name
        const continuation: SceneSong = {
          id: crypto.randomUUID(),
          productionId,
          moduleType: 'cue',
          scriptPageId: page.id,
          name,
          type: 'scene',
          orderIndex,
          continuesFromId: lastScene.id,
          createdAt: now,
          updatedAt: now,
        }

        if (sceneFirstCue) {
          warnings.push({
            row: rowNum,
            message: `Scene cue number "${sceneFirstCue}" on continuation row will be imported but is unusual`,
          })
          continuation.firstCueNumber = sceneFirstCue
        }

        allScenes.push(continuation)
        lastScene.continuesOnPageId = page.id
        lastScene = continuation
        orderIndex++
        pageOrderMap.set(page.id, orderIndex)
      } else if (sceneName && sceneContinues && !lastScene) {
        // Edge case: marked as continuation but no previous scene — treat as new scene
        warnings.push({
          row: rowNum,
          message: `Scene "${sceneName}" marked as continuation but no previous scene exists, treating as new scene`,
        })
        const scene: SceneSong = {
          id: crypto.randomUUID(),
          productionId,
          moduleType: 'cue',
          scriptPageId: page.id,
          name: sceneName,
          type: 'scene',
          firstCueNumber: sceneFirstCue || undefined,
          orderIndex,
          createdAt: now,
          updatedAt: now,
        }
        allScenes.push(scene)
        lastScene = scene
        orderIndex++
        pageOrderMap.set(page.id, orderIndex)
      }
    }

    const pages = Array.from(pageMap.values())
    const continuationCount = allScenes.filter(s => s.continuesFromId).length +
      allSongs.filter(s => s.continuesFromId).length

    return {
      pages,
      scenes: allScenes,
      songs: allSongs,
      warnings,
      stats: {
        totalRows: rows.length,
        pageCount: pages.length,
        sceneCount: allScenes.filter(s => !s.continuesFromId).length,
        songCount: allSongs.filter(s => !s.continuesFromId).length,
        continuationCount,
        actsDetected: Array.from(actsDetected),
        skippedRows,
      },
    }
  }

  /**
   * Get available field names for column mapping dropdowns
   */
  static getFieldOptions(): Array<{ value: string; label: string; required: boolean }> {
    return [
      { value: 'pageNumber', label: 'Page Number', required: true },
      { value: 'pageFirstCue', label: 'Page First Cue', required: false },
      { value: 'act', label: 'Act', required: false },
      { value: 'actContinues', label: 'Act continues', required: false },
      { value: 'scene', label: 'Scene', required: false },
      { value: 'sceneContinues', label: 'Scene continues', required: false },
      { value: 'sceneFirstCue', label: 'Scene First Cue', required: false },
      { value: 'song', label: 'Song', required: false },
      { value: 'songContinues', label: 'Song continues', required: false },
      { value: 'songFirstCue', label: 'Song First Cue', required: false },
    ]
  }
}
