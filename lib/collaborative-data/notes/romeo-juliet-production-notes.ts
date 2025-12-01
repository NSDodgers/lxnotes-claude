/**
 * Romeo and Juliet Production Notes
 *
 * Cross-department communication notes.
 */

import type { Note } from '@/types'

export const RJ_PRODUCTION_NOTES: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    productionId: 'rj-1',
    moduleType: 'production',
    title: 'Sword fight choreography blocking front light',
    description:
      'Fight choreographer reports actors in shadow during Mercutio/Tybalt fight. Current blocking puts them between two specials. Options: reblock fight 2ft downstage OR add intermediate special.',
    priority: 'very_high',
    status: 'todo',
    type: 'scenic',
  },
  {
    productionId: 'rj-1',
    moduleType: 'production',
    title: 'Juliet dress color for balcony scene',
    description:
      'Costume designer asks about lighting color for balcony. Juliet\'s dress is pale blue - current moonlight wash (R60) works well. Confirm no changes to color palette.',
    priority: 'medium',
    status: 'complete',
    type: 'costume',
  },
  {
    productionId: 'rj-1',
    moduleType: 'production',
    title: 'Tomb fog effect coordination',
    description:
      'Props and LX need to coordinate fog timing. Fog must clear for final tableau but sustain through Romeo death. Suggest starting fog at cue 120, stopping at cue 140.',
    priority: 'high',
    status: 'todo',
    type: 'scenic',
  },
  {
    productionId: 'rj-1',
    moduleType: 'production',
    title: 'Sound speaker placement conflict',
    description:
      'Sound wants to add speaker on SR boom. Will shadow existing side light position. Need to negotiate placement or refocus sidelight.',
    priority: 'high',
    status: 'todo',
    type: 'sound',
  },
  {
    productionId: 'rj-1',
    moduleType: 'production',
    title: 'Balcony platform height concern',
    description:
      'Scenic wants to raise balcony 6 inches for sightlines. Will affect current special focus. If approved, will need to refocus units 45-48.',
    priority: 'medium',
    status: 'todo',
    type: 'scenic',
  },
  {
    productionId: 'rj-1',
    moduleType: 'production',
    title: 'Quick change booth lighting',
    description:
      'Wardrobe needs blue work lights in SR quick change booth. Currently too dark for costume changes. Add shielded blue LED strip.',
    priority: 'medium',
    status: 'todo',
    type: 'costume',
  },
  {
    productionId: 'rj-1',
    moduleType: 'production',
    title: 'Chandelier rigging coordination',
    description:
      'Fly crew needs LX present for chandelier hang. Practical wiring must connect before unit goes to trim. Schedule for Tuesday AM.',
    priority: 'high',
    status: 'complete',
    type: 'scenic',
  },
  {
    productionId: 'rj-1',
    moduleType: 'production',
    title: 'Opening night house lights preset',
    description:
      'House manager requests special preset for opening night reception. Warm amber at 50% for lobby. Coordinate with building electrician.',
    priority: 'low',
    status: 'todo',
    type: 'scenic',
  },
  {
    productionId: 'rj-1',
    moduleType: 'production',
    title: 'Strobe effect safety discussion',
    description:
      'Director considering strobe for party scene. Need to confirm photosensitivity warnings in program and pre-show announcement. Check venue policy.',
    priority: 'very_high',
    status: 'todo',
    type: 'sound',
  },
  {
    productionId: 'rj-1',
    moduleType: 'production',
    title: 'Rehearsal lighting request',
    description:
      'Stage manager asks for additional work light during fight calls. Current rehearsal light inadequate for safety. Add temporary positions.',
    priority: 'high',
    status: 'complete',
    type: 'scenic',
  },
]
