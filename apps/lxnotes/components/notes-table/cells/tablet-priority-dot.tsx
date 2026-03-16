'use client'

import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import type { Note, ModuleType } from '@/types'

interface TabletPriorityDotProps {
  note: Note
  moduleType: ModuleType
}

export function TabletPriorityDot({ note, moduleType }: TabletPriorityDotProps) {
  const { getPriorities } = useCustomPrioritiesStore()
  const priorities = getPriorities(moduleType)
  const priority = priorities.find(p => p.value === note.priority)

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: priority?.color || '#6B7280' }}
      />
      <span
        className="text-sm font-medium truncate"
        style={{ color: priority?.color || '#6B7280' }}
      >
        {priority?.label || note.priority}
      </span>
    </div>
  )
}
