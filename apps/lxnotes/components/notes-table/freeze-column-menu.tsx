'use client'

import { Lock, Unlock } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

interface FreezeColumnMenuProps {
  children: React.ReactNode
  columnIndex: number
  isFrozen: boolean
  onFreeze: (columnIndex: number) => void
  onUnfreeze: () => void
}

export function FreezeColumnMenu({
  children,
  columnIndex,
  isFrozen,
  onFreeze,
  onUnfreeze,
}: FreezeColumnMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {isFrozen ? (
          <ContextMenuItem onClick={onUnfreeze}>
            <Unlock className="mr-2 h-4 w-4" />
            Unfreeze all columns
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={() => onFreeze(columnIndex)}>
            <Lock className="mr-2 h-4 w-4" />
            Freeze up to here
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
