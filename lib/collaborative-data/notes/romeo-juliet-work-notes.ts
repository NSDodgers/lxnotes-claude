/**
 * Romeo and Juliet Work Notes
 *
 * Pre-populated equipment and technical task notes.
 */

import type { Note } from '@/types'

export const RJ_WORK_NOTES: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    productionId: 'rj-1',
    moduleType: 'work',
    title: 'Focus balcony special',
    description:
      'Special on Juliet balcony position needs tighter focus. Currently spilling onto wall behind. Should be tight pool on her mark.',
    priority: 'very_high',
    status: 'todo',
    type: 'focus',
    channelNumbers: '45',
  },
  {
    productionId: 'rj-1',
    moduleType: 'work',
    title: 'Replace gobo in tree pattern unit',
    description:
      'Gobo in FOH position showing wear/burn marks. Moonlight tree shadow pattern degrading. Need replacement gobo.',
    priority: 'high',
    status: 'todo',
    type: 'maintenance',
    channelNumbers: '112',
  },
  {
    productionId: 'rj-1',
    moduleType: 'work',
    title: 'Check DMX on upstage strip',
    description:
      'Intermittent flicker on upstage cyc strip. Could be DMX cable or terminator. Need to troubleshoot during next work call.',
    priority: 'high',
    status: 'todo',
    type: 'troubleshoot',
    channelNumbers: '201-216',
  },
  {
    productionId: 'rj-1',
    moduleType: 'work',
    title: 'Add fog machine for tomb scene',
    description:
      'Director wants low-lying fog for tomb scene. Need to set up cracker/chiller unit stage right. Test timing with cue sequence.',
    priority: 'very_high',
    status: 'todo',
    type: 'install',
    channelNumbers: 'FOG-1',
  },
  {
    productionId: 'rj-1',
    moduleType: 'work',
    title: 'Chandelier practical check',
    description:
      'Ball scene chandelier practicals need testing. One bulb reported out. Verify all 24 candle bulbs working.',
    priority: 'medium',
    status: 'complete',
    type: 'maintenance',
    channelNumbers: '301-302',
  },
  {
    productionId: 'rj-1',
    moduleType: 'work',
    title: 'Program moonlight chase',
    description:
      'Create subtle slow chase for moonlight wash during balcony scene. Very slow drift to simulate clouds. Max 10% intensity variation.',
    priority: 'medium',
    status: 'todo',
    type: 'programming',
    channelNumbers: '55-62',
  },
  {
    productionId: 'rj-1',
    moduleType: 'work',
    title: 'Install followspot #2',
    description:
      'Need second followspot for ball scene. Romeo and Juliet both need isolated coverage. Position in booth window 2.',
    priority: 'high',
    status: 'todo',
    type: 'install',
    channelNumbers: 'SPOT-2',
  },
  {
    productionId: 'rj-1',
    moduleType: 'work',
    title: 'Color scroll maintenance',
    description:
      'Color scroller on downstage left making noise. Needs cleaning and re-tensioning. Currently using gels as backup.',
    priority: 'medium',
    status: 'todo',
    type: 'maintenance',
    channelNumbers: '33',
  },
  {
    productionId: 'rj-1',
    moduleType: 'work',
    title: 'Verify safety cables on grid',
    description:
      'Quarterly safety check due. Need to verify all safety cables on grid positions. Document any concerns.',
    priority: 'high',
    status: 'todo',
    type: 'safety',
    channelNumbers: 'ALL',
  },
  {
    productionId: 'rj-1',
    moduleType: 'work',
    title: 'Focus sword fight specials',
    description:
      'Fight choreographer marked new positions. Need to refocus 4 specials for Mercutio/Tybalt fight. See blocking notes.',
    priority: 'very_high',
    status: 'todo',
    type: 'focus',
    channelNumbers: '85-88',
  },
  {
    productionId: 'rj-1',
    moduleType: 'work',
    title: 'Test red flash effect',
    description:
      'Director wants quick red flash when Romeo kills Tybalt. Program LED strip for 0.2s flash. Test with stage management.',
    priority: 'medium',
    status: 'complete',
    type: 'programming',
    channelNumbers: '250-265',
  },
  {
    productionId: 'rj-1',
    moduleType: 'work',
    title: 'Gel replacement - amber wash',
    description:
      'Amber gels in FOH wash showing fade. Need to replace before dress rehearsal. R02 to R05 conversion per designer.',
    priority: 'medium',
    status: 'todo',
    type: 'maintenance',
    channelNumbers: '1-12',
  },
]
