'use client'

import React, { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PresetDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function PresetDialog({ 
  open, 
  onClose, 
  title, 
  description,
  children, 
  className 
}: PresetDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className={cn(
        'relative bg-bg-secondary border border-bg-tertiary rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-bg-tertiary shrink-0">
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
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

interface PresetDialogContentProps {
  children: ReactNode
  className?: string
}

export function PresetDialogContent({ children, className }: PresetDialogContentProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  )
}

interface PresetDialogActionsProps {
  children: ReactNode
  className?: string
}

export function PresetDialogActions({ children, className }: PresetDialogActionsProps) {
  return (
    <div className={cn(
      'flex items-center justify-end gap-3 p-6 border-t border-bg-tertiary bg-bg-primary shrink-0',
      className
    )}>
      {children}
    </div>
  )
}

// Form components for preset dialogs
interface PresetFormFieldProps {
  label: string
  description?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function PresetFormField({ 
  label, 
  description, 
  required, 
  children, 
  className 
}: PresetFormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-text-secondary">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-text-muted">{description}</p>
      )}
      {children}
    </div>
  )
}

type PresetFormInputProps = React.InputHTMLAttributes<HTMLInputElement>

export const PresetFormInput = React.forwardRef<HTMLInputElement, PresetFormInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary',
          'placeholder:text-text-muted focus:outline-hidden focus:border-modules-production',
          className
        )}
        {...props}
      />
    )
  }
)
PresetFormInput.displayName = 'PresetFormInput'

type PresetFormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const PresetFormTextarea = React.forwardRef<HTMLTextAreaElement, PresetFormTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary',
          'placeholder:text-text-muted focus:outline-hidden focus:border-modules-production resize-vertical',
          className
        )}
        {...props}
      />
    )
  }
)
PresetFormTextarea.displayName = 'PresetFormTextarea'

interface PresetFormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode
}

export function PresetFormSelect({ className, children, ...props }: PresetFormSelectProps) {
  return (
    <select
      className={cn(
        'w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary',
        'focus:outline-hidden focus:border-modules-production',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

interface PresetFormToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  description?: string
}

export function PresetFormToggle({ 
  checked, 
  onCheckedChange, 
  label, 
  description 
}: PresetFormToggleProps) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          checked ? 'bg-modules-production' : 'bg-bg-tertiary'
        )}
      >
        <span 
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      <div className="flex-1">
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
        {description && (
          <p className="text-xs text-text-muted mt-1">{description}</p>
        )}
      </div>
    </div>
  )
}
