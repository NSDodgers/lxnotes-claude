import { create } from 'zustand'
import type { ScriptPage, SceneSong } from '@/types'

interface ScriptState {
  pages: ScriptPage[]
  scenes: SceneSong[]
  songs: SceneSong[]
  
  // CRUD operations for pages
  addPage: (page: Omit<ScriptPage, 'id' | 'createdAt' | 'updatedAt'>) => ScriptPage
  updatePage: (id: string, updates: Partial<ScriptPage>) => void
  deletePage: (id: string) => void
  
  // CRUD operations for scenes/songs
  addSceneSong: (item: Omit<SceneSong, 'id' | 'createdAt' | 'updatedAt'>) => SceneSong
  updateSceneSong: (id: string, updates: Partial<SceneSong>) => void
  deleteSceneSong: (id: string) => void
  
  // Utility functions
  getPageScenes: (pageId: string) => SceneSong[]
  getPageSongs: (pageId: string) => SceneSong[]
  getSortedPages: () => ScriptPage[]
  validateCueNumber: (cueNumber: string, excludeId?: string) => { valid: boolean; message?: string }
  validatePageOrder: (pageId: string) => { valid: boolean; message?: string }
  validateSceneSongCueNumber: (cueNumber: string, pageId: string, itemId?: string) => { valid: boolean; message?: string }
  findCueLocation: (cueNumber: string) => { page?: ScriptPage; scene?: SceneSong; song?: SceneSong }
  
  // Continuation functions
  getPreviousPageScenes: (pageId: string) => SceneSong[]
  getPreviousPageSongs: (pageId: string) => SceneSong[]
  createContinuation: (originalItemId: string, targetPageId: string, firstCueNumber?: string) => SceneSong
  getContinuationChain: (itemId: string) => SceneSong[]
  getNextPage: (pageId: string) => ScriptPage | undefined
  
  // Smart continuation functions
  getAvailableContinuations: (pageId: string, type: 'scene' | 'song') => SceneSong[]
  getContinuationStatus: (itemId: string, targetPageId: string) => 'available' | 'already_continued' | 'already_here'
  getSuggestedContinuation: (pageId: string, type: 'scene' | 'song') => SceneSong | undefined
  updateContinuationChain: (itemId: string, updates: Partial<SceneSong>) => void
}

// Utility function to parse theatrical page numbers for sorting
const parsePageNumber = (pageNumber: string): { base: number; suffix: string } => {
  const match = pageNumber.match(/^(\d+)(.*)$/)
  if (match) {
    return { base: parseInt(match[1], 10), suffix: match[2] }
  }
  return { base: 0, suffix: pageNumber }
}

// Utility function to parse cue numbers for comparison
const parseCueNumber = (cueNumber: string): number => {
  const match = cueNumber.match(/^(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}

export const useScriptStore = create<ScriptState>((set, get) => ({
  pages: [
    // Joy! Musical - Mock data from production
    { id: 'page-1', productionId: 'prod-1', pageNumber: '1', firstCueNumber: '1', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-2', productionId: 'prod-1', pageNumber: '2', firstCueNumber: '11', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-3', productionId: 'prod-1', pageNumber: '3', firstCueNumber: '17', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-4', productionId: 'prod-1', pageNumber: '4', firstCueNumber: '22', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-5', productionId: 'prod-1', pageNumber: '5', firstCueNumber: '32', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-6', productionId: 'prod-1', pageNumber: '6', firstCueNumber: '39', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-7', productionId: 'prod-1', pageNumber: '7', firstCueNumber: '43', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-8', productionId: 'prod-1', pageNumber: '8', firstCueNumber: '52', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-9', productionId: 'prod-1', pageNumber: '9', firstCueNumber: '63', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-10', productionId: 'prod-1', pageNumber: '10', firstCueNumber: '68', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-11', productionId: 'prod-1', pageNumber: '11', firstCueNumber: '91', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-12', productionId: 'prod-1', pageNumber: '12', firstCueNumber: '93', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-16', productionId: 'prod-1', pageNumber: '16', firstCueNumber: '105', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-17-18', productionId: 'prod-1', pageNumber: '17-18', firstCueNumber: '106', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-17-18a', productionId: 'prod-1', pageNumber: '17-18a', firstCueNumber: '107', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-17-18b', productionId: 'prod-1', pageNumber: '17-18b', firstCueNumber: '110', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-19', productionId: 'prod-1', pageNumber: '19', firstCueNumber: '111', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-20', productionId: 'prod-1', pageNumber: '20', firstCueNumber: '115', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-21', productionId: 'prod-1', pageNumber: '21', firstCueNumber: '133', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-22', productionId: 'prod-1', pageNumber: '22', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-23', productionId: 'prod-1', pageNumber: '23', firstCueNumber: '175', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-25', productionId: 'prod-1', pageNumber: '25', firstCueNumber: '181', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-26', productionId: 'prod-1', pageNumber: '26', firstCueNumber: '189', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-27', productionId: 'prod-1', pageNumber: '27', firstCueNumber: '194', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-28', productionId: 'prod-1', pageNumber: '28', firstCueNumber: '205', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-30', productionId: 'prod-1', pageNumber: '30', firstCueNumber: '208', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-31', productionId: 'prod-1', pageNumber: '31', firstCueNumber: '211', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-33', productionId: 'prod-1', pageNumber: '33', firstCueNumber: '220', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-34', productionId: 'prod-1', pageNumber: '34', firstCueNumber: '224', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-35', productionId: 'prod-1', pageNumber: '35', firstCueNumber: '228', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-36', productionId: 'prod-1', pageNumber: '36', firstCueNumber: '242', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-37', productionId: 'prod-1', pageNumber: '37', firstCueNumber: '257', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-38', productionId: 'prod-1', pageNumber: '38', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'page-38a', productionId: 'prod-1', pageNumber: '38a', firstCueNumber: '260', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  ],
  
  scenes: [
    // Joy! Musical - Scenes from production with continuation chains
    { id: 'scene-1', scriptPageId: 'page-1', name: 'Preshow', type: 'scene', firstCueNumber: '7', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    
    // "1.2 At Home" continuation chain: page-11 → page-12 → page-16
    { id: 'scene-2', scriptPageId: 'page-11', name: '1.2 At Home', type: 'scene', firstCueNumber: '91', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'scene-3', scriptPageId: 'page-12', name: '1.2 At Home', type: 'scene', firstCueNumber: '93', orderIndex: 0, continuesFromId: 'scene-2', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'scene-4', scriptPageId: 'page-16', name: '1.2 At Home', type: 'scene', firstCueNumber: '105', orderIndex: 0, continuesFromId: 'scene-3', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    
    { id: 'scene-5', scriptPageId: 'page-23', name: '1.3 At home', type: 'scene', firstCueNumber: '175', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    
    // "SCENE AFTER THIS IS" continuation chain: page-28 → page-30
    { id: 'scene-6', scriptPageId: 'page-28', name: 'SCENE AFTER THIS IS', type: 'scene', firstCueNumber: '205', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'scene-7', scriptPageId: 'page-30', name: 'SCENE AFTER THIS IS', type: 'scene', firstCueNumber: '208', orderIndex: 0, continuesFromId: 'scene-6', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    
    { id: 'scene-8', scriptPageId: 'page-31', name: 'SCENE AFTER THIS IS REPRISE', type: 'scene', firstCueNumber: '217', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'scene-9', scriptPageId: 'page-36', name: '1.4 AT HOME', type: 'scene', firstCueNumber: '242', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  ],
  
  songs: [
    // Joy! Musical - Songs from production with continuation chains
    { id: 'song-1', scriptPageId: 'page-1', name: 'Overture', type: 'song', firstCueNumber: '1', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-2', scriptPageId: 'page-2', name: '#1 THE SHAPE OF THINGS', type: 'song', firstCueNumber: '11', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    
    // "#2 WELCOME TO MY WORLD" continuation chain: pages 3→4→5→6→7→8→9→10 (8 pages!)
    { id: 'song-3', scriptPageId: 'page-3', name: '#2 WELCOME TO MY WORLD', type: 'song', firstCueNumber: '17', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-4', scriptPageId: 'page-4', name: '#2 WELCOME TO MY WORLD', type: 'song', firstCueNumber: '22', orderIndex: 0, continuesFromId: 'song-3', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-5', scriptPageId: 'page-5', name: '#2 WELCOME TO MY WORLD', type: 'song', firstCueNumber: '38', orderIndex: 0, continuesFromId: 'song-4', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-6', scriptPageId: 'page-6', name: '#2 WELCOME TO MY WORLD', type: 'song', firstCueNumber: '39', orderIndex: 0, continuesFromId: 'song-5', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-7', scriptPageId: 'page-7', name: '#2 WELCOME TO MY WORLD', type: 'song', firstCueNumber: '43', orderIndex: 0, continuesFromId: 'song-6', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-8', scriptPageId: 'page-8', name: '#2 WELCOME TO MY WORLD', type: 'song', firstCueNumber: '52', orderIndex: 0, continuesFromId: 'song-7', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-9', scriptPageId: 'page-9', name: '#2 WELCOME TO MY WORLD', type: 'song', firstCueNumber: '63', orderIndex: 0, continuesFromId: 'song-8', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-10', scriptPageId: 'page-10', name: '#2 WELCOME TO MY WORLD', type: 'song', firstCueNumber: '68', orderIndex: 0, continuesFromId: 'song-9', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    
    // "#4 THE SHAPE OF THINGS" continuation chain: pages 19→20→21
    { id: 'song-11', scriptPageId: 'page-19', name: '#4 THE SHAPE OF THINGS', type: 'song', firstCueNumber: '111', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-12', scriptPageId: 'page-20', name: '#4 THE SHAPE OF THINGS', type: 'song', firstCueNumber: '115', orderIndex: 0, continuesFromId: 'song-11', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-13', scriptPageId: 'page-21', name: '#4 THE SHAPE OF THINGS', type: 'song', firstCueNumber: '133', orderIndex: 0, continuesFromId: 'song-12', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    
    { id: 'song-14', scriptPageId: 'page-22', name: '#4A SPARK', type: 'song', firstCueNumber: '142', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    
    // "#5 THIS IS" continuation chain: pages 25→26→27
    { id: 'song-15', scriptPageId: 'page-25', name: '#5 THIS IS', type: 'song', firstCueNumber: '181', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-16', scriptPageId: 'page-26', name: '#5 THIS IS', type: 'song', firstCueNumber: '189', orderIndex: 0, continuesFromId: 'song-15', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-17', scriptPageId: 'page-27', name: '#5 THIS IS', type: 'song', firstCueNumber: '194', orderIndex: 0, continuesFromId: 'song-16', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    
    // "#6 THIS IS REPRISE" continuation chain: pages 30→31
    { id: 'song-18', scriptPageId: 'page-30', name: '#6 THIS IS REPRISE', type: 'song', orderIndex: 1, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-19', scriptPageId: 'page-31', name: '#6 THIS IS REPRISE', type: 'song', firstCueNumber: '211', orderIndex: 1, continuesFromId: 'song-18', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    
    // "#7 AMAZING / DISAPPOINTING" continuation chain: pages 33→34→35
    { id: 'song-20', scriptPageId: 'page-33', name: '#7 AMAZING / DISAPPOINTING', type: 'song', firstCueNumber: '220', orderIndex: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-21', scriptPageId: 'page-34', name: '#7 AMAZING / DISAPPOINTING', type: 'song', firstCueNumber: '224', orderIndex: 0, continuesFromId: 'song-20', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-22', scriptPageId: 'page-35', name: '#7 AMAZING / DISAPPOINTING', type: 'song', firstCueNumber: '228', orderIndex: 0, continuesFromId: 'song-21', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    
    // "#8 SHIP IT TO YOUR DOOR" continuation chain: pages 36→37→38
    { id: 'song-23', scriptPageId: 'page-36', name: '#8 SHIP IT TO YOUR DOOR', type: 'song', firstCueNumber: '244', orderIndex: 1, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-24', scriptPageId: 'page-37', name: '#8 SHIP IT TO YOUR DOOR', type: 'song', firstCueNumber: '257', orderIndex: 0, continuesFromId: 'song-23', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'song-25', scriptPageId: 'page-38', name: '#8 SHIP IT TO YOUR DOOR', type: 'song', orderIndex: 0, continuesFromId: 'song-24', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  ],

  addPage: (pageData) => {
    const newPage: ScriptPage = {
      ...pageData,
      id: `page-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    set((state) => ({
      pages: [...state.pages, newPage].sort((a, b) => {
        const pageA = parsePageNumber(a.pageNumber)
        const pageB = parsePageNumber(b.pageNumber)
        if (pageA.base !== pageB.base) {
          return pageA.base - pageB.base
        }
        return pageA.suffix.localeCompare(pageB.suffix)
      })
    }))
    
    return newPage
  },

  updatePage: (id, updates) => {
    set((state) => ({
      pages: state.pages.map(page =>
        page.id === id ? { ...page, ...updates, updatedAt: new Date() } : page
      )
    }))
  },

  deletePage: (id) => {
    set((state) => ({
      pages: state.pages.filter(page => page.id !== id),
      scenes: state.scenes.filter(scene => scene.scriptPageId !== id),
      songs: state.songs.filter(song => song.scriptPageId !== id),
    }))
  },

  addSceneSong: (itemData) => {
    const newItem: SceneSong = {
      ...itemData,
      id: `${itemData.type}-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const arrayName = itemData.type === 'scene' ? 'scenes' : 'songs'
    
    set((state) => ({
      [arrayName]: [...state[arrayName], newItem].sort((a, b) => {
        if (a.scriptPageId !== b.scriptPageId) {
          return a.scriptPageId.localeCompare(b.scriptPageId)
        }
        const cueA = a.firstCueNumber ? parseCueNumber(a.firstCueNumber) : 0
        const cueB = b.firstCueNumber ? parseCueNumber(b.firstCueNumber) : 0
        return cueA - cueB
      })
    }))
    
    return newItem
  },

  updateSceneSong: (id, updates) => {
    set((state) => {
      const scenes = state.scenes.map(scene =>
        scene.id === id ? { ...scene, ...updates, updatedAt: new Date() } : scene
      )
      const songs = state.songs.map(song =>
        song.id === id ? { ...song, ...updates, updatedAt: new Date() } : song
      )
      
      return { scenes, songs }
    })
  },

  deleteSceneSong: (id) => {
    set((state) => ({
      scenes: state.scenes.filter(scene => scene.id !== id),
      songs: state.songs.filter(song => song.id !== id),
    }))
  },

  getPageScenes: (pageId) => {
    const { scenes } = get()
    return scenes
      .filter(scene => scene.scriptPageId === pageId)
      .sort((a, b) => {
        const cueA = a.firstCueNumber ? parseCueNumber(a.firstCueNumber) : 0
        const cueB = b.firstCueNumber ? parseCueNumber(b.firstCueNumber) : 0
        return cueA - cueB
      })
  },

  getPageSongs: (pageId) => {
    const { songs } = get()
    return songs
      .filter(song => song.scriptPageId === pageId)
      .sort((a, b) => {
        const cueA = a.firstCueNumber ? parseCueNumber(a.firstCueNumber) : 0
        const cueB = b.firstCueNumber ? parseCueNumber(b.firstCueNumber) : 0
        return cueA - cueB
      })
  },

  getSortedPages: () => {
    const { pages } = get()
    return pages.sort((a, b) => {
      const pageA = parsePageNumber(a.pageNumber)
      const pageB = parsePageNumber(b.pageNumber)
      if (pageA.base !== pageB.base) {
        return pageA.base - pageB.base
      }
      return pageA.suffix.localeCompare(pageB.suffix)
    })
  },

  validateCueNumber: (cueNumber, excludeId) => {
    const { pages, scenes, songs } = get()
    const cueNum = parseCueNumber(cueNumber)
    
    if (cueNum <= 0) {
      return { valid: false, message: 'Cue number must be greater than 0' }
    }
    
    const excludeItem = pages.find(p => p.id === excludeId) || 
                       scenes.find(s => s.id === excludeId) || 
                       songs.find(s => s.id === excludeId)
    
    // If checking a page, only check conflicts with other pages (not scenes/songs)
    if (excludeItem && pages.find(p => p.id === excludeId)) {
      const conflictingPage = pages.find(page => 
        page.id !== excludeId && 
        page.firstCueNumber && 
        parseCueNumber(page.firstCueNumber) === cueNum
      )
      
      if (conflictingPage) {
        return { 
          valid: false, 
          message: `Cue number conflicts with page ${conflictingPage.pageNumber}` 
        }
      }
    }
    
    // If checking a scene/song, only check conflicts with other scenes/songs
    if (excludeItem && (scenes.find(s => s.id === excludeId) || songs.find(s => s.id === excludeId))) {
      const allItems = [...scenes, ...songs]
      const conflictingItem = allItems.find(item =>
        item.id !== excludeId &&
        item.firstCueNumber &&
        parseCueNumber(item.firstCueNumber) === cueNum
      )
      
      if (conflictingItem) {
        return {
          valid: false,
          message: `Cue number conflicts with ${conflictingItem.type} "${conflictingItem.name}"`
        }
      }
    }
    
    return { valid: true }
  },

  validatePageOrder: (pageId) => {
    const { pages } = get()
    const currentPage = pages.find(p => p.id === pageId)
    
    if (!currentPage || !currentPage.firstCueNumber) {
      return { valid: true }
    }
    
    const sortedPages = pages
      .filter(p => p.firstCueNumber)
      .sort((a, b) => {
        const pageA = parsePageNumber(a.pageNumber)
        const pageB = parsePageNumber(b.pageNumber)
        if (pageA.base !== pageB.base) {
          return pageA.base - pageB.base
        }
        return pageA.suffix.localeCompare(pageB.suffix)
      })
    
    const currentIndex = sortedPages.findIndex(p => p.id === pageId)
    const currentCue = parseCueNumber(currentPage.firstCueNumber)
    
    // Check previous page
    if (currentIndex > 0) {
      const prevPage = sortedPages[currentIndex - 1]
      const prevCue = parseCueNumber(prevPage.firstCueNumber!)
      if (currentCue < prevCue) {
        return {
          valid: false,
          message: `Cue ${currentPage.firstCueNumber} is lower than previous page ${prevPage.pageNumber} (cue ${prevPage.firstCueNumber})`
        }
      }
    }
    
    // Check next page
    if (currentIndex < sortedPages.length - 1) {
      const nextPage = sortedPages[currentIndex + 1]
      const nextCue = parseCueNumber(nextPage.firstCueNumber!)
      if (currentCue > nextCue) {
        return {
          valid: false,
          message: `Cue ${currentPage.firstCueNumber} is higher than next page ${nextPage.pageNumber} (cue ${nextPage.firstCueNumber})`
        }
      }
    }
    
    return { valid: true }
  },

  validateSceneSongCueNumber: (cueNumber, pageId, itemId) => {
    const { pages } = get()
    const cueNum = parseCueNumber(cueNumber)
    
    if (cueNum <= 0) {
      return { valid: false, message: 'Cue number must be greater than 0' }
    }
    
    const currentPage = pages.find(p => p.id === pageId)
    if (!currentPage) {
      return { valid: true } // Page not found, skip validation
    }
    
    const sortedPages = pages
      .filter(p => p.firstCueNumber)
      .sort((a, b) => {
        const pageA = parsePageNumber(a.pageNumber)
        const pageB = parsePageNumber(b.pageNumber)
        if (pageA.base !== pageB.base) {
          return pageA.base - pageB.base
        }
        return pageA.suffix.localeCompare(pageB.suffix)
      })
    
    const currentPageIndex = sortedPages.findIndex(p => p.id === pageId)
    if (currentPageIndex === -1) {
      return { valid: true } // Page not in sorted list, skip validation
    }
    
    // Check if cue is lower than current page's first cue
    if (currentPage.firstCueNumber) {
      const currentPageCue = parseCueNumber(currentPage.firstCueNumber)
      if (cueNum < currentPageCue) {
        return {
          valid: false,
          message: `Cue ${cueNumber} is lower than page ${currentPage.pageNumber} first cue (${currentPage.firstCueNumber})`
        }
      }
    }
    
    // Check if cue is higher than next page's first cue
    if (currentPageIndex < sortedPages.length - 1) {
      const nextPage = sortedPages[currentPageIndex + 1]
      if (nextPage.firstCueNumber) {
        const nextPageCue = parseCueNumber(nextPage.firstCueNumber)
        if (cueNum > nextPageCue) {
          return {
            valid: false,
            message: `Cue ${cueNumber} is higher than next page ${nextPage.pageNumber} first cue (${nextPage.firstCueNumber})`
          }
        }
      }
    }
    
    return { valid: true }
  },

  findCueLocation: (cueNumber) => {
    const { pages, scenes, songs } = get()
    const cueNum = parseCueNumber(cueNumber)
    
    // Find the page with the highest cue number <= requested cue
    const sortedPages = pages
      .filter(page => page.firstCueNumber && parseCueNumber(page.firstCueNumber) <= cueNum)
      .sort((a, b) => parseCueNumber(b.firstCueNumber!) - parseCueNumber(a.firstCueNumber!))
    
    const page = sortedPages[0]
    if (!page) return {}
    
    // Find the scene with the highest cue number <= requested cue on that page
    const pageScenes = scenes
      .filter(scene => scene.scriptPageId === page.id && scene.firstCueNumber && parseCueNumber(scene.firstCueNumber) <= cueNum)
      .sort((a, b) => parseCueNumber(b.firstCueNumber!) - parseCueNumber(a.firstCueNumber!))
    
    // Find the song with the highest cue number <= requested cue on that page
    const pageSongs = songs
      .filter(song => song.scriptPageId === page.id && song.firstCueNumber && parseCueNumber(song.firstCueNumber) <= cueNum)
      .sort((a, b) => parseCueNumber(b.firstCueNumber!) - parseCueNumber(a.firstCueNumber!))
    
    return {
      page,
      scene: pageScenes[0],
      song: pageSongs[0]
    }
  },

  // Continuation functions
  getPreviousPageScenes: (pageId) => {
    const { pages, scenes } = get()
    const sortedPages = pages
      .filter(p => p.firstCueNumber)
      .sort((a, b) => {
        const pageA = parsePageNumber(a.pageNumber)
        const pageB = parsePageNumber(b.pageNumber)
        if (pageA.base !== pageB.base) {
          return pageA.base - pageB.base
        }
        return pageA.suffix.localeCompare(pageB.suffix)
      })
    
    const currentPageIndex = sortedPages.findIndex(p => p.id === pageId)
    if (currentPageIndex <= 0) return []
    
    const previousPage = sortedPages[currentPageIndex - 1]
    return scenes
      .filter(scene => scene.scriptPageId === previousPage.id)
      .sort((a, b) => {
        const cueA = a.firstCueNumber ? parseCueNumber(a.firstCueNumber) : 0
        const cueB = b.firstCueNumber ? parseCueNumber(b.firstCueNumber) : 0
        return cueA - cueB
      })
  },

  getPreviousPageSongs: (pageId) => {
    const { pages, songs } = get()
    const sortedPages = pages
      .filter(p => p.firstCueNumber)
      .sort((a, b) => {
        const pageA = parsePageNumber(a.pageNumber)
        const pageB = parsePageNumber(b.pageNumber)
        if (pageA.base !== pageB.base) {
          return pageA.base - pageB.base
        }
        return pageA.suffix.localeCompare(pageB.suffix)
      })
    
    const currentPageIndex = sortedPages.findIndex(p => p.id === pageId)
    if (currentPageIndex <= 0) return []
    
    const previousPage = sortedPages[currentPageIndex - 1]
    return songs
      .filter(song => song.scriptPageId === previousPage.id)
      .sort((a, b) => {
        const cueA = a.firstCueNumber ? parseCueNumber(a.firstCueNumber) : 0
        const cueB = b.firstCueNumber ? parseCueNumber(b.firstCueNumber) : 0
        return cueA - cueB
      })
  },

  createContinuation: (originalItemId, targetPageId, firstCueNumber) => {
    const { scenes, songs, addSceneSong } = get()
    const originalItem = [...scenes, ...songs].find(item => item.id === originalItemId)
    
    if (!originalItem) {
      throw new Error('Original item not found')
    }

    const continuationData = {
      name: originalItem.name,
      type: originalItem.type as 'scene' | 'song',
      scriptPageId: targetPageId,
      orderIndex: 0,
      continuesFromId: originalItemId,
      firstCueNumber,
    }

    return addSceneSong(continuationData)
  },

  getContinuationChain: (itemId) => {
    const { scenes, songs } = get()
    const allItems = [...scenes, ...songs]
    const chain: SceneSong[] = []
    
    // Find the root item (one without continuesFromId)
    let currentItem = allItems.find(item => item.id === itemId)
    if (!currentItem) return []
    
    // Go back to find the root
    while (currentItem && currentItem.continuesFromId) {
      currentItem = allItems.find(item => item.id === currentItem!.continuesFromId)
    }
    
    if (!currentItem) return []
    
    // Build the chain forward
    chain.push(currentItem)
    
    let nextItem = allItems.find(item => item.continuesFromId === currentItem!.id)
    while (nextItem) {
      chain.push(nextItem)
      const nextId = nextItem.id
      nextItem = allItems.find(item => item.continuesFromId === nextId)
    }
    
    return chain
  },

  getNextPage: (pageId) => {
    const { pages } = get()
    // Don't filter by firstCueNumber - we need ALL pages in sequence for continuation logic
    const sortedPages = pages
      .sort((a, b) => {
        const pageA = parsePageNumber(a.pageNumber)
        const pageB = parsePageNumber(b.pageNumber)
        if (pageA.base !== pageB.base) {
          return pageA.base - pageB.base
        }
        return pageA.suffix.localeCompare(pageB.suffix)
      })
    
    const currentPageIndex = sortedPages.findIndex(p => p.id === pageId)
    if (currentPageIndex === -1 || currentPageIndex >= sortedPages.length - 1) {
      return undefined
    }
    
    return sortedPages[currentPageIndex + 1]
  },

  // Smart continuation functions
  getAvailableContinuations: (pageId, type) => {
    const { pages, scenes, songs } = get()
    
    // Get previous page
    const sortedPages = pages
      .filter(p => p.firstCueNumber)
      .sort((a, b) => {
        const pageA = parsePageNumber(a.pageNumber)
        const pageB = parsePageNumber(b.pageNumber)
        if (pageA.base !== pageB.base) {
          return pageA.base - pageB.base
        }
        return pageA.suffix.localeCompare(pageB.suffix)
      })
    
    const currentPageIndex = sortedPages.findIndex(p => p.id === pageId)
    if (currentPageIndex <= 0) return []
    
    const previousPage = sortedPages[currentPageIndex - 1]
    const items = type === 'scene' ? scenes : songs
    const allItems = [...scenes, ...songs]
    
    return items
      .filter(item => item.scriptPageId === previousPage.id)
      .filter(item => {
        // Only include items that don't already continue to the target page
        const hasExistingContinuation = allItems.some(otherItem => 
          otherItem.continuesFromId === item.id && otherItem.scriptPageId === pageId
        )
        return !hasExistingContinuation
      })
      .sort((a, b) => {
        const cueA = a.firstCueNumber ? parseCueNumber(a.firstCueNumber) : 0
        const cueB = b.firstCueNumber ? parseCueNumber(b.firstCueNumber) : 0
        return cueA - cueB
      })
  },

  getContinuationStatus: (itemId, targetPageId) => {
    const { scenes, songs } = get()
    const allItems = [...scenes, ...songs]
    
    // Check if item already exists on the target page as a continuation
    const existsOnTargetPage = allItems.some(item => 
      item.continuesFromId === itemId && item.scriptPageId === targetPageId
    )
    
    if (existsOnTargetPage) {
      return 'already_here'
    }
    
    // Check if item already continues somewhere else
    const continuesElsewhere = allItems.some(item => 
      item.continuesFromId === itemId && item.scriptPageId !== targetPageId
    )
    
    if (continuesElsewhere) {
      return 'already_continued'
    }
    
    return 'available'
  },

  getSuggestedContinuation: (pageId, type) => {
    const availableContinuations = get().getAvailableContinuations(pageId, type)
    
    if (availableContinuations.length === 0) return undefined
    
    // If there's only one available, suggest it
    if (availableContinuations.length === 1) {
      return availableContinuations[0]
    }
    
    // Otherwise, suggest the one with the highest cue number (likely the last one on the page)
    return availableContinuations.reduce((prev, current) => {
      const prevCue = prev.firstCueNumber ? parseCueNumber(prev.firstCueNumber) : 0
      const currentCue = current.firstCueNumber ? parseCueNumber(current.firstCueNumber) : 0
      return currentCue > prevCue ? current : prev
    })
  },

  updateContinuationChain: (itemId, updates) => {
    const { getContinuationChain } = get()
    const continuationChain = getContinuationChain(itemId)
    
    // Only update the 'name' field across all items in the chain for consistency
    // Other fields like cue numbers should remain unique per page
    const nameUpdate = updates.name ? { name: updates.name } : {}
    
    if (Object.keys(nameUpdate).length === 0) {
      // If no name update, just update the single item
      set((state) => {
        const scenes = state.scenes.map(scene =>
          scene.id === itemId ? { ...scene, ...updates, updatedAt: new Date() } : scene
        )
        const songs = state.songs.map(song =>
          song.id === itemId ? { ...song, ...updates, updatedAt: new Date() } : song
        )
        return { scenes, songs }
      })
      return
    }
    
    // Update all items in the continuation chain with the new name
    set((state) => {
      const chainIds = new Set(continuationChain.map(item => item.id))
      
      const scenes = state.scenes.map(scene =>
        chainIds.has(scene.id) ? { ...scene, ...nameUpdate, updatedAt: new Date() } : scene
      )
      const songs = state.songs.map(song =>
        chainIds.has(song.id) ? { ...song, ...nameUpdate, updatedAt: new Date() } : song
      )
      
      return { scenes, songs }
    })
  },
}))