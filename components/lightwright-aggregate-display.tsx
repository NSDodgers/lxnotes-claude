'use client'

import { AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { LightwrightAggregate } from '@/types'

interface LightwrightAggregateDisplayProps {
  aggregate: LightwrightAggregate | null
  field: 'channels' | 'positions' | 'fixtureTypes' | 'purposes' | 'universeAddresses'
  className?: string
  maxItems?: number
}

export function LightwrightAggregateDisplay({
  aggregate,
  field,
  className,
  maxItems = 3
}: LightwrightAggregateDisplayProps) {
  if (!aggregate) {
    return <span className={cn('text-muted-foreground', className)}>—</span>
  }

  const renderChannels = () => (
    <div className="flex items-center gap-2">
      <span className={cn('font-mono text-sm', className)}>
        {aggregate.channels || '—'}
      </span>
      {aggregate.hasInactive && (
        <div title="Some fixtures are inactive">
          <AlertTriangle className="h-3 w-3 text-orange-500" />
        </div>
      )}
    </div>
  )

  const renderArray = (items: string[], title: string) => {
    if (items.length === 0) {
      return <span className={cn('text-muted-foreground', className)}>—</span>
    }

    if (items.length === 1) {
      return (
        <div className="flex items-center gap-2">
          <span className={className}>{items[0]}</span>
          {aggregate.hasInactive && (
            <div title="Some fixtures are inactive">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
            </div>
          )}
        </div>
      )
    }

    const displayItems = items.slice(0, maxItems)
    const remainingCount = items.length - displayItems.length

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {displayItems.map((item, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {item}
          </Badge>
        ))}
        
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            +{remainingCount} more
          </Badge>
        )}
        
        {aggregate.hasInactive && (
          <div title="Some fixtures are inactive">
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
      
      if (addresses.length <= maxItems) {
        return (
          <div className="flex items-center gap-2">
            <span className={cn('font-mono text-sm', className)}>
              U{universe}: {addresses.join(', ')}
            </span>
            {aggregate.hasInactive && (
              <div title="Some fixtures are inactive">
            <AlertTriangle className="h-3 w-3 text-orange-500" />
          </div>
            )}
          </div>
        )
      }
    }

    // Multiple universes or many addresses, show as badges
    const allAddresses = aggregate.universeAddresses.slice(0, maxItems)
    const remainingCount = aggregate.universeAddresses.length - allAddresses.length

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {allAddresses.map((addr, index) => (
          <Badge key={index} variant="secondary" className="text-xs font-mono">
            {addr}
          </Badge>
        ))}
        
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            +{remainingCount} more
          </Badge>
        )}
        
        {aggregate.hasInactive && (
          <div title="Some fixtures are inactive">
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
      return renderArray(aggregate.positions, 'Positions')
    case 'fixtureTypes':
      return renderArray(aggregate.fixtureTypes, 'Fixture Types')
    case 'purposes':
      return renderArray(aggregate.purposes, 'Purposes')
    case 'universeAddresses':
      return renderUniverseAddresses()
    default:
      return null
  }
}

interface LightwrightSummaryDisplayProps {
  aggregate: LightwrightAggregate | null
  className?: string
  maxItems?: number
}

export function LightwrightSummaryDisplay({
  aggregate,
  className,
  maxItems = 2
}: LightwrightSummaryDisplayProps) {
  if (!aggregate) {
    return <span className={cn('text-muted-foreground text-sm', className)}>No fixtures linked</span>
  }

  const hasMultipleTypes = aggregate.fixtureTypes.length > 1
  const hasMultiplePurposes = aggregate.purposes.length > 1
  const hasMultiplePositions = aggregate.positions.length > 1

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

interface LightwrightTooltipContentProps {
  aggregate: LightwrightAggregate
}

export function LightwrightTooltipContent({ aggregate }: LightwrightTooltipContentProps) {
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