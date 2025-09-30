'use client'

import { Badge } from '@/components/ui/badge'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import type { Note, ModuleType } from '@/types'

interface TypeCellProps {
  note: Note
  moduleType: ModuleType
}

export function TypeCell({ note, moduleType }: TypeCellProps) {
  const { getTypes } = useCustomTypesStore()
  const types = getTypes(moduleType)
  const type = types.find(t => t.value === (note.type || ''))

  return (
    <Badge
      style={{ backgroundColor: type?.color || '#6B7280' }}
      className="text-white"
    >
      {type?.label || note.type || moduleType}
    </Badge>
  )
}