'use client'

import { useState, useEffect, useCallback } from 'react'
import { ColumnSizingState, OnChangeFn } from '@tanstack/react-table'

type ModuleType = 'cue' | 'work' | 'production'

/**
 * Hook for managing column sizing with localStorage persistence
 *
 * Stores column widths per module in localStorage, allowing users
 * to maintain their column width preferences across sessions.
 *
 * @param moduleType - The module type (cue, work, or production)
 * @returns Column sizing state and handlers
 */
export function useColumnSizing(moduleType: ModuleType) {
  const storageKey = `lxnotes-${moduleType}-columns`

  // Initialize state from localStorage or empty object
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => {
    if (typeof window === 'undefined') return {}

    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Error loading column sizes from localStorage:', error)
      return {}
    }
  })

  // Save to localStorage whenever column sizing changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (Object.keys(columnSizing).length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(columnSizing))
      }
    } catch (error) {
      console.error('Error saving column sizes to localStorage:', error)
    }
  }, [columnSizing, storageKey])

  // Handler for TanStack Table onColumnSizingChange
  const handleColumnSizingChange: OnChangeFn<ColumnSizingState> = useCallback(
    (updaterOrValue) => {
      setColumnSizing((prev) => {
        const newValue =
          typeof updaterOrValue === 'function'
            ? updaterOrValue(prev)
            : updaterOrValue
        return newValue
      })
    },
    []
  )

  // Reset column sizes to defaults
  const resetColumnSizes = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(storageKey)
      setColumnSizing({})
    } catch (error) {
      console.error('Error resetting column sizes:', error)
    }
  }, [storageKey])

  return {
    columnSizing,
    onColumnSizingChange: handleColumnSizingChange,
    resetColumnSizes,
  }
}