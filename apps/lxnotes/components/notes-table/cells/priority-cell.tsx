'use client'

import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import type { Note, ModuleType } from '@/types'

interface PriorityCellProps {
  note: Note
  moduleType: ModuleType
}

export function PriorityCell({ note, moduleType }: PriorityCellProps) {
  const { getPriorities } = useCustomPrioritiesStore()
  const priorities = getPriorities(moduleType)
  const priority = priorities.find(p => p.value === note.priority)

  return (
    <span
      className="text-sm font-medium"
      style={{ color: priority?.color || '#6B7280' }}
    >
      {priority?.label || note.priority}
    </span>
  )
}