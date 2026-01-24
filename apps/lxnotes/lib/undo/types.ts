/**
 * Undo/Redo System Types
 *
 * Command Pattern implementation for tracking reversible operations.
 * Each command captures the state before and after an operation,
 * allowing reliable undo/redo functionality.
 */

import type { Note, ModuleType } from '@/types'

/** Types of operations that can be undone/redone */
export type CommandType = 'create' | 'update' | 'delete'

/** Entity types that support undo/redo (extensible for future use) */
export type EntityType = 'note'

/**
 * Represents a single undoable operation.
 * Stores enough information to reverse the operation.
 */
export interface UndoableCommand {
  /** Unique identifier for this command */
  id: string

  /** Type of operation performed */
  type: CommandType

  /** When the operation was performed */
  timestamp: Date

  /** User who performed the operation (for audit trail) */
  userId?: string

  /** Type of entity affected */
  entityType: EntityType

  /** ID of the affected entity */
  entityId: string

  /** Module type for notes (cue, work, production, actor) */
  moduleType: ModuleType

  /**
   * State of the entity before the operation.
   * - null for 'create' operations (entity didn't exist)
   * - Full Note object for 'update' and 'delete' operations
   */
  previousState: Note | null

  /**
   * State of the entity after the operation.
   * - Full Note object for 'create' and 'update' operations
   * - null for 'delete' operations (entity removed from view)
   */
  newState: Note | null

  /** Human-readable description for UI display */
  description: string
}

/**
 * Configuration for the undo system
 */
export interface UndoConfig {
  /** Maximum number of commands to keep in the stack */
  maxStackSize: number

  /** Whether to persist undo history (not recommended for real-time apps) */
  persistToStorage: boolean
}

/**
 * Default configuration values
 */
export const DEFAULT_UNDO_CONFIG: UndoConfig = {
  maxStackSize: 50,
  persistToStorage: false,
}

/**
 * Generates a unique command ID
 */
export function generateCommandId(): string {
  return `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Creates a human-readable description for a command
 */
export function createCommandDescription(
  type: CommandType,
  note: Note | null
): string {
  const titlePreview = note?.title
    ? note.title.length > 30
      ? `${note.title.substring(0, 30)}...`
      : note.title
    : 'note'

  switch (type) {
    case 'create':
      return `Created: ${titlePreview}`
    case 'update':
      return `Edited: ${titlePreview}`
    case 'delete':
      return `Deleted: ${titlePreview}`
    default:
      return `Modified: ${titlePreview}`
  }
}

/**
 * Helper to create a command for a create operation
 */
export function createCreateCommand(
  newNote: Note,
  userId?: string
): UndoableCommand {
  return {
    id: generateCommandId(),
    type: 'create',
    timestamp: new Date(),
    userId,
    entityType: 'note',
    entityId: newNote.id,
    moduleType: newNote.moduleType,
    previousState: null,
    newState: newNote,
    description: createCommandDescription('create', newNote),
  }
}

/**
 * Helper to create a command for an update operation
 */
export function createUpdateCommand(
  previousNote: Note,
  updatedNote: Note,
  userId?: string
): UndoableCommand {
  return {
    id: generateCommandId(),
    type: 'update',
    timestamp: new Date(),
    userId,
    entityType: 'note',
    entityId: previousNote.id,
    moduleType: previousNote.moduleType,
    previousState: previousNote,
    newState: updatedNote,
    description: createCommandDescription('update', updatedNote),
  }
}

/**
 * Helper to create a command for a delete operation
 */
export function createDeleteCommand(
  deletedNote: Note,
  userId?: string
): UndoableCommand {
  return {
    id: generateCommandId(),
    type: 'delete',
    timestamp: new Date(),
    userId,
    entityType: 'note',
    entityId: deletedNote.id,
    moduleType: deletedNote.moduleType,
    previousState: deletedNote,
    newState: null,
    description: createCommandDescription('delete', deletedNote),
  }
}
