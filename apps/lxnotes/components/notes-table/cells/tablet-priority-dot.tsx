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
    <div className="flex items-center justify-center">
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={{ backgroundColor: priority?.color || '#6B7280' }}
        title={priority?.label || note.priority}
      />
    </div>
  )
}
