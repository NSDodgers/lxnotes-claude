'use client'

import { useState } from 'react'
import { X, User, Calendar, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlaceholderDefinition } from '@/types'

interface PlaceholderChipProps {
  placeholder: PlaceholderDefinition
  variant?: 'draggable' | 'inline' | 'preview'
  onRemove?: () => void
  className?: string
  isDragging?: boolean
}

// Get category icon
const getCategoryIcon = (category: PlaceholderDefinition['category']) => {
  const iconProps = { className: "h-3 w-3" }
  switch (category) {
    case 'production':
      return <Settings {...iconProps} />
    case 'user':
      return <User {...iconProps} />
    case 'date':
      return <Calendar {...iconProps} />
    case 'notes':
      return <FileText {...iconProps} />
    default:
      return <Settings {...iconProps} />
  }
}

// Get category colors
const getCategoryColors = (category: PlaceholderDefinition['category']) => {
  switch (category) {
    case 'production':
      return {
        bg: 'bg-linear-to-r from-purple-500 to-purple-600',
        hoverBg: 'hover:from-purple-600 hover:to-purple-700',
        border: 'border-purple-300 dark:border-purple-500',
        text: 'text-white',
        lightBg: 'bg-purple-100 dark:bg-purple-900/30',
        lightText: 'text-purple-700 dark:text-purple-300'
      }
    case 'user':
      return {
        bg: 'bg-linear-to-r from-blue-500 to-blue-600',
        hoverBg: 'hover:from-blue-600 hover:to-blue-700',
        border: 'border-blue-300 dark:border-blue-500',
        text: 'text-white',
        lightBg: 'bg-blue-100 dark:bg-blue-900/30',
        lightText: 'text-blue-700 dark:text-blue-300'
      }
    case 'date':
      return {
        bg: 'bg-linear-to-r from-green-500 to-green-600',
        hoverBg: 'hover:from-green-600 hover:to-green-700',
        border: 'border-green-300 dark:border-green-500',
        text: 'text-white',
        lightBg: 'bg-green-100 dark:bg-green-900/30',
        lightText: 'text-green-700 dark:text-green-300'
      }
    case 'notes':
      return {
        bg: 'bg-linear-to-r from-orange-500 to-orange-600',
        hoverBg: 'hover:from-orange-600 hover:to-orange-700',
        border: 'border-orange-300 dark:border-orange-500',
        text: 'text-white',
        lightBg: 'bg-orange-100 dark:bg-orange-900/30',
        lightText: 'text-orange-700 dark:text-orange-300'
      }
    default:
      return {
        bg: 'bg-linear-to-r from-gray-500 to-gray-600',
        hoverBg: 'hover:from-gray-600 hover:to-gray-700',
        border: 'border-gray-300 dark:border-gray-500',
        text: 'text-white',
        lightBg: 'bg-gray-100 dark:bg-gray-900/30',
        lightText: 'text-gray-700 dark:text-gray-300'
      }
  }
}

// Extract readable name from placeholder key
const getDisplayName = (key: string) => {
  // Remove {{ }} and convert to readable format
  return key
    .replace(/^\{\{|\}\}$/g, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
}

export function PlaceholderChip({
  placeholder,
  variant = 'draggable',
  onRemove,
  className,
  isDragging = false
}: PlaceholderChipProps) {
  const [isHovered, setIsHovered] = useState(false)
  const colors = getCategoryColors(placeholder.category)
  const displayName = getDisplayName(placeholder.key)

  const handleDragStart = (e: React.DragEvent) => {
    if (variant !== 'draggable') return

    e.dataTransfer.setData('text/placeholder', placeholder.key)
    e.dataTransfer.setData('text/plain', placeholder.key)
    e.dataTransfer.effectAllowed = 'copy'

    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.transform = 'rotate(5deg)'
    dragImage.style.opacity = '0.8'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 10, 10)

    // Clean up the drag image
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage)
      }
    }, 0)
  }

  const chipContent = (
    <>
      <div className="flex items-center gap-1.5">
        {getCategoryIcon(placeholder.category)}
        <span className="text-xs font-medium truncate max-w-24">
          {displayName}
        </span>
      </div>
      {variant === 'inline' && onRemove && isHovered && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors"
          title="Remove placeholder"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </>
  )

  // Draggable chip (in palette)
  if (variant === 'draggable') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium cursor-grab active:cursor-grabbing transition-all duration-200 select-none transform-gpu',
          colors.bg,
          colors.hoverBg,
          colors.text,
          'shadow-sm hover:shadow-lg hover:shadow-black/20 hover:scale-105 hover:-translate-y-0.5',
          'hover:border-white/30 border border-transparent',
          isDragging && 'opacity-50 scale-95 rotate-2',
          className
        )}
        title={`${placeholder.label}: ${placeholder.description}\nDrag to insert: ${placeholder.key}`}
      >
        {chipContent}
      </div>
    )
  }

  // Inline chip (within text)
  if (variant === 'inline') {
    return (
      <span
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-default select-none transition-all duration-300 transform-gpu',
          colors.bg,
          colors.text,
          'shadow-sm mx-0.5 animate-in fade-in-0 zoom-in-95',
          'hover:scale-105 hover:shadow-md',
          isHovered && onRemove && 'bg-destructive hover:bg-destructive/90',
          className
        )}
        contentEditable={false}
        suppressContentEditableWarning
        data-placeholder-key={placeholder.key}
        title={`${placeholder.label}: ${placeholder.description}\nValue: ${placeholder.key}`}
      >
        {chipContent}
      </span>
    )
  }

  // Preview chip (in lists/previews)
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
        colors.lightBg,
        colors.lightText,
        colors.border,
        className
      )}
      title={`${placeholder.label}: ${placeholder.description}`}
    >
      {chipContent}
    </span>
  )
}