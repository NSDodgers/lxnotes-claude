'use client'

import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { PlaceholderChip } from '@/components/placeholder-chip'
import { cn } from '@/lib/utils'
import type { PlaceholderDefinition } from '@/types'

export interface DroppableTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  availablePlaceholders?: PlaceholderDefinition[]
  onPlaceholderInsert?: (placeholder: string) => void
  className?: string
  placeholder?: string
  rows?: number
}

interface ParsedContent {
  type: 'text' | 'placeholder' | 'linebreak'
  content: string
  placeholder?: PlaceholderDefinition
}

// Parse text content to identify placeholders and line breaks
const parseContent = (text: string, placeholders: PlaceholderDefinition[] = []): ParsedContent[] => {
  const parts: ParsedContent[] = []

  // First split by line breaks
  const lines = text.split('\n')

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      parts.push({ type: 'linebreak', content: '\n' })
    }

    if (line === '') {
      // Empty line - add a zero-width space to maintain line height
      parts.push({ type: 'text', content: '' })
      return
    }

    const placeholderRegex = /(\{\{[^}]+\}\})/g
    let lastIndex = 0
    let match

    while ((match = placeholderRegex.exec(line)) !== null) {
      // Add text before placeholder
      if (match.index > lastIndex) {
        const textContent = line.slice(lastIndex, match.index)
        if (textContent) {
          parts.push({ type: 'text', content: textContent })
        }
      }

      // Add placeholder
      const placeholderKey = match[1]
      const placeholder = placeholders.find(p => p.key === placeholderKey)
      parts.push({
        type: 'placeholder',
        content: placeholderKey,
        placeholder
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text in line
    if (lastIndex < line.length) {
      const remainingText = line.slice(lastIndex)
      parts.push({ type: 'text', content: remainingText })
    }
  })

  return parts
}

export const DroppableTextarea = forwardRef<HTMLDivElement, DroppableTextareaProps>(
  ({
    value,
    onChange,
    availablePlaceholders = [],
    onPlaceholderInsert,
    className,
    placeholder,
    disabled,
    rows = 4,
    ...props
  }, ref) => {
    const [isDragOver, setIsDragOver] = useState(false)
    const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const hiddenTextareaRef = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => contentRef.current!, [])

    const parsedContent = parseContent(value, availablePlaceholders)

    const updateValue = useCallback((newValue: string) => {
      onChange(newValue)
      if (onPlaceholderInsert) {
        // Check if a new placeholder was added
        const oldPlaceholders = parseContent(value, availablePlaceholders)
          .filter(p => p.type === 'placeholder')
          .map(p => p.content)
        const newPlaceholders = parseContent(newValue, availablePlaceholders)
          .filter(p => p.type === 'placeholder')
          .map(p => p.content)

        const addedPlaceholders = newPlaceholders.filter(p => !oldPlaceholders.includes(p))
        if (addedPlaceholders.length > 0) {
          onPlaceholderInsert(addedPlaceholders[0])
        }
      }
    }, [value, onChange, onPlaceholderInsert, availablePlaceholders])

    const getCursorPosition = useCallback(() => {
      if (!contentRef.current) return 0

      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return 0

      const range = selection.getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(contentRef.current)
      preCaretRange.setEnd(range.startContainer, range.startOffset)

      return preCaretRange.toString().length
    }, [])

    const insertAtCursor = useCallback((text: string) => {
      const selection = window.getSelection()
      if (!selection || !contentRef.current) {
        // Fallback: append to end
        const newValue = value + text
        updateValue(newValue)
        return
      }

      const range = selection.getRangeAt(0)
      const cursorPos = getCursorPosition()
      const newValue = value.slice(0, cursorPos) + text + value.slice(cursorPos)
      updateValue(newValue)

      // Set cursor after inserted text
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus()

          // Try to restore cursor position
          const newSelection = window.getSelection()
          if (newSelection) {
            try {
              const newRange = document.createRange()
              const textNodes: Node[] = []

              const collectTextNodes = (node: Node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                  textNodes.push(node)
                } else {
                  for (let i = 0; i < node.childNodes.length; i++) {
                    collectTextNodes(node.childNodes[i])
                  }
                }
              }

              collectTextNodes(contentRef.current)

              let targetOffset = cursorPos + text.length
              for (const textNode of textNodes) {
                const nodeLength = textNode.textContent?.length || 0
                if (targetOffset <= nodeLength) {
                  newRange.setStart(textNode, targetOffset)
                  newRange.setEnd(textNode, targetOffset)
                  newSelection.removeAllRanges()
                  newSelection.addRange(newRange)
                  break
                }
                targetOffset -= nodeLength
              }
            } catch (error) {
              // Fallback: place cursor at end
              console.warn('Could not restore cursor position:', error)
            }
          }
        }
      }, 0)
    }, [value, updateValue, getCursorPosition])

    const removePlaceholder = useCallback((placeholderToRemove: string) => {
      const newValue = value.replace(placeholderToRemove, '')
      updateValue(newValue)
    }, [value, updateValue])

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'

      if (!isDragOver) {
        setIsDragOver(true)
      }

      // Calculate drop position for visual indicator
      const rect = contentRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setDragPosition({ x, y })
      }
    }, [isDragOver])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      // Only clear drag state if leaving the entire component
      if (!contentRef.current?.contains(e.relatedTarget as Node)) {
        setIsDragOver(false)
        setDragPosition(null)
      }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      setDragPosition(null)

      const placeholderData = e.dataTransfer.getData('text/placeholder') || e.dataTransfer.getData('text/plain')
      if (placeholderData && placeholderData.startsWith('{{')) {
        insertAtCursor(placeholderData)
      }
    }, [insertAtCursor])

    const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
      const newValue = e.currentTarget.textContent || ''
      updateValue(newValue)
    }, [updateValue])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      // Handle Enter key to create line breaks
      if (e.key === 'Enter') {
        e.preventDefault()
        insertAtCursor('\n')
        return
      }

      // Allow normal text editing
    }, [insertAtCursor])

    const handleClick = useCallback((e: React.MouseEvent) => {
      // Focus the contentEditable div
      if (contentRef.current && !disabled) {
        contentRef.current.focus()
      }
    }, [disabled])

    return (
      <div className="relative">
        {/* Hidden textarea for form compatibility */}
        <textarea
          ref={hiddenTextareaRef}
          value={value}
          onChange={() => { }} // Controlled by contentEditable
          className="sr-only"
          tabIndex={-1}
          rows={rows}
          {...props}
        />

        {/* Visual content editable area */}
        <div
          ref={contentRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'w-full px-3 py-2 bg-bg-tertiary border border-bg-hover rounded-lg',
            'text-text-primary placeholder:text-text-muted',
            'focus:outline-none focus:border-modules-production transition-colors',
            'cursor-text select-text whitespace-pre-wrap break-words overflow-auto resize-none',
            isDragOver && 'border-modules-production bg-modules-production/5',
            disabled && 'opacity-50 cursor-not-allowed bg-bg-secondary',
            className
          )}
          style={{
            minHeight: `${rows * 1.5}rem`,
            lineHeight: '1.5',
          }}
        >
          {/* Render content with chips */}
          {parsedContent.length === 0 ? (
            <span className="text-text-muted pointer-events-none">
              {placeholder || 'Enter text or drag placeholders here...'}
            </span>
          ) : (
            parsedContent.map((part, index) => {
              if (part.type === 'placeholder' && part.placeholder) {
                return (
                  <PlaceholderChip
                    key={`${part.content}-${index}`}
                    placeholder={part.placeholder}
                    variant="inline"
                    onRemove={() => removePlaceholder(part.content)}
                  />
                )
              } else if (part.type === 'linebreak') {
                return <br key={index} />
              }
              return (
                <span key={index}>
                  {part.content}
                </span>
              )
            })
          )}
        </div>

        {/* Drop zone overlay */}
        {isDragOver && (
          <div className="absolute inset-0 border-2 border-dashed border-modules-production rounded-lg pointer-events-none bg-modules-production/5 flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="bg-bg-secondary/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-modules-production/20">
              <div className="flex items-center gap-2 text-sm font-medium text-modules-production">
                <div className="w-2 h-2 bg-modules-production rounded-full animate-bounce"></div>
                Drop placeholder here
              </div>
              {dragPosition && (
                <div className="text-xs text-modules-production/70 mt-1 animate-pulse">
                  Will insert at cursor position
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cursor indicator when dragging */}
        {isDragOver && dragPosition && (
          <div
            className="absolute w-0.5 h-5 bg-modules-production animate-pulse pointer-events-none transition-all duration-100 ease-out"
            style={{
              left: `${dragPosition.x}px`,
              top: `${dragPosition.y}px`,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 8px currentColor'
            }}
          />
        )}
      </div>
    )
  }
)

DroppableTextarea.displayName = 'DroppableTextarea'