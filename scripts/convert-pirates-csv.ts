/**
 * Script to convert Pirates fixtures CSV to TypeScript data file
 * Run with: npx ts-node scripts/convert-pirates-csv.ts
 */

import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

interface FixtureRow {
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

function parseUniverseAddress(raw: string): { universe?: number; address?: number } {
  if (!raw || raw.trim() === '') {
    return {}
  }

  const parts = raw.split('/')
  if (parts.length === 2) {
    const universe = parseInt(parts[0], 10)
    const address = parseInt(parts[1], 10)

    if (!isNaN(universe) && !isNaN(address)) {
      return { universe, address }
    }
  }

  return {}
}

// Read CSV
const csvPath = path.join(process.cwd(), 'lib', 'demo-data', 'fixtures', 'pirates-fixtures.csv')
const csvContent = fs.readFileSync(csvPath, 'utf-8')

const result = Papa.parse<string[]>(csvContent, {
  header: false,
  skipEmptyLines: true
})

const fixtures: FixtureRow[] = []

// Skip header row (index 0)
for (let i = 1; i < result.data.length; i++) {
  const row = result.data[i]

  if (row.length < 8) {
    console.warn(`Skipping incomplete row ${i}:`, row)
    continue
  }

  const lwid = row[0].trim()
  const channelStr = row[1].trim()
  const position = row[2].trim()
  const unitNumber = row[3].trim()
  const fixtureType = row[4].trim()
  const purpose = row[5].trim()
  const universeAddressRaw = row[6].trim()
  const positionOrderStr = row[7].trim()

  const channel = parseInt(channelStr, 10)
  if (isNaN(channel)) {
    console.warn(`Invalid channel number in row ${i}:`, channelStr)
    continue
  }

  const positionOrder = parseInt(positionOrderStr, 10)
  if (isNaN(positionOrder)) {
    console.warn(`Invalid position order in row ${i}:`, positionOrderStr)
    continue
  }

  const { universe, address } = parseUniverseAddress(universeAddressRaw)

  fixtures.push({
    lwid,
    channel,
    position,
    unitNumber,
    fixtureType,
    purpose,
    universeAddressRaw,
    universe,
    address,
    positionOrder
  })
}

// Generate TypeScript file
const tsContent = `/**
 * Pirates of Penzance Fixture Data
 *
 * This file is AUTO-GENERATED from pirates-fixtures.csv
 * DO NOT EDIT MANUALLY - Run scripts/convert-pirates-csv.ts to regenerate
 */

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

export const PIRATES_FIXTURES_DATA: ParsedFixtureRow[] = ${JSON.stringify(fixtures, null, 2)}
`

const outputPath = path.join(process.cwd(), 'lib', 'demo-data', 'fixtures', 'pirates-fixtures-data.ts')
fs.writeFileSync(outputPath, tsContent, 'utf-8')

console.log(`✅ Converted ${fixtures.length} fixtures to ${outputPath}`)
