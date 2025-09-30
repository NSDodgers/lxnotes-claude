/**
 * Cue Notes Module - Main component for theatrical lighting cue management
 * Manages notes linked to specific lighting cues, script pages, and scenes/songs
 */
'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CueNotesTable } from '@/components/notes-table/cue-notes-table'
import { AddNoteDialog } from '@/components/add-note-dialog'
import { EmailNotesSidebar } from '@/components/email-notes-sidebar'
import { PrintNotesSidebar } from '@/components/print-notes-sidebar'
import { useState, useEffect } from 'react'
import { Plus, Search, Lightbulb, FileText, Mail, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note, NoteStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { useProductionStore } from '@/lib/stores/production-store'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { ScriptManager } from '@/components/script-manager'

// Mock data for development
const mockCueNotes: Note[] = [
  // Cue type notes
  {
    id: '1',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Fade house lights on page 23',
    description: 'Slow fade to 50% over 3 seconds when actor enters',
    priority: 'critical',
    status: 'todo',
    type: 'cue',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
    scriptPageId: 'cue-127',
    sceneSongId: 'Act1-Scene3',
  },
  {
    id: '2',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Blackout after finale',
    description: 'Complete blackout in 2 counts',
    priority: 'medium',
    status: 'complete',
    type: 'cue',
    createdAt: new Date('2024-01-14T14:20:00'),
    updatedAt: new Date('2024-01-16T09:15:00'),
    scriptPageId: 'cue-245',
    sceneSongId: 'Act2-Finale',
  },
  {
    id: '3',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Intermission preset too bright',
    description: 'Reduce intensity to 75% for house lights',
    priority: 'very_low',
    status: 'cancelled',
    type: 'cue',
    createdAt: new Date('2024-01-13T16:45:00'),
    updatedAt: new Date('2024-01-14T11:30:00'),
    scriptPageId: 'cue-156',
    sceneSongId: 'Intermission',
  },
  // Director type notes
  {
    id: '4',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Need more dramatic lighting for death scene',
    description: 'Director wants stronger side light and deeper shadows',
    priority: 'critical',
    status: 'todo',
    type: 'director',
    createdAt: new Date('2024-01-16T11:00:00'),
    updatedAt: new Date('2024-01-16T11:00:00'),
    scriptPageId: 'cue-78',
    sceneSongId: 'Act2-Scene1',
  },
  {
    id: '5',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Approved new color palette for ballroom',
    description: 'Warmer tones approved, shift from cool blue to amber',
    priority: 'medium',
    status: 'complete',
    type: 'director',
    createdAt: new Date('2024-01-12T13:30:00'),
    updatedAt: new Date('2024-01-15T10:45:00'),
    scriptPageId: 'cue-89',
    sceneSongId: 'Act1-Ballroom',
  },
  // Choreographer type notes
  {
    id: '6',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Dance number needs center special',
    description: 'Tight special on lead dancer for solo section',
    priority: 'medium',
    status: 'todo',
    type: 'choreographer',
    createdAt: new Date('2024-01-15T09:20:00'),
    updatedAt: new Date('2024-01-15T09:20:00'),
    scriptPageId: 'cue-34',
    sceneSongId: 'Act1-DanceNumber',
  },
  {
    id: '7',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Remove upstage wash during tap sequence',
    description: 'Too much spill light affecting the precision work',
    priority: 'very_low',
    status: 'cancelled',
    type: 'choreographer',
    createdAt: new Date('2024-01-11T15:15:00'),
    updatedAt: new Date('2024-01-13T14:20:00'),
    scriptPageId: 'cue-203',
    sceneSongId: 'Act2-TapNumber',
  },
  // Designer type notes
  {
    id: '8',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Blue wash for dream sequence',
    description: 'Deep blue with breakup gobos, fade in over 8 counts',
    priority: 'medium',
    status: 'complete',
    type: 'designer',
    createdAt: new Date('2024-01-10T16:30:00'),
    updatedAt: new Date('2024-01-14T12:45:00'),
    scriptPageId: 'cue-45',
    sceneSongId: 'Act1-DreamSequence',
  },
  {
    id: '9',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Add texture to forest scene',
    description: 'Use leaf breakup gobos on trees, R79 color',
    priority: 'critical',
    status: 'todo',
    type: 'designer',
    createdAt: new Date('2024-01-16T08:45:00'),
    updatedAt: new Date('2024-01-16T08:45:00'),
    scriptPageId: 'cue-112',
    sceneSongId: 'Act1-Forest',
  },
  // Stage Manager type notes
  {
    id: '10',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Pre-show checklist updated',
    description: 'Added new safety check for fly system integration',
    priority: 'medium',
    status: 'complete',
    type: 'stage_manager',
    scriptPageId: 'cue-1',
    createdAt: new Date('2024-01-14T07:30:00'),
    updatedAt: new Date('2024-01-15T18:20:00'),
  },
  {
    id: '11',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Cue timing adjustments needed',
    description: 'Several cues running late, need to tighten timing',
    priority: 'critical',
    status: 'todo',
    type: 'stage_manager',
    scriptPageId: 'cue-145',
    createdAt: new Date('2024-01-16T19:15:00'),
    updatedAt: new Date('2024-01-16T19:15:00'),
  },
  // Associate type notes
  {
    id: '12',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Focus session notes compiled',
    description: 'All focus notes from yesterday organized and prioritized',
    priority: 'very_low',
    status: 'complete',
    type: 'associate',
    scriptPageId: 'cue-78',
    createdAt: new Date('2024-01-13T20:30:00'),
    updatedAt: new Date('2024-01-14T09:45:00'),
  },
  {
    id: '13',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Research color temperature options',
    description: 'Need warmer options for intimate scenes',
    priority: 'medium',
    status: 'cancelled',
    type: 'associate',
    scriptPageId: 'cue-234',
    createdAt: new Date('2024-01-12T11:00:00'),
    updatedAt: new Date('2024-01-15T16:30:00'),
  },
  // Assistant type notes
  {
    id: '14',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Cable management in booth',
    description: 'Organize control cables to prevent interference',
    priority: 'very_low',
    status: 'todo',
    type: 'assistant',
    scriptPageId: 'cue-15',
    createdAt: new Date('2024-01-15T12:15:00'),
    updatedAt: new Date('2024-01-15T12:15:00'),
  },
  // Spot type notes
  {
    id: '15',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Spotlight follow for solo',
    description: 'Track performer during song, stage right to center',
    priority: 'critical',
    status: 'complete',
    type: 'spot',
    createdAt: new Date('2024-01-14T17:00:00'),
    updatedAt: new Date('2024-01-16T20:30:00'),
    scriptPageId: 'cue-67',
    sceneSongId: 'Act2-Solo',
  },
  {
    id: '16',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Spot operator needs better sightlines',
    description: 'Move position slightly stage left for Act 2',
    priority: 'medium',
    status: 'cancelled',
    type: 'spot',
    scriptPageId: 'cue-167',
    createdAt: new Date('2024-01-13T18:45:00'),
    updatedAt: new Date('2024-01-14T10:15:00'),
  },
  // Programmer type notes
  {
    id: '17',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Optimize memory usage in console',
    description: 'Remove unused palettes and groups',
    priority: 'very_low',
    status: 'complete',
    type: 'programmer',
    scriptPageId: 'cue-25',
    createdAt: new Date('2024-01-11T14:20:00'),
    updatedAt: new Date('2024-01-12T16:45:00'),
  },
  {
    id: '18',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Program backup sequences',
    description: 'Create alternate cues for emergency situations',
    priority: 'critical',
    status: 'todo',
    type: 'programmer',
    scriptPageId: 'cue-98',
    createdAt: new Date('2024-01-16T13:30:00'),
    updatedAt: new Date('2024-01-16T13:30:00'),
  },
  // Production type notes
  {
    id: '19',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Budget approval for additional fixtures',
    description: 'Request approved for 6 additional LED pars',
    priority: 'medium',
    status: 'complete',
    type: 'production',
    scriptPageId: 'cue-56',
    createdAt: new Date('2024-01-09T10:00:00'),
    updatedAt: new Date('2024-01-11T15:30:00'),
  },
  // Paperwork type notes
  {
    id: '20',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Update lighting plot with changes',
    description: 'Reflect all modifications made during tech week',
    priority: 'medium',
    status: 'todo',
    type: 'paperwork',
    scriptPageId: 'cue-189',
    createdAt: new Date('2024-01-16T16:00:00'),
    updatedAt: new Date('2024-01-16T16:00:00'),
  },
  {
    id: '21',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Archive previous show files',
    description: 'Clean up console and backup important files',
    priority: 'very_low',
    status: 'cancelled',
    type: 'paperwork',
    scriptPageId: 'cue-301',
    createdAt: new Date('2024-01-10T09:30:00'),
    updatedAt: new Date('2024-01-12T14:00:00'),
  },
  // Think type notes
  {
    id: '22',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Consider alternative approach to storm scene',
    description: 'Current lightning effect not convincing enough',
    priority: 'critical',
    status: 'todo',
    type: 'think',
    scriptPageId: 'cue-178',
    createdAt: new Date('2024-01-15T21:45:00'),
    updatedAt: new Date('2024-01-15T21:45:00'),
    sceneSongId: 'Act2-Storm',
  },
  {
    id: '23',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Evaluate LED vs conventional for specials',
    description: 'Cost-benefit analysis completed, recommend LED',
    priority: 'medium',
    status: 'complete',
    type: 'think',
    scriptPageId: 'cue-67',
    createdAt: new Date('2024-01-08T11:20:00'),
    updatedAt: new Date('2024-01-10T13:15:00'),
  },
  // Additional 100 mock cue notes
  {
    id: '24',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Opening wash too bright',
    description: 'Reduce general wash to 85% for better mood',
    priority: 'medium',
    status: 'todo',
    type: 'cue',
    scriptPageId: 'cue-1',
    createdAt: new Date('2024-01-17T09:00:00'),
    updatedAt: new Date('2024-01-17T09:00:00'),
    sceneSongId: 'Act1-Opening',
  },
  {
    id: '25',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'First entrance special needs focus',
    description: 'Protagonist special hitting upstage too much',
    priority: 'very_high',
    status: 'todo',
    type: 'director',
    scriptPageId: 'cue-5',
    createdAt: new Date('2024-01-17T10:15:00'),
    updatedAt: new Date('2024-01-17T10:15:00'),
    sceneSongId: 'Act1-Scene1',
  },
  {
    id: '26',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Love scene needs warmer color',
    description: 'Add L201 to create romantic atmosphere',
    priority: 'medium',
    status: 'complete',
    type: 'designer',
    scriptPageId: 'cue-23',
    createdAt: new Date('2024-01-16T14:30:00'),
    updatedAt: new Date('2024-01-17T11:00:00'),
    sceneSongId: 'Act1-Scene4',
  },
  {
    id: '27',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Dance number cyc color change',
    description: 'Sequence through R26, G200, B200 during chorus',
    priority: 'critical',
    status: 'todo',
    type: 'choreographer',
    scriptPageId: 'cue-34',
    createdAt: new Date('2024-01-17T13:45:00'),
    updatedAt: new Date('2024-01-17T13:45:00'),
    sceneSongId: 'Act1-DanceNumber',
  },
  {
    id: '28',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Ghost light effect malfunction',
    description: 'LED strip not responding to DMX signal',
    priority: 'critical',
    status: 'todo',
    type: 'spot',
    scriptPageId: 'cue-45',
    createdAt: new Date('2024-01-17T16:20:00'),
    updatedAt: new Date('2024-01-17T16:20:00'),
    sceneSongId: 'Act1-Scene7',
  },
  {
    id: '29',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Sunset timing adjustment needed',
    description: 'Extend fade time from 8 to 12 seconds',
    priority: 'medium',
    status: 'complete',
    type: 'stage_manager',
    scriptPageId: 'cue-67',
    createdAt: new Date('2024-01-16T19:30:00'),
    updatedAt: new Date('2024-01-17T08:15:00'),
    sceneSongId: 'Act1-Finale',
  },
  {
    id: '30',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Act 2 preset levels',
    description: 'Document current intensity levels for all channels',
    priority: 'low',
    status: 'complete',
    type: 'paperwork',
    scriptPageId: 'cue-89',
    createdAt: new Date('2024-01-15T20:00:00'),
    updatedAt: new Date('2024-01-16T10:30:00'),
    sceneSongId: 'Act2-Opening',
  },
  {
    id: '31',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Mirror ball motor replacement',
    description: 'Current motor too noisy during quiet scenes',
    priority: 'medium',
    status: 'todo',
    type: 'assistant',
    scriptPageId: 'cue-101',
    createdAt: new Date('2024-01-17T14:45:00'),
    updatedAt: new Date('2024-01-17T14:45:00'),
    sceneSongId: 'Act2-Scene3',
  },
  {
    id: '32',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Storm sequence programming',
    description: 'Create lightning chase effect on backdrop',
    priority: 'very_high',
    status: 'todo',
    type: 'programmer',
    scriptPageId: 'cue-123',
    createdAt: new Date('2024-01-17T11:00:00'),
    updatedAt: new Date('2024-01-17T11:00:00'),
    sceneSongId: 'Act2-Storm',
  },
  {
    id: '33',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Blackout cue after gunshot',
    description: 'Snap to black, then restore in 3 seconds',
    priority: 'critical',
    status: 'complete',
    type: 'cue',
    scriptPageId: 'cue-134',
    createdAt: new Date('2024-01-16T13:20:00'),
    updatedAt: new Date('2024-01-17T09:45:00'),
    sceneSongId: 'Act2-Climax',
  },
  {
    id: '34',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Final bow special sequence',
    description: 'Individual specials for each principal',
    priority: 'medium',
    status: 'todo',
    type: 'associate',
    scriptPageId: 'cue-156',
    createdAt: new Date('2024-01-17T15:30:00'),
    updatedAt: new Date('2024-01-17T15:30:00'),
    sceneSongId: 'Act2-Finale',
  },
  {
    id: '35',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Curtain call wash intensity',
    description: 'Full intensity on all front light',
    priority: 'low',
    status: 'complete',
    type: 'production',
    scriptPageId: 'cue-167',
    createdAt: new Date('2024-01-15T12:00:00'),
    updatedAt: new Date('2024-01-16T14:20:00'),
    sceneSongId: 'CurtainCall',
  },
  {
    id: '36',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Followspot iris size',
    description: 'Consider tighter iris for dramatic monologue',
    priority: 'low',
    status: 'todo',
    type: 'think',
    scriptPageId: 'cue-78',
    createdAt: new Date('2024-01-17T17:00:00'),
    updatedAt: new Date('2024-01-17T17:00:00'),
    sceneSongId: 'Act2-Monologue',
  },
  {
    id: '37',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Bedroom scene too dark',
    description: 'Add practical lamp on nightstand',
    priority: 'medium',
    status: 'todo',
    type: 'designer',
    scriptPageId: 'cue-56',
    createdAt: new Date('2024-01-17T10:30:00'),
    updatedAt: new Date('2024-01-17T10:30:00'),
    sceneSongId: 'Act1-Scene8',
  },
  {
    id: '38',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Kitchen scene color temperature',
    description: 'Switch to warmer tungsten look',
    priority: 'medium',
    status: 'complete',
    type: 'director',
    scriptPageId: 'cue-67',
    createdAt: new Date('2024-01-16T11:45:00'),
    updatedAt: new Date('2024-01-17T08:30:00'),
    sceneSongId: 'Act1-Scene9',
  },
  {
    id: '39',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Crowd scene visibility',
    description: 'Ensure all ensemble members visible',
    priority: 'very_high',
    status: 'todo',
    type: 'choreographer',
    scriptPageId: 'cue-89',
    createdAt: new Date('2024-01-17T14:00:00'),
    updatedAt: new Date('2024-01-17T14:00:00'),
    sceneSongId: 'Act2-Ensemble',
  },
  {
    id: '40',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Fire effect safety check',
    description: 'Test smoke detector sensitivity',
    priority: 'critical',
    status: 'complete',
    type: 'stage_manager',
    scriptPageId: 'cue-112',
    createdAt: new Date('2024-01-16T16:00:00'),
    updatedAt: new Date('2024-01-17T07:45:00'),
    sceneSongId: 'Act2-Fire',
  },
  {
    id: '41',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Gobos not sharp enough',
    description: 'Clean lenses and check focus',
    priority: 'medium',
    status: 'todo',
    type: 'spot',
    scriptPageId: 'cue-45',
    createdAt: new Date('2024-01-17T13:15:00'),
    updatedAt: new Date('2024-01-17T13:15:00'),
    sceneSongId: 'Act1-Forest',
  },
  {
    id: '42',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Cue timing documentation',
    description: 'Record all fade times for tech rehearsal',
    priority: 'medium',
    status: 'complete',
    type: 'paperwork',
    scriptPageId: 'cue-200',
    createdAt: new Date('2024-01-15T14:30:00'),
    updatedAt: new Date('2024-01-16T16:45:00'),
    sceneSongId: 'Complete',
  },
  {
    id: '43',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Haze machine refill',
    description: 'Low fluid warning during Act 1',
    priority: 'very_high',
    status: 'todo',
    type: 'assistant',
    scriptPageId: 'cue-23',
    createdAt: new Date('2024-01-17T18:00:00'),
    updatedAt: new Date('2024-01-17T18:00:00'),
    sceneSongId: 'Act1-Scene4',
  },
  {
    id: '44',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'LED strip color calibration',
    description: 'Match RGB values across all strips',
    priority: 'medium',
    status: 'todo',
    type: 'programmer',
    scriptPageId: 'cue-156',
    createdAt: new Date('2024-01-17T12:30:00'),
    updatedAt: new Date('2024-01-17T12:30:00'),
    sceneSongId: 'Act2-Finale',
  },
  {
    id: '45',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Entrance music sync',
    description: 'Light change 2 beats before vocal entry',
    priority: 'very_high',
    status: 'complete',
    type: 'cue',
    scriptPageId: 'cue-78',
    createdAt: new Date('2024-01-16T20:15:00'),
    updatedAt: new Date('2024-01-17T10:00:00'),
    sceneSongId: 'Act2-Song',
  },
  {
    id: '46',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Balcony scene moonlight',
    description: 'Add top light with L200 for moonlight effect',
    priority: 'medium',
    status: 'todo',
    type: 'associate',
    scriptPageId: 'cue-67',
    createdAt: new Date('2024-01-17T16:45:00'),
    updatedAt: new Date('2024-01-17T16:45:00'),
    sceneSongId: 'Act1-Balcony',
  },
  {
    id: '47',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'House light preset levels',
    description: 'Set intermission and pre-show levels',
    priority: 'low',
    status: 'complete',
    type: 'production',
    scriptPageId: 'cue-0',
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-16T09:30:00'),
    sceneSongId: 'Preshow',
  },
  {
    id: '48',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Backup console programming',
    description: 'Should we program backup for critical cues?',
    priority: 'low',
    status: 'todo',
    type: 'think',
    scriptPageId: 'cue-999',
    createdAt: new Date('2024-01-17T19:00:00'),
    updatedAt: new Date('2024-01-17T19:00:00'),
    sceneSongId: 'Emergency',
  },
  {
    id: '49',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Tavern scene atmosphere',
    description: 'Warmer color, more side light',
    priority: 'medium',
    status: 'todo',
    type: 'designer',
    scriptPageId: 'cue-34',
    createdAt: new Date('2024-01-17T11:30:00'),
    updatedAt: new Date('2024-01-17T11:30:00'),
    sceneSongId: 'Act1-Tavern',
  },
  {
    id: '50',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Villain entrance too subtle',
    description: 'Add dramatic lighting change',
    priority: 'very_high',
    status: 'todo',
    type: 'director',
    scriptPageId: 'cue-45',
    createdAt: new Date('2024-01-17T15:00:00'),
    updatedAt: new Date('2024-01-17T15:00:00'),
    sceneSongId: 'Act1-VillainEntry',
  },
  {
    id: '51',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Dance break lighting',
    description: 'Faster color changes for energy',
    priority: 'medium',
    status: 'complete',
    type: 'choreographer',
    scriptPageId: 'cue-89',
    createdAt: new Date('2024-01-16T17:30:00'),
    updatedAt: new Date('2024-01-17T12:00:00'),
    sceneSongId: 'Act2-Dance',
  },
  {
    id: '52',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Fog machine timing',
    description: 'Start fog 30 seconds before ghost entrance',
    priority: 'critical',
    status: 'todo',
    type: 'stage_manager',
    scriptPageId: 'cue-112',
    createdAt: new Date('2024-01-17T17:30:00'),
    updatedAt: new Date('2024-01-17T17:30:00'),
    sceneSongId: 'Act2-Ghost',
  },
  {
    id: '53',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Followspot color correction',
    description: 'Add CTB to match stage wash',
    priority: 'medium',
    status: 'todo',
    type: 'spot',
    scriptPageId: 'cue-78',
    createdAt: new Date('2024-01-17T14:30:00'),
    updatedAt: new Date('2024-01-17T14:30:00'),
    sceneSongId: 'Act2-Solo',
  },
  {
    id: '54',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Lighting plot updates',
    description: 'Add new specials to plot drawing',
    priority: 'low',
    status: 'complete',
    type: 'paperwork',
    scriptPageId: 'cue-300',
    createdAt: new Date('2024-01-15T13:00:00'),
    updatedAt: new Date('2024-01-16T11:15:00'),
    sceneSongId: 'Documentation',
  },
  {
    id: '55',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Dimmer rack maintenance',
    description: 'Check all connections before tech',
    priority: 'very_high',
    status: 'todo',
    type: 'assistant',
    scriptPageId: 'cue-400',
    createdAt: new Date('2024-01-17T08:00:00'),
    updatedAt: new Date('2024-01-17T08:00:00'),
    sceneSongId: 'Maintenance',
  },
  {
    id: '56',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Moving light position preset',
    description: 'Store positions for quick scene changes',
    priority: 'medium',
    status: 'todo',
    type: 'programmer',
    scriptPageId: 'cue-178',
    createdAt: new Date('2024-01-17T13:00:00'),
    updatedAt: new Date('2024-01-17T13:00:00'),
    sceneSongId: 'Act2-Quick',
  },
  {
    id: '57',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Wedding scene brightness',
    description: 'Full front light for photo opportunity',
    priority: 'medium',
    status: 'complete',
    type: 'cue',
    scriptPageId: 'cue-145',
    createdAt: new Date('2024-01-16T14:45:00'),
    updatedAt: new Date('2024-01-17T09:30:00'),
    sceneSongId: 'Act2-Wedding',
  },
  {
    id: '58',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Forest scene depth',
    description: 'Add more layers with different colors',
    priority: 'medium',
    status: 'todo',
    type: 'associate',
    scriptPageId: 'cue-56',
    createdAt: new Date('2024-01-17T16:00:00'),
    updatedAt: new Date('2024-01-17T16:00:00'),
    sceneSongId: 'Act1-Forest',
  },
  {
    id: '59',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Safety light check',
    description: 'Ensure all exit signs operational',
    priority: 'critical',
    status: 'complete',
    type: 'production',
    scriptPageId: 'cue-500',
    createdAt: new Date('2024-01-15T16:00:00'),
    updatedAt: new Date('2024-01-16T08:00:00'),
    sceneSongId: 'Safety',
  },
  {
    id: '60',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Console backup strategy',
    description: 'Worth programming grandMA2 as backup?',
    priority: 'very_low',
    status: 'cancelled',
    type: 'think',
    scriptPageId: 'cue-999',
    createdAt: new Date('2024-01-16T20:00:00'),
    updatedAt: new Date('2024-01-17T07:00:00'),
    sceneSongId: 'Planning',
  },
  {
    id: '61',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Castle scene grandeur',
    description: 'Uplighting on columns needed',
    priority: 'very_high',
    status: 'todo',
    type: 'designer',
    scriptPageId: 'cue-23',
    createdAt: new Date('2024-01-17T12:15:00'),
    updatedAt: new Date('2024-01-17T12:15:00'),
    sceneSongId: 'Act1-Castle',
  },
  {
    id: '62',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Comedic timing on pratfall',
    description: 'Light bump on impact for emphasis',
    priority: 'medium',
    status: 'todo',
    type: 'director',
    scriptPageId: 'cue-67',
    createdAt: new Date('2024-01-17T13:30:00'),
    updatedAt: new Date('2024-01-17T13:30:00'),
    sceneSongId: 'Act1-Comedy',
  },
  {
    id: '63',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Group number formations',
    description: 'Light each formation change',
    priority: 'medium',
    status: 'complete',
    type: 'choreographer',
    scriptPageId: 'cue-134',
    createdAt: new Date('2024-01-16T18:00:00'),
    updatedAt: new Date('2024-01-17T11:30:00'),
    sceneSongId: 'Act2-Group',
  },
  {
    id: '64',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Quick change timing',
    description: 'Coordinate blackout with costume change',
    priority: 'critical',
    status: 'todo',
    type: 'stage_manager',
    scriptPageId: 'cue-89',
    createdAt: new Date('2024-01-17T18:30:00'),
    updatedAt: new Date('2024-01-17T18:30:00'),
    sceneSongId: 'Act1-Change',
  },
  {
    id: '65',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Spot operator headset',
    description: 'Channel 3 static interference',
    priority: 'medium',
    status: 'todo',
    type: 'spot',
    scriptPageId: 'cue-156',
    createdAt: new Date('2024-01-17T15:45:00'),
    updatedAt: new Date('2024-01-17T15:45:00'),
    sceneSongId: 'Communication',
  },
  {
    id: '66',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Channel hookup verification',
    description: 'Double-check all dimmer assignments',
    priority: 'medium',
    status: 'complete',
    type: 'paperwork',
    scriptPageId: 'cue-600',
    createdAt: new Date('2024-01-15T15:30:00'),
    updatedAt: new Date('2024-01-16T13:45:00'),
    sceneSongId: 'Tech',
  },
  {
    id: '67',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Circuit breaker test',
    description: 'Test all breakers under full load',
    priority: 'very_high',
    status: 'todo',
    type: 'assistant',
    scriptPageId: 'cue-700',
    createdAt: new Date('2024-01-17T07:30:00'),
    updatedAt: new Date('2024-01-17T07:30:00'),
    sceneSongId: 'Electrical',
  },
  {
    id: '68',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Strobe effect sequence',
    description: 'Program battle scene strobes',
    priority: 'very_high',
    status: 'todo',
    type: 'programmer',
    scriptPageId: 'cue-201',
    createdAt: new Date('2024-01-17T14:15:00'),
    updatedAt: new Date('2024-01-17T14:15:00'),
    sceneSongId: 'Act2-Battle',
  },
  {
    id: '69',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Dawn breaking sequence',
    description: 'Slow build from night to day',
    priority: 'medium',
    status: 'complete',
    type: 'cue',
    scriptPageId: 'cue-178',
    createdAt: new Date('2024-01-16T21:00:00'),
    updatedAt: new Date('2024-01-17T10:45:00'),
    sceneSongId: 'Act2-Dawn',
  },
  {
    id: '70',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Throne room majesty',
    description: 'More dramatic top light angles',
    priority: 'medium',
    status: 'todo',
    type: 'associate',
    scriptPageId: 'cue-45',
    createdAt: new Date('2024-01-17T17:15:00'),
    updatedAt: new Date('2024-01-17T17:15:00'),
    sceneSongId: 'Act1-Throne',
  },
  {
    id: '71',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Dressing room mirror lights',
    description: 'Add practical bulbs around mirror',
    priority: 'low',
    status: 'complete',
    type: 'production',
    scriptPageId: 'cue-800',
    createdAt: new Date('2024-01-15T17:00:00'),
    updatedAt: new Date('2024-01-16T12:30:00'),
    sceneSongId: 'Backstage',
  },
  {
    id: '72',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Automated vs manual cues',
    description: 'Which cues need manual triggers?',
    priority: 'medium',
    status: 'todo',
    type: 'think',
    scriptPageId: 'cue-1',
    createdAt: new Date('2024-01-17T19:30:00'),
    updatedAt: new Date('2024-01-17T19:30:00'),
    sceneSongId: 'Planning',
  },
  {
    id: '73',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Spooky graveyard mood',
    description: 'Add fog and blue/green color mix',
    priority: 'very_high',
    status: 'todo',
    type: 'designer',
    scriptPageId: 'cue-134',
    createdAt: new Date('2024-01-17T12:45:00'),
    updatedAt: new Date('2024-01-17T12:45:00'),
    sceneSongId: 'Act2-Graveyard',
  },
  {
    id: '74',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Actor cannot find mark',
    description: 'Add floor spike tape in better color',
    priority: 'medium',
    status: 'todo',
    type: 'director',
    scriptPageId: 'cue-56',
    createdAt: new Date('2024-01-17T14:45:00'),
    updatedAt: new Date('2024-01-17T14:45:00'),
    sceneSongId: 'Act1-Mark',
  },
  {
    id: '75',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Lift dance number energy',
    description: 'Add moving light effects to chorus',
    priority: 'medium',
    status: 'complete',
    type: 'choreographer',
    scriptPageId: 'cue-167',
    createdAt: new Date('2024-01-16T19:15:00'),
    updatedAt: new Date('2024-01-17T13:15:00'),
    sceneSongId: 'Act2-Lift',
  },
  {
    id: '76',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Cue light malfunction',
    description: 'Replace LED in conductor cue light',
    priority: 'critical',
    status: 'todo',
    type: 'stage_manager',
    scriptPageId: 'cue-900',
    createdAt: new Date('2024-01-17T19:00:00'),
    updatedAt: new Date('2024-01-17T19:00:00'),
    sceneSongId: 'Technical',
  },
  {
    id: '77',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Followspot iris adjustment',
    description: 'Iris sticking at 75% position',
    priority: 'very_high',
    status: 'todo',
    type: 'spot',
    scriptPageId: 'cue-123',
    createdAt: new Date('2024-01-17T16:30:00'),
    updatedAt: new Date('2024-01-17T16:30:00'),
    sceneSongId: 'Equipment',
  },
  {
    id: '78',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Magic sheet updates',
    description: 'Add new specials to magic sheet',
    priority: 'low',
    status: 'complete',
    type: 'paperwork',
    scriptPageId: 'cue-1000',
    createdAt: new Date('2024-01-15T18:00:00'),
    updatedAt: new Date('2024-01-16T15:00:00'),
    sceneSongId: 'Organization',
  },
  {
    id: '79',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Cable management backstage',
    description: 'Secure all cables with gaff tape',
    priority: 'medium',
    status: 'todo',
    type: 'assistant',
    scriptPageId: 'cue-1100',
    createdAt: new Date('2024-01-17T08:30:00'),
    updatedAt: new Date('2024-01-17T08:30:00'),
    sceneSongId: 'Safety',
  },
  {
    id: '80',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Color changer calibration',
    description: 'Recalibrate all VL3000s',
    priority: 'medium',
    status: 'todo',
    type: 'programmer',
    scriptPageId: 'cue-1200',
    createdAt: new Date('2024-01-17T15:15:00'),
    updatedAt: new Date('2024-01-17T15:15:00'),
    sceneSongId: 'Calibration',
  },
  {
    id: '81',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Finale pyro sequence',
    description: 'Coordinate with pyro tech for safety',
    priority: 'critical',
    status: 'complete',
    type: 'cue',
    scriptPageId: 'cue-245',
    createdAt: new Date('2024-01-16T22:00:00'),
    updatedAt: new Date('2024-01-17T11:45:00'),
    sceneSongId: 'Finale-Pyro',
  },
  {
    id: '82',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Courtyard scene romance',
    description: 'Softer edges on all specials',
    priority: 'medium',
    status: 'todo',
    type: 'associate',
    scriptPageId: 'cue-89',
    createdAt: new Date('2024-01-17T18:00:00'),
    updatedAt: new Date('2024-01-17T18:00:00'),
    sceneSongId: 'Act1-Courtyard',
  },
  {
    id: '83',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Work light schedule',
    description: 'Set timers for work light automation',
    priority: 'low',
    status: 'complete',
    type: 'production',
    scriptPageId: 'cue-1300',
    createdAt: new Date('2024-01-15T19:00:00'),
    updatedAt: new Date('2024-01-16T10:00:00'),
    sceneSongId: 'Facility',
  },
  {
    id: '84',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'LED color matching',
    description: 'Should we use color temperature correction?',
    priority: 'low',
    status: 'todo',
    type: 'think',
    scriptPageId: 'cue-1400',
    createdAt: new Date('2024-01-17T20:00:00'),
    updatedAt: new Date('2024-01-17T20:00:00'),
    sceneSongId: 'Color-Theory',
  },
  {
    id: '85',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Prison scene starkness',
    description: 'Remove all color, harsh whites only',
    priority: 'very_high',
    status: 'todo',
    type: 'designer',
    scriptPageId: 'cue-156',
    createdAt: new Date('2024-01-17T13:45:00'),
    updatedAt: new Date('2024-01-17T13:45:00'),
    sceneSongId: 'Act2-Prison',
  },
  {
    id: '86',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Crowd murmur timing',
    description: 'Lights up before sound cue starts',
    priority: 'medium',
    status: 'todo',
    type: 'director',
    scriptPageId: 'cue-178',
    createdAt: new Date('2024-01-17T16:15:00'),
    updatedAt: new Date('2024-01-17T16:15:00'),
    sceneSongId: 'Act2-Crowd',
  },
  {
    id: '87',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Partner dance spotlights',
    description: 'Two tight spots following each dancer',
    priority: 'medium',
    status: 'complete',
    type: 'choreographer',
    scriptPageId: 'cue-201',
    createdAt: new Date('2024-01-16T20:30:00'),
    updatedAt: new Date('2024-01-17T14:00:00'),
    sceneSongId: 'Act2-Partner',
  },
  {
    id: '88',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Backup power test',
    description: 'Test emergency lighting system',
    priority: 'critical',
    status: 'todo',
    type: 'stage_manager',
    scriptPageId: 'cue-1500',
    createdAt: new Date('2024-01-17T19:45:00'),
    updatedAt: new Date('2024-01-17T19:45:00'),
    sceneSongId: 'Emergency',
  },
  {
    id: '89',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Spot cue sheet missing',
    description: 'Followspot #2 missing cue 15-20',
    priority: 'very_high',
    status: 'todo',
    type: 'spot',
    scriptPageId: 'cue-1600',
    createdAt: new Date('2024-01-17T17:45:00'),
    updatedAt: new Date('2024-01-17T17:45:00'),
    sceneSongId: 'Documentation',
  },
  {
    id: '90',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Gel inventory check',
    description: 'Low on R02 and L201',
    priority: 'medium',
    status: 'complete',
    type: 'paperwork',
    scriptPageId: 'cue-1700',
    createdAt: new Date('2024-01-15T20:30:00'),
    updatedAt: new Date('2024-01-16T17:30:00'),
    sceneSongId: 'Inventory',
  },
  {
    id: '91',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Extension cord inspection',
    description: 'Check all cords for damage',
    priority: 'very_high',
    status: 'todo',
    type: 'assistant',
    scriptPageId: 'cue-1800',
    createdAt: new Date('2024-01-17T09:00:00'),
    updatedAt: new Date('2024-01-17T09:00:00'),
    sceneSongId: 'Safety',
  },
  {
    id: '92',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Fixture maintenance log',
    description: 'Update all lamp hours in database',
    priority: 'low',
    status: 'todo',
    type: 'programmer',
    scriptPageId: 'cue-1900',
    createdAt: new Date('2024-01-17T16:00:00'),
    updatedAt: new Date('2024-01-17T16:00:00'),
    sceneSongId: 'Maintenance',
  },
  {
    id: '93',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Wedding march processional',
    description: 'Grand entrance with full stage wash',
    priority: 'medium',
    status: 'complete',
    type: 'cue',
    scriptPageId: 'cue-223',
    createdAt: new Date('2024-01-17T00:15:00'),
    updatedAt: new Date('2024-01-17T12:30:00'),
    sceneSongId: 'Act2-Processional',
  },
  {
    id: '94',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Library scene intimacy',
    description: 'Single pool of warm light',
    priority: 'medium',
    status: 'todo',
    type: 'associate',
    scriptPageId: 'cue-112',
    createdAt: new Date('2024-01-17T18:45:00'),
    updatedAt: new Date('2024-01-17T18:45:00'),
    sceneSongId: 'Act1-Library',
  },
  {
    id: '95',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Load-in power distribution',
    description: 'Plan 400A service distribution',
    priority: 'critical',
    status: 'complete',
    type: 'production',
    scriptPageId: 'cue-2000',
    createdAt: new Date('2024-01-15T21:00:00'),
    updatedAt: new Date('2024-01-16T06:00:00'),
    sceneSongId: 'Load-in',
  },
  {
    id: '96',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Sidelight color consistency',
    description: 'Are we mixing tungsten and LED?',
    priority: 'medium',
    status: 'todo',
    type: 'think',
    scriptPageId: 'cue-2100',
    createdAt: new Date('2024-01-17T20:30:00'),
    updatedAt: new Date('2024-01-17T20:30:00'),
    sceneSongId: 'Color-Match',
  },
  {
    id: '97',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Masquerade ball sparkle',
    description: 'Add glitter effects with moving lights',
    priority: 'very_high',
    status: 'todo',
    type: 'designer',
    scriptPageId: 'cue-189',
    createdAt: new Date('2024-01-17T14:30:00'),
    updatedAt: new Date('2024-01-17T14:30:00'),
    sceneSongId: 'Act2-Masquerade',
  },
  {
    id: '98',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Actors missing light cues',
    description: 'Need better cue calling visibility',
    priority: 'medium',
    status: 'todo',
    type: 'director',
    scriptPageId: 'cue-234',
    createdAt: new Date('2024-01-17T17:00:00'),
    updatedAt: new Date('2024-01-17T17:00:00'),
    sceneSongId: 'Act2-Timing',
  },
  {
    id: '99',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Tap number floor lighting',
    description: 'Low angle side light to show feet',
    priority: 'medium',
    status: 'complete',
    type: 'choreographer',
    scriptPageId: 'cue-267',
    createdAt: new Date('2024-01-16T21:45:00'),
    updatedAt: new Date('2024-01-17T15:30:00'),
    sceneSongId: 'Act2-Tap',
  },
  {
    id: '100',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Strike schedule coordination',
    description: 'Plan lighting strike with scenic',
    priority: 'critical',
    status: 'todo',
    type: 'stage_manager',
    scriptPageId: 'cue-2200',
    createdAt: new Date('2024-01-17T20:15:00'),
    updatedAt: new Date('2024-01-17T20:15:00'),
    sceneSongId: 'Strike',
  },
  {
    id: '101',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Followspot color wheel',
    description: 'R26 gel torn, needs replacement',
    priority: 'very_high',
    status: 'todo',
    type: 'spot',
    scriptPageId: 'cue-2300',
    createdAt: new Date('2024-01-17T18:15:00'),
    updatedAt: new Date('2024-01-17T18:15:00'),
    sceneSongId: 'Equipment',
  },
  {
    id: '102',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Load-out truck schedule',
    description: 'Coordinate with rental house pickup',
    priority: 'medium',
    status: 'complete',
    type: 'paperwork',
    scriptPageId: 'cue-2400',
    createdAt: new Date('2024-01-15T22:00:00'),
    updatedAt: new Date('2024-01-16T18:30:00'),
    sceneSongId: 'Logistics',
  },
  {
    id: '103',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Inventory return checklist',
    description: 'Check all rental gear before return',
    priority: 'medium',
    status: 'todo',
    type: 'assistant',
    scriptPageId: 'cue-2500',
    createdAt: new Date('2024-01-17T09:30:00'),
    updatedAt: new Date('2024-01-17T09:30:00'),
    sceneSongId: 'Returns',
  },
  {
    id: '104',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Console show file backup',
    description: 'Save final show file to multiple drives',
    priority: 'critical',
    status: 'todo',
    type: 'programmer',
    scriptPageId: 'cue-2600',
    createdAt: new Date('2024-01-17T17:00:00'),
    updatedAt: new Date('2024-01-17T17:00:00'),
    sceneSongId: 'Archive',
  },
  {
    id: '105',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Post-show notes compilation',
    description: 'Gather all notes for next production',
    priority: 'low',
    status: 'complete',
    type: 'cue',
    scriptPageId: 'cue-2700',
    createdAt: new Date('2024-01-17T01:00:00'),
    updatedAt: new Date('2024-01-17T16:30:00'),
    sceneSongId: 'Post-Show',
  },
  {
    id: '106',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Season planning meeting',
    description: 'Discuss improvements for next show',
    priority: 'medium',
    status: 'todo',
    type: 'associate',
    scriptPageId: 'cue-2800',
    createdAt: new Date('2024-01-17T19:30:00'),
    updatedAt: new Date('2024-01-17T19:30:00'),
    sceneSongId: 'Future',
  },
  {
    id: '107',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Equipment evaluation report',
    description: 'Document equipment performance',
    priority: 'low',
    status: 'complete',
    type: 'production',
    scriptPageId: 'cue-2900',
    createdAt: new Date('2024-01-16T00:00:00'),
    updatedAt: new Date('2024-01-16T19:45:00'),
    sceneSongId: 'Evaluation',
  },
  {
    id: '108',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Budget reconciliation',
    description: 'Was LED rental worth the cost?',
    priority: 'low',
    status: 'todo',
    type: 'think',
    scriptPageId: 'cue-3000',
    createdAt: new Date('2024-01-17T21:00:00'),
    updatedAt: new Date('2024-01-17T21:00:00'),
    sceneSongId: 'Budget',
  },
  {
    id: '109',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Student designer feedback',
    description: 'Schedule mentoring session',
    priority: 'medium',
    status: 'todo',
    type: 'designer',
    scriptPageId: 'cue-3100',
    createdAt: new Date('2024-01-17T15:45:00'),
    updatedAt: new Date('2024-01-17T15:45:00'),
    sceneSongId: 'Education',
  },
  {
    id: '110',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Thank you notes to crew',
    description: 'Appreciate everyone who helped',
    priority: 'medium',
    status: 'todo',
    type: 'director',
    scriptPageId: 'cue-3200',
    createdAt: new Date('2024-01-17T18:30:00'),
    updatedAt: new Date('2024-01-17T18:30:00'),
    sceneSongId: 'Gratitude',
  },
  {
    id: '111',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Closing night celebration',
    description: 'Plan lighting for cast party',
    priority: 'very_low',
    status: 'complete',
    type: 'choreographer',
    scriptPageId: 'cue-3300',
    createdAt: new Date('2024-01-16T23:30:00'),
    updatedAt: new Date('2024-01-17T20:00:00'),
    sceneSongId: 'Celebration',
  },
  {
    id: '112',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Archive show photos',
    description: 'Save production photos with lighting',
    priority: 'low',
    status: 'todo',
    type: 'stage_manager',
    scriptPageId: 'cue-3400',
    createdAt: new Date('2024-01-17T21:30:00'),
    updatedAt: new Date('2024-01-17T21:30:00'),
    sceneSongId: 'Archive',
  },
  {
    id: '113',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Final equipment clean',
    description: 'Clean all lenses before storage',
    priority: 'medium',
    status: 'todo',
    type: 'spot',
    scriptPageId: 'cue-3500',
    createdAt: new Date('2024-01-17T19:15:00'),
    updatedAt: new Date('2024-01-17T19:15:00'),
    sceneSongId: 'Maintenance',
  },
  {
    id: '114',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Storage organization plan',
    description: 'Plan gel and equipment storage',
    priority: 'low',
    status: 'complete',
    type: 'paperwork',
    scriptPageId: 'cue-3600',
    createdAt: new Date('2024-01-16T01:00:00'),
    updatedAt: new Date('2024-01-16T20:15:00'),
    sceneSongId: 'Storage',
  },
  {
    id: '115',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Next show prep checklist',
    description: 'What do we need for spring musical?',
    priority: 'medium',
    status: 'todo',
    type: 'assistant',
    scriptPageId: 'cue-3700',
    createdAt: new Date('2024-01-17T10:00:00'),
    updatedAt: new Date('2024-01-17T10:00:00'),
    sceneSongId: 'Next-Show',
  },
  {
    id: '116',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Programming techniques learned',
    description: 'Document new console features used',
    priority: 'low',
    status: 'todo',
    type: 'programmer',
    scriptPageId: 'cue-3800',
    createdAt: new Date('2024-01-17T18:00:00'),
    updatedAt: new Date('2024-01-17T18:00:00'),
    sceneSongId: 'Learning',
  },
  {
    id: '117',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Season wrap celebration',
    description: 'Final company lighting moment',
    priority: 'medium',
    status: 'complete',
    type: 'cue',
    scriptPageId: 'cue-3900',
    createdAt: new Date('2024-01-17T02:00:00'),
    updatedAt: new Date('2024-01-17T21:00:00'),
    sceneSongId: 'Finale-Final',
  },
  {
    id: '118',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Equipment return inspection',
    description: 'Final check before vendor pickup',
    priority: 'very_high',
    status: 'todo',
    type: 'associate',
    scriptPageId: 'cue-4000',
    createdAt: new Date('2024-01-17T20:30:00'),
    updatedAt: new Date('2024-01-17T20:30:00'),
    sceneSongId: 'Return',
  },
  {
    id: '119',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Theatre restoration fund',
    description: 'Propose LED house light upgrade',
    priority: 'very_low',
    status: 'complete',
    type: 'production',
    scriptPageId: 'cue-4100',
    createdAt: new Date('2024-01-16T02:30:00'),
    updatedAt: new Date('2024-01-16T21:45:00'),
    sceneSongId: 'Future-Vision',
  },
  {
    id: '120',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Lighting career reflection',
    description: 'What did this show teach me?',
    priority: 'low',
    status: 'todo',
    type: 'think',
    scriptPageId: 'cue-4200',
    createdAt: new Date('2024-01-17T22:00:00'),
    updatedAt: new Date('2024-01-17T22:00:00'),
    sceneSongId: 'Reflection',
  },
  {
    id: '121',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'New designer opportunities',
    description: 'Recommend assistant for next project',
    priority: 'medium',
    status: 'todo',
    type: 'designer',
    scriptPageId: 'cue-4300',
    createdAt: new Date('2024-01-17T16:45:00'),
    updatedAt: new Date('2024-01-17T16:45:00'),
    sceneSongId: 'Mentorship',
  },
  {
    id: '122',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Director collaboration notes',
    description: 'How can we improve communication?',
    priority: 'medium',
    status: 'todo',
    type: 'director',
    scriptPageId: 'cue-4400',
    createdAt: new Date('2024-01-17T19:45:00'),
    updatedAt: new Date('2024-01-17T19:45:00'),
    sceneSongId: 'Collaboration',
  },
  {
    id: '123',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Choreographer feedback session',
    description: 'Discuss lighting and movement integration',
    priority: 'medium',
    status: 'complete',
    type: 'choreographer',
    scriptPageId: 'cue-4500',
    createdAt: new Date('2024-01-17T03:15:00'),
    updatedAt: new Date('2024-01-17T22:30:00'),
    sceneSongId: 'Integration',
  }
]

export default function CueNotesPage() {
  const mockNotesStore = useMockNotesStore()

  // Get notes directly from store instead of local state
  const notes = mockNotesStore.getAllNotes('cue')

  // Initialize mock data only once
  useEffect(() => {
    mockNotesStore.initializeWithMockData()
  }, [])
  const { name, abbreviation, logo } = useProductionStore()
  const customTypesStore = useCustomTypesStore()
  const customPrioritiesStore = useCustomPrioritiesStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<NoteStatus>('todo')
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogDefaultType, setDialogDefaultType] = useState<string>('Cue')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isEmailViewOpen, setIsEmailViewOpen] = useState(false)
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false)
  const [isScriptManagerOpen, setIsScriptManagerOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Handle client-side hydration for stores with skipHydration: true
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Get custom types and priorities from stores (only after hydration)
  const availableTypes = isHydrated ? customTypesStore.getTypes('cue') : []
  const typeOptions = availableTypes.map(type => ({ 
    value: type.value, 
    label: type.label,
    color: type.color 
  }))
  const availablePriorities = isHydrated ? customPrioritiesStore.getPriorities('cue') : []

  const filteredNotes = notes.filter(note => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = note.title.toLowerCase().includes(searchLower) ||
                          note.description?.toLowerCase().includes(searchLower) ||
                          note.scriptPageId?.toLowerCase().includes(searchLower) ||
                          note.sceneSongId?.toLowerCase().includes(searchLower)
    const matchesStatus = note.status === filterStatus
    const matchesType = filterTypes.length === 0 || filterTypes.includes(note.type || '')
    return matchesSearch && matchesStatus && matchesType
  })

  const handleAddNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingNote) {
      // Update existing note
      mockNotesStore.updateNote(editingNote.id, noteData)
    } else {
      // Create new note
      mockNotesStore.addNote(noteData)
    }
  }

  const openDialog = (type?: string) => {
    setEditingNote(null)
    setDialogDefaultType(type || 'Cue')
    setIsDialogOpen(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setDialogDefaultType(note.type || 'Cue')
    setIsDialogOpen(true)
  }

  const updateNoteStatus = (noteId: string, status: NoteStatus) => {
    mockNotesStore.updateNote(noteId, { status })
  }


  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Sticky Header Container */}
        <div className="flex-none space-y-6 pb-4">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center border-b border-bg-tertiary pb-6">
            {/* Left: Production Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-bg-secondary rounded-lg text-2xl overflow-hidden">
                {logo && (logo.startsWith('data:') || logo.startsWith('/') || logo.startsWith('http')) ? (
                  <img src={logo} alt="Production logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{logo}</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">{name}</h2>
                <p className="text-text-secondary">{abbreviation}</p>
              </div>
            </div>

            {/* Center: Module Heading */}
            <div className="flex justify-center">
              <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3 whitespace-nowrap">
                <Lightbulb className="h-8 w-8 text-modules-cue" />
                Cue Notes
              </h1>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setIsPrintViewOpen(true)}
                variant="secondary"
              >
                <Printer className="h-4 w-4" />
                PDF
              </Button>
              <Button
                onClick={() => setIsEmailViewOpen(true)}
                variant="secondary"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsScriptManagerOpen(true)}
              >
                <FileText className="h-5 w-5" />
                Manage Script
              </Button>
              <Button
                onClick={() => openDialog()}
                variant="cue"
              >
                <Plus className="h-5 w-5" />
                Add Cue Note
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Status Filters */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">Status</label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setFilterStatus('todo')}
                    variant={filterStatus === 'todo' ? 'todo' : 'secondary'}
                    size="sm"
                  >
                    To Do
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('complete')}
                    variant={filterStatus === 'complete' ? 'complete' : 'secondary'}
                    size="sm"
                  >
                    Complete
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('cancelled')}
                    variant={filterStatus === 'cancelled' ? 'cancelled' : 'secondary'}
                    size="sm"
                  >
                    Cancelled
                  </Button>
                </div>
              </div>

              {/* Type Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">Type</label>
                <MultiSelect
                  options={typeOptions}
                  selected={filterTypes}
                  onChange={setFilterTypes}
                  placeholder="All Types"
                  className="min-w-[140px]"
                />
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search cue notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 pl-8 font-medium"
              />
            </div>
          </div>

          {/* Quick Add Bar */}
          {filterStatus === 'todo' && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground text-sm">Quick Add:</span>
              {availableTypes.map(type => (
                <Button 
                  key={type.id}
                  onClick={() => openDialog(type.value)} 
                  size="xs"
                  style={{ 
                    backgroundColor: type.color,
                    borderColor: type.color 
                  }}
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <Plus className="h-3 w-3" />{type.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Notes Table - Fills remaining space */}
        <div className="flex-1 min-h-0">
          <CueNotesTable
            notes={filteredNotes}
            onStatusUpdate={updateNoteStatus}
            onEdit={handleEditNote}
          />

          {filteredNotes.length === 0 && (
            <div className="text-center py-12">
              <Lightbulb className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No cue notes found</p>
              <p className="text-text-muted text-sm mt-1">Try adjusting your filters or add a new note</p>
            </div>
          )}
        </div>
      </div>

      <AddNoteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleAddNote}
        moduleType="cue"
        defaultType={dialogDefaultType}
        editingNote={editingNote}
      />
      
      <EmailNotesSidebar
        moduleType="cue"
        isOpen={isEmailViewOpen}
        onClose={() => setIsEmailViewOpen(false)}
      />

      <PrintNotesSidebar
        moduleType="cue"
        isOpen={isPrintViewOpen}
        onClose={() => setIsPrintViewOpen(false)}
        notes={notes}
      />

      <ScriptManager
        isOpen={isScriptManagerOpen}
        onClose={() => setIsScriptManagerOpen(false)}
      />
    </DashboardLayout>
  )
}
