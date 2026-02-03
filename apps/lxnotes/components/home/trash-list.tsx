'use client'

import { useState } from 'react'
import { Trash2, Info } from 'lucide-react'
import { DeletedProductionCard } from './deleted-production-card'

interface DeletedProduction {
  id: string
  name: string
  abbreviation: string
  logo?: string
  description?: string
  deletedAt: Date
}

interface TrashListProps {
  initialDeletedProductions: DeletedProduction[]
  onRestoreComplete?: () => void
}

export function TrashList({ initialDeletedProductions, onRestoreComplete }: TrashListProps) {
  const [deletedProductions, setDeletedProductions] = useState<DeletedProduction[]>(initialDeletedProductions)

  const handleRestore = (productionId: string) => {
    setDeletedProductions((prev) => prev.filter((p) => p.id !== productionId))
    onRestoreComplete?.()
  }

  if (deletedProductions.length === 0) {
    return (
      <div className="text-center py-8">
        <Trash2 className="h-12 w-12 text-text-muted mx-auto mb-3 opacity-50" />
        <p className="text-text-muted">Trash is empty</p>
        <p className="text-sm text-text-muted mt-1">
          Deleted productions will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-bg-tertiary border border-border">
        <Info className="h-4 w-4 text-text-muted mt-0.5 flex-shrink-0" />
        <p className="text-sm text-text-muted">
          Items in trash will be permanently deleted after 30 days.
        </p>
      </div>

      {/* Deleted productions list */}
      <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-bg-tertiary scrollbar-track-transparent">
        {deletedProductions.map((production) => (
          <DeletedProductionCard
            key={production.id}
            production={production}
            onRestore={() => handleRestore(production.id)}
          />
        ))}
      </div>
    </div>
  )
}
