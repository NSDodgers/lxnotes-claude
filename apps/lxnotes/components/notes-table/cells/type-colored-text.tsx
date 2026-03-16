'use client'

import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import type { Note, ModuleType } from '@/types'

interface TypeColoredTextProps {
  note: Note
  moduleType: ModuleType
  className?: string
  children: React.ReactNode
}

export function TypeColoredText({ note, moduleType, className, children }: TypeColoredTextProps) {
  const { getTypes } = useCustomTypesStore()
  const types = getTypes(moduleType)
  const type = types.find(t => t.value === (note.type || ''))

  return (
    <span className={className} style={{ color: type?.color || undefined }}>
      {children}
    </span>
  )
}
