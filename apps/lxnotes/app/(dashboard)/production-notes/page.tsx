'use client'

import { ProductionNotesTable } from '@/components/notes-table/production-notes-table'
import { TabletNotesTable } from '@/components/notes-table/tablet-notes-table'
import { createTabletProductionColumns } from '@/components/notes-table/columns/tablet-production-columns'
import { AddNoteDialog } from '@/components/add-note-dialog'
import { EmailNotesSidebar } from '@/components/email-notes-sidebar'
import { PrintNotesSidebar } from '@/components/print-notes-sidebar'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Plus, Search, FileText, Mail, Printer, RotateCcw } from 'lucide-react'
import type { Note, NoteStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { useCurrentProductionStore, DEFAULT_PRODUCTION_LOGO } from '@/lib/stores/production-store'
import { useProductionOptional } from '@/components/production/production-provider'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useMockNotesStore } from '@/lib/stores/mock-notes-store'
import { useNotes } from '@/lib/contexts/notes-context'
import { isDemoMode } from '@/lib/demo-data'
import { useTabletModeStore } from '@/lib/stores/tablet-mode-store'
import { useNotesFilterStore } from '@/lib/stores/notes-filter-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { sortNotes } from '@/lib/utils/filter-sort-notes'
import { UndoRedoButtons } from '@/components/undo-redo-buttons'
import Image from 'next/image'

// Mock data for development - REMOVED: This large array was never used
// Notes are now generated dynamically by the mock-notes-store
const mockProductionNotes: Note[] = [
  // Scenic department notes
  {
    id: '1',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Set piece height blocking front light',
    description: 'Upstage platform at 4 feet blocks key light from FOH',
    priority: 'very_high',
    status: 'todo',
    type: 'scenic',
    createdAt: new Date('2024-01-16T10:30:00'),
    updatedAt: new Date('2024-01-16T10:30:00'),
  },
  {
    id: '2',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Approved paint colors for set',
    description: 'Warmer beige will work better with lighting palette',
    priority: 'medium',
    status: 'complete',
    type: 'scenic',
    createdAt: new Date('2024-01-14T15:20:00'),
    updatedAt: new Date('2024-01-15T11:45:00'),
  },
  {
    id: '3',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Reflective paint causing glare issues',
    description: 'Metallic finish on throne reflects too much light',
    priority: 'low',
    status: 'cancelled',
    type: 'scenic',
    createdAt: new Date('2024-01-12T14:15:00'),
    updatedAt: new Date('2024-01-14T09:30:00'),
  },
  // Costumes department notes
  {
    id: '4',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Schedule meeting with costume department',
    description: 'Discuss color temperature for white costume reveals',
    priority: 'very_high',
    status: 'todo',
    type: 'costumes',
    createdAt: new Date('2024-01-16T09:00:00'),
    updatedAt: new Date('2024-01-16T09:00:00'),
  },
  {
    id: '5',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Fabric samples approved for lighting test',
    description: 'New silk fabric responds well to blue wash',
    priority: 'medium',
    status: 'complete',
    type: 'costumes',
    createdAt: new Date('2024-01-13T16:30:00'),
    updatedAt: new Date('2024-01-15T14:20:00'),
  },
  {
    id: '6',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Sequin costume causing light scatter',
    description: 'Princess dress creating unwanted sparkle effects',
    priority: 'medium',
    status: 'cancelled',
    type: 'costumes',
    createdAt: new Date('2024-01-11T13:45:00'),
    updatedAt: new Date('2024-01-13T10:15:00'),
  },
  // Lighting department notes
  {
    id: '7',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'LED upgrade budget approved',
    description: 'Replacing 12 conventional fixtures with LED',
    priority: 'low',
    status: 'complete',
    type: 'lighting',
    createdAt: new Date('2024-01-10T11:00:00'),
    updatedAt: new Date('2024-01-12T16:45:00'),
  },
  {
    id: '8',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Request additional circuit capacity',
    description: 'Need 6 more circuits for expanded design',
    priority: 'very_high',
    status: 'todo',
    type: 'lighting',
    createdAt: new Date('2024-01-15T18:30:00'),
    updatedAt: new Date('2024-01-15T18:30:00'),
  },
  // Props department notes
  {
    id: '9',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Practical lanterns need dimming solution',
    description: 'Stage lanterns too bright, need inline dimmers',
    priority: 'medium',
    status: 'todo',
    type: 'props',
    createdAt: new Date('2024-01-14T12:15:00'),
    updatedAt: new Date('2024-01-14T12:15:00'),
  },
  {
    id: '10',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Mirror placement approved',
    description: 'Angled to avoid light reflection into audience',
    priority: 'low',
    status: 'complete',
    type: 'props',
    createdAt: new Date('2024-01-11T10:30:00'),
    updatedAt: new Date('2024-01-13T15:45:00'),
  },
  {
    id: '11',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Candle effect too realistic',
    description: 'LED candles look fake under stage lights',
    priority: 'medium',
    status: 'cancelled',
    type: 'props',
    createdAt: new Date('2024-01-09T16:20:00'),
    updatedAt: new Date('2024-01-11T14:30:00'),
  },
  // Sound department notes
  {
    id: '12',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Coordinate with sound for Act 2 transitions',
    description: 'Sync lighting blackouts with sound effects timing',
    priority: 'very_high',
    status: 'complete',
    type: 'sound',
    createdAt: new Date('2024-01-13T14:00:00'),
    updatedAt: new Date('2024-01-16T11:30:00'),
  },
  {
    id: '13',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Speaker placement affecting light positions',
    description: 'Stage right speaker blocking side light angle',
    priority: 'medium',
    status: 'todo',
    type: 'sound',
    createdAt: new Date('2024-01-15T17:45:00'),
    updatedAt: new Date('2024-01-15T17:45:00'),
  },
  // Video department notes
  {
    id: '14',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Projector wash out from stage lights',
    description: 'Need to flag or adjust FOH positions to prevent spill',
    priority: 'very_high',
    status: 'todo',
    type: 'video',
    createdAt: new Date('2024-01-16T13:20:00'),
    updatedAt: new Date('2024-01-16T13:20:00'),
  },
  {
    id: '15',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Screen surface reflection minimized',
    description: 'New matte screen reduces light bounce',
    priority: 'low',
    status: 'complete',
    type: 'video',
    createdAt: new Date('2024-01-12T09:15:00'),
    updatedAt: new Date('2024-01-14T16:30:00'),
  },
  {
    id: '16',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Sync issues with lighting console',
    description: 'SMPTE timecode not stable during video cues',
    priority: 'medium',
    status: 'cancelled',
    type: 'video',
    createdAt: new Date('2024-01-10T14:45:00'),
    updatedAt: new Date('2024-01-12T11:20:00'),
  },
  // Stage Management notes
  {
    id: '17',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Review safety protocols with stage management',
    description: 'Updated emergency lighting and evacuation procedures',
    priority: 'very_high',
    status: 'complete',
    type: 'stage_management',
    createdAt: new Date('2024-01-11T08:30:00'),
    updatedAt: new Date('2024-01-13T17:15:00'),
  },
  {
    id: '18',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Cue light system needs expansion',
    description: 'Add cue lights to fly gallery and trap room',
    priority: 'medium',
    status: 'todo',
    type: 'stage_management',
    createdAt: new Date('2024-01-15T12:45:00'),
    updatedAt: new Date('2024-01-15T12:45:00'),
  },
  // Directing notes
  {
    id: '19',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Update director on technical limitations',
    description: 'Flying effects would interfere with lighting grid',
    priority: 'very_high',
    status: 'complete',
    type: 'directing',
    createdAt: new Date('2024-01-14T10:00:00'),
    updatedAt: new Date('2024-01-15T15:30:00'),
  },
  {
    id: '20',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Director requests more dramatic shadows',
    description: 'Increase side light angle for Act 3 interrogation',
    priority: 'medium',
    status: 'cancelled',
    type: 'directing',
    createdAt: new Date('2024-01-12T19:30:00'),
    updatedAt: new Date('2024-01-14T13:45:00'),
  },
  {
    id: '21',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Approved lighting concept for finale',
    description: 'Warm wash with practical star effects overhead',
    priority: 'low',
    status: 'todo',
    type: 'directing',
    createdAt: new Date('2024-01-16T16:15:00'),
    updatedAt: new Date('2024-01-16T16:15:00'),
  },
  // Choreography notes
  {
    id: '22',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Dance formation requires spot repositioning',
    description: 'New triangle formation needs 3 specials not 2',
    priority: 'medium',
    status: 'todo',
    type: 'choreography',
    createdAt: new Date('2024-01-15T20:00:00'),
    updatedAt: new Date('2024-01-15T20:00:00'),
  },
  {
    id: '23',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Lift sequence timing coordinated',
    description: 'Lighting follows dancers up to 8-foot platforms',
    priority: 'very_high',
    status: 'complete',
    type: 'choreography',
    createdAt: new Date('2024-01-13T18:15:00'),
    updatedAt: new Date('2024-01-16T10:45:00'),
  },
  {
    id: '24',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Floor reflection causing balance issues',
    description: 'Dancers slipping on glossy stage floor under lights',
    priority: 'low',
    status: 'cancelled',
    type: 'choreography',
    createdAt: new Date('2024-01-10T13:30:00'),
    updatedAt: new Date('2024-01-12T09:45:00'),
  },
  // Production Management notes
  {
    id: '25',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Budget variance report due Friday',
    description: 'Additional LED fixtures pushed costs over by 8%',
    priority: 'medium',
    status: 'todo',
    type: 'production_management',
    createdAt: new Date('2024-01-16T14:30:00'),
    updatedAt: new Date('2024-01-16T14:30:00'),
  },
  {
    id: '26',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Approved overtime for focus session',
    description: 'Extended tech week requires additional crew hours',
    priority: 'very_high',
    status: 'complete',
    type: 'production_management',
    createdAt: new Date('2024-01-12T16:00:00'),
    updatedAt: new Date('2024-01-14T08:30:00'),
  },
  {
    id: '27',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Insurance claims for damaged equipment',
    description: 'Storm damage to outdoor lighting rig last month',
    priority: 'low',
    status: 'cancelled',
    type: 'production_management',
    createdAt: new Date('2024-01-08T12:15:00'),
    updatedAt: new Date('2024-01-10T15:45:00'),
  },
  // Additional production notes for testing
  {
    id: '28',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Coordinate fog machine timing with sound cues',
    description: 'Atmospheric effects for ghost entrance',
    priority: 'very_high',
    status: 'todo',
    type: 'sound',
    createdAt: new Date('2024-01-17T09:30:00'),
    updatedAt: new Date('2024-01-17T09:30:00'),
  },
  {
    id: '29',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'New backdrop fabric testing complete',
    description: 'Muslin accepts lighting colors better than canvas',
    priority: 'medium',
    status: 'complete',
    type: 'scenic',
    createdAt: new Date('2024-01-15T14:20:00'),
    updatedAt: new Date('2024-01-16T11:45:00'),
  },
  {
    id: '30',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Costume reflectivity causing hot spots',
    description: 'Silver dress creates unwanted glare in Act 2',
    priority: 'medium',
    status: 'todo',
    type: 'costumes',
    createdAt: new Date('2024-01-17T10:15:00'),
    updatedAt: new Date('2024-01-17T10:15:00'),
  },
  {
    id: '31',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'LED house light conversion approved',
    description: 'Board approved budget for energy-efficient upgrade',
    priority: 'low',
    status: 'complete',
    type: 'lighting',
    createdAt: new Date('2024-01-14T16:00:00'),
    updatedAt: new Date('2024-01-15T13:30:00'),
  },
  {
    id: '32',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Video projection alignment with lighting',
    description: 'Projectors need repositioning to avoid wash spill',
    priority: 'very_high',
    status: 'complete',
    type: 'video',
    createdAt: new Date('2024-01-16T18:45:00'),
    updatedAt: new Date('2024-01-17T12:20:00'),
  },
  {
    id: '33',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Emergency evacuation lighting test',
    description: 'Monthly safety inspection passed',
    priority: 'critical',
    status: 'complete',
    type: 'stage_management',
    createdAt: new Date('2024-01-15T08:00:00'),
    updatedAt: new Date('2024-01-15T09:30:00'),
  },
  {
    id: '34',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Director wants more intimate lighting',
    description: 'Reduce area coverage for dialogue scenes',
    priority: 'medium',
    status: 'cancelled',
    type: 'directing',
    createdAt: new Date('2024-01-14T20:30:00'),
    updatedAt: new Date('2024-01-16T14:15:00'),
  },
  {
    id: '35',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Tap number requires floor lighting',
    description: 'Low-angle side light to show feet clearly',
    priority: 'very_high',
    status: 'todo',
    type: 'choreography',
    createdAt: new Date('2024-01-17T11:00:00'),
    updatedAt: new Date('2024-01-17T11:00:00'),
  },
  {
    id: '36',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Budget increase for additional equipment',
    description: 'Need approval for 8 more LED fixtures',
    priority: 'very_high',
    status: 'todo',
    type: 'production_management',
    createdAt: new Date('2024-01-17T08:15:00'),
    updatedAt: new Date('2024-01-17T08:15:00'),
  },
  {
    id: '37',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Microphone feedback eliminated',
    description: 'Repositioned monitors away from light booth',
    priority: 'medium',
    status: 'complete',
    type: 'sound',
    createdAt: new Date('2024-01-15T19:30:00'),
    updatedAt: new Date('2024-01-16T16:45:00'),
  },
  {
    id: '38',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Platform height creates shadow issues',
    description: 'Raised platform blocks downstage specials',
    priority: 'very_high',
    status: 'complete',
    type: 'scenic',
    createdAt: new Date('2024-01-16T12:30:00'),
    updatedAt: new Date('2024-01-17T09:45:00'),
  },
  {
    id: '39',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'White costume UV reactivity',
    description: 'Test fabrics under blacklight for ghost scene',
    priority: 'medium',
    status: 'todo',
    type: 'costumes',
    createdAt: new Date('2024-01-17T13:20:00'),
    updatedAt: new Date('2024-01-17T13:20:00'),
  },
  {
    id: '40',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Circuit capacity analysis complete',
    description: 'Current electrical can handle LED upgrade',
    priority: 'medium',
    status: 'complete',
    type: 'lighting',
    createdAt: new Date('2024-01-14T10:45:00'),
    updatedAt: new Date('2024-01-15T17:20:00'),
  },
  {
    id: '41',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Media server sync improvements',
    description: 'SMPTE timecode now stable with console',
    priority: 'low',
    status: 'complete',
    type: 'video',
    createdAt: new Date('2024-01-13T15:00:00'),
    updatedAt: new Date('2024-01-14T12:30:00'),
  },
  {
    id: '42',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Fire marshal inspection scheduled',
    description: 'Review all pyrotechnic and haze effects',
    priority: 'critical',
    status: 'todo',
    type: 'stage_management',
    createdAt: new Date('2024-01-17T07:30:00'),
    updatedAt: new Date('2024-01-17T07:30:00'),
  },
  {
    id: '43',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Approved scene change lighting',
    description: 'Blue working light for scene transitions',
    priority: 'low',
    status: 'complete',
    type: 'directing',
    createdAt: new Date('2024-01-15T21:15:00'),
    updatedAt: new Date('2024-01-16T08:45:00'),
  },
  {
    id: '44',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Group dance formation lighting',
    description: 'Even wash coverage for 16 dancers',
    priority: 'medium',
    status: 'complete',
    type: 'choreography',
    createdAt: new Date('2024-01-16T17:00:00'),
    updatedAt: new Date('2024-01-17T14:30:00'),
  },
  {
    id: '45',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Equipment rental contract signed',
    description: 'Moving lights secured for 6-week run',
    priority: 'medium',
    status: 'complete',
    type: 'production_management',
    createdAt: new Date('2024-01-12T14:20:00'),
    updatedAt: new Date('2024-01-13T11:00:00'),
  },
  {
    id: '46',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Orchestra pit lighting adjustment',
    description: 'Musicians need brighter music stand lights',
    priority: 'medium',
    status: 'todo',
    type: 'sound',
    createdAt: new Date('2024-01-17T15:45:00'),
    updatedAt: new Date('2024-01-17T15:45:00'),
  },
  {
    id: '47',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Set piece paint finish approved',
    description: 'Matte finish reduces unwanted reflections',
    priority: 'low',
    status: 'complete',
    type: 'scenic',
    createdAt: new Date('2024-01-14T13:45:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
  },
  {
    id: '48',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Quick change booth lighting',
    description: 'LED strips for costume changes stage left',
    priority: 'very_high',
    status: 'todo',
    type: 'costumes',
    createdAt: new Date('2024-01-17T12:00:00'),
    updatedAt: new Date('2024-01-17T12:00:00'),
  },
  {
    id: '49',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Dimmer room ventilation improved',
    description: 'New fans prevent overheating during shows',
    priority: 'very_high',
    status: 'complete',
    type: 'lighting',
    createdAt: new Date('2024-01-15T06:30:00'),
    updatedAt: new Date('2024-01-16T19:15:00'),
  },
  {
    id: '50',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Projection surface texture testing',
    description: 'Canvas vs screen material light interaction',
    priority: 'medium',
    status: 'cancelled',
    type: 'video',
    createdAt: new Date('2024-01-13T16:30:00'),
    updatedAt: new Date('2024-01-15T09:00:00'),
  },
  {
    id: '51',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Headset system expansion needed',
    description: 'Add channels for fly gallery operators',
    priority: 'medium',
    status: 'todo',
    type: 'stage_management',
    createdAt: new Date('2024-01-17T14:15:00'),
    updatedAt: new Date('2024-01-17T14:15:00'),
  },
  {
    id: '52',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Director collaboration on mood',
    description: 'Review color temperature for each scene',
    priority: 'very_high',
    status: 'complete',
    type: 'directing',
    createdAt: new Date('2024-01-16T10:00:00'),
    updatedAt: new Date('2024-01-17T16:30:00'),
  },
  {
    id: '53',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Partner lift safety lighting',
    description: 'Bright wash for rehearsal safety',
    priority: 'critical',
    status: 'complete',
    type: 'choreography',
    createdAt: new Date('2024-01-15T18:00:00'),
    updatedAt: new Date('2024-01-16T13:45:00'),
  },
  {
    id: '54',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Insurance documentation updated',
    description: 'New equipment added to policy',
    priority: 'low',
    status: 'complete',
    type: 'production_management',
    createdAt: new Date('2024-01-11T11:30:00'),
    updatedAt: new Date('2024-01-14T15:20:00'),
  },
  {
    id: '55',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Wireless microphone interference',
    description: 'RF scan shows conflict with LED drivers',
    priority: 'very_high',
    status: 'todo',
    type: 'sound',
    createdAt: new Date('2024-01-17T16:00:00'),
    updatedAt: new Date('2024-01-17T16:00:00'),
  },
  {
    id: '56',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Masking adjustment for new lighting',
    description: 'Additional borders needed to hide fixtures',
    priority: 'medium',
    status: 'todo',
    type: 'scenic',
    createdAt: new Date('2024-01-17T11:45:00'),
    updatedAt: new Date('2024-01-17T11:45:00'),
  },
  {
    id: '57',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Makeup compatibility with stage lights',
    description: 'Test foundation colors under LED wash',
    priority: 'medium',
    status: 'complete',
    type: 'costumes',
    createdAt: new Date('2024-01-14T17:30:00'),
    updatedAt: new Date('2024-01-15T14:45:00'),
  },
  {
    id: '58',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Console programming backup',
    description: 'Multiple save points for show files',
    priority: 'critical',
    status: 'complete',
    type: 'lighting',
    createdAt: new Date('2024-01-16T22:00:00'),
    updatedAt: new Date('2024-01-17T01:15:00'),
  },
  {
    id: '59',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Live camera feed integration',
    description: 'Backstage monitor for cue calling',
    priority: 'low',
    status: 'cancelled',
    type: 'video',
    createdAt: new Date('2024-01-12T13:00:00'),
    updatedAt: new Date('2024-01-14T10:30:00'),
  },
  {
    id: '60',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Strike coordination meeting',
    description: 'Plan equipment removal schedule',
    priority: 'medium',
    status: 'todo',
    type: 'stage_management',
    createdAt: new Date('2024-01-17T17:30:00'),
    updatedAt: new Date('2024-01-17T17:30:00'),
  },
  {
    id: '61',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Approved curtain call special effects',
    description: 'Confetti cannon timing with lighting',
    priority: 'medium',
    status: 'complete',
    type: 'directing',
    createdAt: new Date('2024-01-15T22:00:00'),
    updatedAt: new Date('2024-01-16T15:30:00'),
  },
  {
    id: '62',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Rehearsal lighting schedule',
    description: 'Coordinate tech time with other departments',
    priority: 'very_high',
    status: 'complete',
    type: 'choreography',
    createdAt: new Date('2024-01-14T09:15:00'),
    updatedAt: new Date('2024-01-15T18:20:00'),
  },
  {
    id: '63',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Venue rental negotiations',
    description: 'Extended run approved through May',
    priority: 'low',
    status: 'complete',
    type: 'production_management',
    createdAt: new Date('2024-01-10T16:45:00'),
    updatedAt: new Date('2024-01-12T10:20:00'),
  },
  {
    id: '64',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Sound board integration test',
    description: 'MIDI triggers for automated light cues',
    priority: 'medium',
    status: 'todo',
    type: 'sound',
    createdAt: new Date('2024-01-17T13:45:00'),
    updatedAt: new Date('2024-01-17T13:45:00'),
  },
  {
    id: '65',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Trap room lighting installation',
    description: 'Work lights for below-stage access',
    priority: 'very_high',
    status: 'todo',
    type: 'scenic',
    createdAt: new Date('2024-01-17T09:00:00'),
    updatedAt: new Date('2024-01-17T09:00:00'),
  },
  {
    id: '66',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Hair styling heat compatibility',
    description: 'Wigs must withstand stage light heat',
    priority: 'low',
    status: 'complete',
    type: 'costumes',
    createdAt: new Date('2024-01-13T14:30:00'),
    updatedAt: new Date('2024-01-15T11:15:00'),
  },
  {
    id: '67',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Energy audit for LED conversion',
    description: 'Calculate power savings over season',
    priority: 'low',
    status: 'todo',
    type: 'lighting',
    createdAt: new Date('2024-01-17T14:45:00'),
    updatedAt: new Date('2024-01-17T14:45:00'),
  },
  {
    id: '68',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Rehearsal recording setup',
    description: 'Document lighting states for reference',
    priority: 'medium',
    status: 'cancelled',
    type: 'video',
    createdAt: new Date('2024-01-11T19:00:00'),
    updatedAt: new Date('2024-01-13T12:45:00'),
  },
  {
    id: '69',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Cast safety briefing completed',
    description: 'Emergency procedures and exit lighting',
    priority: 'critical',
    status: 'complete',
    type: 'stage_management',
    createdAt: new Date('2024-01-14T18:30:00'),
    updatedAt: new Date('2024-01-15T12:00:00'),
  },
  {
    id: '70',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Final dress rehearsal notes',
    description: 'Last-minute lighting adjustments approved',
    priority: 'very_high',
    status: 'complete',
    type: 'directing',
    createdAt: new Date('2024-01-17T21:00:00'),
    updatedAt: new Date('2024-01-17T23:45:00'),
  },
  {
    id: '71',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Finale dance lighting effects',
    description: 'Strobe and color chase sequences',
    priority: 'medium',
    status: 'complete',
    type: 'choreography',
    createdAt: new Date('2024-01-16T20:30:00'),
    updatedAt: new Date('2024-01-17T17:15:00'),
  },
  {
    id: '72',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Box office coordination',
    description: 'House light timing for patron seating',
    priority: 'low',
    status: 'complete',
    type: 'production_management',
    createdAt: new Date('2024-01-13T10:00:00'),
    updatedAt: new Date('2024-01-14T14:30:00'),
  },
  {
    id: '73',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Monitor mix adjustment',
    description: 'Stage monitors interfering with booth sightlines',
    priority: 'medium',
    status: 'todo',
    type: 'sound',
    createdAt: new Date('2024-01-17T18:15:00'),
    updatedAt: new Date('2024-01-17T18:15:00'),
  },
  {
    id: '74',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Fly system counterweight adjustment',
    description: 'New lighting positions affect balance',
    priority: 'very_high',
    status: 'complete',
    type: 'scenic',
    createdAt: new Date('2024-01-15T07:45:00'),
    updatedAt: new Date('2024-01-16T14:00:00'),
  },
  {
    id: '75',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Wardrobe fitting under stage lights',
    description: 'Final costume check under performance lighting',
    priority: 'medium',
    status: 'complete',
    type: 'costumes',
    createdAt: new Date('2024-01-16T19:00:00'),
    updatedAt: new Date('2024-01-17T13:30:00'),
  },
  {
    id: '76',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Maintenance schedule for run',
    description: 'Weekly equipment checks during performances',
    priority: 'critical',
    status: 'todo',
    type: 'lighting',
    createdAt: new Date('2024-01-17T16:30:00'),
    updatedAt: new Date('2024-01-17T16:30:00'),
  },
  {
    id: '77',
    productionId: 'prod-1',
    moduleType: 'production',
    title: 'Audience survey feedback',
    description: 'Comments on lighting visibility and mood',
    priority: 'low',
    status: 'cancelled',
    type: 'video',
    createdAt: new Date('2024-01-10T12:30:00'),
    updatedAt: new Date('2024-01-12T16:00:00'),
  },
]

export default function ProductionNotesPage() {
  const notesContext = useNotes()
  // Determine effective notes based on mode
  const isDemo = isDemoMode()
  const notes = isDemo
    ? (typeof window !== 'undefined' ? useMockNotesStore.getState().notes.production : [])
    : notesContext.getNotes('production')

  const initializeWithMockData = useMockNotesStore(state => state.initializeWithMockData)

  // Initialize data logic
  useEffect(() => {
    // Non-production init
    if (!isDemo && typeof window !== 'undefined' && !window.location.pathname.startsWith('/production/')) {
      initializeWithMockData()
    }

    // Demo seeding
    if (isDemo) {
      const current = useMockNotesStore.getState().notes.production
      if ((!current || current.length === 0) && Array.isArray(mockProductionNotes) && mockProductionNotes.length > 0) {
        notesContext.setNotes('production', mockProductionNotes)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializeWithMockData, isDemo])

  // Mock store subscription for demo mode only
  const [, forceUpdate] = useState({})
  useEffect(() => {
    if (isDemo) {
      const unsubscribe = useMockNotesStore.subscribe(
        (state) => state.notes.production,
        () => forceUpdate({})
      )
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe()
      }
    }
  }, [isDemo])
  // Get production data from context (Supabase) if available, otherwise fall back to store
  const productionContext = useProductionOptional()
  const storeData = useCurrentProductionStore()
  const pathname = usePathname()
  const isProductionMode = pathname.startsWith('/production/')
  // When in production mode (real Supabase), use placeholder during loading and when no logo
  // Only fall back to store data when NOT in production mode (demo/default)
  const name = productionContext?.production?.name ?? (isProductionMode ? '' : storeData.name)
  const abbreviation = productionContext?.production?.abbreviation ?? (isProductionMode ? '' : storeData.abbreviation)
  const logo = isProductionMode
    ? (productionContext?.production?.logo || DEFAULT_PRODUCTION_LOGO)
    : storeData.logo
  const customTypesStore = useCustomTypesStore()
  const { isTabletMode } = useTabletModeStore()
  const tabletFilterStatus = useNotesFilterStore((s) => s.filterStatus)
  const tabletSearchTerm = useNotesFilterStore((s) => s.searchTerm)
  const setOnAddNote = useNotesFilterStore((s) => s.setOnAddNote)
  const tabletFilterTypes = useNotesFilterStore((s) => s.filterTypes)
  const tabletFilterPriorities = useNotesFilterStore((s) => s.filterPriorities)
  const tabletSortField = useNotesFilterStore((s) => s.sortField)
  const tabletSortDirection = useNotesFilterStore((s) => s.sortDirection)
  const customPrioritiesStore = useCustomPrioritiesStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<NoteStatus>('todo')
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogDefaultType, setDialogDefaultType] = useState<string>('lighting')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isEmailViewOpen, setIsEmailViewOpen] = useState(false)
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const resetColumnsRef = useRef<(() => void) | null>(null)

  // Handle client-side hydration for stores with skipHydration: true
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Get custom types from store (only after hydration)
  const availableTypes = isHydrated ? customTypesStore.getTypes('production') : []
  const typeOptions = availableTypes.map(type => ({
    value: type.value,
    label: type.label,
    color: type.color
  }))

  // In tablet mode, use shared filter store; in desktop, use local state
  const effectiveSearchTerm = isTabletMode ? tabletSearchTerm : searchTerm
  const effectiveFilterStatus = isTabletMode ? tabletFilterStatus : filterStatus

  const effectiveFilterTypes = isTabletMode ? tabletFilterTypes : filterTypes

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
        note.description?.toLowerCase().includes(effectiveSearchTerm.toLowerCase())
      const matchesStatus = note.status === effectiveFilterStatus
      const matchesType = effectiveFilterTypes.length > 0
        ? effectiveFilterTypes.includes(note.type || '')
        : true
      const matchesPriority = isTabletMode && tabletFilterPriorities.length > 0
        ? tabletFilterPriorities.includes(note.priority)
        : true
      return matchesSearch && matchesStatus && matchesType && matchesPriority
    })

    if (isTabletMode) {
      const activeSortField = tabletSortField ?? 'priority'
      const priorities = isHydrated ? customPrioritiesStore.getPriorities('production') : []
      return sortNotes(filtered, {
        type: 'filter_sort',
        moduleType: 'production',
        id: '_tablet',
        name: '_tablet',
        config: {
          statusFilter: null,
          typeFilters: [],
          priorityFilters: [],
          sortBy: activeSortField,
          sortOrder: tabletSortDirection,
          groupByType: false,
        },
      } as any, priorities)
    }

    return filtered
  }, [notes, effectiveSearchTerm, effectiveFilterStatus, effectiveFilterTypes, isTabletMode, tabletFilterPriorities, tabletSortField, tabletSortDirection, isHydrated, customPrioritiesStore])


  const openQuickAdd = (typeValue: string) => {
    setDialogDefaultType(typeValue)
    setEditingNote(null)
    setIsDialogOpen(true)
  }

  const updateNoteStatus = async (noteId: string, status: NoteStatus) => {
    await notesContext.updateNote(noteId, { status })
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setDialogDefaultType(note.type || 'Lighting')
    setIsDialogOpen(true)
  }

  // Register add-note callback for tablet top bar
  const tabletAddNote = useCallback(() => {
    setEditingNote(null)
    setDialogDefaultType('scenic')
    setIsDialogOpen(true)
  }, [])

  useEffect(() => {
    if (isTabletMode) {
      setOnAddNote(tabletAddNote)
      return () => setOnAddNote(null)
    }
  }, [isTabletMode, tabletAddNote, setOnAddNote])

  const tabletColumns = useMemo(
    () => createTabletProductionColumns({ onStatusUpdate: updateNoteStatus }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isTabletMode]
  )

  const handleDialogAdd = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingNote) {
      // Update existing note
      await notesContext.updateNote(editingNote.id, noteData)
    } else {
      // Create new note
      await notesContext.addNote(noteData)
    }
    setEditingNote(null)
  }

  // Tablet mode rendering
  if (isTabletMode) {
    return (
      <>
        <div className="h-full">
          <TabletNotesTable
            notes={filteredNotes}
            columns={tabletColumns}
            onEdit={handleEditNote}
            emptyIcon={FileText}
            emptyMessage="No production notes found"
          />
        </div>

        <AddNoteDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAdd={handleDialogAdd}
          moduleType="production"
          defaultType={dialogDefaultType}
          editingNote={editingNote}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Sticky Header Container */}
        <div className="flex-none space-y-6 pb-4">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center border-b border-bg-tertiary pb-6">
            {/* Left: Production Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-bg-secondary rounded-lg text-2xl overflow-hidden">
                {(() => {
                  const displayLogo = logo || DEFAULT_PRODUCTION_LOGO
                  return displayLogo.startsWith('data:') || displayLogo.startsWith('/') || displayLogo.startsWith('http') ? (
                    <div className="relative w-full h-full">
                      <Image src={displayLogo} alt="Production logo" fill className="object-cover" />
                    </div>
                  ) : (
                    <span>{displayLogo}</span>
                  )
                })()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">{name}</h2>
                <p className="text-text-secondary">{abbreviation}</p>
              </div>
            </div>

            {/* Center: Module Heading */}
            <div className="flex justify-center">
              <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3 whitespace-nowrap">
                <FileText className="h-8 w-8 text-modules-production" />
                Production Notes
              </h1>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex justify-end items-center gap-3">
              <UndoRedoButtons />
              <div className="h-6 w-px bg-border" />
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
                onClick={() => openQuickAdd('scenic')}
                variant="production"
              >
                <Plus className="h-5 w-5" />
                Add Production Note
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

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search production notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-80 pl-8 font-medium"
                  data-testid="search-input"
                  aria-label="Search notes"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (resetColumnsRef.current) {
                    resetColumnsRef.current()
                  }
                }}
                title="Reset column widths to defaults"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Add Bar */}
          {filterStatus === 'todo' && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground text-sm">Quick Add:</span>
              {availableTypes.map(type => {
                // Truncate long labels for quick add bar
                const displayLabel = type.label.length > 12
                  ? type.label.substring(0, 10) + '...'
                  : type.label;

                return (
                  <Button
                    key={type.id}
                    onClick={() => openQuickAdd(type.value)}
                    size="xs"
                    style={{
                      backgroundColor: type.color,
                      borderColor: type.color
                    }}
                    className="text-white hover:opacity-80 transition-opacity"
                    title={type.label} // Full name on hover
                  >
                    <Plus className="h-3 w-3" />{displayLabel}
                  </Button>
                );
              })}
            </div>
          )}
        </div>


        {/* Notes Table - Fills remaining space */}
        <div className="flex-1 min-h-0">
          <ProductionNotesTable
            notes={filteredNotes}
            onStatusUpdate={updateNoteStatus}
            onEdit={handleEditNote}
            onMountResetFn={(resetFn) => {
              resetColumnsRef.current = resetFn
            }}
          />

          {filteredNotes.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No production notes found</p>
              <p className="text-text-muted text-sm mt-1">Try adjusting your filters or add a new note</p>
            </div>
          )}
        </div>
      </div>

      <AddNoteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleDialogAdd}
        moduleType="production"
        defaultType={dialogDefaultType}
        editingNote={editingNote}
      />

      <EmailNotesSidebar
        moduleType="production"
        isOpen={isEmailViewOpen}
        onClose={() => setIsEmailViewOpen(false)}
      />

      <PrintNotesSidebar
        moduleType="production"
        isOpen={isPrintViewOpen}
        onClose={() => setIsPrintViewOpen(false)}
        notes={notes}
      />
    </>
  )
}
