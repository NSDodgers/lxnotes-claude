import { useScriptStore } from '@/lib/stores/script-store'

export interface CueLookupResult {
  display: string
  page?: string
  scene?: string
  song?: string
}

export function useCueLookup() {
  const { findCueLocation } = useScriptStore()

  const lookupCue = (cueNumber: string): CueLookupResult => {
    if (!cueNumber?.trim()) {
      return { display: '' }
    }

    const location = findCueLocation(cueNumber.trim())

    if (!location.page) {
      return { display: `Cue ${cueNumber} (Page not found)` }
    }

    let display = `Pg. ${location.page.pageNumber}`
    let scene = ''
    let song = ''

    // Determine which item to show based on priority: song > scene > page only
    if (location.song) {
      display += ` - ${location.song.name}`
      song = location.song.name
    } else if (location.scene) {
      display += ` - ${location.scene.name}`
      scene = location.scene.name
    } else {
      display += '.'
    }

    return {
      display,
      page: location.page.pageNumber,
      scene,
      song
    }
  }

  return { lookupCue }
}