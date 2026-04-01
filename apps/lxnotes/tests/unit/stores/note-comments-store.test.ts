import { describe, it, expect, beforeEach } from 'vitest'
import { useNoteCommentsStore } from '@/lib/stores/note-comments-store'

describe('useNoteCommentsStore', () => {
  beforeEach(() => {
    useNoteCommentsStore.setState({
      counts: {},
      openNoteId: null,
    })
  })

  describe('counts', () => {
    it('should set counts', () => {
      const { setCounts } = useNoteCommentsStore.getState()
      setCounts({ 'note-1': 3, 'note-2': 5 })

      const { counts } = useNoteCommentsStore.getState()
      expect(counts).toEqual({ 'note-1': 3, 'note-2': 5 })
    })

    it('should increment count for existing note', () => {
      useNoteCommentsStore.setState({ counts: { 'note-1': 3 } })
      const { incrementCount } = useNoteCommentsStore.getState()
      incrementCount('note-1')

      expect(useNoteCommentsStore.getState().counts['note-1']).toBe(4)
    })

    it('should increment count for new note (starts at 0)', () => {
      const { incrementCount } = useNoteCommentsStore.getState()
      incrementCount('note-new')

      expect(useNoteCommentsStore.getState().counts['note-new']).toBe(1)
    })

    it('should decrement count', () => {
      useNoteCommentsStore.setState({ counts: { 'note-1': 3 } })
      const { decrementCount } = useNoteCommentsStore.getState()
      decrementCount('note-1')

      expect(useNoteCommentsStore.getState().counts['note-1']).toBe(2)
    })

    it('should not decrement below 0', () => {
      useNoteCommentsStore.setState({ counts: { 'note-1': 0 } })
      const { decrementCount } = useNoteCommentsStore.getState()
      decrementCount('note-1')

      expect(useNoteCommentsStore.getState().counts['note-1']).toBe(0)
    })

    it('should remove count', () => {
      useNoteCommentsStore.setState({ counts: { 'note-1': 3, 'note-2': 5 } })
      const { removeCount } = useNoteCommentsStore.getState()
      removeCount('note-1')

      const { counts } = useNoteCommentsStore.getState()
      expect(counts).toEqual({ 'note-2': 5 })
      expect(counts['note-1']).toBeUndefined()
    })
  })

  describe('openNoteId', () => {
    it('should set openNoteId', () => {
      const { setOpenNoteId } = useNoteCommentsStore.getState()
      setOpenNoteId('note-1')

      expect(useNoteCommentsStore.getState().openNoteId).toBe('note-1')
    })

    it('should clear openNoteId', () => {
      useNoteCommentsStore.setState({ openNoteId: 'note-1' })
      const { setOpenNoteId } = useNoteCommentsStore.getState()
      setOpenNoteId(null)

      expect(useNoteCommentsStore.getState().openNoteId).toBeNull()
    })
  })
})
