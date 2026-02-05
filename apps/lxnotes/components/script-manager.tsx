'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useScriptStore } from '@/lib/stores/script-store'
import { createSupabaseStorageAdapter } from '@/lib/supabase/supabase-storage-adapter'
import { useAuthContext } from '@/components/auth/auth-provider'
import { Plus, FileText, Theater, Music, Trash2, AlertTriangle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScriptPage, SceneSong } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface ScriptManagerProps {
  isOpen: boolean
  onClose: () => void
  productionId: string
}

interface ScriptItemProps {
  page: ScriptPage
  productionId: string
  isDemoMode: boolean
  onPersist: () => Promise<void>
}

function ScriptItem({ page, productionId, isDemoMode, onPersist }: ScriptItemProps) {
  const {
    getPageScenes,
    getPageSongs,
    updatePage,
    deletePage,
    addSceneSong,
    validateCueNumber,
    validatePageOrder,
    getPreviousPageScenes,
    getPreviousPageSongs,
    getContinuationStatus,
    getSuggestedContinuation
  } = useScriptStore()

  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [cueValidation, setCueValidation] = useState<{ valid: boolean; message?: string } | null>(null)
  const [orderValidation, setOrderValidation] = useState<{ valid: boolean; message?: string } | null>(null)

  // Inline form state for Add Scene/Song
  const [addingType, setAddingType] = useState<'scene' | 'song' | null>(null)
  const [newName, setNewName] = useState('')
  const [newFirstCueNumber, setNewFirstCueNumber] = useState('')
  const [usePageCue, setUsePageCue] = useState(false)
  const [isContinuation, setIsContinuation] = useState(false)
  const [continuesFromId, setContinuesFromId] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

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

  const handlePageNumberChange = async (value: string) => {
    updatePage(page.id, { pageNumber: value })

    // Check page order after update
    setTimeout(() => {
      const orderValidation = validatePageOrder(page.id)
      setOrderValidation(orderValidation.valid ? null : orderValidation)
    }, 0)

    // Persist to Supabase
    await onPersist()
  }

  const handleCueNumberChange = async (value: string) => {
    const cueValidation = validateCueNumber(value, page.id)
    setCueValidation(cueValidation.valid ? null : cueValidation)

    updatePage(page.id, { firstCueNumber: value || undefined })

    // Check page order after update
    setTimeout(() => {
      const orderValidation = validatePageOrder(page.id)
      setOrderValidation(orderValidation.valid ? null : orderValidation)
    }, 0)

    // Persist to Supabase
    await onPersist()
  }

  const handleDelete = async () => {
    deletePage(page.id)
    setShowConfirmDelete(false)

    // Persist to Supabase
    await onPersist()
  }

  // Get continuation options for inline form
  const previousScenes = getPreviousPageScenes(page.id)
  const previousSongs = getPreviousPageSongs(page.id)
  const previousItems = addingType === 'scene' ? previousScenes : previousSongs

  // Inline form handlers
  const openAddForm = (type: 'scene' | 'song') => {
    setAddingType(type)
    setNewName('')
    setNewFirstCueNumber('')
    setUsePageCue(false)
    setIsContinuation(false)
    setContinuesFromId('')

    // Apply smart defaults for continuation
    const suggested = getSuggestedContinuation(page.id, type)
    if (suggested) {
      setIsContinuation(true)
      setContinuesFromId(suggested.id)
      setNewName(suggested.name)
    }

    setTimeout(() => nameInputRef.current?.focus(), 0)
  }

  const handleCancelAdd = () => {
    setAddingType(null)
    setNewName('')
    setNewFirstCueNumber('')
    setUsePageCue(false)
    setIsContinuation(false)
    setContinuesFromId('')
  }

  const handleInlineFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleInlineAdd()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelAdd()
    }
  }

  const handleInlineAdd = async () => {
    if (!addingType || !newName.trim()) return

    const cueNumber = usePageCue ? page.firstCueNumber : newFirstCueNumber.trim()

    addSceneSong({
      name: newName.trim(),
      type: addingType,
      firstCueNumber: cueNumber || undefined,
      continuesFromId: isContinuation ? continuesFromId || undefined : undefined,
      productionId,
      moduleType: 'cue',
      scriptPageId: page.id,
      orderIndex: 0,
    })

    handleCancelAdd()
    await onPersist()
  }

  const handleContinuationChange = (selectedId: string) => {
    setContinuesFromId(selectedId)
    const items = addingType === 'scene' ? previousScenes : previousSongs
    const selectedItem = items.find(item => item.id === selectedId)
    if (selectedItem) {
      setNewName(selectedItem.name)
    }
  }

  return (
    <>
      {/* Page Card */}
      <div className="rounded-lg bg-bg-secondary border border-bg-tertiary shadow-sm">
        {/* Page Header */}
        <div className="flex items-center justify-between p-4 border-b border-bg-tertiary bg-bg-secondary/50">
          <div className="flex items-center gap-compact-3">
            <div className="flex items-center gap-compact-2">
              <FileText className="h-5 w-5 text-modules-cue" />
              <span className="text-sm font-semibold text-text-primary">Page</span>
              <input
                type="text"
                value={page.pageNumber}
                onChange={(e) => handlePageNumberChange(e.target.value)}
                className="h-compact-7 bg-bg-tertiary border border-bg-hover rounded px-compact-3 text-sm font-semibold text-text-primary focus:outline-none focus:border-modules-cue min-w-[80px] cursor-text"
                title="Click to edit page number"
              />
            </div>

            {/* First Cue */}
            <div className="flex items-center gap-compact-2">
              <span className="text-sm text-text-secondary">First Cue:</span>
              <div className="flex items-center gap-compact-1">
                <input
                  type="text"
                  value={page.firstCueNumber || ''}
                  onChange={(e) => handleCueNumberChange(e.target.value)}
                  placeholder="None"
                  className={cn(
                    "h-compact-7 bg-bg-tertiary border rounded px-compact-2 text-sm text-text-primary focus:outline-none w-20 cursor-text",
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
          <div className="flex items-center gap-compact-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openAddForm('scene')}
              disabled={addingType !== null}
            >
              <Theater className="h-4 w-4 mr-1" />
              Add Scene
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openAddForm('song')}
              disabled={addingType !== null}
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

        {/* Inline Add Scene/Song Form */}
        {addingType && (
          <div className="p-4 border-b border-bg-tertiary bg-bg-tertiary/50">
            <div className="space-y-3">
              {/* Row 1: Name + Cue */}
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    {addingType === 'scene' ? 'Scene' : 'Song'} Name <span className="text-modules-cue">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleInlineFormKeyDown}
                    placeholder={addingType === 'scene' ? 'e.g., Act 1, Scene 1' : 'e.g., Opening Number'}
                    disabled={isContinuation}
                    className="w-full h-9 rounded-lg bg-bg-secondary border border-bg-hover px-3 text-sm text-text-primary focus:outline-none focus:border-modules-cue disabled:opacity-50"
                  />
                </div>
                {!usePageCue && (
                  <div className="w-24">
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      First Cue
                    </label>
                    <input
                      type="text"
                      value={newFirstCueNumber}
                      onChange={(e) => setNewFirstCueNumber(e.target.value)}
                      onKeyDown={handleInlineFormKeyDown}
                      placeholder="e.g., 127"
                      className="w-full h-9 rounded-lg bg-bg-secondary border border-bg-hover px-3 text-sm text-text-primary focus:outline-none focus:border-modules-cue"
                    />
                  </div>
                )}
              </div>

              {/* Row 2: Options (continuation + use page cue) */}
              <div className="flex items-center gap-4 text-sm">
                {previousItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`continuation-${page.id}`}
                      checked={isContinuation}
                      onChange={(e) => {
                        setIsContinuation(e.target.checked)
                        if (!e.target.checked) {
                          setContinuesFromId('')
                          setNewName('')
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={`continuation-${page.id}`} className="text-text-secondary">
                      Continue from previous
                    </label>
                    {isContinuation && (
                      <select
                        value={continuesFromId}
                        onChange={(e) => handleContinuationChange(e.target.value)}
                        className="h-7 rounded bg-bg-secondary border border-bg-hover px-2 text-xs text-text-primary focus:outline-none focus:border-modules-cue"
                      >
                        <option value="">Select...</option>
                        {previousItems.map(item => {
                          const status = getContinuationStatus(item.id, page.id)
                          return (
                            <option key={item.id} value={item.id} disabled={status === 'already_here'}>
                              {item.name}
                            </option>
                          )
                        })}
                      </select>
                    )}
                  </div>
                )}
                {page.firstCueNumber && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`usePageCue-${page.id}`}
                      checked={usePageCue}
                      onChange={(e) => setUsePageCue(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor={`usePageCue-${page.id}`} className="text-text-secondary">
                      Same as page ({page.firstCueNumber})
                    </label>
                  </div>
                )}
              </div>

              {/* Row 3: Actions */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-text-muted">
                  <kbd className="px-1 py-0.5 rounded bg-bg-secondary">Enter</kbd> to add, <kbd className="px-1 py-0.5 rounded bg-bg-secondary">Esc</kbd> to cancel
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={handleCancelAdd}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="cue" onClick={handleInlineAdd} disabled={!newName.trim()}>
                    <Plus className="h-4 w-4" />
                    Add {addingType === 'scene' ? 'Scene' : 'Song'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                      onPersist={onPersist}
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

    </>
  )
}

interface SceneSongItemProps {
  item: SceneSong
  isLastItem?: boolean
  onPersist: () => Promise<void>
}

function SceneSongItem({ item, isLastItem = false, onPersist }: SceneSongItemProps) {
  const { updateSceneSong, deleteSceneSong, validateCueNumber, validateSceneSongCueNumber, getSortedPages, getContinuationChain, getNextPage, createContinuation, updateContinuationChain } = useScriptStore()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [cueValidation, setCueValidation] = useState<{ valid: boolean; message?: string } | null>(null)

  // Get the page this item belongs to
  const pages = getSortedPages()
  const page = pages.find(p => p.id === item.scriptPageId)

  // Check if this item uses the page's cue number
  const usesPageCue = !!(page?.firstCueNumber &&
    item.firstCueNumber &&
    item.firstCueNumber === page.firstCueNumber)

  // Get continuation info
  const continuationChain = getContinuationChain(item.id)
  const isContinuation = !!item.continuesFromId
  const isOriginal = continuationChain.length > 1 && continuationChain[0].id === item.id

  // Get next page info
  const nextPage = getNextPage(item.scriptPageId)

  // Allow continuing if this is the LAST item in its chain (enables multi-page continuation)
  // Chain always includes the item itself, so last item = chain[chain.length-1]
  const isEndOfChain = continuationChain.length > 0 &&
    continuationChain[continuationChain.length - 1].id === item.id
  const canContinue = nextPage && isEndOfChain && isLastItem

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

  const handleNameChange = async (value: string) => {
    // Use updateContinuationChain to sync name changes across all continuations
    updateContinuationChain(item.id, { name: value })

    // Persist to Supabase
    await onPersist()
  }

  const handleCueNumberChange = async (value: string) => {
    // Use the new scene/song specific validation instead of general cue validation
    const validation = validateSceneSongCueNumber(value, item.scriptPageId, item.id)
    setCueValidation(validation.valid ? null : validation)
    updateSceneSong(item.id, { firstCueNumber: value || undefined })

    // Persist to Supabase
    await onPersist()
  }

  const handleDelete = async () => {
    deleteSceneSong(item.id)
    setShowConfirmDelete(false)

    // Persist to Supabase
    await onPersist()
  }

  const handleContinueToNext = async () => {
    if (!nextPage) return

    try {
      // Use the next page's first cue number as default
      createContinuation(item.id, nextPage.id, nextPage.firstCueNumber)

      // Persist to Supabase
      await onPersist()
    } catch (error) {
      console.error('Failed to create continuation:', error)
    }
  }

  return (
    <>
      <div className="flex items-center gap-compact-3 py-compact-2 px-compact-3 rounded bg-bg-tertiary/50 border border-bg-hover/30">
        {/* Name with continuation indicators */}
        <div className="flex items-center gap-compact-2 flex-1">
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
              "h-compact-7 border rounded px-compact-2 text-sm text-text-primary focus:outline-none focus:border-modules-cue flex-1 cursor-text",
              isContinuation
                ? "bg-modules-production/10 border-modules-production/30"
                : "bg-bg-tertiary border-bg-hover"
            )}
            title={isContinuation ? "Continued from previous page" : "Click to edit name"}
          />
          {isOriginal && continuationChain.length > 1 && (
            <span
              className="text-xs text-modules-cue/70 font-medium"
              title={`This ${item.type} spans ${continuationChain.length} pages`}
            >
              ({continuationChain.length} pages)
            </span>
          )}
        </div>

        {/* First Cue */}
        <div className="flex items-center gap-compact-2">
          <span className="text-xs text-text-secondary">Cue:</span>
          <div className="flex items-center gap-compact-1">
            {usesPageCue && (
              <span
                className="text-xs text-modules-cue font-mono"
                title="Same as page first cue"
              >
                =
              </span>
            )}
            <input
              type="text"
              value={item.firstCueNumber || ''}
              onChange={(e) => handleCueNumberChange(e.target.value)}
              placeholder="None"
              className={cn(
                "h-compact-7 border rounded px-compact-2 text-sm text-text-primary focus:outline-none w-16 cursor-text",
                cueValidation
                  ? "border-yellow-500 focus:border-yellow-500 bg-bg-tertiary"
                  : usesPageCue
                    ? "bg-modules-cue/10 border-modules-cue/30 focus:border-modules-cue"
                    : "bg-bg-tertiary border-bg-hover focus:border-modules-cue"
              )}
              title={usesPageCue ? "Same as page first cue" : "Click to edit cue number"}
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
        <div className="flex items-center gap-compact-2">
          {canContinue && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleContinueToNext}
              className="h-7 px-3 border-modules-cue/50 text-modules-cue hover:bg-modules-cue hover:text-white hover:border-modules-cue"
              title={`Continue "${item.name}" to page ${nextPage?.pageNumber}`}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              <span className="text-xs font-medium">Page {nextPage?.pageNumber}</span>
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

export function ScriptManager({ isOpen, onClose, productionId }: ScriptManagerProps) {
  const pathname = usePathname()
  const isDemoMode = pathname.startsWith('/demo')
  const { isAuthenticated } = useAuthContext()
  const { getSortedPages, addPage, scenes, songs, setScriptData } = useScriptStore()

  // Inline form state
  const [isAddingPage, setIsAddingPage] = useState(false)
  const [newPageNumber, setNewPageNumber] = useState('')
  const [newFirstCueNumber, setNewFirstCueNumber] = useState('')
  const pageNumberInputRef = useRef<HTMLInputElement>(null)

  const pages = getSortedPages()

  // Fetch fresh script data from Supabase when sidebar opens
  useEffect(() => {
    if (!isOpen || isDemoMode || !isAuthenticated || !productionId || productionId === 'demo-production') {
      return
    }

    const fetchScriptData = async () => {
      try {
        const adapter = createSupabaseStorageAdapter(productionId)
        const [pages, scenesSongs] = await Promise.all([
          adapter.script.getPages(),
          adapter.script.getScenesSongs(),
        ])

        const fetchedScenes = scenesSongs.filter(s => s.type === 'scene')
        const fetchedSongs = scenesSongs.filter(s => s.type === 'song')
        setScriptData(pages, fetchedScenes, fetchedSongs)
      } catch (error) {
        console.error('[ScriptManager] Failed to fetch script data:', error)
      }
    }

    fetchScriptData()
  }, [isOpen, isDemoMode, isAuthenticated, productionId, setScriptData])

  // Persist all script data to Supabase
  const persistToSupabase = useCallback(async () => {
    // Skip if demo mode OR if we don't have a real production ID
    if (isDemoMode || !productionId || productionId === 'demo-production') {
      console.log('[ScriptManager] Skipping Supabase persist:', { isDemoMode, productionId })
      return
    }

    // Skip if not authenticated (avoids 401 errors)
    if (!isAuthenticated) {
      console.log('[ScriptManager] Skipping Supabase persist: User not authenticated')
      return
    }

    try {
      const adapter = createSupabaseStorageAdapter(productionId)
      const currentPages = getSortedPages()
      const allScenesSongs = [...scenes, ...songs]

      console.log('[ScriptManager] Persisting to Supabase:', { productionId, pagesCount: currentPages.length, scenesSongsCount: allScenesSongs.length })

      // Run sequentially to identify which operation fails
      await adapter.script.setPages(currentPages)
      console.log('[ScriptManager] Pages persisted successfully')

      await adapter.script.setScenesSongs(allScenesSongs)
      console.log('[ScriptManager] Scenes/Songs persisted successfully')
    } catch (error: unknown) {
      // Try multiple ways to get error info
      console.error('[ScriptManager] Failed to persist script data to Supabase:')
      console.error('  Type:', typeof error)
      console.error('  Constructor:', error?.constructor?.name)
      console.error('  String:', String(error))
      console.error('  JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error as object)))
      if (error instanceof Error) {
        console.error('  Error.message:', error.message)
        console.error('  Error.stack:', error.stack)
      }
      console.dir(error, { depth: 5 })
    }
  }, [isDemoMode, productionId, isAuthenticated, getSortedPages, scenes, songs])

  // Inline form handlers
  const handleInlineFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleInlineAddPage()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelAddPage()
    }
  }

  const handleInlineAddPage = async () => {
    if (!newPageNumber.trim()) return

    addPage({
      productionId,
      pageNumber: newPageNumber.trim(),
      firstCueNumber: newFirstCueNumber.trim() || undefined,
    })

    setNewPageNumber('')
    setNewFirstCueNumber('')
    setIsAddingPage(false)
    await persistToSupabase()
  }

  const handleCancelAddPage = () => {
    setNewPageNumber('')
    setNewFirstCueNumber('')
    setIsAddingPage(false)
  }

  const openAddPageForm = () => {
    setIsAddingPage(true)
    setTimeout(() => pageNumberInputRef.current?.focus(), 0)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl max-w-none flex flex-col">
        <SheetHeader className="pb-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-modules-cue" />
            <SheetTitle>Script Setup</SheetTitle>
          </div>
          <SheetDescription>
            Configure your script structure with pages and their scenes/songs to enable automatic cue lookup
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Script Structure</h2>
              <p className="text-sm text-text-secondary mt-1">
                Organize your script with hierarchical pages, scenes, and songs
              </p>
            </div>
            <Button
              onClick={openAddPageForm}
              variant="cue"
              disabled={isAddingPage}
            >
              <Plus className="h-5 w-5" />
              Add Page
            </Button>
          </div>

          {/* Inline Add Page Form */}
          {isAddingPage && (
            <div className="mb-4 p-3 rounded-lg bg-bg-tertiary border border-modules-cue/30">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Page Number <span className="text-modules-cue">*</span>
                  </label>
                  <input
                    ref={pageNumberInputRef}
                    type="text"
                    value={newPageNumber}
                    onChange={(e) => setNewPageNumber(e.target.value)}
                    onKeyDown={handleInlineFormKeyDown}
                    placeholder="e.g., 1, 23a, 59-60"
                    className="w-full h-9 rounded-lg bg-bg-secondary border border-bg-hover px-3 text-sm text-text-primary focus:outline-none focus:border-modules-cue"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    First Cue (optional)
                  </label>
                  <input
                    type="text"
                    value={newFirstCueNumber}
                    onChange={(e) => setNewFirstCueNumber(e.target.value)}
                    onKeyDown={handleInlineFormKeyDown}
                    placeholder="e.g., 127"
                    className="w-full h-9 rounded-lg bg-bg-secondary border border-bg-hover px-3 text-sm text-text-primary focus:outline-none focus:border-modules-cue"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Button size="sm" variant="cue" onClick={handleInlineAddPage} disabled={!newPageNumber.trim()}>
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleCancelAddPage}>
                    Cancel
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-xs text-text-muted">
                Press <kbd className="px-1 py-0.5 rounded bg-bg-secondary">Enter</kbd> to add, <kbd className="px-1 py-0.5 rounded bg-bg-secondary">Esc</kbd> to cancel
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pb-4">
            {pages.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary">No script pages configured</p>
                <p className="text-text-muted text-sm mt-1">Add your first page to get started</p>
                <Button
                  onClick={openAddPageForm}
                  variant="cue"
                  className="mt-4"
                  disabled={isAddingPage}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Page
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {pages.map(page => (
                  <ScriptItem
                    key={page.id}
                    page={page}
                    productionId={productionId}
                    isDemoMode={isDemoMode}
                    onPersist={persistToSupabase}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
