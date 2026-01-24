/**
 * Undo/Redo Store
 *
 * Zustand store that manages the undo/redo stack for note operations.
 * Uses Command Pattern to track reversible operations.
 *
 * Key features:
 * - Session-only (clears on page refresh)
 * - Max 50 commands to limit memory usage
 * - Clears when switching productions
 * - Provides undo/redo descriptions for UI
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { UndoableCommand } from '@/lib/undo/types'
import { DEFAULT_UNDO_CONFIG } from '@/lib/undo/types'

interface UndoState {
  /** Stack of commands (newest at the end) */
  stack: UndoableCommand[]

  /**
   * Pointer to current position in stack.
   * Points to the last executed command.
   * -1 means nothing executed (empty or all undone)
   */
  pointer: number

  /** Maximum commands to keep */
  maxSize: number

  /** Current production ID (used to clear on switch) */
  productionId: string | null

  // Actions
  /** Push a new command after an operation */
  push: (command: UndoableCommand) => void

  /** Get the command to undo (returns null if nothing to undo) */
  undo: () => UndoableCommand | null

  /** Get the command to redo (returns null if nothing to redo) */
  redo: () => UndoableCommand | null

  /** Clear the entire stack */
  clear: () => void

  /** Set production ID and clear if changed */
  setProductionId: (id: string | null) => void

  // Selectors
  /** Check if undo is available */
  canUndo: () => boolean

  /** Check if redo is available */
  canRedo: () => boolean

  /** Get description of the action that would be undone */
  getUndoDescription: () => string | null

  /** Get description of the action that would be redone */
  getRedoDescription: () => string | null

  /** Get the full undo stack (for debugging) */
  getStack: () => UndoableCommand[]
}

export const useUndoStore = create<UndoState>()(
  subscribeWithSelector((set, get) => ({
    stack: [],
    pointer: -1,
    maxSize: DEFAULT_UNDO_CONFIG.maxStackSize,
    productionId: null,

    push: (command: UndoableCommand) => {
      set((state) => {
        // If we're not at the end of the stack (user undid some commands),
        // discard all commands after the current pointer
        const newStack = state.stack.slice(0, state.pointer + 1)

        // Add the new command
        newStack.push(command)

        // Trim to max size if needed (remove oldest commands)
        while (newStack.length > state.maxSize) {
          newStack.shift()
        }

        return {
          stack: newStack,
          // Pointer is at the new end of the stack
          pointer: newStack.length - 1,
        }
      })
    },

    undo: () => {
      const state = get()
      if (state.pointer < 0) {
        return null
      }

      const command = state.stack[state.pointer]
      set({ pointer: state.pointer - 1 })
      return command
    },

    redo: () => {
      const state = get()
      if (state.pointer >= state.stack.length - 1) {
        return null
      }

      const command = state.stack[state.pointer + 1]
      set({ pointer: state.pointer + 1 })
      return command
    },

    clear: () => {
      set({ stack: [], pointer: -1 })
    },

    setProductionId: (id: string | null) => {
      const state = get()
      if (state.productionId !== id) {
        // Clear stack when switching productions
        set({ productionId: id, stack: [], pointer: -1 })
      }
    },

    canUndo: () => {
      return get().pointer >= 0
    },

    canRedo: () => {
      const state = get()
      return state.pointer < state.stack.length - 1
    },

    getUndoDescription: () => {
      const state = get()
      if (state.pointer < 0) {
        return null
      }
      return state.stack[state.pointer].description
    },

    getRedoDescription: () => {
      const state = get()
      if (state.pointer >= state.stack.length - 1) {
        return null
      }
      return state.stack[state.pointer + 1].description
    },

    getStack: () => {
      return get().stack
    },
  }))
)

/**
 * Hook to get reactive undo/redo state for UI
 */
export function useUndoState() {
  const canUndo = useUndoStore((state) => state.pointer >= 0)
  const canRedo = useUndoStore(
    (state) => state.pointer < state.stack.length - 1
  )
  const undoDescription = useUndoStore((state) =>
    state.pointer >= 0 ? state.stack[state.pointer]?.description : null
  )
  const redoDescription = useUndoStore((state) =>
    state.pointer < state.stack.length - 1
      ? state.stack[state.pointer + 1]?.description
      : null
  )

  return {
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
  }
}
