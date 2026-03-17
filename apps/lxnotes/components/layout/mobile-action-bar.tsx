'use client'

import { Plus, Printer, Mail, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ModuleType } from '@/types'
import type { LucideIcon } from 'lucide-react'

interface OverflowItem {
  label: string
  icon: LucideIcon
  onClick: () => void
}

interface MobileActionBarProps {
  moduleType: ModuleType
  onAddNote?: () => void
  onPDF?: () => void
  onEmail?: () => void
  overflowItems?: OverflowItem[]
}

const moduleVariants: Record<ModuleType, string> = {
  cue: 'cue',
  work: 'work',
  production: 'production',
  electrician: 'electrician',
}

export function MobileActionBar({ moduleType, onAddNote, onPDF, onEmail, overflowItems }: MobileActionBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary border-t border-bg-tertiary safe-bottom"
      data-testid="mobile-action-bar"
    >
      <div className="flex items-center justify-around gap-1 px-2 py-2">
        {/* Add Note - primary */}
        {onAddNote && (
          <Button
            onClick={onAddNote}
            variant={moduleVariants[moduleType] as 'cue' | 'work' | 'production' | 'electrician'}
            size="sm"
            className="h-10 flex-1 max-w-[140px] text-xs"
            data-testid="mobile-add-note-button"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        )}

        {/* PDF */}
        {onPDF && (
          <Button
            onClick={onPDF}
            variant="secondary"
            size="sm"
            className="h-10 px-3 text-xs"
          >
            <Printer className="h-4 w-4" />
            PDF
          </Button>
        )}

        {/* Email */}
        {onEmail && (
          <Button
            onClick={onEmail}
            variant="secondary"
            size="sm"
            className="h-10 px-3 text-xs"
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
        )}

        {/* Overflow menu */}
        {overflowItems && overflowItems.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-10 w-10 p-0"
                data-testid="mobile-overflow-menu"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" side="top" className="w-52 p-1" sideOffset={8}>
              {overflowItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center gap-2.5 w-full rounded-md px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}
