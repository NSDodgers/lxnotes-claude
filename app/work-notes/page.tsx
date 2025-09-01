'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NotesTable } from '@/components/notes-table'
import { AddNoteDialog } from '@/components/add-note-dialog'
import { EmailNotesView } from '@/components/email-notes-view'
import { PrintNotesView } from '@/components/print-notes-view'
import { LightwrightUploadDialog } from '@/components/lightwright-upload-dialog'
import { LightwrightDataViewer } from '@/components/lightwright-data-viewer'
import { useState, useEffect } from 'react'
import { Plus, Search, Wrench, Upload, Mail, Printer, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note, NoteStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { useProductionStore } from '@/lib/stores/production-store'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useLightwrightStore } from '@/lib/stores/lightwright-store'
import { generateSampleFixtures } from '@/lib/test-data/sample-lightwright-data'

// Mock data for development
const mockWorkNotes: Note[] = [
  // Work type notes
  {
    id: '1',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Replace lamp in FOH position 3',
    description: 'HPL 575W burnt out during tech rehearsal',
    priority: 'high',
    status: 'todo',
    type: 'work',
    createdAt: new Date('2024-01-16T09:30:00'),
    updatedAt: new Date('2024-01-16T09:30:00'),
    lightwrightItemId: 'LW001',
    channelNumbers: '101, 102',
    positionUnit: 'FOH-3 Units 1-2',
    sceneryNeeds: 'Need ladder access behind set piece',
  },
  {
    id: '2',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Hang additional side light positions',
    description: 'Install 4 new fixtures on SL boom',
    priority: 'medium',
    status: 'complete',
    type: 'work',
    createdAt: new Date('2024-01-14T08:15:00'),
    updatedAt: new Date('2024-01-15T17:45:00'),
    lightwrightItemId: 'LW078',
    channelNumbers: '215, 216, 217, 218',
    positionUnit: 'SL Boom Units 4-7',
    sceneryNeeds: 'Coordinate with scenic for boom placement',
  },
  {
    id: '3',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Repair damaged yoke on Unit 47',
    description: 'Tilt mechanism sticking, needs cleaning',
    priority: 'low',
    status: 'cancelled',
    type: 'work',
    createdAt: new Date('2024-01-12T14:20:00'),
    updatedAt: new Date('2024-01-14T11:30:00'),
    lightwrightItemId: 'LW047',
  },
  // Focus type notes
  {
    id: '4',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Gel replacement for cyc lights',
    description: 'Change R80 to R83 for warmer tone in Act 2',
    priority: 'medium',
    status: 'complete',
    type: 'focus',
    createdAt: new Date('2024-01-13T16:00:00'),
    updatedAt: new Date('2024-01-15T10:20:00'),
    lightwrightItemId: 'LW045',
    channelNumbers: '301-310',
    positionUnit: 'Cyc Units 1-10',
    sceneryNeeds: 'Access behind cyc during intermission only',
  },
  {
    id: '5',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Refocus specials after set change',
    description: 'Platform height changed, need to adjust 8 fixtures',
    priority: 'high',
    status: 'todo',
    type: 'focus',
    createdAt: new Date('2024-01-16T11:45:00'),
    updatedAt: new Date('2024-01-16T11:45:00'),
    channelNumbers: '151-158',
    positionUnit: 'Balcony Rail Specials 1-8',
    sceneryNeeds: 'Wait until platform is final height',
  },
  {
    id: '6',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Barn door adjustment on front wash',
    description: 'Clean up spill light hitting proscenium',
    priority: 'low',
    status: 'cancelled',
    type: 'focus',
    createdAt: new Date('2024-01-11T13:30:00'),
    updatedAt: new Date('2024-01-13T09:15:00'),
    lightwrightItemId: 'LW023',
  },
  // Paperwork type notes
  {
    id: '7',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Update hookup with circuit changes',
    description: 'Circuits 47-52 reassigned to new dimmers',
    priority: 'medium',
    status: 'todo',
    type: 'paperwork',
    createdAt: new Date('2024-01-15T14:30:00'),
    updatedAt: new Date('2024-01-15T14:30:00'),
  },
  {
    id: '8',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Complete safety inspection forms',
    description: 'Annual electrical safety documentation',
    priority: 'high',
    status: 'complete',
    type: 'paperwork',
    createdAt: new Date('2024-01-10T09:00:00'),
    updatedAt: new Date('2024-01-12T16:45:00'),
  },
  {
    id: '9',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Organize gel swatch book',
    description: 'Update with new LED color samples',
    priority: 'low',
    status: 'cancelled',
    type: 'paperwork',
    createdAt: new Date('2024-01-09T15:20:00'),
    updatedAt: new Date('2024-01-11T10:30:00'),
  },
  // Electrician type notes
  {
    id: '10',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Check DMX cable run stage left',
    description: 'Intermittent signal issues on Universe 2',
    priority: 'high',
    status: 'todo',
    type: 'electrician',
    createdAt: new Date('2024-01-16T07:45:00'),
    updatedAt: new Date('2024-01-16T07:45:00'),
  },
  {
    id: '11',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Install new dimmer rack cooling fan',
    description: 'Rack 3 running hot, fan replacement needed',
    priority: 'medium',
    status: 'complete',
    type: 'electrician',
    createdAt: new Date('2024-01-13T10:15:00'),
    updatedAt: new Date('2024-01-15T14:20:00'),
  },
  {
    id: '12',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Ground fault testing on all circuits',
    description: 'Monthly safety protocol check',
    priority: 'low',
    status: 'cancelled',
    type: 'electrician',
    createdAt: new Date('2024-01-08T11:00:00'),
    updatedAt: new Date('2024-01-10T09:30:00'),
  },
  {
    id: '13',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Repair loose connection in patch panel',
    description: 'Circuit 28 has intermittent power loss',
    priority: 'medium',
    status: 'todo',
    type: 'electrician',
    createdAt: new Date('2024-01-15T19:30:00'),
    updatedAt: new Date('2024-01-15T19:30:00'),
  },
  // Think type notes
  {
    id: '14',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Evaluate LED retrofit for house lights',
    description: 'Cost analysis and energy savings calculation',
    priority: 'low',
    status: 'complete',
    type: 'think',
    createdAt: new Date('2024-01-07T16:00:00'),
    updatedAt: new Date('2024-01-12T13:45:00'),
  },
  {
    id: '15',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Consider wireless DMX for fly gallery',
    description: 'Cable runs problematic, research wireless options',
    priority: 'medium',
    status: 'todo',
    type: 'think',
    createdAt: new Date('2024-01-14T12:30:00'),
    updatedAt: new Date('2024-01-14T12:30:00'),
  },
  {
    id: '16',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Alternative rigging for overhead specials',
    description: 'Current position blocks sightlines from balcony',
    priority: 'high',
    status: 'cancelled',
    type: 'think',
    createdAt: new Date('2024-01-11T18:15:00'),
    updatedAt: new Date('2024-01-13T15:45:00'),
  },
  {
    id: '17',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Research new haze machine options',
    description: 'Current unit too noisy for intimate scenes',
    priority: 'medium',
    status: 'todo',
    type: 'think',
    createdAt: new Date('2024-01-16T14:00:00'),
    updatedAt: new Date('2024-01-16T14:00:00'),
  },
  {
    id: '18',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Plan cable management upgrade',
    description: 'Current system creating trip hazards',
    priority: 'high',
    status: 'complete',
    type: 'think',
    createdAt: new Date('2024-01-09T13:20:00'),
    updatedAt: new Date('2024-01-14T10:15:00'),
  },
  // Additional work notes for testing
  {
    id: '19',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Install gobos in downstage wash',
    description: 'Add breakup gobos to Units 12-15 for texture',
    priority: 'medium',
    status: 'todo',
    type: 'work',
    createdAt: new Date('2024-01-17T09:15:00'),
    updatedAt: new Date('2024-01-17T09:15:00'),
    lightwrightItemId: 'LW012',
    channelNumbers: '112, 113, 114, 115',
    positionUnit: 'FOH-1 Units 12-15',
    sceneryNeeds: 'Access during preset time only',
  },
  {
    id: '20',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Replace dimmer module in rack 3',
    description: 'Channel 305 not responding to control',
    priority: 'critical',
    status: 'todo',
    type: 'electrician',
    createdAt: new Date('2024-01-17T11:30:00'),
    updatedAt: new Date('2024-01-17T11:30:00'),
    lightwrightItemId: 'LW305',
    channelNumbers: '305',
    sceneryNeeds: 'Power shutdown required for 30 minutes',
  },
  {
    id: '21',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Focus session for Act 2 ballet sequence',
    description: 'Adjust 16 specials for new choreography',
    priority: 'high',
    status: 'todo',
    type: 'focus',
    createdAt: new Date('2024-01-17T08:00:00'),
    updatedAt: new Date('2024-01-17T14:20:00'),
    lightwrightItemId: 'LW201',
    channelNumbers: '201-216',
    positionUnit: 'Box Boom Specials 1-16',
    sceneryNeeds: 'Schedule around dancer rehearsal',
  },
  {
    id: '22',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Gel maintenance on cyc wash',
    description: 'Replace faded R80 with fresh color',
    priority: 'low',
    status: 'complete',
    type: 'maintenance',
    createdAt: new Date('2024-01-15T16:45:00'),
    updatedAt: new Date('2024-01-16T12:30:00'),
    lightwrightItemId: 'LW320',
    channelNumbers: '320-335',
    positionUnit: 'Cyc Units 1-16',
  },
  {
    id: '23',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Install safety cables on all moving lights',
    description: 'Required by venue insurance policy',
    priority: 'critical',
    status: 'complete',
    type: 'install',
    createdAt: new Date('2024-01-14T07:00:00'),
    updatedAt: new Date('2024-01-15T18:45:00'),
    channelNumbers: '401-412',
    positionUnit: 'All Moving Light Positions',
    sceneryNeeds: 'Coordinate with rigger certification',
  },
  {
    id: '24',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Update lighting plot with latest changes',
    description: 'Add new positions and fixture updates',
    priority: 'medium',
    status: 'todo',
    type: 'paperwork',
    createdAt: new Date('2024-01-17T10:00:00'),
    updatedAt: new Date('2024-01-17T10:00:00'),
  },
  {
    id: '25',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Troubleshoot flickering in position 7',
    description: 'Intermittent connection in Unit 34',
    priority: 'high',
    status: 'todo',
    type: 'electrician',
    createdAt: new Date('2024-01-17T13:15:00'),
    updatedAt: new Date('2024-01-17T13:15:00'),
    lightwrightItemId: 'LW034',
    channelNumbers: '134',
    positionUnit: 'SL Boom Unit 7',
    sceneryNeeds: 'Access during dinner break',
  },
  {
    id: '26',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Clean lenses on front wash system',
    description: 'Dust buildup affecting light quality',
    priority: 'medium',
    status: 'cancelled',
    type: 'maintenance',
    createdAt: new Date('2024-01-16T09:30:00'),
    updatedAt: new Date('2024-01-17T08:45:00'),
    lightwrightItemId: 'LW101',
    channelNumbers: '101-120',
    positionUnit: 'FOH Wash Units 1-20',
    sceneryNeeds: 'Need tall ladder access',
  },
  {
    id: '27',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Research LED color temperature matching',
    description: 'New LEDs dont match tungsten warm',
    priority: 'medium',
    status: 'complete',
    type: 'think',
    createdAt: new Date('2024-01-14T15:20:00'),
    updatedAt: new Date('2024-01-16T11:00:00'),
  },
  {
    id: '28',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Install additional circuits in booth',
    description: 'Need 4 more 20A circuits for equipment',
    priority: 'high',
    status: 'todo',
    type: 'install',
    createdAt: new Date('2024-01-17T12:00:00'),
    updatedAt: new Date('2024-01-17T12:00:00'),
    sceneryNeeds: 'Coordinate with house electrician',
  },
  {
    id: '29',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Focus specials for dream sequence',
    description: 'Tight pools for Act 1 Scene 5',
    priority: 'medium',
    status: 'complete',
    type: 'focus',
    createdAt: new Date('2024-01-15T19:00:00'),
    updatedAt: new Date('2024-01-16T14:30:00'),
    lightwrightItemId: 'LW155',
    channelNumbers: '155-162',
    positionUnit: 'Balcony Specials 1-8',
  },
  {
    id: '30',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Test backup power systems',
    description: 'Weekly safety check of emergency lighting',
    priority: 'critical',
    status: 'complete',
    type: 'maintenance',
    createdAt: new Date('2024-01-16T06:00:00'),
    updatedAt: new Date('2024-01-16T07:30:00'),
    channelNumbers: '501-520',
    positionUnit: 'Emergency Systems All',
  },
  {
    id: '31',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Organize gel inventory',
    description: 'Sort and count all color filters',
    priority: 'low',
    status: 'todo',
    type: 'paperwork',
    createdAt: new Date('2024-01-17T08:30:00'),
    updatedAt: new Date('2024-01-17T08:30:00'),
  },
  {
    id: '32',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Repair broken color scroller',
    description: 'Unit 28 scroller jammed on R26',
    priority: 'medium',
    status: 'todo',
    type: 'electrician',
    createdAt: new Date('2024-01-17T15:45:00'),
    updatedAt: new Date('2024-01-17T15:45:00'),
    lightwrightItemId: 'LW028',
    channelNumbers: '128',
    positionUnit: 'FOH-2 Unit 8',
  },
  {
    id: '33',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Install haze machine upstage',
    description: 'New position for better coverage',
    priority: 'high',
    status: 'complete',
    type: 'install',
    createdAt: new Date('2024-01-15T10:15:00'),
    updatedAt: new Date('2024-01-16T16:20:00'),
    sceneryNeeds: 'Platform modification required',
  },
  {
    id: '34',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Adjust barn doors on side wash',
    description: 'Eliminate spill onto proscenium arch',
    priority: 'low',
    status: 'cancelled',
    type: 'focus',
    createdAt: new Date('2024-01-14T17:30:00'),
    updatedAt: new Date('2024-01-16T09:15:00'),
    lightwrightItemId: 'LW089',
    channelNumbers: '189-196',
    positionUnit: 'SR Boom Units 1-8',
  },
  {
    id: '35',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Evaluate wireless DMX performance',
    description: 'Occasional signal dropout in moving lights',
    priority: 'medium',
    status: 'complete',
    type: 'think',
    createdAt: new Date('2024-01-13T11:45:00'),
    updatedAt: new Date('2024-01-15T13:20:00'),
  },
  {
    id: '36',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Replace aging followspot',
    description: 'Current unit has poor optics',
    priority: 'high',
    status: 'todo',
    type: 'work',
    createdAt: new Date('2024-01-17T14:00:00'),
    updatedAt: new Date('2024-01-17T14:00:00'),
    sceneryNeeds: 'Booth access for installation',
  },
  {
    id: '37',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Check all fixture yokes for wear',
    description: 'Preventive maintenance inspection',
    priority: 'medium',
    status: 'complete',
    type: 'maintenance',
    createdAt: new Date('2024-01-14T08:30:00'),
    updatedAt: new Date('2024-01-15T17:45:00'),
    channelNumbers: 'All positions',
    positionUnit: 'Theatre-wide inspection',
  },
  {
    id: '38',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Program new moving light show',
    description: 'Create chase effects for finale',
    priority: 'low',
    status: 'todo',
    type: 'focus',
    createdAt: new Date('2024-01-17T16:30:00'),
    updatedAt: new Date('2024-01-17T16:30:00'),
    channelNumbers: '401-412',
    positionUnit: 'Moving Light Grid',
  },
  {
    id: '39',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Update emergency contact list',
    description: 'Add new vendor and technician info',
    priority: 'low',
    status: 'complete',
    type: 'paperwork',
    createdAt: new Date('2024-01-16T13:00:00'),
    updatedAt: new Date('2024-01-16T15:45:00'),
  },
  {
    id: '40',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Install blacklight for UV effects',
    description: 'Special effect for ghost appearances',
    priority: 'high',
    status: 'todo',
    type: 'install',
    createdAt: new Date('2024-01-17T11:15:00'),
    updatedAt: new Date('2024-01-17T11:15:00'),
    lightwrightItemId: 'LW451',
    channelNumbers: '451',
    positionUnit: 'US Right Special',
    sceneryNeeds: 'Coordinate with costume dept UV materials',
  },
  {
    id: '41',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Troubleshoot DMX termination issues',
    description: 'Occasional signal corruption on universe 2',
    priority: 'critical',
    status: 'complete',
    type: 'electrician',
    createdAt: new Date('2024-01-15T20:00:00'),
    updatedAt: new Date('2024-01-16T10:30:00'),
    channelNumbers: '201-300',
    positionUnit: 'Universe 2 All Fixtures',
  },
  {
    id: '42',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Consider LED strip upgrade',
    description: 'Current strips not bright enough for cyc wash',
    priority: 'medium',
    status: 'todo',
    type: 'think',
    createdAt: new Date('2024-01-17T09:45:00'),
    updatedAt: new Date('2024-01-17T09:45:00'),
  },
  {
    id: '43',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Focus tight specials for solos',
    description: '6 spots for principal character moments',
    priority: 'high',
    status: 'complete',
    type: 'focus',
    createdAt: new Date('2024-01-16T18:00:00'),
    updatedAt: new Date('2024-01-17T12:45:00'),
    lightwrightItemId: 'LW170',
    channelNumbers: '170-175',
    positionUnit: 'Catwalk Specials 1-6',
  },
  {
    id: '44',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Replace worn gel frames',
    description: 'Several frames cracked from heat',
    priority: 'medium',
    status: 'cancelled',
    type: 'maintenance',
    createdAt: new Date('2024-01-15T12:20:00'),
    updatedAt: new Date('2024-01-16T08:30:00'),
    lightwrightItemId: 'LW045',
    positionUnit: 'Various high-wattage positions',
  },
  {
    id: '45',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Install additional work lights',
    description: 'Better illumination for setup crews',
    priority: 'low',
    status: 'todo',
    type: 'install',
    createdAt: new Date('2024-01-17T07:15:00'),
    updatedAt: new Date('2024-01-17T07:15:00'),
    sceneryNeeds: 'Coordinate with scenic shop',
  },
  {
    id: '46',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Document all console programming',
    description: 'Backup and archive show files',
    priority: 'critical',
    status: 'complete',
    type: 'paperwork',
    createdAt: new Date('2024-01-16T21:00:00'),
    updatedAt: new Date('2024-01-17T01:30:00'),
  },
  {
    id: '47',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Test smoke detector sensitivity',
    description: 'Ensure haze wont trigger fire system',
    priority: 'critical',
    status: 'complete',
    type: 'electrician',
    createdAt: new Date('2024-01-15T14:30:00'),
    updatedAt: new Date('2024-01-15T16:00:00'),
    sceneryNeeds: 'Coordinate with building maintenance',
  },
  {
    id: '48',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Evaluate new console training needs',
    description: 'Assess operator proficiency levels',
    priority: 'low',
    status: 'todo',
    type: 'think',
    createdAt: new Date('2024-01-17T10:30:00'),
    updatedAt: new Date('2024-01-17T10:30:00'),
  },
  {
    id: '49',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Adjust iris size on followspots',
    description: 'Tighter focus needed for intimate scenes',
    priority: 'medium',
    status: 'complete',
    type: 'focus',
    createdAt: new Date('2024-01-16T19:45:00'),
    updatedAt: new Date('2024-01-17T13:00:00'),
  },
  {
    id: '50',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Clean and organize tool inventory',
    description: 'End-of-show equipment maintenance',
    priority: 'low',
    status: 'todo',
    type: 'maintenance',
    createdAt: new Date('2024-01-17T17:00:00'),
    updatedAt: new Date('2024-01-17T17:00:00'),
  },
  {
    id: '51',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Install additional power outlets',
    description: 'More convenience outlets needed backstage',
    priority: 'medium',
    status: 'todo',
    type: 'install',
    createdAt: new Date('2024-01-17T08:45:00'),
    updatedAt: new Date('2024-01-17T08:45:00'),
    sceneryNeeds: 'Coordinate with building electrical',
  },
  {
    id: '52',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Research automated rigging systems',
    description: 'Evaluate motorized batten options',
    priority: 'low',
    status: 'complete',
    type: 'think',
    createdAt: new Date('2024-01-14T13:15:00'),
    updatedAt: new Date('2024-01-16T17:20:00'),
  },
  {
    id: '53',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Focus audience blinder effects',
    description: 'High-intensity strobes for finale',
    priority: 'high',
    status: 'todo',
    type: 'focus',
    createdAt: new Date('2024-01-17T14:30:00'),
    updatedAt: new Date('2024-01-17T14:30:00'),
    lightwrightItemId: 'LW480',
    channelNumbers: '480-485',
    positionUnit: 'Audience Blinders 1-6',
    sceneryNeeds: 'Test during audience dress rehearsal',
  },
  {
    id: '54',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Update fixture maintenance logs',
    description: 'Record lamp hours and service dates',
    priority: 'medium',
    status: 'cancelled',
    type: 'paperwork',
    createdAt: new Date('2024-01-15T11:00:00'),
    updatedAt: new Date('2024-01-16T14:15:00'),
  },
  {
    id: '55',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Install mirror ball motor',
    description: 'Variable speed control for dance numbers',
    priority: 'medium',
    status: 'complete',
    type: 'install',
    createdAt: new Date('2024-01-15T16:30:00'),
    updatedAt: new Date('2024-01-16T11:45:00'),
    lightwrightItemId: 'LW499',
    channelNumbers: '499',
    positionUnit: 'Center Fly Gallery',
  },
  {
    id: '56',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Calibrate color temperature meters',
    description: 'Annual equipment calibration due',
    priority: 'low',
    status: 'todo',
    type: 'maintenance',
    createdAt: new Date('2024-01-17T09:00:00'),
    updatedAt: new Date('2024-01-17T09:00:00'),
  },
  {
    id: '57',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Plan inventory for next production',
    description: 'Assess equipment needs for spring show',
    priority: 'medium',
    status: 'todo',
    type: 'think',
    createdAt: new Date('2024-01-17T15:00:00'),
    updatedAt: new Date('2024-01-17T15:00:00'),
  },
  {
    id: '58',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Focus practical lighting elements',
    description: 'Table lamps and chandeliers on set',
    priority: 'high',
    status: 'complete',
    type: 'focus',
    createdAt: new Date('2024-01-16T17:00:00'),
    updatedAt: new Date('2024-01-17T10:15:00'),
    lightwrightItemId: 'LW350',
    channelNumbers: '350-355',
    positionUnit: 'Practical Elements',
    sceneryNeeds: 'Coordinate with props department',
  },
  {
    id: '59',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Replace batteries in wireless units',
    description: 'Preventive maintenance on all RF equipment',
    priority: 'critical',
    status: 'complete',
    type: 'maintenance',
    createdAt: new Date('2024-01-16T08:00:00'),
    updatedAt: new Date('2024-01-16T12:00:00'),
  },
  {
    id: '60',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Test emergency lighting systems',
    description: 'Monthly safety inspection',
    priority: 'critical',
    status: 'complete',
    type: 'electrician',
    createdAt: new Date('2024-01-15T07:30:00'),
    updatedAt: new Date('2024-01-15T08:45:00'),
    channelNumbers: '501-520',
  },
  {
    id: '61',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Consider LED house light retrofit',
    description: 'Energy savings and dimming improvements',
    priority: 'low',
    status: 'todo',
    type: 'think',
    createdAt: new Date('2024-01-17T11:45:00'),
    updatedAt: new Date('2024-01-17T11:45:00'),
  },
  {
    id: '62',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Install additional ethernet runs',
    description: 'Expand network for media servers',
    priority: 'medium',
    status: 'todo',
    type: 'install',
    createdAt: new Date('2024-01-17T13:30:00'),
    updatedAt: new Date('2024-01-17T13:30:00'),
    sceneryNeeds: 'Route cables through existing infrastructure',
  },
  {
    id: '63',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Focus wash lighting for dance numbers',
    description: 'Even coverage for full stage choreography',
    priority: 'high',
    status: 'complete',
    type: 'focus',
    createdAt: new Date('2024-01-16T20:15:00'),
    updatedAt: new Date('2024-01-17T15:30:00'),
    lightwrightItemId: 'LW250',
    channelNumbers: '250-265',
    positionUnit: 'Dance Wash All Positions',
  },
  {
    id: '64',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Create equipment checkout system',
    description: 'Track tools and equipment loans',
    priority: 'low',
    status: 'cancelled',
    type: 'paperwork',
    createdAt: new Date('2024-01-14T10:45:00'),
    updatedAt: new Date('2024-01-16T16:00:00'),
  },
  {
    id: '65',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Install pyrotechnic safety systems',
    description: 'Fire marshal requirements for flash effects',
    priority: 'critical',
    status: 'complete',
    type: 'install',
    createdAt: new Date('2024-01-14T12:00:00'),
    updatedAt: new Date('2024-01-15T19:30:00'),
    sceneryNeeds: 'Coordinate with fire marshal inspection',
  },
  {
    id: '66',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Troubleshoot console freezing issues',
    description: 'Intermittent lockups during complex cues',
    priority: 'high',
    status: 'todo',
    type: 'electrician',
    createdAt: new Date('2024-01-17T16:45:00'),
    updatedAt: new Date('2024-01-17T16:45:00'),
  },
  {
    id: '67',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Plan cable storage reorganization',
    description: 'Current system inefficient for quick setup',
    priority: 'medium',
    status: 'todo',
    type: 'think',
    createdAt: new Date('2024-01-17T12:15:00'),
    updatedAt: new Date('2024-01-17T12:15:00'),
  },
  {
    id: '68',
    productionId: 'prod-1',
    moduleType: 'work',
    title: 'Focus key light for principal actors',
    description: 'Individual specials for star entrances',
    priority: 'high',
    status: 'complete',
    type: 'focus',
    createdAt: new Date('2024-01-16T21:30:00'),
    updatedAt: new Date('2024-01-17T14:45:00'),
    lightwrightItemId: 'LW180',
    channelNumbers: '180-185',
    positionUnit: 'Star Specials 1-6',
  },
]

export default function WorkNotesPage() {
  const [notes, setNotes] = useState(mockWorkNotes)
  const { name, abbreviation, logo } = useProductionStore()
  const customTypesStore = useCustomTypesStore()
  const { fixtures, uploadFixtures, linkFixturesToWorkNote } = useLightwrightStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<NoteStatus>('todo')
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [showImport, setShowImport] = useState(false)
  const [isLightwrightDialogOpen, setIsLightwrightDialogOpen] = useState(false)
  const [isLightwrightViewerOpen, setIsLightwrightViewerOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogDefaultType, setDialogDefaultType] = useState<string>('Work')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isEmailViewOpen, setIsEmailViewOpen] = useState(false)
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Handle client-side hydration for stores with skipHydration: true
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load test data in development mode
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true' || !process.env.NEXT_PUBLIC_DEV_MODE) {
      loadTestData()
    }
  }, [])

  // Development helper - populate test data
  const loadTestData = () => {
    if (fixtures.length === 0) {
      const testFixtures = generateSampleFixtures()
      const parsedRows = testFixtures.map(f => ({
        lwid: f.lwid,
        channel: f.channel,
        position: f.position,
        unitNumber: f.unitNumber,
        fixtureType: f.fixtureType,
        purpose: f.purpose,
        universeAddressRaw: f.universeAddressRaw,
        universe: f.universe,
        address: f.address
      }))
      uploadFixtures('prod-1', parsedRows, false)
    }
  }

  // Get custom types from store (only after hydration)
  const availableTypes = isHydrated ? customTypesStore.getTypes('work') : []
  const typeOptions = availableTypes.map(type => ({ 
    value: type.value, 
    label: type.label,
    color: type.color 
  }))

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          note.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = note.status === filterStatus
    const matchesType = filterTypes.length === 0 || filterTypes.includes(note.type || '')
    return matchesSearch && matchesStatus && matchesType
  })


  const openQuickAdd = (typeValue: string) => {
    setDialogDefaultType(typeValue)
    setEditingNote(null)
    setIsDialogOpen(true)
  }

  const updateNoteStatus = (noteId: string, status: NoteStatus) => {
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, status, updatedAt: new Date() } : note
    ))
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setDialogDefaultType(note.type || 'Work')
    setIsDialogOpen(true)
  }

  const handleDialogAdd = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>, lightwrightFixtureIds?: string[]) => {
    if (editingNote) {
      // Update existing note
      const updatedNote: Note = {
        ...editingNote,
        ...noteData,
        updatedAt: new Date(),
      }
      setNotes(notes.map(note => note.id === editingNote.id ? updatedNote : note))
      
      // Handle fixture linking for work notes
      if (noteData.moduleType === 'work' && lightwrightFixtureIds) {
        linkFixturesToWorkNote(editingNote.id, lightwrightFixtureIds)
      }
    } else {
      // Create new note
      const note: Note = {
        ...noteData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setNotes([note, ...notes])
      
      // Handle fixture linking for work notes
      if (noteData.moduleType === 'work' && lightwrightFixtureIds && lightwrightFixtureIds.length > 0) {
        linkFixturesToWorkNote(note.id, lightwrightFixtureIds)
      }
    }
    setEditingNote(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Sticky Header Container */}
        <div className="sticky top-0 z-30 bg-bg-primary space-y-6 pb-4">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center border-b border-bg-tertiary pb-6">
            {/* Left: Production Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-bg-secondary rounded-lg text-2xl overflow-hidden">
                {logo.startsWith('data:') ? (
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
                <Wrench className="h-8 w-8 text-modules-work" />
                Work Notes
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
                onClick={() => setIsLightwrightViewerOpen(true)}
                variant="secondary"
              >
                <Database className="h-4 w-4" />
                View Lightwright Data
              </Button>
              <Button
                onClick={() => setIsLightwrightDialogOpen(true)}
                variant="outline"
              >
                <Upload className="h-5 w-5" />
                Import Lightwright
              </Button>
              <Button
                onClick={() => openQuickAdd('work')}
                variant="work"
              >
                <Plus className="h-5 w-5" />
                Add Work Note
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search work notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 pl-10"
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
                  onClick={() => openQuickAdd(type.value)} 
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


        {/* Notes Table */}
        <NotesTable 
          notes={filteredNotes}
          moduleType="work"
          onStatusUpdate={updateNoteStatus}
          onEdit={handleEditNote}
        />

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">No work notes found</p>
            <p className="text-text-muted text-sm mt-1">Try adjusting your filters or add a new note</p>
          </div>
        )}
      </div>

      <AddNoteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleDialogAdd}
        moduleType="work"
        defaultType={dialogDefaultType}
        editingNote={editingNote}
      />
      
      <EmailNotesView
        moduleType="work"
        isOpen={isEmailViewOpen}
        onClose={() => setIsEmailViewOpen(false)}
      />
      
      <PrintNotesView
        moduleType="work"
        isOpen={isPrintViewOpen}
        onClose={() => setIsPrintViewOpen(false)}
        notes={filteredNotes}
      />
      
      <LightwrightUploadDialog
        isOpen={isLightwrightDialogOpen}
        onClose={() => setIsLightwrightDialogOpen(false)}
        productionId="prod-1"
      />
      
      <LightwrightDataViewer
        isOpen={isLightwrightViewerOpen}
        onClose={() => setIsLightwrightViewerOpen(false)}
        productionId="prod-1"
      />
    </DashboardLayout>
  )
}