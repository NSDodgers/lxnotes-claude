import type { Note, ModuleType } from '@/types'

export function getMockNotes(moduleType: ModuleType): Note[] {
  const baseDate = new Date()

  switch (moduleType) {
    case 'cue':
      return [
        {
          id: '1',
          productionId: 'prod-1',
          moduleType: 'cue',
          title: 'Fade house lights on page 23',
          description: 'Slow fade to 50% over 3 seconds when actor enters',
          priority: 'critical',
          status: 'todo',
          type: 'cue',
          createdAt: new Date(baseDate.getTime() - 86400000),
          updatedAt: new Date(baseDate.getTime() - 86400000),
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
          createdAt: new Date(baseDate.getTime() - 172800000),
          updatedAt: new Date(baseDate.getTime() - 3600000),
          scriptPageId: 'cue-245',
          sceneSongId: 'Act2-Finale',
        },
        {
          id: '3',
          productionId: 'prod-1',
          moduleType: 'cue',
          title: 'Need more dramatic lighting for death scene',
          description: 'Director wants stronger side light and deeper shadows',
          priority: 'very_high',
          status: 'todo',
          type: 'director',
          createdAt: new Date(baseDate.getTime() - 7200000),
          updatedAt: new Date(baseDate.getTime() - 7200000),
          scriptPageId: 'page-78',
          sceneSongId: 'Act2-Scene1',
        }
      ]

    case 'work':
      return [
        {
          id: '1',
          productionId: 'prod-1',
          moduleType: 'work',
          title: 'Replace lamp in FOH position 3',
          description: 'HPL 575W burnt out during tech rehearsal',
          priority: 'very_high',
          status: 'todo',
          type: 'work',
          createdAt: new Date(baseDate.getTime() - 43200000),
          updatedAt: new Date(baseDate.getTime() - 43200000),
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
          createdAt: new Date(baseDate.getTime() - 259200000),
          updatedAt: new Date(baseDate.getTime() - 86400000),
          lightwrightItemId: 'LW078',
          channelNumbers: '215, 216, 217, 218',
          positionUnit: 'SL Boom Units 4-7',
          sceneryNeeds: 'Coordinate with scenic for boom placement',
        },
        {
          id: '3',
          productionId: 'prod-1',
          moduleType: 'work',
          title: 'Gel replacement for cyc lights',
          description: 'Change R80 to R83 for warmer tone in Act 2',
          priority: 'medium',
          status: 'complete',
          type: 'focus',
          createdAt: new Date(baseDate.getTime() - 345600000),
          updatedAt: new Date(baseDate.getTime() - 172800000),
          lightwrightItemId: 'LW045',
          channelNumbers: '301-310',
          positionUnit: 'Cyc Units 1-10',
          sceneryNeeds: 'Access behind cyc during intermission only',
        }
      ]

    case 'production':
      return [
        {
          id: '1',
          productionId: 'prod-1',
          moduleType: 'production',
          title: 'Set piece height blocking front light',
          description: 'Upstage platform at 4 feet blocks key light from FOH',
          priority: 'very_high',
          status: 'todo',
          type: 'scenic',
          createdAt: new Date(baseDate.getTime() - 21600000),
          updatedAt: new Date(baseDate.getTime() - 21600000),
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
          createdAt: new Date(baseDate.getTime() - 432000000),
          updatedAt: new Date(baseDate.getTime() - 345600000),
        },
        {
          id: '3',
          productionId: 'prod-1',
          moduleType: 'production',
          title: 'Costume color conflicts with lighting',
          description: 'Lead actress red dress washes out under warm washes',
          priority: 'medium',
          status: 'todo',
          type: 'costume',
          createdAt: new Date(baseDate.getTime() - 129600000),
          updatedAt: new Date(baseDate.getTime() - 129600000),
        }
      ]

    default:
      return []
  }
}