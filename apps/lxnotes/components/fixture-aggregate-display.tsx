'use client'

import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FixtureAggregate } from '@/types'

interface FixtureAggregateDisplayProps {
  aggregate: FixtureAggregate | null
  field: 'channels' | 'positions' | 'fixtureTypes' | 'purposes' | 'universeAddresses'
  className?: string
}

export function FixtureAggregateDisplay({
  aggregate,
  field,
  className,
}: FixtureAggregateDisplayProps) {
  if (!aggregate) {
    return <span className={cn('text-muted-foreground', className)}>—</span>
  }

  const renderChannels = () => (
    <div className="flex items-center gap-2">
      <span className={cn('font-mono text-sm', className)}>
        {aggregate.channels || '—'}
      </span>
      {aggregate.hasInactive && (
        <div title="Some hookup items are inactive">
          <AlertTriangle className="h-3 w-3 text-orange-500" />
        </div>
      )}
    </div>
  )

  const renderArray = (items: string[]) => {
    if (items.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>
    }

    if (items.length === 1) {
      return (
        <div className="flex items-center gap-2">
          <span className={className}>{items[0]}</span>
          {aggregate.hasInactive && (
            <div title="Some hookup items are inactive">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <ul className="flex flex-col gap-0.5 max-h-24 overflow-y-auto list-disc pl-3.5">
          {items.map((item, index) => (
            <li key={index} className={cn('text-sm', className)}>{item}</li>
          ))}
        </ul>
        {aggregate.hasInactive && (
          <div title="Some hookup items are inactive">
            <AlertTriangle className="h-3 w-3 text-orange-500" />
          </div>
        )}
      </div>
    )
  }

  const renderUniverseAddresses = () => {
    if (aggregate.universeAddresses.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>
    }

    // Group by universe for better display
    const grouped = aggregate.universeAddresses.reduce((acc, addr) => {
      const universeMatch = addr.match(/^(\d+)\//)
      if (universeMatch) {
        const universe = universeMatch[1]
        if (!acc[universe]) acc[universe] = []
        acc[universe].push(addr)
      } else {
        // Address without universe
        if (!acc['?']) acc['?'] = []
        acc['?'].push(addr)
      }
      return acc
    }, {} as Record<string, string[]>)

    const universes = Object.keys(grouped).sort()
    
    if (universes.length === 1 && universes[0] !== '?') {
      // Single universe, show more compact format
      const universe = universes[0]
      const addresses = grouped[universe]
      
      return (
        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-sm', className)}>
            U{universe}: {addresses.join(', ')}
          </span>
          {aggregate.hasInactive && (
            <div title="Some hookup items are inactive">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
            </div>
          )}
        </div>
      )
    }

    // Multiple universes or many addresses, show as bulleted list
    return (
      <div className="flex items-center gap-2">
        <ul className="flex flex-col gap-0.5 max-h-24 overflow-y-auto list-disc pl-3.5">
          {aggregate.universeAddresses.map((addr, index) => (
            <li key={index} className={cn('font-mono text-sm', className)}>{addr}</li>
          ))}
        </ul>
        {aggregate.hasInactive && (
          <div title="Some hookup items are inactive">
            <AlertTriangle className="h-3 w-3 text-orange-500" />
          </div>
        )}
      </div>
    )
  }

  switch (field) {
    case 'channels':
      return renderChannels()
    case 'positions':
      return renderArray(aggregate.positionsWithUnits)
    case 'fixtureTypes':
      return renderArray(aggregate.fixtureTypes)
    case 'purposes':
      return renderArray(aggregate.purposes)
    case 'universeAddresses':
      return renderUniverseAddresses()
    default:
      return null
  }
}

interface FixtureSummaryDisplayProps {
  aggregate: FixtureAggregate | null
  className?: string
  maxItems?: number
}

export function FixtureSummaryDisplay({
  aggregate,
  className,
  maxItems = 2
}: FixtureSummaryDisplayProps) {
  if (!aggregate) {
    return <span className={cn('text-muted-foreground text-sm', className)}>No fixtures linked</span>
  }

  // Determine what to show in summary
  const summaryParts: string[] = []

  // Always show channel count/range
  if (aggregate.channels) {
    summaryParts.push(aggregate.channels)
  }

  // Show type if single type, otherwise show count
  if (aggregate.fixtureTypes.length === 1) {
    summaryParts.push(aggregate.fixtureTypes[0])
  } else if (aggregate.fixtureTypes.length > 1) {
    const displayTypes = aggregate.fixtureTypes.slice(0, maxItems)
    const remaining = aggregate.fixtureTypes.length - displayTypes.length
    const typeStr = displayTypes.join(', ') + (remaining > 0 ? ` +${remaining}` : '')
    summaryParts.push(typeStr)
  }

  // Show position if single position, otherwise show count
  if (aggregate.positions.length === 1) {
    summaryParts.push(aggregate.positions[0])
  } else if (aggregate.positions.length > 1) {
    summaryParts.push(`${aggregate.positions.length} positions`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className={cn('text-sm', className)}>
        {summaryParts.join(' • ') || 'Fixtures linked'}
      </span>
      
      {aggregate.hasInactive && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-orange-500" />
          <span className="text-xs text-orange-600">Inactive</span>
        </div>
      )}
    </div>
  )
}

interface FixtureTooltipContentProps {
  aggregate: FixtureAggregate
}

export function FixtureTooltipContent({ aggregate }: FixtureTooltipContentProps) {
  return (
    <div className="space-y-2 text-xs">
      <div>
        <span className="font-medium">Channels:</span> {aggregate.channels || 'None'}
      </div>
      
      {aggregate.fixtureTypes.length > 0 && (
        <div>
          <span className="font-medium">Types:</span> {aggregate.fixtureTypes.join(', ')}
        </div>
      )}
      
      {aggregate.purposes.length > 0 && (
        <div>
          <span className="font-medium">Purposes:</span> {aggregate.purposes.join(', ')}
        </div>
      )}
      
      {aggregate.positions.length > 0 && (
        <div>
          <span className="font-medium">Positions:</span> {aggregate.positions.join(', ')}
        </div>
      )}
      
      {aggregate.universeAddresses.length > 0 && (
        <div>
          <span className="font-medium">Universe/Address:</span> {aggregate.universeAddresses.join(', ')}
        </div>
      )}
      
      {aggregate.hasInactive && (
        <div className="flex items-center gap-1 text-orange-600 pt-1 border-t">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-xs">Some fixtures are no longer active</span>
        </div>
      )}
    </div>
  )
}