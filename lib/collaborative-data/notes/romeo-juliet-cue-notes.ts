/**
 * Romeo and Juliet Cue Notes
 *
 * Pre-populated lighting cue notes for the production.
 */

import type { Note } from '@/types'

export const RJ_CUE_NOTES: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Prologue
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Prologue - Chorus entrance spotlight',
    description:
      'Single tight spot on Chorus member, rest of stage dark. Fade up over 5 count as they speak "Two households..."',
    priority: 'very_high',
    status: 'todo',
    type: 'cue',
    cueNumber: '1',
    sceneSongId: 'rj-prologue',
  },

  // Act 1
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Opening brawl - Hot daylight',
    description:
      'Bright, harsh amber wash to establish hot Verona street. Add breakup gobo for dappled sunlight effect.',
    priority: 'high',
    status: 'todo',
    type: 'designer',
    cueNumber: '5',
    sceneSongId: 'rj-1-1',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Prince entrance - Authority wash',
    description:
      'Cool blue/white wash from above when Prince enters to break up fight. Represent authority and order.',
    priority: 'medium',
    status: 'complete',
    type: 'cue',
    cueNumber: '12',
    sceneSongId: 'rj-1-1',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Queen Mab speech - Dream sequence',
    description:
      'Subtle purple/blue shift during Mercutio\'s Queen Mab speech. Consider moving light effect or slow chase.',
    priority: 'high',
    status: 'todo',
    type: 'designer',
    cueNumber: '22',
    sceneSongId: 'rj-1-4',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Capulet ball - Grand entrance',
    description:
      'Warm amber/gold wash, chandeliers at full intensity. Festive atmosphere with dancing specials. Consider haze for ambiance.',
    priority: 'very_high',
    status: 'todo',
    type: 'choreographer',
    cueNumber: '25',
    sceneSongId: 'rj-1-5',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Romeo sees Juliet - Isolation special',
    description:
      'When Romeo first sees Juliet across the room. Tight special on her, everything else dims. "Did my heart love till now?"',
    priority: 'very_high',
    status: 'todo',
    type: 'cue',
    cueNumber: '28',
    sceneSongId: 'rj-1-5',
  },

  // Act 2 - Balcony Scene
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Balcony scene - Moonlight effect',
    description:
      'Romantic blue/white wash from stage right simulating moonlight. Add gobo for tree shadow on balcony. This is the signature look.',
    priority: 'very_high',
    status: 'todo',
    type: 'designer',
    cueNumber: '45',
    sceneSongId: 'rj-2-2',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Balcony - Dawn warning',
    description:
      'Subtle warm shift as they talk through the night. Pink/amber creeping in from stage left to suggest approaching dawn.',
    priority: 'medium',
    status: 'todo',
    type: 'cue',
    cueNumber: '52',
    sceneSongId: 'rj-2-2',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Secret wedding - Friar cell interior',
    description:
      'Warm candlelight effect inside Friar Lawrence\'s cell. Shaft of light through window creating cross pattern on floor.',
    priority: 'high',
    status: 'todo',
    type: 'cue',
    cueNumber: '65',
    sceneSongId: 'rj-2-6',
  },

  // Act 3 - Turning point
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Mercutio death - Harsh reality',
    description:
      'Strip away romantic moonlight. Return to harsh daylight but now feels threatening. Red wash grows as Tybalt kills Mercutio.',
    priority: 'very_high',
    status: 'todo',
    type: 'designer',
    cueNumber: '72',
    sceneSongId: 'rj-3-1',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Romeo kills Tybalt - Blood red flash',
    description:
      'Quick red flash/pulse on the killing stroke. Then sudden blackout except for Romeo in pool of light.',
    priority: 'high',
    status: 'todo',
    type: 'cue',
    cueNumber: '78',
    sceneSongId: 'rj-3-1',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Dawn farewell - Lark vs nightingale',
    description:
      'Gradual dawn light creeping through Juliet\'s window. Pink to amber shift during "It was the lark" / "It was the nightingale".',
    priority: 'high',
    status: 'todo',
    type: 'cue',
    cueNumber: '88',
    sceneSongId: 'rj-3-5',
  },

  // Act 4
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Juliet takes potion - Isolation in fear',
    description:
      'Tight spot on Juliet as she takes potion. Surrounding darkness represents her fear and isolation. Slow fade to black.',
    priority: 'very_high',
    status: 'todo',
    type: 'director',
    cueNumber: '102',
    sceneSongId: 'rj-4-3',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Juliet found dead - Morning shock',
    description:
      'Bright morning light contrasts with discovery of Juliet\'s "death". Harsh, unforgiving daylight.',
    priority: 'medium',
    status: 'complete',
    type: 'cue',
    cueNumber: '110',
    sceneSongId: 'rj-4-5',
  },

  // Act 5 - Tomb scene
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Tomb exterior - Moonlit churchyard',
    description:
      'Cold blue moonlight on tomb exterior. Fog/haze recommended. Ominous atmosphere.',
    priority: 'high',
    status: 'todo',
    type: 'designer',
    cueNumber: '120',
    sceneSongId: 'rj-5-3',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Tomb interior - Death light',
    description:
      'Cold, deathly light inside tomb. Juliet illuminated on bier. Candles or practical torches for Romeo.',
    priority: 'very_high',
    status: 'todo',
    type: 'cue',
    cueNumber: '125',
    sceneSongId: 'rj-5-3',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Romeo drinks poison - Final light',
    description:
      'Warm light returns briefly as Romeo looks at Juliet. "Thus with a kiss I die." Then cold snap back.',
    priority: 'very_high',
    status: 'todo',
    type: 'cue',
    cueNumber: '132',
    sceneSongId: 'rj-5-3',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Juliet wakes - Hope then despair',
    description:
      'Brief warm glow as Juliet wakes, immediately shifts cold as she discovers Romeo dead.',
    priority: 'high',
    status: 'todo',
    type: 'cue',
    cueNumber: '138',
    sceneSongId: 'rj-5-3',
  },
  {
    productionId: 'rj-1',
    moduleType: 'cue',
    title: 'Final tableau - Dawn of reconciliation',
    description:
      'Slow dawn build as families reconcile over bodies. "A glooming peace this morning with it brings." Full stage wash, somber but hopeful.',
    priority: 'very_high',
    status: 'todo',
    type: 'designer',
    cueNumber: '145',
    sceneSongId: 'rj-5-3',
  },
]
