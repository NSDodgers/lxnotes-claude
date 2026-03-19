import { describe, it, expect, beforeEach } from 'vitest'
import { useUndoStore } from '@/lib/stores/undo-store'
import type { UndoableCommand } from '@/lib/undo/types'
import type { Note } from '@/types'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    productionId: 'prod-1',
    moduleType: 'cue',
    title: 'Test note',
    priority: 'medium',
    status: 'todo',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeCommand(type: 'create' | 'update' | 'delete', overrides: Partial<UndoableCommand> = {}): UndoableCommand {
  const note = makeNote()
  return {
    id: `cmd-${Math.random()}`,
    type,
    timestamp: new Date(),
    entityType: 'note',
    entityId: note.id,
    moduleType: 'cue',
    previousState: type === 'create' ? null : note,
    newState: type === 'delete' ? null : note,
    description: `Test ${type}`,
    ...overrides,
  }
}

describe('Undo Store', () => {
  beforeEach(() => {
    useUndoStore.getState().clear()
  })

  describe('push', () => {
    it('should add a command to the stack', () => {
      const cmd = makeCommand('create')
      useUndoStore.getState().push(cmd)

      expect(useUndoStore.getState().stack).toHaveLength(1)
      expect(useUndoStore.getState().pointer).toBe(0)
    })

    it('should discard redo commands when pushing after undo', () => {
      const cmd1 = makeCommand('create')
      const cmd2 = makeCommand('update')
      const cmd3 = makeCommand('delete')

      useUndoStore.getState().push(cmd1)
      useUndoStore.getState().push(cmd2)
      useUndoStore.getState().push(cmd3)

      // Undo twice (pointer goes from 2 → 0)
      useUndoStore.getState().commitUndo()
      useUndoStore.getState().commitUndo()

      // Push a new command — should discard cmd2 and cmd3
      const cmd4 = makeCommand('create')
      useUndoStore.getState().push(cmd4)

      expect(useUndoStore.getState().stack).toHaveLength(2)
      expect(useUndoStore.getState().stack[0]).toBe(cmd1)
      expect(useUndoStore.getState().stack[1]).toBe(cmd4)
      expect(useUndoStore.getState().pointer).toBe(1)
    })

    it('should trim to max size when stack overflows', () => {
      // Push 55 commands (max is 50)
      for (let i = 0; i < 55; i++) {
        useUndoStore.getState().push(makeCommand('update'))
      }

      expect(useUndoStore.getState().stack).toHaveLength(50)
      expect(useUndoStore.getState().pointer).toBe(49)
    })
  })

  describe('peekUndo / commitUndo', () => {
    it('should peek without moving pointer', () => {
      const cmd = makeCommand('create')
      useUndoStore.getState().push(cmd)

      const peeked = useUndoStore.getState().peekUndo()
      expect(peeked).toBe(cmd)
      expect(useUndoStore.getState().pointer).toBe(0)
    })

    it('should return null when nothing to undo', () => {
      expect(useUndoStore.getState().peekUndo()).toBeNull()
    })

    it('should move pointer on commit', () => {
      useUndoStore.getState().push(makeCommand('create'))
      useUndoStore.getState().push(makeCommand('update'))

      useUndoStore.getState().commitUndo()
      expect(useUndoStore.getState().pointer).toBe(0)

      useUndoStore.getState().commitUndo()
      expect(useUndoStore.getState().pointer).toBe(-1)
    })

    it('should not move pointer below -1', () => {
      useUndoStore.getState().push(makeCommand('create'))
      useUndoStore.getState().commitUndo()
      useUndoStore.getState().commitUndo() // Should not go below -1

      expect(useUndoStore.getState().pointer).toBe(-1)
    })
  })

  describe('peekRedo / commitRedo', () => {
    it('should peek at the next command after undo', () => {
      const cmd1 = makeCommand('create')
      const cmd2 = makeCommand('update')
      useUndoStore.getState().push(cmd1)
      useUndoStore.getState().push(cmd2)

      useUndoStore.getState().commitUndo() // pointer: 0

      const peeked = useUndoStore.getState().peekRedo()
      expect(peeked).toBe(cmd2)
      expect(useUndoStore.getState().pointer).toBe(0)
    })

    it('should return null when nothing to redo', () => {
      useUndoStore.getState().push(makeCommand('create'))
      expect(useUndoStore.getState().peekRedo()).toBeNull()
    })

    it('should move pointer forward on commit', () => {
      useUndoStore.getState().push(makeCommand('create'))
      useUndoStore.getState().push(makeCommand('update'))
      useUndoStore.getState().commitUndo()
      useUndoStore.getState().commitUndo()

      useUndoStore.getState().commitRedo()
      expect(useUndoStore.getState().pointer).toBe(0)
    })
  })

  describe('canUndo / canRedo', () => {
    it('should report correct availability', () => {
      expect(useUndoStore.getState().canUndo()).toBe(false)
      expect(useUndoStore.getState().canRedo()).toBe(false)

      useUndoStore.getState().push(makeCommand('create'))
      expect(useUndoStore.getState().canUndo()).toBe(true)
      expect(useUndoStore.getState().canRedo()).toBe(false)

      useUndoStore.getState().commitUndo()
      expect(useUndoStore.getState().canUndo()).toBe(false)
      expect(useUndoStore.getState().canRedo()).toBe(true)
    })
  })

  describe('setProductionId', () => {
    it('should clear stack when switching productions', () => {
      useUndoStore.getState().push(makeCommand('create'))
      useUndoStore.getState().push(makeCommand('update'))
      expect(useUndoStore.getState().stack).toHaveLength(2)

      useUndoStore.getState().setProductionId('new-prod')
      expect(useUndoStore.getState().stack).toHaveLength(0)
      expect(useUndoStore.getState().pointer).toBe(-1)
    })

    it('should not clear stack when setting same production', () => {
      useUndoStore.getState().setProductionId('prod-1')
      useUndoStore.getState().push(makeCommand('create'))

      useUndoStore.getState().setProductionId('prod-1')
      expect(useUndoStore.getState().stack).toHaveLength(1)
    })
  })

  describe('descriptions', () => {
    it('should return undo description for current command', () => {
      useUndoStore.getState().push(makeCommand('create', { description: 'Created: My Note' }))
      expect(useUndoStore.getState().getUndoDescription()).toBe('Created: My Note')
    })

    it('should return redo description after undo', () => {
      useUndoStore.getState().push(makeCommand('create', { description: 'Created: My Note' }))
      useUndoStore.getState().commitUndo()
      expect(useUndoStore.getState().getRedoDescription()).toBe('Created: My Note')
    })

    it('should return null when nothing to undo/redo', () => {
      expect(useUndoStore.getState().getUndoDescription()).toBeNull()
      expect(useUndoStore.getState().getRedoDescription()).toBeNull()
    })
  })
})
