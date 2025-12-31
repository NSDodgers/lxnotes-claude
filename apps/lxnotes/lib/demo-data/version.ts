/**
 * Demo Data Version Tracking
 *
 * Tracks the version of the demo dataset to handle future updates and migrations.
 */

export const DEMO_DATA_VERSION = '1.0.0'

export interface DemoDataMetadata {
  version: string
  productionName: string
  dataGeneratedDate: string
  description: string
}

export const DEMO_METADATA: DemoDataMetadata = {
  version: DEMO_DATA_VERSION,
  productionName: 'The Pirates of Penzance',
  dataGeneratedDate: '2025-01-30',
  description: 'Sample production data for Pirates of Penzance musical production with cue notes, work notes, and production notes'
}