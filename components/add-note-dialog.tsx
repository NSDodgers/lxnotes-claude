'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Note, Priority, ModuleType } from '@/types'
import { Button } from '@/components/ui/button'
import { useCueLookup } from '@/lib/services/cue-lookup'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AddNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
  moduleType: ModuleType
  defaultType?: string
  editingNote?: Note | null
}

export function AddNoteDialog({ isOpen, onClose, onAdd, moduleType, defaultType, editingNote }: AddNoteDialogProps) {
  const { lookupCue } = useCueLookup()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    type: defaultType || (moduleType === 'cue' ? 'Cue' : moduleType === 'work' ? 'Work' : 'Lighting'),
    cueNumbers: '',
    scriptPageId: '',
    sceneSongId: '',
    lightwrightItemId: '',
  })

  // Populate form when editing
  useEffect(() => {
    if (editingNote) {
      const cueNumbers = editingNote.scriptPageId?.startsWith('cue-') 
        ? editingNote.scriptPageId.split('cue-')[1] 
        : ''
      
      setFormData({
        title: editingNote.title || '',
        description: editingNote.description || '',
        priority: editingNote.priority,
        type: editingNote.type || 'Cue',
        cueNumbers,
        scriptPageId: editingNote.scriptPageId || '',
        sceneSongId: editingNote.sceneSongId || '',
        lightwrightItemId: editingNote.lightwrightItemId || '',
      })
    } else if (defaultType) {
      setFormData(prev => ({ ...prev, type: defaultType }))
    }
  }, [editingNote, defaultType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description.trim()) return

    const noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
      productionId: 'prod-1',
      moduleType,
      title: formData.description,
      description: formData.description,
      priority: formData.priority,
      status: 'todo',
      type: formData.type,
      scriptPageId: formData.cueNumbers ? `cue-${formData.cueNumbers}` : undefined,
      sceneSongId: formData.sceneSongId || undefined,
      lightwrightItemId: formData.lightwrightItemId || undefined,
    }

    onAdd(noteData)
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      type: defaultType || (moduleType === 'cue' ? 'Cue' : moduleType === 'work' ? 'Work' : 'Lighting'),
      cueNumbers: '',
      scriptPageId: '',
      sceneSongId: '',
      lightwrightItemId: '',
    })
    
    onClose()
  }

  const getTypeOptions = () => {
    switch (moduleType) {
      case 'cue':
        return ['Cue', 'Director', 'Choreographer', 'Designer', 'Stage Manager', 'Associate', 'Assistant', 'Spot', 'Programmer', 'Production', 'Paperwork', 'Think']
      case 'work':
        return ['Work', 'Focus', 'Paperwork', 'Electrician', 'Think']
      case 'production':
        return ['Scenic', 'Costumes', 'Lighting', 'Props', 'Sound', 'Video', 'Stage Management', 'Directing', 'Choreography', 'Production Management']
      default:
        return []
    }
  }

  const getModuleColor = () => {
    switch (moduleType) {
      case 'cue': return 'modules-cue'
      case 'work': return 'modules-work'
      case 'production': return 'modules-production'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingNote ? 'Edit Note' : 'Add New Note'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getTypeOptions().map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: Priority) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {moduleType === 'cue' && (
            <div className="space-y-2">
              <Label htmlFor="cueNumbers">Cue Number(s)</Label>
              <Input
                id="cueNumbers"
                type="text"
                value={formData.cueNumbers}
                onChange={(e) => setFormData({ ...formData, cueNumbers: e.target.value })}
                placeholder="e.g., 127 or 45-47 or 89, 92, 95"
              />
              <p className="text-xs text-muted-foreground">Enter single number, range (10-15), or list (5, 8, 12)</p>
            </div>
          )}

          {moduleType === 'work' && (
            <div className="space-y-2">
              <Label htmlFor="lightwrightId">Lightwright ID (optional)</Label>
              <Input
                id="lightwrightId"
                type="text"
                value={formData.lightwrightItemId}
                onChange={(e) => setFormData({ ...formData, lightwrightItemId: e.target.value })}
                placeholder="LW001"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Note Content</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter your lighting note here..."
              className="min-h-[120px] resize-none"
              required
            />
          </div>

          {moduleType === 'cue' && formData.cueNumbers && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Script Location Preview:</p>
              <div className="rounded-lg bg-muted border px-3 py-2">
                <div className="text-sm text-muted-foreground">
                  {(() => {
                    const cueNumber = formData.cueNumbers.trim()
                    if (!cueNumber) return 'Enter cue number to see location'
                    
                    const lookup = lookupCue(cueNumber)
                    return lookup.display || 'No script location found'
                  })()}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={moduleType as any}
              className="flex-1"
            >
              {editingNote ? 'Update Note' : 'Create Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}