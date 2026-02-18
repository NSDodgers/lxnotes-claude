'use client'

import { useMemo } from 'react'
import { User, Calendar, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlaceholderDefinition } from '@/types'

interface PlaceholderTextDisplayProps {
  text: string
  availablePlaceholders: PlaceholderDefinition[]
  className?: string
  multiline?: boolean
}

// Get category icon
const getCategoryIcon = (category: PlaceholderDefinition['category']) => {
  const iconProps = { className: "h-3 w-3 shrink-0" }
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

// Get category colors for inline display
const getCategoryColors = (category: PlaceholderDefinition['category']) => {
  switch (category) {
    case 'production':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'user':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'date':
      return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'notes':
      return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }
}

// Extract readable name from placeholder key
const getDisplayName = (key: string) => {
  return key
    .replace(/^\{\{|\}\}$/g, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
}

// Parse text and split into segments (text and placeholders)
function parseTextWithPlaceholders(text: string, placeholders: PlaceholderDefinition[]) {
  const placeholderMap = new Map(
    placeholders.map(p => [p.key, p])
  )

  // Match {{PLACEHOLDER_NAME}} patterns
  const regex = /(\{\{[A-Z_]+\}\})/g
  const parts = text.split(regex)

  return parts.map((part, index) => {
    const placeholder = placeholderMap.get(part)
    if (placeholder) {
      return { type: 'placeholder' as const, content: part, placeholder, key: `ph-${index}` }
    }
    return { type: 'text' as const, content: part, key: `txt-${index}` }
  }).filter(part => part.content.length > 0)
}

export function PlaceholderTextDisplay({
  text,
  availablePlaceholders,
  className,
  multiline = false
}: PlaceholderTextDisplayProps) {
  const segments = useMemo(
    () => parseTextWithPlaceholders(text, availablePlaceholders),
    [text, availablePlaceholders]
  )

  if (!text) {
    return <span className="text-text-muted italic">Not set</span>
  }

  return (
    <div className={cn(
      'text-sm text-text-primary',
      multiline && 'whitespace-pre-wrap',
      className
    )}>
      {segments.map(segment => {
        if (segment.type === 'placeholder') {
          const colors = getCategoryColors(segment.placeholder.category)
          const displayName = getDisplayName(segment.content)

          return (
            <span
              key={segment.key}
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border mx-0.5',
                colors
              )}
              title={`${segment.placeholder.label}: ${segment.placeholder.description}`}
            >
              {getCategoryIcon(segment.placeholder.category)}
              <span>{displayName}</span>
            </span>
          )
        }

        // For text segments, handle newlines if multiline
        if (multiline && segment.content.includes('\n')) {
          return (
            <span key={segment.key}>
              {segment.content.split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </span>
          )
        }

        return <span key={segment.key}>{segment.content}</span>
      })}
    </div>
  )
}
