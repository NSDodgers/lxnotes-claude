'use client'

import { useState } from 'react'
import { ProductionList } from './production-list'
import { TrashList } from './trash-list'
import { cn } from '@/lib/utils'

interface Production {
  id: string
  name: string
  abbreviation: string
  logo?: string
  description?: string
  startDate?: Date
  endDate?: Date
  isDemo?: boolean
  createdAt: Date
  updatedAt: Date
}

interface DeletedProduction {
  id: string
  name: string
  abbreviation: string
  logo?: string
  description?: string
  deletedAt: Date
}

interface ProductionsTabsProps {
  initialProductions: Production[]
  initialDeletedProductions: DeletedProduction[]
  adminProductionIds: string[]
}

export function ProductionsTabs({
  initialProductions,
  initialDeletedProductions,
  adminProductionIds,
}: ProductionsTabsProps) {
  const [activeTab, setActiveTab] = useState<'productions' | 'trash'>('productions')
  const [deletedCount, setDeletedCount] = useState(initialDeletedProductions.length)

  const handleRestoreComplete = () => {
    setDeletedCount((prev) => Math.max(0, prev - 1))
  }

  return (
    <div className="mt-8 text-left">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 justify-center">
        <button
          onClick={() => setActiveTab('productions')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            activeTab === 'productions'
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'
          )}
        >
          Your Productions
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            activeTab === 'trash'
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'
          )}
        >
          Trash{deletedCount > 0 && ` (${deletedCount})`}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'productions' ? (
        <ProductionList
          initialProductions={initialProductions}
          adminProductionIds={adminProductionIds}
        />
      ) : (
        <TrashList
          initialDeletedProductions={initialDeletedProductions}
          onRestoreComplete={handleRestoreComplete}
        />
      )}
    </div>
  )
}
