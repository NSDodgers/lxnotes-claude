'use client'

import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle, useLayoutEffect } from 'react'
import { cn } from '@/lib/utils'
import type { PlaceholderDefinition } from '@/types'

// Selection save/restore utilities for cursor position preservation
interface SavedSelection {
  start: number
  end: number
}

const saveSelection = (el: HTMLElement): SavedSelection | null => {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null

  const range = sel.getRangeAt(0)
  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(el)
  preCaretRange.setEnd(range.startContainer, range.startOffset)
  const start = preCaretRange.toString().length

  preCaretRange.setEnd(range.endContainer, range.endOffset)
  const end = preCaretRange.toString().length

  return { start, end }
}

const restoreSelection = (el: HTMLElement, pos: SavedSelection): void => {
  const sel = window.getSelection()
  if (!sel) return

  // Walk text nodes to find position
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
  let currentPos = 0
  let startNode: Node | null = null
  let startOffset = 0
  let endNode: Node | null = null
  let endOffset = 0

  let node: Node | null
  while ((node = walker.nextNode())) {
    const nodeLength = node.textContent?.length || 0

    // Find start position
    if (!startNode && currentPos + nodeLength >= pos.start) {
      startNode = node
      startOffset = pos.start - currentPos
    }

    // Find end position
    if (!endNode && currentPos + nodeLength >= pos.end) {
      endNode = node
      endOffset = pos.end - currentPos
      break
    }

    currentPos += nodeLength
  }

  // If we found both positions, restore the selection
  if (startNode && endNode) {
    try {
      const range = document.createRange()
      range.setStart(startNode, startOffset)
      range.setEnd(endNode, endOffset)
      sel.removeAllRanges()
      sel.addRange(range)
    } catch {
      // Fallback: place cursor at end
    }
  }
}

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

// Escape HTML to prevent XSS
const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Get SVG icon for category
const getCategoryIconSvg = (category: PlaceholderDefinition['category']): string => {
  const baseAttrs = 'xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"'
  switch (category) {
    case 'production':
      return `<svg ${baseAttrs}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`
    case 'user':
      return `<svg ${baseAttrs}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    case 'date':
      return `<svg ${baseAttrs}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`
    case 'notes':
      return `<svg ${baseAttrs}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
    default:
      return `<svg ${baseAttrs}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`
  }
}

// Get gradient style for category
const getCategoryGradient = (category: PlaceholderDefinition['category']): string => {
  switch (category) {
    case 'production':
      return 'linear-gradient(to right, #a855f7, #9333ea)'
    case 'user':
      return 'linear-gradient(to right, #3b82f6, #2563eb)'
    case 'date':
      return 'linear-gradient(to right, #22c55e, #16a34a)'
    case 'notes':
      return 'linear-gradient(to right, #f97316, #ea580c)'
    default:
      return 'linear-gradient(to right, #6b7280, #4b5563)'
  }
}

// Extract readable name from placeholder key
const getDisplayName = (key: string): string => {
  return key
    .replace(/^\{\{|\}\}$/g, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
}

// Build HTML for a placeholder chip
const buildPlaceholderChipHtml = (placeholder: PlaceholderDefinition): string => {
  const gradient = getCategoryGradient(placeholder.category)
  const icon = getCategoryIconSvg(placeholder.category)
  const displayName = escapeHtml(getDisplayName(placeholder.key))

  return `<span contenteditable="false" data-placeholder-key="${escapeHtml(placeholder.key)}" style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:500;cursor:default;user-select:none;background:${gradient};color:white;box-shadow:0 1px 2px 0 rgb(0 0 0 / 0.05);margin:0 2px;white-space:nowrap;"><span style="display:flex;align-items:center;gap:4px;">${icon}<span style="max-width:96px;overflow:hidden;text-overflow:ellipsis;">${displayName}</span></span></span>`
}

// Build HTML from parsed content
const buildHtml = (parts: ParsedContent[], placeholderText: string): string => {
  if (parts.length === 0) {
    return `<span style="color:var(--text-muted);pointer-events:none;">${escapeHtml(placeholderText)}</span>`
  }

  return parts.map(part => {
    if (part.type === 'placeholder' && part.placeholder) {
      return buildPlaceholderChipHtml(part.placeholder)
    } else if (part.type === 'linebreak') {
      return '<br>'
    }
    // Text content - escape and return directly (no wrapper span to avoid duplication)
    return escapeHtml(part.content)
  }).join('')
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
    const lastHtmlRef = useRef<string>('')
    const isTypingRef = useRef(false)

    useImperativeHandle(ref, () => contentRef.current!, [])

    const parsedContent = parseContent(value, availablePlaceholders)

    // Sync DOM only when value changes externally (not from typing)
    useLayoutEffect(() => {
      if (!contentRef.current) return

      const newHtml = buildHtml(parsedContent, placeholder || 'Enter text or drag placeholders here...')

      // Only update DOM if content changed externally (not from typing)
      // Compare against what we last set, not current innerHTML
      if (newHtml !== lastHtmlRef.current && !isTypingRef.current) {
        // Save cursor position before update
        const savedSelection = saveSelection(contentRef.current)

        contentRef.current.innerHTML = newHtml
        lastHtmlRef.current = newHtml

        // Restore cursor position after update (for external changes like drop)
        if (savedSelection && document.activeElement === contentRef.current) {
          restoreSelection(contentRef.current, savedSelection)
        }
      }

      // Reset typing flag after effect runs
      isTypingRef.current = false
    }, [parsedContent, placeholder])

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
      // Mark as typing so useLayoutEffect doesn't replace DOM
      isTypingRef.current = true

      // Walk the DOM to reconstruct value, preserving placeholder keys
      const extractValue = (node: Node): string => {
        let result = ''

        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i]

          if (child.nodeType === Node.TEXT_NODE) {
            // Text node - use its content directly
            result += child.textContent || ''
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const element = child as HTMLElement

            // Check for placeholder chip with data attribute
            const placeholderKey = element.getAttribute('data-placeholder-key')
            if (placeholderKey) {
              result += placeholderKey
            } else if (element.tagName === 'BR') {
              // Line break
              result += '\n'
            } else {
              // Recurse into other elements (like spans for text)
              result += extractValue(element)
            }
          }
        }

        return result
      }

      const newValue = extractValue(e.currentTarget)
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

    const handleClick = useCallback(() => {
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
            'focus:outline-hidden focus:border-modules-production transition-colors',
            'cursor-text select-text whitespace-pre-wrap wrap-break-word overflow-auto resize-none',
            isDragOver && 'border-modules-production bg-modules-production/5',
            disabled && 'opacity-50 cursor-not-allowed bg-bg-secondary',
            className
          )}
          style={{
            minHeight: `${rows * 1.5}rem`,
            lineHeight: '1.5',
          }}
          // No dangerouslySetInnerHTML - we manage DOM imperatively via useLayoutEffect
        />

        {/* Drop zone overlay */}
        {isDragOver && (
          <div className="absolute inset-0 border-2 border-dashed border-modules-production rounded-lg pointer-events-none bg-modules-production/5 flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="bg-bg-secondary/95 backdrop-blur-xs rounded-lg px-4 py-3 shadow-lg border border-modules-production/20">
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