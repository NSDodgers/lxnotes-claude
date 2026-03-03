'use client'

import { useFixtureStore } from '@/lib/stores/fixture-store'
import { FixtureAggregateDisplay } from '@/components/fixture-aggregate-display'

interface FixtureAggregateCellProps {
  noteId: string
  field: 'channels' | 'fixtureTypes' | 'purposes' | 'positions'
}

/**
 * Cell component that displays fixture aggregate data for work notes
 * Uses the fixture store to retrieve and display aggregated fixture information
 */
export function FixtureAggregateCell({
  noteId,
  field,
}: FixtureAggregateCellProps) {
  const { getAggregate } = useFixtureStore()
  const aggregate = getAggregate(noteId)

  return (
    <FixtureAggregateDisplay
      aggregate={aggregate}
      field={field}
      className="text-sm"
    />
  )
}
