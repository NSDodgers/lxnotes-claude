/**
 * Keyboard Shortcuts Hook
 *
 * Provides global keyboard shortcut handling for the application.
 * Currently supports:
 * - Cmd/Ctrl+Z: Undo
 * - Cmd/Ctrl+Shift+Z: Redo
 *
 * Note: Shortcuts are only enabled on note pages (cue-notes, work-notes, production-notes)
 */

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useNotes } from '@/lib/contexts/notes-context'

/** Route patterns where undo/redo shortcuts should be enabled */
const NOTE_PAGE_PATTERNS = [
  '/cue-notes',
  '/work-notes',
  '/production-notes',
  '/demo/cue-notes',
  '/demo/work-notes',
  '/demo/production-notes',
]

/**
 * Check if the current pathname is a note page
 * Handles both direct routes (/cue-notes) and production routes (/production/[id]/cue-notes)
 */
function isNotePageRoute(pathname: string | null): boolean {
  if (!pathname) return false

  // Check direct matches
  if (NOTE_PAGE_PATTERNS.some((route) => pathname === route)) {
    return true
  }

  // Check production routes like /production/[id]/cue-notes
  const productionRouteMatch = pathname.match(/^\/production\/[^/]+\/(cue-notes|work-notes|production-notes)$/)
  return !!productionRouteMatch
}

interface UseKeyboardShortcutsOptions {
  /** Whether keyboard shortcuts are enabled */
  enabled?: boolean
}

/**
 * Hook to enable global keyboard shortcuts for undo/redo
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true } = options
  const { undoLastAction, redoLastAction, canUndo, canRedo } = useNotes()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if we're in an input field or textarea
      // When in text inputs, let the browser handle undo/redo for text editing
      const target = event.target as HTMLElement
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (isInputField) {
        // Let browser handle all keyboard shortcuts in input fields
        // including native text undo/redo
        return
      }

      // Undo: Cmd/Ctrl+Z (without Shift)
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === 'z' &&
        !event.shiftKey
      ) {
        event.preventDefault()
        if (canUndo) {
          undoLastAction()
        }
        return
      }

      // Redo: Cmd/Ctrl+Shift+Z
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === 'z' || event.key === 'Z') &&
        event.shiftKey
      ) {
        event.preventDefault()
        if (canRedo) {
          redoLastAction()
        }
        return
      }
    },
    [undoLastAction, redoLastAction, canUndo, canRedo]
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return {
    canUndo,
    canRedo,
    undoLastAction,
    redoLastAction,
  }
}

/**
 * Component wrapper that enables keyboard shortcuts
 * Automatically detects if we're on a note page and enables shortcuts accordingly
 */
export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Only enable shortcuts on note pages
  const isNotePage = isNotePageRoute(pathname)

  useKeyboardShortcuts({ enabled: isNotePage })
  return <>{children}</>
}
