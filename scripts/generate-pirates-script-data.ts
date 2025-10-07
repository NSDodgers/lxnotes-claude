/**
 * Pirates of Penzance Script Data Generator
 *
 * Generates complete script data from Excel input:
 * - All 189 pages
 * - Song continuation chains
 * - Proper cue number progression (1 → ~2500, incrementing 10-50 per page)
 */

interface ExcelRow {
  page: number
  act: number
  scene?: string
  song?: string
}

// Raw data from Excel file
const excelData: ExcelRow[] = [
  { page: 1, act: 1 },
  { page: 1, act: 1, song: 'Overture' },
  { page: 13, act: 1, song: 'Pour, oh pour, the pirate sherry' },
  { page: 19, act: 1, song: 'When Fred\'ric was a little lad' },
  { page: 22, act: 1, song: 'Oh, better far to live and die' },
  { page: 26, act: 1, song: 'Oh! false one, you have deceiv\'d me' },
  { page: 34, act: 1, song: 'Climbing over rocky mountain' },
  { page: 43, act: 1, song: 'Stop, ladies, pray' },
  { page: 45, act: 1, song: 'Oh, is there not one maiden breast?' },
  { page: 51, act: 1, song: 'Poor wand\'ring one' },
  { page: 57, act: 1, song: 'What ought we to do?' },
  { page: 59, act: 1, song: 'How beautifully blue the sky' },
  { page: 67, act: 1, song: 'Stay, we must not lose our senses' },
  { page: 72, act: 1, song: 'Hold, monsters' },
  { page: 74, act: 1, song: 'I am the very model of a modern Major-General' },
  { page: 84, act: 1, song: 'Oh, men of dark and dismal fate' },
  { page: 114, act: 2, song: 'Oh, dry the glist\'ning tear' },
  { page: 119, act: 2, song: 'Then, Frederic, let your escort lion-hearted' },
  { page: 119, act: 2, song: 'When the foeman bares his steel' },
  { page: 138, act: 2, song: 'Now for the pirates\' lair!' },
  { page: 141, act: 2, song: 'When you had left our pirate fold' },
  { page: 150, act: 2, song: 'Away, away! My heart\'s on fire!' },
  { page: 157, act: 2, song: 'All is prepar\'d; your gallant crew await you' },
  { page: 159, act: 2, song: 'Stay, Fred\'ric, stay' },
  { page: 168, act: 2, song: 'No, I\'ll be brave' },
  { page: 173, act: 2, song: 'When a felon\'s not engaged in his employment' },
  { page: 177, act: 2, song: 'A rollicking band of pirates we' },
  { page: 180, act: 2, song: 'With cat-like tread, upon our prey we steal' },
  { page: 187, act: 2, song: 'Hush, hush, not a word!' },
  { page: 189, act: 2, song: 'Sighing softly to the river' },
]

// Build song map: page -> song data
const songMap = new Map<number, { song: string; act: number }>()
excelData.forEach(row => {
  if (row.song) {
    songMap.set(row.page, { song: row.song, act: row.act })
  }
})

// Generate cue numbers with random increments
function randomIncrement(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Check if page is a continuation (between two song start pages)
function isContinuationPage(pageNum: number): boolean {
  const songPages = Array.from(songMap.keys()).sort((a, b) => a - b)

  for (let i = 0; i < songPages.length - 1; i++) {
    const currentSongPage = songPages[i]
    const nextSongPage = songPages[i + 1]

    if (pageNum > currentSongPage && pageNum < nextSongPage) {
      return true
    }
  }

  return false
}

// Get song for continuation page
function getSongForPage(pageNum: number): { song: string; act: number; startPage: number } | null {
  const songPages = Array.from(songMap.keys()).sort((a, b) => a - b)

  for (let i = 0; i < songPages.length; i++) {
    const currentSongPage = songPages[i]
    const nextSongPage = songPages[i + 1] || 190

    if (pageNum >= currentSongPage && pageNum < nextSongPage) {
      return {
        ...songMap.get(currentSongPage)!,
        startPage: currentSongPage
      }
    }
  }

  return null
}

// Generate all pages with cue numbers
const pages: any[] = []
let currentCue = 1

for (let pageNum = 1; pageNum <= 189; pageNum++) {
  const pageData: any = {
    id: `page-${pageNum}`,
    productionId: 'prod-1',
    pageNumber: pageNum.toString(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  // Every page gets a cue number in sequential progression
  pageData.firstCueNumber = currentCue.toString()
  currentCue += randomIncrement(10, 50)

  pages.push(pageData)
}

// Generate songs with continuation chains
const songs: any[] = []
let songIdCounter = 1

const songPages = Array.from(songMap.keys()).sort((a, b) => a - b)

songPages.forEach((startPage, index) => {
  const songData = songMap.get(startPage)!
  const nextSongPage = songPages[index + 1] || 190
  const endPage = nextSongPage - 1

  const baseSongId = `song-${songIdCounter}`
  songIdCounter++

  // Create first song entry
  const firstCueNum = pages.find(p => p.pageNumber === startPage.toString())?.firstCueNumber

  songs.push({
    id: baseSongId,
    scriptPageId: `page-${startPage}`,
    name: songData.song,
    type: 'song',
    firstCueNumber: firstCueNum,
    orderIndex: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  })

  // Create continuation entries
  let previousId = baseSongId
  let continuationCounter = 1

  for (let page = startPage + 1; page <= endPage; page++) {
    const continuationId = `${baseSongId}-cont-${continuationCounter}`

    songs.push({
      id: continuationId,
      scriptPageId: `page-${page}`,
      name: songData.song,
      type: 'song',
      orderIndex: 0,
      continuesFromId: previousId,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    })

    previousId = continuationId
    continuationCounter++
  }
})

// Generate Acts
const acts = [
  {
    id: 'act-1',
    scriptPageId: 'page-1',
    name: 'Act 1',
    type: 'scene',
    firstCueNumber: '1',
    orderIndex: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'act-2',
    scriptPageId: 'page-114',
    name: 'Act 2',
    type: 'scene',
    firstCueNumber: pages.find(p => p.pageNumber === '114')?.firstCueNumber || '1200',
    orderIndex: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

// Output TypeScript code
console.log(`// Generated Pirates of Penzance Script Data`)
console.log(`// Total Pages: ${pages.length}`)
console.log(`// Total Songs: ${songs.length}`)
console.log(`// Total Acts: ${acts.length}`)
console.log(``)
console.log(`import type { ScriptPage, SceneSong } from '@/types'`)
console.log(``)
console.log(`export const PIRATES_PAGES: ScriptPage[] = ${JSON.stringify(pages, null, 2)}`)
console.log(``)
console.log(`export const PIRATES_SONGS: SceneSong[] = ${JSON.stringify(songs, null, 2)}`)
console.log(``)
console.log(`export const PIRATES_ACTS: SceneSong[] = ${JSON.stringify(acts, null, 2)}`)