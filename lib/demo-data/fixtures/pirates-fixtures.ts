/**
 * Pirates of Penzance Fixture Data
 *
 * Provides fixture data for the Pirates demo production
 */

import type { FixtureInfo } from '@/types'
import { PIRATES_FIXTURES_DATA } from './pirates-fixtures-data'

export interface ParsedFixtureRow {
  lwid: string
  channel: number
  position: string
  unitNumber: string
  fixtureType: string
  purpose: string
  universeAddressRaw: string
  universe?: number
  address?: number
  positionOrder: number
}

/**
 * Get Pirates fixtures in FixtureInfo format for the fixture store
 */
export function getPiratesFixtures(): FixtureInfo[] {
  const now = new Date()

  return PIRATES_FIXTURES_DATA.map(fixture => ({
    id: fixture.lwid,
    lwid: fixture.lwid,
    channel: fixture.channel,
    position: fixture.position,
    unitNumber: fixture.unitNumber,
    fixtureType: fixture.fixtureType,
    purpose: fixture.purpose,
    universeAddressRaw: fixture.universeAddressRaw,
    universe: fixture.universe,
    address: fixture.address,
    positionOrder: fixture.positionOrder,
    productionId: 'prod-1', // Pirates demo production
    sourceUploadedAt: now
  }))
}
