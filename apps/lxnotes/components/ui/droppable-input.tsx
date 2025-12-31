'use client'

import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { PlaceholderChip } from '@/components/placeholder-chip'
import { cn } from '@/lib/utils'
import type { PlaceholderDefinition } from '@/types'

export interface DroppableInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  availablePlaceholders?: PlaceholderDefinition[]
  onPlaceholderInsert?: (placeholder: string) => void
  className?: string
  placeholder?: string
}

interface ParsedContent {
  type: 'text' | 'placeholder'
  content: string
  placeholder?: PlaceholderDefinition
}

// Parse text content to identify placeholders
const parseContent = (text: string, placeholders: PlaceholderDefinition[] = []): ParsedContent[] => {
  const parts: ParsedContent[] = []
  const placeholderRegex = /(\{\{[^}]+\}\})/g

  let lastIndex = 0
  let match

  while ((match = placeholderRegex.exec(text)) !== null) {
    // Add text before placeholder
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index)
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

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex)
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText })
    }
  }

  return parts
}

export const DroppableInput = forwardRef<HTMLDivElement, DroppableInputProps>(
  ({
    value,
    onChange,
    availablePlaceholders = [],
    onPlaceholderInsert,
    className,
    placeholder,
    disabled,
    ...props
  }, ref) => {
    const [isDragOver, setIsDragOver] = useState(false)
    const [dragPosition, setDragPosition] = useState<number | null>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const hiddenInputRef = useRef<HTMLInputElement>(null)

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
      const cursorPos = getCursorPosition()
      const newValue = value.slice(0, cursorPos) + text + value.slice(cursorPos)
      updateValue(newValue)

      // Set cursor after inserted text
      setTimeout(() => {
        if (contentRef.current) {
          const selection = window.getSelection()
          const range = document.createRange()

          // Find the text node and position
          let textOffset = cursorPos + text.length
          let currentNode = contentRef.current.firstChild

          while (currentNode && textOffset > 0) {
            if (currentNode.nodeType === Node.TEXT_NODE) {
              const textLength = currentNode.textContent?.length || 0
              if (textOffset <= textLength) {
                range.setStart(currentNode, textOffset)
                range.setEnd(currentNode, textOffset)
                break
              }
              textOffset -= textLength
            }
            currentNode = currentNode.nextSibling
          }

          if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
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
        // Simple position calculation - could be enhanced for better accuracy
        const textLength = value.length
        const relativePos = Math.max(0, Math.min(textLength, Math.round((x / rect.width) * textLength)))
        setDragPosition(relativePos)
      }
    }, [isDragOver, value.length])

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
      // Handle special keys
      if (e.key === 'Enter') {
        e.preventDefault()
        // For single-line input, prevent line breaks
        return
      }

      // Allow normal text editing
    }, [])

    const handleClick = useCallback((e: React.MouseEvent) => {
      // Focus the contentEditable div
      if (contentRef.current && !disabled) {
        contentRef.current.focus()
      }
    }, [disabled])

    return (
      <div className="relative">
        {/* Hidden input for form compatibility */}
        <input
          ref={hiddenInputRef}
          type="text"
          value={value}
          onChange={() => { }} // Controlled by contentEditable
          className="sr-only"
          tabIndex={-1}
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
            'w-full min-h-[2.5rem] px-3 py-2 bg-bg-tertiary border border-bg-hover rounded-lg',
            'text-text-primary placeholder:text-text-muted',
            'focus:outline-none focus:border-modules-production transition-colors',
            'cursor-text select-text whitespace-nowrap overflow-x-auto',
            isDragOver && 'border-modules-production bg-modules-production/5',
            disabled && 'opacity-50 cursor-not-allowed bg-bg-secondary',
            className
          )}
          style={{
            wordBreak: 'break-all',
            overflowWrap: 'break-word'
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
              }
              return (
                <span key={index}>
                  {part.content}
                </span>
              )
            })
          )}

          {/* Drop position indicator */}
          {isDragOver && dragPosition !== null && (
            <span
              className="absolute w-0.5 h-6 bg-modules-production animate-pulse transition-all duration-100 ease-out"
              style={{
                left: `${(dragPosition / Math.max(value.length, 1)) * 100}%`,
                top: '50%',
                transform: 'translateY(-50%)',
                boxShadow: '0 0 8px currentColor'
              }}
            />
          )}
        </div>

        {/* Drop zone overlay */}
        {isDragOver && (
          <div className="absolute inset-0 border-2 border-dashed border-modules-production rounded-lg pointer-events-none bg-modules-production/5 flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="text-xs font-medium text-modules-production bg-bg-secondary/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-modules-production/20 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-modules-production rounded-full animate-bounce"></div>
                Drop placeholder here
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

DroppableInput.displayName = 'DroppableInput'