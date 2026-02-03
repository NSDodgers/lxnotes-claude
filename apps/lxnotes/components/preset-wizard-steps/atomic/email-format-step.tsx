'use client'

import { cn } from '@/lib/utils'
import { FileText, Paperclip } from 'lucide-react'

interface EmailFormatStepProps {
  includeNotesInBody: boolean
  attachPdf: boolean
  onIncludeNotesInBodyChange: (value: boolean) => void
  onAttachPdfChange: (value: boolean) => void
}

export function EmailFormatStep({
  includeNotesInBody,
  attachPdf,
  onIncludeNotesInBodyChange,
  onAttachPdfChange,
}: EmailFormatStepProps) {
  return (
    <div className="space-y-4" data-testid="wizard-step-email-format">
      <div className="space-y-2">
        <p className="text-sm text-text-secondary">
          Choose how notes are included in your email.
        </p>
      </div>

      <div className="space-y-3">
        {/* Include in body toggle */}
        <button
          type="button"
          onClick={() => onIncludeNotesInBodyChange(!includeNotesInBody)}
          className={cn(
            'w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-colors',
            includeNotesInBody
              ? 'border-primary bg-primary/5'
              : 'border-bg-tertiary hover:bg-bg-hover'
          )}
          data-testid="wizard-include-body-toggle"
        >
          <div className={cn(
            'mt-0.5 p-2 rounded-lg',
            includeNotesInBody ? 'bg-primary/20' : 'bg-bg-tertiary'
          )}>
            <FileText className={cn(
              'h-5 w-5',
              includeNotesInBody ? 'text-primary' : 'text-text-secondary'
            )} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">
                Include Notes in Email Body
              </span>
              <div className={cn(
                'w-10 h-6 rounded-full transition-colors relative',
                includeNotesInBody ? 'bg-primary' : 'bg-bg-tertiary'
              )}>
                <div className={cn(
                  'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform',
                  includeNotesInBody ? 'left-5' : 'left-1'
                )} />
              </div>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Notes will be listed directly in the email for quick reading
            </p>
          </div>
        </button>

        {/* Attach PDF toggle */}
        <button
          type="button"
          onClick={() => onAttachPdfChange(!attachPdf)}
          className={cn(
            'w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-colors',
            attachPdf
              ? 'border-primary bg-primary/5'
              : 'border-bg-tertiary hover:bg-bg-hover'
          )}
          data-testid="wizard-attach-pdf-toggle"
        >
          <div className={cn(
            'mt-0.5 p-2 rounded-lg',
            attachPdf ? 'bg-primary/20' : 'bg-bg-tertiary'
          )}>
            <Paperclip className={cn(
              'h-5 w-5',
              attachPdf ? 'text-primary' : 'text-text-secondary'
            )} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">
                Attach PDF Report
              </span>
              <div className={cn(
                'w-10 h-6 rounded-full transition-colors relative',
                attachPdf ? 'bg-primary' : 'bg-bg-tertiary'
              )}>
                <div className={cn(
                  'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform',
                  attachPdf ? 'left-5' : 'left-1'
                )} />
              </div>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              A formatted PDF document will be attached for printing or archiving
            </p>
          </div>
        </button>
      </div>

      {/* Warning if neither selected */}
      {!includeNotesInBody && !attachPdf && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Note: You should enable at least one option to include notes in your email.
          </p>
        </div>
      )}
    </div>
  )
}
