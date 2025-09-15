'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ChannelExpressionParser } from '@/lib/services/lightwright-parser'
import { useLightwrightStore } from '@/lib/stores/lightwright-store'
import type { LightwrightInfo, ParsedChannelExpression } from '@/types'

interface LightwrightSelectorProps {
  productionId: string
  selectedFixtureIds: string[]
  onSelectionChange: (fixtureIds: string[]) => void
  channelExpression?: string
  onChannelExpressionChange?: (expression: string) => void
  className?: string
}


export function LightwrightSelector({
  productionId,
  selectedFixtureIds,
  onSelectionChange,
  channelExpression = '',
  onChannelExpressionChange,
  className
}: LightwrightSelectorProps) {
  const { getFixturesByChannels, getFixturesByProduction } = useLightwrightStore()
  const [searchExpression, setSearchExpression] = useState(channelExpression)
  const [parsedExpression, setParsedExpression] = useState<ParsedChannelExpression | null>(null)
  const [availableFixtures, setAvailableFixtures] = useState<LightwrightInfo[]>([])
  const lastAutoSelectedRef = useRef<string>('')

  // Parse channel expression and fetch fixtures
  useEffect(() => {
    if (searchExpression.trim()) {
      const parsed = ChannelExpressionParser.parse(searchExpression.trim())
      setParsedExpression(parsed)
      
      if (parsed.channels.length > 0) {
        const fixtures = getFixturesByChannels(productionId, parsed.channels)
        setAvailableFixtures(fixtures)
        
        // Automatically select all fixtures that match the channel expression
        // Only auto-select if this is a new/different expression
        if (fixtures.length > 0 && lastAutoSelectedRef.current !== searchExpression.trim()) {
          const newFixtureIds = fixtures.map(f => f.id)
          // Only add fixtures that aren't already selected to avoid duplicates
          const uniqueNewIds = newFixtureIds.filter(id => !selectedFixtureIds.includes(id))
          if (uniqueNewIds.length > 0) {
            onSelectionChange([...selectedFixtureIds, ...uniqueNewIds])
            lastAutoSelectedRef.current = searchExpression.trim()
          }
        }
      } else {
        setAvailableFixtures([])
      }
    } else {
      setParsedExpression(null)
      setAvailableFixtures([])
      lastAutoSelectedRef.current = ''
    }
  }, [searchExpression, productionId, getFixturesByChannels, selectedFixtureIds, onSelectionChange])

  // Update parent channel expression
  useEffect(() => {
    onChannelExpressionChange?.(searchExpression)
  }, [searchExpression, onChannelExpressionChange])

  const handleExpressionChange = (value: string) => {
    setSearchExpression(value)
  }

  const handleFixtureToggle = (fixtureId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedFixtureIds, fixtureId])
    } else {
      onSelectionChange(selectedFixtureIds.filter(id => id !== fixtureId))
    }
  }


  const handleGlobalSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      const allIds = availableFixtures.map(f => f.id)
      const newIds = [...selectedFixtureIds, ...allIds.filter(id => !selectedFixtureIds.includes(id))]
      onSelectionChange(newIds)
    } else {
      const availableIds = availableFixtures.map(f => f.id)
      onSelectionChange(selectedFixtureIds.filter(id => !availableIds.includes(id)))
    }
  }


  // Check global selection state
  const globalSelectionState = (): 'none' | 'partial' | 'all' => {
    if (availableFixtures.length === 0) return 'none'
    
    const selectedCount = availableFixtures.filter(f => selectedFixtureIds.includes(f.id)).length
    if (selectedCount === 0) return 'none'
    if (selectedCount === availableFixtures.length) return 'all'
    return 'partial'
  }

  const renderFixtureRow = (fixture: LightwrightInfo) => (
    <div
      key={fixture.id}
      className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-sm"
    >
      <Checkbox
        id={fixture.id}
        checked={selectedFixtureIds.includes(fixture.id)}
        onCheckedChange={(checked) => handleFixtureToggle(fixture.id, !!checked)}
      />
      
      <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
        <div className="font-mono font-medium">{fixture.channel}</div>
        <div className="font-medium">{fixture.position}</div>
        <div className="text-center">
          {fixture.unitNumber ? `Unit ${fixture.unitNumber}` : '—'}
        </div>
        <div className="truncate" title={fixture.fixtureType}>
          {fixture.fixtureType || '—'}
        </div>
        <div className="truncate" title={fixture.purpose}>
          {fixture.purpose || '—'}
        </div>
      </div>
    </div>
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Channel Expression Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Channel Expression
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchExpression}
            onChange={(e) => handleExpressionChange(e.target.value)}
            placeholder="e.g., 1-5,21,45,67"
            className="pl-10"
          />
        </div>
        
        {/* Expression Feedback */}
        {parsedExpression && (
          <div className="text-xs space-y-1">
            {parsedExpression.channels.length > 0 && (
              <div className="text-muted-foreground">
                Found channels: {parsedExpression.channels.join(', ')}
              </div>
            )}
            {parsedExpression.invalid.length > 0 && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                Invalid tokens: {parsedExpression.invalid.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixtures Selection */}
      {availableFixtures.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              Select Fixtures ({availableFixtures.length} found)
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={
                  globalSelectionState() === 'all' ? true : 
                  globalSelectionState() === 'partial' ? 'indeterminate' : 
                  false
                }
                onCheckedChange={(checked) => handleGlobalSelectAll(!!checked)}
              />
              <label htmlFor="select-all" className="text-sm text-muted-foreground">
                Select All
              </label>
            </div>
          </div>

          {/* Header Row */}
          <div className="grid grid-cols-5 gap-4 text-xs font-medium text-muted-foreground border-b pb-2 ml-10">
            <div>Channel</div>
            <div>Position</div>
            <div className="text-center">Unit (#)</div>
            <div>Instrument Type</div>
            <div>Purpose</div>
          </div>

          {/* Fixtures List */}
          <div className="max-h-40 overflow-y-auto space-y-1">
            {availableFixtures
              .sort((a, b) => a.channel - b.channel)
              .map(renderFixtureRow)}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchExpression.trim() && availableFixtures.length === 0 && parsedExpression?.channels.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No channels found for this expression</p>
          <p className="text-xs">Try a different channel expression</p>
        </div>
      )}

      {/* Invalid Expression Message */}
      {searchExpression.trim() && parsedExpression?.channels.length === 0 && parsedExpression?.invalid.length > 0 && (
        <div className="text-center py-8 text-orange-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Invalid channel expression</p>
          <p className="text-xs">Check your syntax and try again</p>
        </div>
      )}

      {/* Empty State */}
      {!searchExpression.trim() && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Enter a channel expression to find fixtures</p>
          <p className="text-xs">Example: 1-5,21,45,67</p>
        </div>
      )}
    </div>
  )
}