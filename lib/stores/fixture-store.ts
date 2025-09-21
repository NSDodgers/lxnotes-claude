import { create } from 'zustand'
import type {
  FixtureInfo,
  WorkNoteFixtureLink,
  FixtureAggregate,
  ParsedHookupRow,
  HookupUploadResult
} from '@/types'
import { usePositionStore, type UpdateResult } from './position-store'

interface FixtureState {
  // Core data
  fixtures: FixtureInfo[]
  workNoteLinks: WorkNoteFixtureLink[]
  aggregates: Record<string, FixtureAggregate> // keyed by workNoteId

  // Loading states
  isUploading: boolean
  isProcessing: boolean
  lastUploadResult: HookupUploadResult | null
  lastPositionUpdate: UpdateResult | null
  hasBeenDeleted: boolean // Track when data was intentionally deleted

  // Actions
  uploadFixtures: (
    productionId: string,
    parsedRows: ParsedHookupRow[],
    deactivateMissing?: boolean
  ) => HookupUploadResult

  getFixturesByChannels: (productionId: string, channels: number[]) => FixtureInfo[]
  getFixturesByIds: (fixtureIds: string[]) => FixtureInfo[]

  linkFixturesToWorkNote: (workNoteId: string, fixtureIds: string[]) => void
  unlinkFixturesFromWorkNote: (workNoteId: string, fixtureIds?: string[]) => void
  getLinkedFixtures: (workNoteId: string) => FixtureInfo[]

  updateAggregates: (workNoteId: string) => void
  getAggregate: (workNoteId: string) => FixtureAggregate | null

  // Utility
  clearData: () => void
  getFixturesByProduction: (productionId: string) => FixtureInfo[]
  getUniquePositions: (productionId: string) => string[]
  getHasBeenDeleted: () => boolean
}

export const useFixtureStore = create<FixtureState>((set, get) => ({
  // Initial state
  fixtures: [],
  workNoteLinks: [],
  aggregates: {},
  isUploading: false,
  isProcessing: false,
  lastUploadResult: null,
  lastPositionUpdate: null,
  hasBeenDeleted: false,

  // Upload fixtures with upsert logic
  uploadFixtures: (
    productionId: string,
    parsedRows: ParsedHookupRow[],
    deactivateMissing = true
  ): HookupUploadResult => {
    const state = get()
    const now = new Date()
    
    const result: HookupUploadResult = {
      success: true,
      processed: parsedRows.length,
      inserted: 0,
      updated: 0,
      inactivated: 0,
      skippedInfrastructure: 0,
      errors: [],
      warnings: []
    }

    set({ isProcessing: true })

    try {
      const existingFixtures = state.fixtures.filter(f => f.productionId === productionId)
      const updatedFixtures = [...state.fixtures]
      const processedLwids = new Set<string>()

      // Process each parsed row
      parsedRows.forEach((row, index) => {
        try {
          processedLwids.add(row.lwid)
          
          // Find existing fixture by (productionId, lwid)
          const existingIndex = updatedFixtures.findIndex(
            f => f.productionId === productionId && f.lwid === row.lwid
          )

          if (existingIndex >= 0) {
            // Update existing fixture
            const existing = updatedFixtures[existingIndex]
            updatedFixtures[existingIndex] = {
              ...existing,
              channel: row.channel,
              position: row.position,
              unitNumber: row.unitNumber,
              fixtureType: row.fixtureType,
              purpose: row.purpose,
              universe: row.universe,
              address: row.address,
              universeAddressRaw: row.universeAddressRaw,
              positionOrder: row.positionOrder,
              isActive: true,
              sourceUploadedAt: now,
              updatedAt: now,
              removedAt: undefined
            }
            result.updated++
          } else {
            // Insert new fixture
            const newFixture: FixtureInfo = {
              id: `lw-${productionId}-${row.lwid}-${Date.now()}`,
              productionId,
              lwid: row.lwid,
              channel: row.channel,
              position: row.position,
              unitNumber: row.unitNumber,
              fixtureType: row.fixtureType,
              purpose: row.purpose,
              universe: row.universe,
              address: row.address,
              universeAddressRaw: row.universeAddressRaw,
              positionOrder: row.positionOrder,
              isActive: true,
              source: 'Hookup CSV',
              sourceUploadedAt: now,
              createdAt: now,
              updatedAt: now
            }
            updatedFixtures.push(newFixture)
            result.inserted++
          }
        } catch (error) {
          result.errors.push({
            row: index + 1,
            field: 'general',
            message: error instanceof Error ? error.message : 'Processing error'
          })
          result.success = false
        }
      })

      // Deactivate missing fixtures if requested
      if (deactivateMissing) {
        existingFixtures.forEach((fixture, index) => {
          if (!processedLwids.has(fixture.lwid) && fixture.isActive) {
            const globalIndex = updatedFixtures.findIndex(f => f.id === fixture.id)
            if (globalIndex >= 0) {
              updatedFixtures[globalIndex] = {
                ...updatedFixtures[globalIndex],
                isActive: false,
                removedAt: now,
                updatedAt: now
              }
              result.inactivated++
            }
          }
        })
      }

      // Extract and update position ordering with position order data
      const productionFixtures = updatedFixtures.filter(f => f.productionId === productionId && f.isActive)
      const positionStore = usePositionStore.getState()
      const positionUpdateResult = positionStore.handleCsvUpdateWithOrder(productionId, productionFixtures)

      set({
        fixtures: updatedFixtures,
        lastUploadResult: result,
        lastPositionUpdate: positionUpdateResult,
        isProcessing: false,
        hasBeenDeleted: false // Reset deletion flag when new fixtures are uploaded
      })

      // Update aggregates for affected work notes
      const affectedWorkNotes = state.workNoteLinks
        .filter(link =>
          updatedFixtures.some(f =>
            f.id === link.fixtureInfoId && f.productionId === productionId
          )
        )
        .map(link => link.workNoteId)

      const uniqueWorkNotes = [...new Set(affectedWorkNotes)]
      uniqueWorkNotes.forEach(workNoteId => {
        get().updateAggregates(workNoteId)
      })

    } catch (error) {
      result.success = false
      result.errors.push({
        row: 0,
        field: 'general',
        message: error instanceof Error ? error.message : 'Upload failed'
      })
      
      set({
        lastUploadResult: result,
        isProcessing: false
      })
    }

    return result
  },

  // Get fixtures by channel numbers
  getFixturesByChannels: (productionId: string, channels: number[]): FixtureInfo[] => {
    const { fixtures } = get()
    return fixtures.filter(
      f => f.productionId === productionId && 
           f.isActive && 
           channels.includes(f.channel)
    ).sort((a, b) => a.channel - b.channel)
  },

  // Get fixtures by IDs
  getFixturesByIds: (fixtureIds: string[]): FixtureInfo[] => {
    const { fixtures } = get()
    return fixtures.filter(f => fixtureIds.includes(f.id))
  },

  // Link fixtures to work note
  linkFixturesToWorkNote: (workNoteId: string, fixtureIds: string[]): void => {
    const state = get()
    const now = new Date()
    
    // Remove existing links for this work note
    const existingLinks = state.workNoteLinks.filter(link => link.workNoteId !== workNoteId)
    
    // Add new links
    const newLinks: WorkNoteFixtureLink[] = fixtureIds.map(fixtureId => ({
      workNoteId,
      fixtureInfoId: fixtureId,
      createdAt: now
    }))
    
    set({
      workNoteLinks: [...existingLinks, ...newLinks]
    })
    
    // Update aggregates
    get().updateAggregates(workNoteId)
  },

  // Unlink fixtures from work note
  unlinkFixturesFromWorkNote: (workNoteId: string, fixtureIds?: string[]): void => {
    const state = get()
    
    let filteredLinks: WorkNoteFixtureLink[]
    
    if (fixtureIds) {
      // Remove specific fixtures
      filteredLinks = state.workNoteLinks.filter(
        link => !(link.workNoteId === workNoteId && fixtureIds.includes(link.fixtureInfoId))
      )
    } else {
      // Remove all links for this work note
      filteredLinks = state.workNoteLinks.filter(link => link.workNoteId !== workNoteId)
    }
    
    set({ workNoteLinks: filteredLinks })
    
    // Update aggregates
    get().updateAggregates(workNoteId)
  },

  // Get linked fixtures for work note
  getLinkedFixtures: (workNoteId: string): FixtureInfo[] => {
    const { workNoteLinks, fixtures } = get()
    
    const linkedIds = workNoteLinks
      .filter(link => link.workNoteId === workNoteId)
      .map(link => link.fixtureInfoId)
    
    return fixtures
      .filter(f => linkedIds.includes(f.id))
      .sort((a, b) => a.channel - b.channel)
  },

  // Update aggregates for work note
  updateAggregates: (workNoteId: string): void => {
    const state = get()
    const linkedFixtures = get().getLinkedFixtures(workNoteId)
    
    if (linkedFixtures.length === 0) {
      const newAggregates = { ...state.aggregates }
      delete newAggregates[workNoteId]
      set({ aggregates: newAggregates })
      return
    }

    // Generate channel expression
    const channels = linkedFixtures.map(f => f.channel).sort((a, b) => a - b)
    const channelExpression = formatChannelsAsExpression(channels)
    
    // Collect unique values
    const positions = [...new Set(linkedFixtures.map(f => f.position).filter(Boolean))]
    const fixtureTypes = [...new Set(linkedFixtures.map(f => f.fixtureType).filter(Boolean))]
    const purposes = [...new Set(linkedFixtures.map(f => f.purpose).filter(Boolean))]
    
    // Format universe/addresses
    const universeAddresses = linkedFixtures
      .filter(f => f.universe !== undefined || f.address !== undefined)
      .map(f => {
        if (f.universe && f.address) {
          return `${f.universe}/${f.address}`
        } else if (f.address) {
          return f.address.toString()
        } else if (f.universeAddressRaw) {
          return f.universeAddressRaw
        }
        return ''
      })
      .filter(Boolean)
    
    const uniqueUniverseAddresses = [...new Set(universeAddresses)]
    
    // Check for inactive fixtures
    const hasInactive = linkedFixtures.some(f => !f.isActive)
    
    const aggregate: FixtureAggregate = {
      workNoteId,
      channels: channelExpression,
      positions,
      fixtureTypes,
      purposes,
      universeAddresses: uniqueUniverseAddresses,
      hasInactive
    }
    
    set({
      aggregates: {
        ...state.aggregates,
        [workNoteId]: aggregate
      }
    })
  },

  // Get aggregate for work note
  getAggregate: (workNoteId: string): FixtureAggregate | null => {
    return get().aggregates[workNoteId] || null
  },

  // Get fixtures by production
  getFixturesByProduction: (productionId: string): FixtureInfo[] => {
    return get().fixtures.filter(f => f.productionId === productionId)
  },

  // Get unique positions for a production
  getUniquePositions: (productionId: string): string[] => {
    const fixtures = get().fixtures.filter(f => f.productionId === productionId && f.isActive)
    const positionStore = usePositionStore.getState()
    return positionStore.extractUniquePositions(fixtures)
  },

  // Clear all data
  clearData: (): void => {
    set({
      fixtures: [],
      workNoteLinks: [],
      aggregates: {},
      lastUploadResult: null,
      lastPositionUpdate: null,
      hasBeenDeleted: true
    })
  },

  // Get deletion status
  getHasBeenDeleted: (): boolean => {
    return get().hasBeenDeleted
  }
}))

/**
 * Format channel numbers into expression string (e.g., "1-5, 21, 45")
 */
function formatChannelsAsExpression(channels: number[]): string {
  if (channels.length === 0) return ''

  const sorted = [...channels].sort((a, b) => a - b)
  const ranges: string[] = []
  let rangeStart = sorted[0]
  let rangeEnd = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === rangeEnd + 1) {
      // Continue range
      rangeEnd = sorted[i]
    } else {
      // End current range, start new one
      if (rangeStart === rangeEnd) {
        ranges.push(rangeStart.toString())
      } else if (rangeEnd === rangeStart + 1) {
        // Two consecutive numbers, list separately
        ranges.push(rangeStart.toString(), rangeEnd.toString())
      } else {
        ranges.push(`${rangeStart}-${rangeEnd}`)
      }
      rangeStart = sorted[i]
      rangeEnd = sorted[i]
    }
  }

  // Add final range
  if (rangeStart === rangeEnd) {
    ranges.push(rangeStart.toString())
  } else if (rangeEnd === rangeStart + 1) {
    ranges.push(rangeStart.toString(), rangeEnd.toString())
  } else {
    ranges.push(`${rangeStart}-${rangeEnd}`)
  }

  return ranges.join(', ')
}