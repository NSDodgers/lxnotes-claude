'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { useScriptStore } from '@/lib/stores/script-store'
import { Plus, FileText, Theater, Music, Trash2, AlertTriangle, Edit3, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScriptPage, SceneSong } from '@/types'

interface AddPageDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (pageData: { pageNumber: string; firstCueNumber?: string }) => void
}

interface AddSceneSongDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (itemData: { name: string; type: 'scene' | 'song'; firstCueNumber?: string; continuesFromId?: string }) => void
  pageId: string
  type: 'scene' | 'song'
  pageCueNumber?: string
}

function AddPageDialog({ isOpen, onClose, onAdd }: AddPageDialogProps) {
  const [pageNumber, setPageNumber] = useState('')
  const [firstCueNumber, setFirstCueNumber] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pageNumber.trim()) return

    onAdd({
      pageNumber: pageNumber.trim(),
      firstCueNumber: firstCueNumber.trim() || undefined,
    })

    setPageNumber('')
    setFirstCueNumber('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-bg-secondary rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Add Script Page</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Page Number
            </label>
            <input
              type="text"
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              placeholder="e.g., 1, 23a, 59-60"
              className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-cue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              First Cue Number (optional)
            </label>
            <input
              type="text"
              value={firstCueNumber}
              onChange={(e) => setFirstCueNumber(e.target.value)}
              placeholder="e.g., 127"
              className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-cue"
            />
          </div>
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
              variant="cue"
              className="flex-1"
            >
              Add Page
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddSceneSongDialog({ isOpen, onClose, onAdd, pageId, type, pageCueNumber }: AddSceneSongDialogProps) {
  const { 
    getPreviousPageScenes, 
    getPreviousPageSongs, 
    getAvailableContinuations,
    getContinuationStatus,
    getSuggestedContinuation
  } = useScriptStore()
  
  const [name, setName] = useState('')
  const [firstCueNumber, setFirstCueNumber] = useState('')
  const [usePageCue, setUsePageCue] = useState(false)
  const [isContinuation, setIsContinuation] = useState(false)
  const [continuesFromId, setContinuesFromId] = useState('')
  
  // Get continuation options
  const previousScenes = getPreviousPageScenes(pageId)
  const previousSongs = getPreviousPageSongs(pageId)
  const previousItems = type === 'scene' ? previousScenes : previousSongs
  
  // Get smart continuation data
  const availableContinuations = getAvailableContinuations(pageId, type)
  const suggestedContinuation = getSuggestedContinuation(pageId, type)

  // Smart defaults: Auto-enable continuation mode and pre-select suggestion
  useEffect(() => {
    if (isOpen && suggestedContinuation && !isContinuation && !continuesFromId && !name) {
      setIsContinuation(true)
      setContinuesFromId(suggestedContinuation.id)
      setName(suggestedContinuation.name)
    }
  }, [isOpen, suggestedContinuation, isContinuation, continuesFromId, name])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setFirstCueNumber('')
      setUsePageCue(false)
      setIsContinuation(false)
      setContinuesFromId('')
    }
  }, [isOpen])

  // Handle continuation selection
  const handleContinuationChange = (selectedId: string) => {
    setContinuesFromId(selectedId)
    const selectedItem = previousItems.find(item => item.id === selectedId)
    if (selectedItem) {
      setName(selectedItem.name)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const cueNumber = usePageCue ? pageCueNumber : firstCueNumber.trim()

    onAdd({
      name: name.trim(),
      type,
      firstCueNumber: cueNumber || undefined,
      continuesFromId: isContinuation ? continuesFromId || undefined : undefined,
    })

    setName('')
    setFirstCueNumber('')
    setUsePageCue(false)
    setIsContinuation(false)
    setContinuesFromId('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-bg-secondary rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Add {type === 'scene' ? 'Scene' : 'Song'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {type === 'scene' ? 'Scene' : 'Song'} Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'scene' ? 'e.g., Act 1, Scene 1' : 'e.g., Opening Number'}
              className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-cue"
              required
              disabled={isContinuation}
            />
          </div>

          {/* Continuation Controls */}
          {previousItems.length > 0 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isContinuation"
                    checked={isContinuation}
                    onChange={(e) => {
                      setIsContinuation(e.target.checked)
                      if (!e.target.checked) {
                        setContinuesFromId('')
                        setName('')
                      }
                    }}
                    className="rounded"
                  />
                  <label htmlFor="isContinuation" className="text-sm text-text-secondary">
                    Continue from previous page
                  </label>
                </div>
                
                {/* Smart suggestion indicator */}
                {availableContinuations.length > 0 && !isContinuation && (
                  <div className="text-xs text-modules-cue pl-6">
                    💡 {availableContinuations.length} {type}(s) from previous page can be continued
                    {suggestedContinuation && (
                      <span className="font-medium"> • Suggested: &quot;{suggestedContinuation.name}&quot;</span>
                    )}
                  </div>
                )}
              </div>
              
              {isContinuation && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Select {type} to continue
                  </label>
                  <select
                    value={continuesFromId}
                    onChange={(e) => handleContinuationChange(e.target.value)}
                    className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-cue"
                    required={isContinuation}
                  >
                    <option value="">Select {type}...</option>
                    {previousItems.map(item => {
                      const status = getContinuationStatus(item.id, pageId)
                      const statusIcon = status === 'available' ? '→' : status === 'already_here' ? '↺' : '✓'
                      const statusText = status === 'available' ? 'Available' : status === 'already_here' ? 'Already here' : 'Continues elsewhere'
                      
                      return (
                        <option 
                          key={item.id} 
                          value={item.id}
                          disabled={status === 'already_here'}
                        >
                          {statusIcon} {item.name} {status !== 'available' ? `(${statusText})` : ''}
                        </option>
                      )
                    })}
                  </select>
                  
                  {/* Status Legend */}
                  <div className="mt-2 text-xs text-text-muted space-y-1">
                    <div>→ Available to continue • ✓ Already continues elsewhere • ↺ Already on this page</div>
                    {availableContinuations.length === 0 && (
                      <div className="text-yellow-600">No new continuations available from previous page</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {pageCueNumber && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="usePageCue"
                checked={usePageCue}
                onChange={(e) => setUsePageCue(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="usePageCue" className="text-sm text-text-secondary">
                Use page cue number ({pageCueNumber})
              </label>
            </div>
          )}
          
          {!usePageCue && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                First Cue Number (optional)
              </label>
              <input
                type="text"
                value={firstCueNumber}
                onChange={(e) => setFirstCueNumber(e.target.value)}
                placeholder="e.g., 127"
                className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary focus:outline-none focus:border-modules-cue"
              />
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
              variant="cue"
              className="flex-1"
            >
              Add {type === 'scene' ? 'Scene' : 'Song'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ScriptItemProps {
  page: ScriptPage
}

function ScriptItem({ page }: ScriptItemProps) {
  const { 
    getPageScenes, 
    getPageSongs, 
    updatePage, 
    deletePage,
    addSceneSong,
    validateCueNumber,
    validatePageOrder 
  } = useScriptStore()
  
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState<{ type: 'scene' | 'song' } | null>(null)
  const [cueValidation, setCueValidation] = useState<{ valid: boolean; message?: string } | null>(null)
  const [orderValidation, setOrderValidation] = useState<{ valid: boolean; message?: string } | null>(null)

  // Check validation on mount and when page changes
  useEffect(() => {
    if (page.firstCueNumber) {
      const cueValidation = validateCueNumber(page.firstCueNumber, page.id)
      setCueValidation(cueValidation.valid ? null : cueValidation)
      
      const orderValidation = validatePageOrder(page.id)
      setOrderValidation(orderValidation.valid ? null : orderValidation)
    } else {
      setCueValidation(null)
      setOrderValidation(null)
    }
  }, [page.firstCueNumber, page.id, page.pageNumber, validateCueNumber, validatePageOrder])

  // Re-validate when any page changes (to catch order conflicts resolved by other pages)
  const { getSortedPages } = useScriptStore()
  const allPages = getSortedPages()
  useEffect(() => {
    if (page.firstCueNumber) {
      const orderValidation = validatePageOrder(page.id)
      setOrderValidation(orderValidation.valid ? null : orderValidation)
    }
  }, [allPages, page.firstCueNumber, page.id, validatePageOrder])

  const scenes = getPageScenes(page.id)
  const songs = getPageSongs(page.id)
  
  // Combine and sort all scenes and songs by cue number
  const allItems = [...scenes, ...songs].sort((a, b) => {
    const cueA = a.firstCueNumber ? parseInt(a.firstCueNumber.match(/^(\d+)/)?.[1] || '0') : 0
    const cueB = b.firstCueNumber ? parseInt(b.firstCueNumber.match(/^(\d+)/)?.[1] || '0') : 0
    return cueA - cueB
  })

  const handlePageNumberChange = (value: string) => {
    updatePage(page.id, { pageNumber: value })
    
    // Check page order after update
    setTimeout(() => {
      const orderValidation = validatePageOrder(page.id)
      setOrderValidation(orderValidation.valid ? null : orderValidation)
    }, 0)
  }

  const handleCueNumberChange = (value: string) => {
    const cueValidation = validateCueNumber(value, page.id)
    setCueValidation(cueValidation.valid ? null : cueValidation)
    
    updatePage(page.id, { firstCueNumber: value || undefined })
    
    // Check page order after update
    setTimeout(() => {
      const orderValidation = validatePageOrder(page.id)
      setOrderValidation(orderValidation.valid ? null : orderValidation)
    }, 0)
  }

  const handleDelete = () => {
    deletePage(page.id)
    setShowConfirmDelete(false)
  }

  const handleAddSceneSong = (itemData: { name: string; type: 'scene' | 'song'; firstCueNumber?: string; continuesFromId?: string }) => {
    addSceneSong({
      ...itemData,
      scriptPageId: page.id,
      orderIndex: 0, // Will be sorted automatically
    })
    setShowAddDialog(null)
  }

  return (
    <>
      {/* Page Card */}
      <div className="rounded-lg bg-bg-secondary border border-bg-tertiary shadow-sm">
        {/* Page Header */}
        <div className="flex items-center justify-between p-4 border-b border-bg-tertiary bg-bg-secondary/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-modules-cue" />
              <span className="text-lg font-semibold text-text-primary">Page</span>
              <input
                type="text"
                value={page.pageNumber}
                onChange={(e) => handlePageNumberChange(e.target.value)}
                className="bg-bg-tertiary border border-bg-hover rounded px-3 py-1 text-lg font-bold text-text-primary focus:outline-none focus:border-modules-cue min-w-[80px] cursor-text"
                title="Click to edit page number"
              />
            </div>

            {/* First Cue */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">First Cue:</span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={page.firstCueNumber || ''}
                  onChange={(e) => handleCueNumberChange(e.target.value)}
                  placeholder="None"
                  className={cn(
                    "bg-bg-tertiary border rounded px-2 py-1 text-sm text-text-primary focus:outline-none w-20 cursor-text",
                    (cueValidation || orderValidation) ? "border-yellow-500 focus:border-yellow-500" : "border-bg-hover focus:border-modules-cue"
                  )}
                  title="Click to edit first cue number"
                />
                {(cueValidation || orderValidation) && (
                  <div 
                    className="cursor-help"
                    title={cueValidation?.message || orderValidation?.message}
                  >
                    <AlertTriangle 
                      className="h-4 w-4 text-yellow-500" 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => setShowAddDialog({ type: 'scene' })}
            >
              <Theater className="h-4 w-4 mr-1" />
              Add Scene
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => setShowAddDialog({ type: 'song' })}
            >
              <Music className="h-4 w-4 mr-1" />
              Add Song
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => setShowConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Page Content */}
        {allItems.length > 0 && (
          <div className="p-4">
            <div className="space-y-3">
              {/* Combined Scenes and Songs Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Theater className="h-4 w-4 text-modules-work" />
                  Scenes ({scenes.length})
                  <Music className="h-4 w-4 text-modules-production ml-4" />
                  Songs ({songs.length})
                </h4>
                <div className="space-y-2 pl-6">
                  {allItems.map((item, index) => (
                    <SceneSongItem 
                      key={item.id} 
                      item={item} 
                      isLastItem={index === allItems.length - 1}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-bg-secondary rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Delete Page?</h3>
            <p className="text-text-secondary mb-4">
              Are you sure you want to delete page &quot;{page.pageNumber}&quot;? This will also delete all scenes and songs on this page.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Scene/Song Dialog */}
      {showAddDialog && (
        <AddSceneSongDialog
          isOpen={true}
          onClose={() => setShowAddDialog(null)}
          onAdd={handleAddSceneSong}
          pageId={page.id}
          type={showAddDialog.type}
          pageCueNumber={page.firstCueNumber}
        />
      )}
    </>
  )
}

interface SceneSongItemProps {
  item: SceneSong
  isLastItem?: boolean
}

function SceneSongItem({ item, isLastItem = false }: SceneSongItemProps) {
  const { updateSceneSong, deleteSceneSong, validateCueNumber, validateSceneSongCueNumber, getSortedPages, getContinuationChain, getNextPage, createContinuation, updateContinuationChain } = useScriptStore()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [cueValidation, setCueValidation] = useState<{ valid: boolean; message?: string } | null>(null)
  
  // Get continuation info
  const continuationChain = getContinuationChain(item.id)
  const isContinuation = !!item.continuesFromId
  const isOriginal = continuationChain.length > 1 && continuationChain[0].id === item.id
  
  // Get next page info
  const nextPage = getNextPage(item.scriptPageId)
  const canContinue = nextPage && !isContinuation && isLastItem // Only show on last item, and only for originals

  // Validate on mount and when item changes
  useEffect(() => {
    if (item.firstCueNumber) {
      const validation = validateSceneSongCueNumber(item.firstCueNumber, item.scriptPageId, item.id)
      setCueValidation(validation.valid ? null : validation)
    } else {
      setCueValidation(null)
    }
  }, [item.firstCueNumber, item.scriptPageId, item.id, validateSceneSongCueNumber])

  // Re-validate when any page changes (to catch boundary conflicts resolved by other pages)
  const allPages = getSortedPages()
  useEffect(() => {
    if (item.firstCueNumber) {
      const validation = validateSceneSongCueNumber(item.firstCueNumber, item.scriptPageId, item.id)
      setCueValidation(validation.valid ? null : validation)
    }
  }, [allPages, item.firstCueNumber, item.scriptPageId, item.id, validateSceneSongCueNumber])

  const handleNameChange = (value: string) => {
    // Use updateContinuationChain to sync name changes across all continuations
    updateContinuationChain(item.id, { name: value })
  }

  const handleCueNumberChange = (value: string) => {
    // Use the new scene/song specific validation instead of general cue validation
    const validation = validateSceneSongCueNumber(value, item.scriptPageId, item.id)
    setCueValidation(validation.valid ? null : validation)
    updateSceneSong(item.id, { firstCueNumber: value || undefined })
  }

  const handleDelete = () => {
    deleteSceneSong(item.id)
    setShowConfirmDelete(false)
  }

  const handleContinueToNext = () => {
    if (!nextPage) return
    
    try {
      // Use the next page's first cue number as default
      createContinuation(item.id, nextPage.id, nextPage.firstCueNumber)
    } catch (error) {
      console.error('Failed to create continuation:', error)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 py-2 px-3 rounded bg-bg-tertiary/50 border border-bg-hover/30">
        {/* Name with continuation indicators */}
        <div className="flex items-center gap-2 flex-1">
          {isContinuation && (
            <span className="text-xs text-modules-production font-mono" title="Continued from previous page">
              ← 
            </span>
          )}
          <input
            type="text"
            value={item.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={cn(
              "border rounded px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-modules-cue flex-1 cursor-text",
              isContinuation 
                ? "bg-modules-production/10 border-modules-production/30" 
                : "bg-bg-tertiary border-bg-hover"
            )}
            title={isContinuation ? "Continued from previous page" : "Click to edit name"}
          />
          {isOriginal && continuationChain.length > 1 && (
            <span className="text-xs text-modules-production font-mono" title={`Continues for ${continuationChain.length} pages`}>
              → ({continuationChain.length})
            </span>
          )}
        </div>

        {/* First Cue */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Cue:</span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={item.firstCueNumber || ''}
              onChange={(e) => handleCueNumberChange(e.target.value)}
              placeholder="None"
              className={cn(
                "bg-bg-tertiary border rounded px-2 py-1 text-sm text-text-primary focus:outline-none w-16 cursor-text",
                cueValidation ? "border-yellow-500 focus:border-yellow-500" : "border-bg-hover focus:border-modules-cue"
              )}
              title="Click to edit cue number"
            />
            {cueValidation && (
              <div 
                className="cursor-help"
                title={cueValidation.message}
              >
                <AlertTriangle 
                  className="h-3 w-3 text-yellow-500" 
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canContinue && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleContinueToNext}
              className="h-7 px-2 border-modules-cue text-modules-cue hover:bg-modules-cue hover:text-white"
              title={`Continue to page ${nextPage?.pageNumber}`}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              <span className="text-xs font-medium">Continue</span>
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowConfirmDelete(true)}
            className="h-7 w-7 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-bg-secondary rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Delete {item.type}?</h3>
            <p className="text-text-secondary mb-4">
            Are you sure you want to delete {item.type} &quot;{item.name}&quot;?
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function ManageScriptPage() {
  const { getSortedPages, addPage } = useScriptStore()
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  const pages = getSortedPages()

  const handleAddPage = (pageData: { pageNumber: string; firstCueNumber?: string }) => {
    addPage({
      productionId: 'prod-1', // TODO: Get from production store
      ...pageData,
    })
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-bg-primary border-b border-bg-tertiary pb-4 mb-6 pt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-text-primary">Script Setup</h1>
              <Button onClick={() => setShowAddDialog(true)} variant="cue">
                <Plus className="h-5 w-5" />
                Add Page
              </Button>
            </div>
            <p className="text-text-secondary">
              Configure your script structure with pages and their scenes/songs to enable automatic cue lookup
            </p>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="rounded-lg bg-bg-secondary border border-bg-tertiary">
            <div className="p-6 border-b border-bg-tertiary">
              <h2 className="text-lg font-semibold text-text-primary">Script Structure</h2>
              <p className="text-sm text-text-secondary mt-1">
                Organize your script with hierarchical pages, scenes, and songs
              </p>
            </div>
            
            <div className="p-6">
              {pages.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary">No script pages configured</p>
                  <p className="text-text-muted text-sm mt-1">Add your first page to get started</p>
                  <Button 
                    onClick={() => setShowAddDialog(true)} 
                    variant="cue" 
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Page
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pages.map(page => (
                    <ScriptItem key={page.id} page={page} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddPageDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddPage}
      />
    </DashboardLayout>
  )
}
