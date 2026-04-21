'use client'

import { useState } from 'react'
import type { Note, ModuleType } from '@/types'
import { Button } from '@/components/ui/button'
import { useCueLookup } from '@/lib/services/cue-lookup'
import { useCustomTypesStore } from '@/lib/stores/custom-types-store'
import { useCustomPrioritiesStore } from '@/lib/stores/custom-priorities-store'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { FixtureSelector } from '@/components/fixture-selector'
import { useProductionOptional } from '@/components/production/production-provider'
import { useAuthContext } from '@/components/auth/auth-provider'
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
import { isFixtureModule } from '@/lib/utils/module-helpers'
import { OrderListSection } from '@/components/order-list-section'

interface AddNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>, lightwrightFixtureIds?: string[]) => void
  moduleType: ModuleType
  defaultType?: string
  editingNote?: Note | null
  /** When set, shows a module type selector for the combined view */
  combinedViewModuleTypes?: ModuleType[]
  /** Callback when user changes the module type in combined view */
  onModuleTypeChange?: (moduleType: ModuleType) => void
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

export function AddNoteDialog({ isOpen, onClose, onAdd, moduleType, defaultType, editingNote, combinedViewModuleTypes, onModuleTypeChange }: AddNoteDialogProps) {
  // Use optional hook to avoid throwing during static generation or demo mode
  const productionContext = useProductionOptional()
  const productionId = productionContext?.productionId ?? 'demo'
  const { user } = useAuthContext()
  const { lookupCue } = useCueLookup()
  const { getTypes } = useCustomTypesStore()
  const { getPriorities } = useCustomPrioritiesStore()
  const { getLinkedFixtures } = useFixtureStore()

  // Track selected module for move-between-modules (work <-> electrician)
  const [selectedModuleType, setSelectedModuleType] = useState<ModuleType>(moduleType)

  const [formData, setFormData] = useState({
    description: '',
    priority: 'medium',
    type: defaultType || (moduleType === 'cue' ? 'Cue' : moduleType === 'electrician' ? 'Work' : moduleType === 'work' ? 'Work' : 'Lighting'),
    cueNumbers: '',
    scriptPageId: '',
    sceneSongId: '',
    lightwrightItemId: '',
    sceneryNeeds: '',
  })

  // Lightwright selection state for fixture modules
  const [selectedLightwrightIds, setSelectedLightwrightIds] = useState<string[]>([])
  const [channelExpression, setChannelExpression] = useState('')

  // Populate form when the edited note changes (React 19 adjusting-state
  // pattern: compute during render, not in useEffect). Tracks editingNote.id
  // as the key since moduleType/defaultType don't change while a note is
  // being edited in practice.
  const editingId = editingNote?.id ?? null
  const [prevEditingId, setPrevEditingId] = useState(editingId)
  if (prevEditingId !== editingId) {
    setPrevEditingId(editingId)
    if (editingNote) {
      setSelectedModuleType(editingNote.moduleType)

      // Read from cueNumber field first, fall back to parsing scriptPageId for backward compatibility
      const cueNumbers = editingNote.cueNumber ||
        (editingNote.scriptPageId?.startsWith('cue-')
          ? editingNote.scriptPageId.split('cue-')[1]
          : '')

      setFormData({
        description: editingNote.description || '',
        priority: editingNote.priority,
        type: editingNote.type || 'Cue',
        cueNumbers,
        scriptPageId: editingNote.scriptPageId || '',
        sceneSongId: editingNote.sceneSongId || '',
        lightwrightItemId: editingNote.lightwrightItemId || '',
        sceneryNeeds: editingNote.sceneryNeeds || '',
      })

      // Load existing Lightwright selections for fixture modules
      if (isFixtureModule(moduleType)) {
        const linkedFixtures = getLinkedFixtures(editingNote.id)
        setSelectedLightwrightIds(linkedFixtures.map(f => f.id))

        // Set channel expression from linked fixtures, or fall back to note's channelNumbers
        if (linkedFixtures.length > 0) {
          const channels = linkedFixtures.map(f => f.channel).sort((a, b) => a - b)
          setChannelExpression(formatChannelsAsExpression(channels))
        } else if (editingNote.channelNumbers) {
          setChannelExpression(editingNote.channelNumbers)
        }
      }
    } else {
      setSelectedModuleType(moduleType)
      if (defaultType) {
        setFormData({
          description: '',
          priority: 'medium',
          type: defaultType,
          cueNumbers: '',
          scriptPageId: '',
          sceneSongId: '',
          lightwrightItemId: '',
          sceneryNeeds: '',
        })
        setSelectedLightwrightIds([])
        setChannelExpression('')
      }
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | { preventDefault: () => void }) => {
    e.preventDefault()
    if (!formData.description.trim()) return

    // Get display name for createdBy field
    const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]

    const noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
      productionId,
      moduleType: selectedModuleType,
      description: formData.description,
      priority: formData.priority,
      status: 'todo',
      type: formData.type,
      createdBy: displayName,
      cueNumber: formData.cueNumbers || undefined,
      // Note: scriptPageId is for referencing actual script_pages (UUID), not for display
      // The cue number display is stored in cueNumber field
      sceneSongId: formData.sceneSongId || undefined,
      lightwrightItemId: formData.lightwrightItemId || undefined,
      channelNumbers: isFixtureModule(moduleType) ? channelExpression : undefined,
      sceneryNeeds: (isFixtureModule(moduleType) || moduleType === 'cue') ? formData.sceneryNeeds || undefined : undefined,
    }

    // Pass note data and fixture IDs to parent
    onAdd(noteData, isFixtureModule(moduleType) ? selectedLightwrightIds : undefined)
    
    // Reset form
    setFormData({
      description: '',
      priority: 'medium',
      type: defaultType || (moduleType === 'cue' ? 'Cue' : moduleType === 'electrician' ? 'Work' : moduleType === 'work' ? 'Work' : 'Lighting'),
      cueNumbers: '',
      scriptPageId: '',
      sceneSongId: '',
      lightwrightItemId: '',
      sceneryNeeds: '',
    })
    setSelectedLightwrightIds([])
    setChannelExpression('')

    onClose()
  }

  // Get custom types and priorities from stores
  const availableTypes = getTypes(moduleType)
  const availablePriorities = getPriorities(moduleType)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="add-note-dialog">
        <DialogHeader>
          <DialogTitle>
            {editingNote ? 'Edit Note' : 'Add New Note'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col min-h-0 flex-1">
          <DialogScrollableContent className="space-y-6">
            {/* Module type selector for combined view */}
            {combinedViewModuleTypes && combinedViewModuleTypes.length > 1 && !editingNote && (
              <div className="space-y-2">
                <Label>Module</Label>
                <Select value={moduleType} onValueChange={(value) => onModuleTypeChange?.(value as ModuleType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {combinedViewModuleTypes.map((mt) => (
                      <SelectItem key={mt} value={mt}>
                        {mt === 'work' ? 'Work Notes' : mt === 'electrician' ? 'Electrician Notes' : mt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Module selector for moving between work <-> electrician */}
            {editingNote && (moduleType === 'work' || moduleType === 'electrician') && (
              <div className="space-y-2">
                <Label>Module</Label>
                <Select value={selectedModuleType} onValueChange={(value) => setSelectedModuleType(value as ModuleType)}>
                  <SelectTrigger data-testid="module-type-selector">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work Notes</SelectItem>
                    <SelectItem value="electrician">Electrician Notes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

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
                  autoFocus
                  value={formData.cueNumbers}
                  onChange={(e) => setFormData({ ...formData, cueNumbers: e.target.value })}
                  placeholder="e.g., 127 or 45-47 or 89, 92, 95"
                  data-testid="cue-numbers"
                />
                <p className="text-xs text-muted-foreground">Enter single number, range (10-15), or list (5, 8, 12)</p>
              </div>
            )}

            {isFixtureModule(moduleType) && (
              <div className="space-y-2">
                <Label>Fixture Selection (optional)</Label>
                <div className="border rounded-lg p-4">
                  <FixtureSelector
                    productionId={productionId}
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
                autoFocus={moduleType !== 'cue'}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter your lighting note here..."
                className="min-h-[80px] resize-none"
                required
                data-testid="note-description"
              />
            </div>

            {(isFixtureModule(moduleType) || moduleType === 'cue') && (
              <div className="space-y-2">
                <Label htmlFor="sceneryNeeds">Scenery Needs</Label>
                <Textarea
                  id="sceneryNeeds"
                  data-testid="scenery-needs"
                  value={formData.sceneryNeeds}
                  onChange={(e) => setFormData({ ...formData, sceneryNeeds: e.target.value })}
                  placeholder="Any scenic coordination needed..."
                  className="min-h-[60px] resize-none"
                />
              </div>
            )}

            {isFixtureModule(moduleType) && editingNote && (
              <OrderListSection
                noteId={editingNote.id}
                moduleType={moduleType as 'work' | 'electrician'}
              />
            )}

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
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={moduleType}
                className="flex-1"
                data-testid="save-button"
              >
                {editingNote ? 'Update Note' : 'Create Note'}
                <kbd className="ml-2 text-xs opacity-60">⌘↵</kbd>
              </Button>
            </div>
          </DialogStickyFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
