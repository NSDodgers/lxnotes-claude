import { create } from 'zustand'
import type {
  Note,
  ModuleType,
  ScriptPage,
  SceneSong,
  FixtureInfo
} from '@/types'
import { useScriptStore } from './script-store'
import { useFixtureStore } from './fixture-store'

interface MockNotesState {
  notes: Record<ModuleType, Note[]>

  // Core operations
  getAllNotes: (moduleType: ModuleType) => Note[]
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  // Bulk set/replace notes for a module (used by demo loader)
  setNotes: (moduleType: ModuleType, notes: Note[]) => void

  // Validation functions
  validateCueNote: (note: Partial<Note>) => { valid: boolean; errors: string[] }
  validateWorkNote: (note: Partial<Note>) => { valid: boolean; errors: string[] }
  validateProductionNote: (note: Partial<Note>) => { valid: boolean; errors: string[] }

  // Reference lookups
  getScriptContext: (scriptPageId?: string, sceneSongId?: string) => ScriptContext | null
  getFixtureContext: (channelNumbers?: string) => FixtureContext[]

  // Initialization
  initializeWithMockData: () => void
}

interface ScriptContext {
  page?: ScriptPage
  scene?: SceneSong
  song?: SceneSong
  cueRange?: { min: number; max: number }
}

type FixtureContext = Pick<FixtureInfo, 'lwid' | 'channel' | 'position' | 'unitNumber' | 'fixtureType' | 'purpose'>

export const useMockNotesStore = create<MockNotesState>((set, get) => ({
  notes: {
    cue: [],
    work: [],
    production: []
  },

  getAllNotes: (moduleType) => {
    return get().notes[moduleType] || []
  },

  addNote: (noteData) => {
    const newNote: Note = {
      ...noteData,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    set((state) => ({
      notes: {
        ...state.notes,
        [noteData.moduleType]: [...state.notes[noteData.moduleType], newNote]
      }
    }))

    return newNote
  },

  updateNote: (id, updates) => {
    set((state) => {
      const updatedNotes = { ...state.notes }

      for (const moduleType of Object.keys(updatedNotes) as ModuleType[]) {
        updatedNotes[moduleType] = updatedNotes[moduleType].map(note =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
        )
      }

      return { notes: updatedNotes }
    })
  },

  deleteNote: (id) => {
    set((state) => {
      const updatedNotes = { ...state.notes }

      for (const moduleType of Object.keys(updatedNotes) as ModuleType[]) {
        updatedNotes[moduleType] = updatedNotes[moduleType].filter(note => note.id !== id)
      }

      return { notes: updatedNotes }
    })
  },

  setNotes: (moduleType, notes) => {
    set((state) => ({
      notes: {
        ...state.notes,
        [moduleType]: notes,
      }
    }))
  },

  validateCueNote: (note) => {
    const errors: string[] = []
    const scriptStore = useScriptStore.getState()

    // Validate scriptPageId
    if (note.scriptPageId) {
      const page = scriptStore.pages.find(p => p.id === note.scriptPageId)
      if (!page) {
        errors.push(`Invalid scriptPageId: ${note.scriptPageId}`)
      }
    }

    // Validate sceneSongId
    if (note.sceneSongId) {
      const allScenesSongs = [...scriptStore.scenes, ...scriptStore.songs]
      const sceneSong = allScenesSongs.find(item => item.id === note.sceneSongId)
      if (!sceneSong) {
        errors.push(`Invalid sceneSongId: ${note.sceneSongId}`)
      }
    }

    return { valid: errors.length === 0, errors }
  },

  validateWorkNote: (note) => {
    const errors: string[] = []
    const fixtureStore = useFixtureStore.getState()

    // Validate lightwrightItemId
    if (note.lightwrightItemId) {
      const fixture = fixtureStore.fixtures.find(f => f.lwid === note.lightwrightItemId)
      if (!fixture) {
        errors.push(`Invalid lightwrightItemId: ${note.lightwrightItemId}`)
      }
    }

    // Validate channelNumbers against fixture data
    if (note.channelNumbers) {
      const channels = note.channelNumbers.split(',').map(c => parseInt(c.trim(), 10))
      const validChannels = fixtureStore.fixtures.map(f => f.channel)

      for (const channel of channels) {
        if (!isNaN(channel) && !validChannels.includes(channel)) {
          errors.push(`Invalid channel number: ${channel}`)
        }
      }
    }

    return { valid: errors.length === 0, errors }
  },

  validateProductionNote: (note) => {
    // Production notes don't have external references to validate
    return { valid: true, errors: [] }
  },

  getScriptContext: (scriptPageId, sceneSongId) => {
    const scriptStore = useScriptStore.getState()
    const context: ScriptContext = {}

    if (scriptPageId) {
      context.page = scriptStore.pages.find(p => p.id === scriptPageId)
    }

    if (sceneSongId) {
      const scene = scriptStore.scenes.find(s => s.id === sceneSongId)
      const song = scriptStore.songs.find(s => s.id === sceneSongId)
      context.scene = scene
      context.song = song
    }

    // Calculate cue range for this context
    if (context.page) {
      const pageIndex = scriptStore.getSortedPages().findIndex(p => p.id === context.page!.id)
      const sortedPages = scriptStore.getSortedPages()
      const nextPage = sortedPages[pageIndex + 1]

      const minCue = context.page.firstCueNumber ? parseInt(context.page.firstCueNumber) : 1
      const maxCue = nextPage?.firstCueNumber ? parseInt(nextPage.firstCueNumber) - 1 : 999

      context.cueRange = { min: minCue, max: maxCue }
    }

    return Object.keys(context).length > 0 ? context : null
  },

  getFixtureContext: (channelNumbers) => {
    if (!channelNumbers) return []

    const fixtureStore = useFixtureStore.getState()
    const channels = channelNumbers.split(',').map(c => parseInt(c.trim(), 10))

    return fixtureStore.fixtures.filter(fixture =>
      channels.includes(fixture.channel)
    ).map(fixture => ({
      lwid: fixture.lwid,
      channel: fixture.channel,
      position: fixture.position,
      unitNumber: fixture.unitNumber,
      fixtureType: fixture.fixtureType,
      purpose: fixture.purpose
    }))
  },

  initializeWithMockData: () => {
    const baseDate = new Date()

    const cueNotes: Note[] = [
      {
        id: 'cue-note-1',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Fade house lights on Overture',
        description: 'House to 50% over 5 seconds when music starts. Follow spot should be ready for opening number.',
        priority: 'very_high',
        status: 'todo',
        type: 'cue',
        cueNumber: '5', // System should look up that cue 5 is in Overture on page 1
        createdAt: new Date(baseDate.getTime() - 86400000),
        updatedAt: new Date(baseDate.getTime() - 86400000),
      },
      {
        id: 'cue-note-2',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Lighting change for "Welcome to My World"',
        description: 'Transition to warmer palette during opening verse. Cue 17 needs to happen on "welcome" lyric.',
        priority: 'medium',
        status: 'complete',
        type: 'cue',
        cueNumber: '17', // System should look up that cue 17 is in "Welcome to My World" on page 3
        createdAt: new Date(baseDate.getTime() - 172800000),
        updatedAt: new Date(baseDate.getTime() - 3600000),
      },
      {
        id: 'cue-note-3',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Need dramatic lighting for death scene',
        description: 'Director wants stronger side light and deeper shadows for emotional impact. Consider adding haze effect.',
        priority: 'very_high',
        status: 'todo',
        type: 'director',
        cueNumber: '95', // System should look up that cue 95 is in "At Home" scene on page 11
        createdAt: new Date(baseDate.getTime() - 7200000),
        updatedAt: new Date(baseDate.getTime() - 7200000),
      },
      {
        id: 'cue-note-4',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Finale blackout timing',
        description: 'Complete blackout on final chord. Need 2-count hold before house lights restore.',
        priority: 'very_high',
        status: 'complete',
        type: 'cue',
        cueNumber: '265', // System should look up that cue 265 is on finale page 38a
        createdAt: new Date(baseDate.getTime() - 259200000),
        updatedAt: new Date(baseDate.getTime() - 86400000),
      },
      {
        id: 'cue-note-5',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Scene transition for "Amazing/Disappointing"',
        description: 'Quick cross-fade between locations. Cue 220 should feel seamless.',
        priority: 'medium',
        status: 'todo',
        type: 'cue',
        cueNumber: '220', // System should look up that cue 220 is in "Amazing/Disappointing" on page 33
        createdAt: new Date(baseDate.getTime() - 43200000),
        updatedAt: new Date(baseDate.getTime() - 43200000),
      },
      // Additional 50 cue notes with varied statuses
      {
        id: 'cue-note-6',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Add follow spot pickup for Maria entrance',
        description: 'Follow spot 1 needs to pick up Maria on "How Do You Solve a Problem" entrance.',
        priority: 'very_high',
        status: 'todo',
        type: 'spot',
        cueNumber: '23',
        createdAt: new Date(baseDate.getTime() - 432000000),
        updatedAt: new Date(baseDate.getTime() - 432000000),
      },
      {
        id: 'cue-note-7',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Fix color temperature on church scene',
        description: 'Church interior feels too warm. Need cooler palette for religious atmosphere.',
        priority: 'medium',
        status: 'complete',
        type: 'designer',
        cueNumber: '45',
        createdAt: new Date(baseDate.getTime() - 518400000),
        updatedAt: new Date(baseDate.getTime() - 345600000),
      },
      {
        id: 'cue-note-8',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Gobo rotation speed adjustment',
        description: 'Cloud gobos rotating too fast during "Climb Every Mountain". Slow to 30 second rotation.',
        priority: 'low',
        status: 'cancelled',
        type: 'programmer',
        cueNumber: '156',
        createdAt: new Date(baseDate.getTime() - 604800000),
        updatedAt: new Date(baseDate.getTime() - 259200000),
      },
      {
        id: 'cue-note-9',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Add practical lamp cue for cottage scene',
        description: 'Need to turn on table lamp when Georg enters cottage in Act 2.',
        priority: 'medium',
        status: 'todo',
        type: 'cue',
        cueNumber: '189',
        createdAt: new Date(baseDate.getTime() - 172800000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      },
      {
        id: 'cue-note-10',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Ballroom chandelier timing',
        description: 'Chandelier practical needs to be on before curtain opens on ballroom scene.',
        priority: 'very_high',
        status: 'complete',
        type: 'cue',
        cueNumber: '78',
        createdAt: new Date(baseDate.getTime() - 345600000),
        updatedAt: new Date(baseDate.getTime() - 129600000),
      },
      {
        id: 'cue-note-11',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Storm effect needs more intensity',
        description: 'Lightning flashes during storm scene need to be brighter and more dramatic.',
        priority: 'very_high',
        status: 'todo',
        type: 'director',
        cueNumber: '234',
        createdAt: new Date(baseDate.getTime() - 86400000),
        updatedAt: new Date(baseDate.getTime() - 86400000),
      },
      {
        id: 'cue-note-12',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Follow spot color correction',
        description: 'Follow spot 2 reading too pink on Captain. Adjust to match key light color.',
        priority: 'medium',
        status: 'complete',
        type: 'spot',
        cueNumber: '67',
        createdAt: new Date(baseDate.getTime() - 432000000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      },
      {
        id: 'cue-note-13',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Sunset timing adjustment',
        description: 'Sunset progression during "Edelweiss" needs to be slower, about 90 seconds total.',
        priority: 'very_high',
        status: 'cancelled',
        type: 'programmer',
        cueNumber: '201',
        createdAt: new Date(baseDate.getTime() - 518400000),
        updatedAt: new Date(baseDate.getTime() - 259200000),
      },
      {
        id: 'cue-note-14',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Add haze for dream sequence',
        description: 'Need atmospheric haze during "My Favorite Things" dream ballet.',
        priority: 'medium',
        status: 'todo',
        type: 'choreographer',
        cueNumber: '34',
        createdAt: new Date(baseDate.getTime() - 259200000),
        updatedAt: new Date(baseDate.getTime() - 259200000),
      },
      {
        id: 'cue-note-15',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Blackout too abrupt on scene change',
        description: 'Need 1 second fade instead of snap blackout between garden and abbey.',
        priority: 'low',
        status: 'complete',
        type: 'cue',
        cueNumber: '112',
        createdAt: new Date(baseDate.getTime() - 604800000),
        updatedAt: new Date(baseDate.getTime() - 345600000),
      },
      {
        id: 'cue-note-16',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Orchestra pit lights too bright',
        description: 'Conductor complaining about spill into audience. Reduce pit lights by 20%.',
        priority: 'very_high',
        status: 'todo',
        type: 'production',
        cueNumber: '1',
        createdAt: new Date(baseDate.getTime() - 172800000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      },
      {
        id: 'cue-note-17',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Add side light for ensemble number',
        description: 'Ensemble getting lost in shadows during "Do Re Mi". Need more side light coverage.',
        priority: 'medium',
        status: 'complete',
        type: 'associate',
        cueNumber: '56',
        createdAt: new Date(baseDate.getTime() - 432000000),
        updatedAt: new Date(baseDate.getTime() - 129600000),
      },
      {
        id: 'cue-note-18',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Moonlight effect needs repositioning',
        description: 'Moonlight gobo hitting the wrong area of stage. Move to center more.',
        priority: 'low',
        status: 'cancelled',
        type: 'designer',
        cueNumber: '178',
        createdAt: new Date(baseDate.getTime() - 604800000),
        updatedAt: new Date(baseDate.getTime() - 432000000),
      },
      {
        id: 'cue-note-19',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Curtain call sequence timing',
        description: 'Need 3 second pause between each bow section for applause.',
        priority: 'very_high',
        status: 'todo',
        type: 'stage_manager',
        cueNumber: '270',
        createdAt: new Date(baseDate.getTime() - 43200000),
        updatedAt: new Date(baseDate.getTime() - 43200000),
      },
      {
        id: 'cue-note-20',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Fix strobe timing for lightning',
        description: 'Lightning strobe out of sync with thunder SFX. Advance by 0.5 seconds.',
        priority: 'very_high',
        status: 'complete',
        type: 'programmer',
        cueNumber: '236',
        createdAt: new Date(baseDate.getTime() - 345600000),
        updatedAt: new Date(baseDate.getTime() - 86400000),
      },
      {
        id: 'cue-note-21',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Practical window light flicker',
        description: 'Window practical needs subtle candle flicker effect during intimate scenes.',
        priority: 'medium',
        status: 'todo',
        type: 'assistant',
        cueNumber: '145',
        createdAt: new Date(baseDate.getTime() - 259200000),
        updatedAt: new Date(baseDate.getTime() - 259200000),
      },
      {
        id: 'cue-note-22',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Reduce intensity on upstage wash',
        description: 'Upstage wash overpowering during quiet dialogue scenes. Reduce to 75%.',
        priority: 'low',
        status: 'complete',
        type: 'cue',
        cueNumber: '89',
        createdAt: new Date(baseDate.getTime() - 518400000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      },
      {
        id: 'cue-note-23',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Add warmth to farewell scene',
        description: 'Final goodbye scene feels too clinical. Add amber tones for emotional warmth.',
        priority: 'very_high',
        status: 'cancelled',
        type: 'director',
        cueNumber: '258',
        createdAt: new Date(baseDate.getTime() - 432000000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      },
      {
        id: 'cue-note-24',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'FOH wash needs balancing',
        description: 'Stage left FOH positions brighter than stage right. Balance to match.',
        priority: 'medium',
        status: 'todo',
        type: 'programmer',
        cueNumber: '12',
        createdAt: new Date(baseDate.getTime() - 172800000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      },
      {
        id: 'cue-note-25',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Special effect for magic moment',
        description: 'Need sparkle effect when music box opens during "Sixteen Going on Seventeen".',
        priority: 'low',
        status: 'complete',
        type: 'think',
        cueNumber: '134',
        createdAt: new Date(baseDate.getTime() - 604800000),
        updatedAt: new Date(baseDate.getTime() - 259200000),
      },
      {
        id: 'cue-note-26',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Crossfade timing between songs',
        description: 'Transition from "Lonely Goatherd" to next scene needs smoother 8-second crossfade.',
        priority: 'medium',
        status: 'todo',
        type: 'cue',
        cueNumber: '98',
        createdAt: new Date(baseDate.getTime() - 345600000),
        updatedAt: new Date(baseDate.getTime() - 345600000),
      },
      {
        id: 'cue-note-27',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Reduce spill on cyclorama',
        description: 'Side lights spilling onto cyc during interior scenes. Add barn doors.',
        priority: 'very_high',
        status: 'complete',
        type: 'assistant',
        cueNumber: '167',
        createdAt: new Date(baseDate.getTime() - 518400000),
        updatedAt: new Date(baseDate.getTime() - 129600000),
      },
      {
        id: 'cue-note-28',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Add motivational light source',
        description: 'Morning scene needs visible sun angle from stage right window.',
        priority: 'medium',
        status: 'cancelled',
        type: 'designer',
        cueNumber: '203',
        createdAt: new Date(baseDate.getTime() - 432000000),
        updatedAt: new Date(baseDate.getTime() - 259200000),
      },
      {
        id: 'cue-note-29',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Safety light for stairs',
        description: 'Need subtle blue safety light on stairs during blackout transitions.',
        priority: 'very_high',
        status: 'todo',
        type: 'production',
        cueNumber: '0.5',
        createdAt: new Date(baseDate.getTime() - 86400000),
        updatedAt: new Date(baseDate.getTime() - 86400000),
      },
      {
        id: 'cue-note-30',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Intermission house light timing',
        description: 'House lights need to come up immediately after curtain down for intermission.',
        priority: 'very_high',
        status: 'complete',
        type: 'stage_manager',
        cueNumber: '150',
        createdAt: new Date(baseDate.getTime() - 345600000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      },
      {
        id: 'cue-note-31',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Color wash for party scene',
        description: 'Party scene needs festive color palette - reds, golds, and warm whites.',
        priority: 'medium',
        status: 'todo',
        type: 'choreographer',
        cueNumber: '76',
        createdAt: new Date(baseDate.getTime() - 259200000),
        updatedAt: new Date(baseDate.getTime() - 259200000),
      },
      {
        id: 'cue-note-32',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Adjust follow spot intensity',
        description: 'Follow spot too hot on solos. Reduce by 15% for better balance.',
        priority: 'low',
        status: 'complete',
        type: 'spot',
        cueNumber: '124',
        createdAt: new Date(baseDate.getTime() - 604800000),
        updatedAt: new Date(baseDate.getTime() - 345600000),
      },
      {
        id: 'cue-note-33',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Emergency backup cue sequence',
        description: 'Create backup lighting sequence in case of console failure during show.',
        priority: 'very_high',
        status: 'cancelled',
        type: 'programmer',
        cueNumber: '999',
        createdAt: new Date(baseDate.getTime() - 518400000),
        updatedAt: new Date(baseDate.getTime() - 432000000),
      },
      {
        id: 'cue-note-34',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Rim light for silhouette effect',
        description: 'Need strong rim light for dramatic silhouette during "Sound of Music" finale.',
        priority: 'medium',
        status: 'todo',
        type: 'associate',
        cueNumber: '267',
        createdAt: new Date(baseDate.getTime() - 172800000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      },
      {
        id: 'cue-note-35',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Dressing room call light',
        description: 'Connect dressing room call lights to main console for half-hour calls.',
        priority: 'low',
        status: 'complete',
        type: 'paperwork',
        cueNumber: '0.1',
        createdAt: new Date(baseDate.getTime() - 432000000),
        updatedAt: new Date(baseDate.getTime() - 129600000),
      },
      {
        id: 'cue-note-36',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Rain effect enhancement',
        description: 'Rain effect during storm needs more visual impact. Add moving lights.',
        priority: 'very_high',
        status: 'todo',
        type: 'director',
        cueNumber: '235',
        createdAt: new Date(baseDate.getTime() - 43200000),
        updatedAt: new Date(baseDate.getTime() - 43200000),
      },
      {
        id: 'cue-note-37',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Preset timing for scene changes',
        description: 'All scene change presets need to be at 3-second fade for smooth transitions.',
        priority: 'medium',
        status: 'complete',
        type: 'programmer',
        cueNumber: '0',
        createdAt: new Date(baseDate.getTime() - 345600000),
        updatedAt: new Date(baseDate.getTime() - 86400000),
      },
      {
        id: 'cue-note-38',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Footlight balance adjustment',
        description: 'Footlights creating unflattering shadows. Reduce to 60% intensity.',
        priority: 'low',
        status: 'cancelled',
        type: 'designer',
        cueNumber: '67',
        createdAt: new Date(baseDate.getTime() - 604800000),
        updatedAt: new Date(baseDate.getTime() - 518400000),
      },
      {
        id: 'cue-note-39',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Add texture for forest scene',
        description: 'Forest backdrop needs dappled leaf pattern projected from gobos.',
        priority: 'medium',
        status: 'todo',
        type: 'think',
        cueNumber: '45',
        createdAt: new Date(baseDate.getTime() - 259200000),
        updatedAt: new Date(baseDate.getTime() - 259200000),
      },
      {
        id: 'cue-note-40',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Work light safety protocol',
        description: 'Establish work light protocol for tech rehearsals and quick changes.',
        priority: 'very_high',
        status: 'complete',
        type: 'production',
        cueNumber: '900',
        createdAt: new Date(baseDate.getTime() - 518400000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      },
      {
        id: 'cue-note-41',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Costume reveal lighting',
        description: 'Special reveal lighting for Maria\'s wedding dress in final scene.',
        priority: 'very_high',
        status: 'todo',
        type: 'associate',
        cueNumber: '260',
        createdAt: new Date(baseDate.getTime() - 172800000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      },
      {
        id: 'cue-note-42',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Orchestra entrance lighting',
        description: 'Need subtle lighting for orchestra pit during overture entrance.',
        priority: 'medium',
        status: 'complete',
        type: 'cue',
        cueNumber: '2',
        createdAt: new Date(baseDate.getTime() - 432000000),
        updatedAt: new Date(baseDate.getTime() - 129600000),
      },
      {
        id: 'cue-note-43',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Backup power sequence',
        description: 'Program emergency lighting sequence for power failure scenarios.',
        priority: 'low',
        status: 'cancelled',
        type: 'programmer',
        cueNumber: '998',
        createdAt: new Date(baseDate.getTime() - 604800000),
        updatedAt: new Date(baseDate.getTime() - 432000000),
      },
      {
        id: 'cue-note-44',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Intimate dialogue scene adjustment',
        description: 'Love scene between Maria and Captain needs warmer, softer lighting.',
        priority: 'medium',
        status: 'todo',
        type: 'director',
        cueNumber: '187',
        createdAt: new Date(baseDate.getTime() - 345600000),
        updatedAt: new Date(baseDate.getTime() - 345600000),
      },
      {
        id: 'cue-note-45',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Children\'s entrance visibility',
        description: 'Children getting lost upstage during entrances. Add more upstage coverage.',
        priority: 'very_high',
        status: 'complete',
        type: 'choreographer',
        cueNumber: '34',
        createdAt: new Date(baseDate.getTime() - 518400000),
        updatedAt: new Date(baseDate.getTime() - 86400000),
      },
      {
        id: 'cue-note-46',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Sunset color progression',
        description: 'Sunset needs more realistic color progression from yellow to orange to red.',
        priority: 'low',
        status: 'todo',
        type: 'assistant',
        cueNumber: '200',
        createdAt: new Date(baseDate.getTime() - 259200000),
        updatedAt: new Date(baseDate.getTime() - 259200000),
      },
      {
        id: 'cue-note-47',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Spot operator training note',
        description: 'Train backup spot operator on all follow spot cues and timing.',
        priority: 'medium',
        status: 'complete',
        type: 'spot',
        cueNumber: '888',
        createdAt: new Date(baseDate.getTime() - 345600000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      },
      {
        id: 'cue-note-48',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Abbey atmosphere enhancement',
        description: 'Abbey scenes need more reverent atmosphere with cooler color temperature.',
        priority: 'very_high',
        status: 'cancelled',
        type: 'designer',
        cueNumber: '110',
        createdAt: new Date(baseDate.getTime() - 432000000),
        updatedAt: new Date(baseDate.getTime() - 259200000),
      },
      {
        id: 'cue-note-49',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Quick change blackout timing',
        description: 'Blackout for Captain\'s costume change needs to be exactly 8 seconds.',
        priority: 'very_high',
        status: 'todo',
        type: 'stage_manager',
        cueNumber: '199',
        createdAt: new Date(baseDate.getTime() - 43200000),
        updatedAt: new Date(baseDate.getTime() - 43200000),
      },
      {
        id: 'cue-note-50',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Festival scene energy boost',
        description: 'Festival scene feels flat. Add more saturated colors and dynamic movement.',
        priority: 'medium',
        status: 'complete',
        type: 'programmer',
        cueNumber: '180',
        createdAt: new Date(baseDate.getTime() - 518400000),
        updatedAt: new Date(baseDate.getTime() - 129600000),
      },
      {
        id: 'cue-note-51',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Curtain warmer adjustment',
        description: 'Curtain warmers need dimming during dialogue scenes to reduce ambient spill.',
        priority: 'low',
        status: 'todo',
        type: 'cue',
        cueNumber: '8',
        createdAt: new Date(baseDate.getTime() - 172800000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      },
      {
        id: 'cue-note-52',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Snow effect synchronization',
        description: 'Snow machine needs to sync with lighting for winter wonderland effect.',
        priority: 'very_high',
        status: 'complete',
        type: 'think',
        cueNumber: '240',
        createdAt: new Date(baseDate.getTime() - 345600000),
        updatedAt: new Date(baseDate.getTime() - 86400000),
      },
      {
        id: 'cue-note-53',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Exit sign dimming protocol',
        description: 'Exit signs too bright during performance. Install dimmer controls.',
        priority: 'medium',
        status: 'cancelled',
        type: 'production',
        cueNumber: '0.2',
        createdAt: new Date(baseDate.getTime() - 604800000),
        updatedAt: new Date(baseDate.getTime() - 432000000),
      },
      {
        id: 'cue-note-54',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Ensemble balance in finale',
        description: 'Ensemble getting washed out in finale number. Boost ensemble area lighting.',
        priority: 'very_high',
        status: 'todo',
        type: 'associate',
        cueNumber: '268',
        createdAt: new Date(baseDate.getTime() - 129600000),
        updatedAt: new Date(baseDate.getTime() - 129600000),
      },
      {
        id: 'cue-note-55',
        productionId: 'prod-1',
        moduleType: 'cue',
        title: 'Pre-show atmosphere creation',
        description: 'Create subtle pre-show lighting to set mood 30 minutes before curtain.',
        priority: 'low',
        status: 'complete',
        type: 'paperwork',
        cueNumber: '0.3',
        createdAt: new Date(baseDate.getTime() - 432000000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
      }
    ]

    const workNotes: Note[] = [
      {
        id: 'work-note-1',
        productionId: 'prod-1',
        moduleType: 'work',
        title: 'Replace lamp in Apron Truss DS position',
        description: 'HPL 575W burnt out during tech rehearsal. Unit 6 is dark.',
        priority: 'very_high',
        status: 'todo',
        type: 'work',
        createdAt: new Date(baseDate.getTime() - 43200000),
        updatedAt: new Date(baseDate.getTime() - 43200000),
        lightwrightItemId: '5A984A:1735:19:1B:Vecto', // Valid LWID from fixture data
        channelNumbers: '1', // Valid channel number from fixture data
        positionUnit: 'APRON TRUSS DS Unit 6',
        sceneryNeeds: 'Need ladder access, clear stage during work call',
      },
      {
        id: 'work-note-2',
        productionId: 'prod-1',
        moduleType: 'work',
        title: 'Focus 1E electric pipe',
        description: 'Focus all conventional units on 1E after hanging new fixtures. Need ladder work.',
        priority: 'medium',
        status: 'complete',
        type: 'focus',
        createdAt: new Date(baseDate.getTime() - 259200000),
        updatedAt: new Date(baseDate.getTime() - 86400000),
        lightwrightItemId: '5B6FC:1685:19:1B:Vecto', // Valid LWID from 1E position
        channelNumbers: '11-19', // Valid channel range from 1E electric
        positionUnit: '1E Units 1-9',
        sceneryNeeds: 'Coordinate with scenic for masking adjustments',
      },
      {
        id: 'work-note-3',
        productionId: 'prod-1',
        moduleType: 'work',
        title: 'Gel replacement for LED strip lights',
        description: 'Change diffusion on XBAR DECK units for softer wash coverage.',
        priority: 'medium',
        status: 'complete',
        type: 'work',
        createdAt: new Date(baseDate.getTime() - 345600000),
        updatedAt: new Date(baseDate.getTime() - 172800000),
        lightwrightItemId: '54D362:631:19:1B:Vecto', // Valid LWID from XBAR DECK
        channelNumbers: '401-415', // Valid channel range from XBAR DECK
        positionUnit: 'XBAR DECK Units 1-15',
        sceneryNeeds: 'Access from deck level during intermission only',
      },
      {
        id: 'work-note-4',
        productionId: 'prod-1',
        moduleType: 'work',
        title: 'Repair fog machine connection',
        description: 'Rain effect not triggering properly. Check DMX connection and fluid levels.',
        priority: 'very_high',
        status: 'todo',
        type: 'maintenance',
        createdAt: new Date(baseDate.getTime() - 21600000),
        updatedAt: new Date(baseDate.getTime() - 21600000),
        lightwrightItemId: '87432C:15E50:12:31:Matth', // Valid LWID from rain effect
        channelNumbers: '5001-5008', // Valid channel range for rain effects
        positionUnit: 'Rain Truss FX Units',
        sceneryNeeds: 'Need drain protection, notify wardrobe about moisture',
      },
      {
        id: 'work-note-5',
        productionId: 'prod-1',
        moduleType: 'work',
        title: 'Color temperature adjustment for practicals',
        description: 'Car headlights reading too cool. Need warmer tungsten look.',
        priority: 'medium',
        status: 'todo',
        type: 'focus',
        createdAt: new Date(baseDate.getTime() - 129600000),
        updatedAt: new Date(baseDate.getTime() - 129600000),
        lightwrightItemId: '5F8240:145D:19:1B:Vecto', // Valid LWID from practical
        channelNumbers: '441, 442, 447, 448', // Valid channel numbers for car headlights
        positionUnit: 'Car Headlight Rack',
        sceneryNeeds: 'Coordinate with props for vehicle positioning',
      }
    ]

    const productionNotes: Note[] = [
      {
        id: 'production-note-1',
        productionId: 'prod-1',
        moduleType: 'production',
        title: 'Set piece height blocking front light',
        description: 'Upstage platform at 4 feet blocks key light from FOH positions. Need to adjust platform height or add additional front light positions.',
        priority: 'very_high',
        status: 'todo',
        type: 'scenic',
        createdAt: new Date(baseDate.getTime() - 21600000),
        updatedAt: new Date(baseDate.getTime() - 21600000),
      },
      {
        id: 'production-note-2',
        productionId: 'prod-1',
        moduleType: 'production',
        title: 'Approved paint colors for set',
        description: 'Warmer beige will work better with lighting palette. Received final approval from director and designer.',
        priority: 'medium',
        status: 'complete',
        type: 'scenic',
        createdAt: new Date(baseDate.getTime() - 432000000),
        updatedAt: new Date(baseDate.getTime() - 345600000),
      },
      {
        id: 'production-note-3',
        productionId: 'prod-1',
        moduleType: 'production',
        title: 'Costume color conflicts with lighting',
        description: 'Lead actress red dress washes out under warm washes. Working with costume designer on alternative fabric or lighting adjustment.',
        priority: 'medium',
        status: 'todo',
        type: 'costume',
        createdAt: new Date(baseDate.getTime() - 129600000),
        updatedAt: new Date(baseDate.getTime() - 129600000),
      },
      {
        id: 'production-note-4',
        productionId: 'prod-1',
        moduleType: 'production',
        title: 'Sound equipment placement coordination',
        description: 'New speaker positions conflict with lighting positions. Need to coordinate placement during load-in.',
        priority: 'very_high',
        status: 'todo',
        type: 'sound',
        createdAt: new Date(baseDate.getTime() - 86400000),
        updatedAt: new Date(baseDate.getTime() - 86400000),
      },
      {
        id: 'production-note-5',
        productionId: 'prod-1',
        moduleType: 'production',
        title: 'Fire marshal inspection requirements',
        description: 'All fog effects and electrical equipment need inspection before opening. Schedule appointment for final dress rehearsal.',
        priority: 'very_high',
        status: 'complete',
        type: 'safety',
        createdAt: new Date(baseDate.getTime() - 604800000),
        updatedAt: new Date(baseDate.getTime() - 259200000),
      }
    ]

    set({
      notes: {
        cue: cueNotes,
        work: workNotes,
        production: productionNotes
      }
    })
  }
}))
