/**
 * Romeo and Juliet Script Data
 *
 * Authentic Shakespeare structure: Prologue + 5 Acts with 24 scenes
 */

import type { ScriptPage, SceneSong } from '@/lib/storage/adapter'

// Generate script pages (approximately 100 pages for the play)
export const RJ_PAGES: ScriptPage[] = Array.from({ length: 100 }, (_, i) => ({
  id: `rj-page-${i + 1}`,
  pageNumber: String(i + 1),
  firstCueNumber: i === 0 ? '1' : undefined,
}))

// Scenes organized by act
export const RJ_SCENES_SONGS: SceneSong[] = [
  // Prologue
  {
    id: 'rj-prologue',
    name: 'Prologue - Two households, both alike in dignity',
    type: 'scene',
  },

  // Act 1
  {
    id: 'rj-1-1',
    name: 'Act 1, Scene 1 - A public place (Opening brawl)',
    type: 'scene',
  },
  {
    id: 'rj-1-2',
    name: 'Act 1, Scene 2 - A street (Paris asks for Juliet)',
    type: 'scene',
  },
  {
    id: 'rj-1-3',
    name: "Act 1, Scene 3 - Capulet's house (Lady Capulet and Nurse)",
    type: 'scene',
  },
  {
    id: 'rj-1-4',
    name: 'Act 1, Scene 4 - A street (Queen Mab speech)',
    type: 'scene',
  },
  {
    id: 'rj-1-5',
    name: "Act 1, Scene 5 - Capulet's hall (The ball, first meeting)",
    type: 'scene',
  },

  // Act 2
  {
    id: 'rj-2-prologue',
    name: 'Act 2, Prologue - Chorus',
    type: 'scene',
  },
  {
    id: 'rj-2-1',
    name: "Act 2, Scene 1 - Lane by Capulet's orchard",
    type: 'scene',
  },
  {
    id: 'rj-2-2',
    name: "Act 2, Scene 2 - Capulet's orchard (Balcony scene)",
    type: 'scene',
  },
  {
    id: 'rj-2-3',
    name: "Act 2, Scene 3 - Friar Lawrence's cell",
    type: 'scene',
  },
  {
    id: 'rj-2-4',
    name: 'Act 2, Scene 4 - A street (Nurse seeks Romeo)',
    type: 'scene',
  },
  {
    id: 'rj-2-5',
    name: "Act 2, Scene 5 - Capulet's orchard (Nurse brings news)",
    type: 'scene',
  },
  {
    id: 'rj-2-6',
    name: "Act 2, Scene 6 - Friar Lawrence's cell (Secret wedding)",
    type: 'scene',
  },

  // Act 3
  {
    id: 'rj-3-1',
    name: 'Act 3, Scene 1 - A public place (Mercutio and Tybalt die)',
    type: 'scene',
  },
  {
    id: 'rj-3-2',
    name: "Act 3, Scene 2 - Capulet's orchard (Juliet learns of banishment)",
    type: 'scene',
  },
  {
    id: 'rj-3-3',
    name: "Act 3, Scene 3 - Friar Lawrence's cell (Romeo's despair)",
    type: 'scene',
  },
  {
    id: 'rj-3-4',
    name: "Act 3, Scene 4 - Capulet's house (Paris wedding planned)",
    type: 'scene',
  },
  {
    id: 'rj-3-5',
    name: "Act 3, Scene 5 - Juliet's chamber (Dawn farewell)",
    type: 'scene',
  },

  // Act 4
  {
    id: 'rj-4-1',
    name: "Act 4, Scene 1 - Friar Lawrence's cell (Sleeping potion)",
    type: 'scene',
  },
  {
    id: 'rj-4-2',
    name: "Act 4, Scene 2 - Capulet's house (Wedding preparations)",
    type: 'scene',
  },
  {
    id: 'rj-4-3',
    name: "Act 4, Scene 3 - Juliet's chamber (Juliet takes potion)",
    type: 'scene',
  },
  {
    id: 'rj-4-4',
    name: "Act 4, Scene 4 - Capulet's house (Wedding morning)",
    type: 'scene',
  },
  {
    id: 'rj-4-5',
    name: "Act 4, Scene 5 - Juliet's chamber (Juliet found 'dead')",
    type: 'scene',
  },

  // Act 5
  {
    id: 'rj-5-1',
    name: 'Act 5, Scene 1 - Mantua (Romeo hears of Juliet\'s death)',
    type: 'scene',
  },
  {
    id: 'rj-5-2',
    name: "Act 5, Scene 2 - Friar Lawrence's cell (Letter not delivered)",
    type: 'scene',
  },
  {
    id: 'rj-5-3',
    name: "Act 5, Scene 3 - Capulet's monument (The tomb)",
    type: 'scene',
  },
]
