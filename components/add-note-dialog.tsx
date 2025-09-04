'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Note, ModuleType } from '@/types'
import { Button } from '@/components/ui/button'
import { useCueLookup } from '@/lib/services/cue-lookup'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { useLightwrightStore } from '@/lib/stores/lightwright-store'
import { LightwrightSelector } from '@/components/lightwright-selector'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogScrollableContent,
  DialogStickyFooter,
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
  onAdd: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>, lightwrightFixtureIds?: string[]) => void
  moduleType: ModuleType
  defaultType?: string
  editingNote?: Note | null
}

// Helper function to format channel numbers into expression string
function formatChannelsAsExpression(channels: number[]): string {
  if (channels.length === 0) return ''

  const sorted = [...channels].sort((a, b) => a - b)
  const ranges: string[] = []
  let rangeStart = sorted[0]
  let rangeEnd = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === rangeEnd + 1) {
      rangeEnd = sorted[i]
    } else {
      if (rangeStart === rangeEnd) {
        ranges.push(rangeStart.toString())
      } else if (rangeEnd === rangeStart + 1) {
        ranges.push(rangeStart.toString(), rangeEnd.toString())
      } else {
        ranges.push(`${rangeStart}-${rangeEnd}`)
      }
      rangeStart = sorted[i]
      rangeEnd = sorted[i]
    }
  }

  if (rangeStart === rangeEnd) {
    ranges.push(rangeStart.toString())
  } else if (rangeEnd === rangeStart + 1) {
    ranges.push(rangeStart.toString(), rangeEnd.toString())
  } else {
    ranges.push(`${rangeStart}-${rangeEnd}`)
  }

  return ranges.join(', ')
}

export function AddNoteDialog({ isOpen, onClose, onAdd, moduleType, defaultType, editingNote }: AddNoteDialogProps) {
  const { lookupCue } = useCueLookup()
  const { getTypes } = useCustomTypesStore()
  const { getPriorities } = useCustomPrioritiesStore()
  const { linkFixturesToWorkNote, getLinkedFixtures } = useLightwrightStore()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    type: defaultType || (moduleType === 'cue' ? 'Cue' : moduleType === 'work' ? 'Work' : 'Lighting'),
    cueNumbers: '',
    scriptPageId: '',
    sceneSongId: '',
    lightwrightItemId: '',
  })
  
  // Lightwright selection state for work notes
  const [selectedLightwrightIds, setSelectedLightwrightIds] = useState<string[]>([])
  const [channelExpression, setChannelExpression] = useState('')

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
      
      // Load existing Lightwright selections for work notes
      if (moduleType === 'work') {
        const linkedFixtures = getLinkedFixtures(editingNote.id)
        setSelectedLightwrightIds(linkedFixtures.map(f => f.id))
        
        // Set channel expression from linked fixtures
        if (linkedFixtures.length > 0) {
          const channels = linkedFixtures.map(f => f.channel).sort((a, b) => a - b)
          // Use the formatting function from the store
          setChannelExpression(formatChannelsAsExpression(channels))
        }
      }
    } else if (defaultType) {
      setFormData(prev => ({ ...prev, type: defaultType }))
      // Reset Lightwright selections for new notes
      setSelectedLightwrightIds([])
      setChannelExpression('')
    }
  }, [editingNote, defaultType, moduleType, getLinkedFixtures])

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
      channelNumbers: moduleType === 'work' ? channelExpression : undefined,
    }

    // Pass note data and fixture IDs to parent
    onAdd(noteData, moduleType === 'work' ? selectedLightwrightIds : undefined)
    
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
    setSelectedLightwrightIds([])
    setChannelExpression('')
    
    onClose()
  }

  // Get custom types and priorities from stores
  const availableTypes = getTypes(moduleType)
  const availablePriorities = getPriorities(moduleType)

  const getModuleColor = () => {
    switch (moduleType) {
      case 'cue': return 'modules-cue'
      case 'work': return 'modules-work'
      case 'production': return 'modules-production'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingNote ? 'Edit Note' : 'Add New Note'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogScrollableContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map(type => (
                      <SelectItem key={type.id} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: string) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePriorities.map(priority => (
                      <SelectItem key={priority.id} value={priority.value}>{priority.label}</SelectItem>
                    ))}
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
                <Label>Lightwright Fixtures (optional)</Label>
                <div className="border rounded-lg p-4">
                  <LightwrightSelector
                    productionId="prod-1"
                    selectedFixtureIds={selectedLightwrightIds}
                    onSelectionChange={setSelectedLightwrightIds}
                    channelExpression={channelExpression}
                    onChannelExpressionChange={setChannelExpression}
                  />
                </div>
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
          </DialogScrollableContent>

          <DialogStickyFooter>
            <div className="flex gap-3 w-full">
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
          </DialogStickyFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}