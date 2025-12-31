'use client'

import { useCueLookup } from '@/lib/services/cue-lookup'

interface ScriptLookupCellProps {
  cueNumber?: string
}

export function ScriptLookupCell({ cueNumber }: ScriptLookupCellProps) {
  const { lookupCue } = useCueLookup()

  if (!cueNumber) {
    return <span className="text-sm text-muted-foreground">-</span>
  }

  const lookup = lookupCue(cueNumber)

  return (
    <span className="text-sm text-muted-foreground">
      {lookup.display || '-'}
    </span>
  )
}