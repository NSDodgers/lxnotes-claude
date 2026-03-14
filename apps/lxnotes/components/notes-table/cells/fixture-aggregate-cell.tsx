'use client'

import { useFixtureStore } from '@/lib/stores/fixture-store'
import { FixtureAggregateDisplay } from '@/components/fixture-aggregate-display'

interface FixtureAggregateCellProps {
  noteId: string
  field: 'channels' | 'fixtureTypes' | 'purposes' | 'positions'
  /** Fallback channel expression from the note's channelNumbers field */
  fallbackChannels?: string
}

/**
 * Cell component that displays fixture aggregate data for work notes
 * Uses the fixture store to retrieve and display aggregated fixture information
 */
export function FixtureAggregateCell({
  noteId,
  field,
  fallbackChannels,
}: FixtureAggregateCellProps) {
  const { getAggregate } = useFixtureStore()
  const aggregate = getAggregate(noteId)

  // If no fixture aggregate but we have a fallback channel expression, show it directly
  if (!aggregate && field === 'channels' && fallbackChannels) {
    return (
      <span className="font-mono text-sm">
        {fallbackChannels}
      </span>
    )
  }

  return (
    <FixtureAggregateDisplay
      aggregate={aggregate}
      field={field}
      className="text-sm"
    />
  )
}
