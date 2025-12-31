'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/color-picker'
import { Check, X, Pencil, RotateCcw, EyeOff } from 'lucide-react'

interface InlineEditorProps {
  label: string
  color: string
  isSystem: boolean
  isCustomized?: boolean
  isHidden?: boolean
  onSave: (updates: { label?: string; color?: string }) => void
  onReset?: () => void
  onToggleHidden?: () => void
  className?: string
}

export function InlineEditor({ 
  label, 
  color, 
  isSystem, 
  isCustomized = false,
  isHidden = false,
  onSave, 
  onReset,
  onToggleHidden,
  className 
}: InlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(label)
  const [editColor, setEditColor] = useState(color)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditLabel(label)
    setEditColor(color)
  }, [label, color])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    if (editLabel.trim()) {
      onSave({
        label: editLabel.trim(),
        color: editColor
      })
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditLabel(label)
    setEditColor(color)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary', className)}>
        <ColorPicker
          value={editColor}
          onChange={setEditColor}
          className="flex-shrink-0"
        />
        <Input
          ref={inputRef}
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
          placeholder="Enter label..."
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!editLabel.trim()}
          className="flex-shrink-0"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-center gap-3 p-2 rounded-lg hover:bg-bg-secondary transition-colors group',
      isHidden && 'opacity-50',
      className
    )}>
      <div 
        className="w-6 h-6 rounded border flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium',
            isHidden ? 'text-text-muted line-through' : 'text-text-primary'
          )}>
            {label}
          </span>
          {isCustomized && (
            <span className="text-xs text-text-muted">(Customized)</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isSystem && onToggleHidden && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleHidden}
            className="h-8 w-8 p-0"
            title={isHidden ? "Show" : "Hide"}
          >
            <EyeOff className={cn('h-4 w-4', isHidden && 'text-text-muted')} />
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="h-8 w-8 p-0"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        
        {isSystem && isCustomized && onReset && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onReset}
            className="h-8 w-8 p-0"
            title="Reset to default"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}