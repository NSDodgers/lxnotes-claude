'use client'

import { useRef } from 'react'
import { Plus, Printer, Mail, MoreHorizontal, Bug, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { BugReportModal } from '@/components/bug-report/bug-report-modal'
import { useBugReport } from '@/components/bug-report/use-bug-report'
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
  const barRef = useRef<HTMLDivElement>(null)
  const { openReport, isCapturing, modalProps } = useBugReport({
    // Exclude the entire bottom bar from the captured screenshot so the red
    // bug icon the user just pressed doesn't appear in the report image.
    getExtraIgnoreElements: () => (barRef.current ? [barRef.current] : []),
  })

  return (
    <>
    <div
      ref={barRef}
      className="fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary border-t border-bg-tertiary safe-bottom"
      data-testid="mobile-action-bar"
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        {/* Add Note - primary, takes available space */}
        {onAddNote && (
          <Button
            onClick={onAddNote}
            variant={moduleVariants[moduleType] as 'cue' | 'work' | 'production' | 'electrician'}
            size="sm"
            className="h-9 flex-1 text-xs"
            data-testid="mobile-add-note-button"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}

        {/* PDF - icon only */}
        {onPDF && (
          <Button
            onClick={onPDF}
            variant="secondary"
            size="sm"
            className="h-9 w-9 p-0 shrink-0"
            title="PDF"
          >
            <Printer className="h-4 w-4" />
          </Button>
        )}

        {/* Email - icon only */}
        {onEmail && (
          <Button
            onClick={onEmail}
            variant="secondary"
            size="sm"
            className="h-9 w-9 p-0 shrink-0"
            title="Email"
          >
            <Mail className="h-4 w-4" />
          </Button>
        )}

        {/* Bug report - icon only */}
        <Button
          onClick={() => openReport(null)}
          disabled={isCapturing}
          variant="secondary"
          size="sm"
          className="h-9 w-9 p-0 shrink-0"
          data-testid="mobile-bug-report-button"
          aria-label="Report a bug"
          aria-busy={isCapturing}
          title="Report a bug"
        >
          {isCapturing ? (
            <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
          ) : (
            <Bug className="h-4 w-4 text-red-500" />
          )}
        </Button>

        {/* Overflow menu */}
        {overflowItems && overflowItems.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 w-9 p-0 shrink-0"
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
    <BugReportModal {...modalProps} />
    </>
  )
}
