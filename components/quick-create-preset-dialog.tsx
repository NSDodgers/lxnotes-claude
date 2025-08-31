'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickCreatePresetDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function QuickCreatePresetDialog({ 
  open, 
  onClose, 
  title, 
  description,
  children, 
  className 
}: QuickCreatePresetDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className={cn(
        'relative bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-bg-tertiary">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            {description && (
              <p className="text-sm text-text-secondary mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-tertiary rounded transition-colors"
          >
            <X className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
        
        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

interface QuickCreatePresetDialogContentProps {
  children: ReactNode
  className?: string
}

export function QuickCreatePresetDialogContent({ children, className }: QuickCreatePresetDialogContentProps) {
  return (
    <div className={cn('p-4', className)}>
      {children}
    </div>
  )
}

interface QuickCreatePresetDialogActionsProps {
  children: ReactNode
  className?: string
}

export function QuickCreatePresetDialogActions({ children, className }: QuickCreatePresetDialogActionsProps) {
  return (
    <div className={cn(
      'flex items-center justify-end gap-2 p-4 border-t border-bg-tertiary bg-bg-primary',
      className
    )}>
      {children}
    </div>
  )
}