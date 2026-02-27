'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useScriptStore } from '@/lib/stores/script-store'
import { createSupabaseStorageAdapter } from '@/lib/supabase/supabase-storage-adapter'
import { useAuthContext } from '@/components/auth/auth-provider'
import { Plus, FileText, Theater, Music, Trash2, AlertTriangle, ArrowRight, Upload, Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScriptPage, SceneSong } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScriptImportWizard } from '@/components/script-import-wizard'

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

function ScriptItem({ page, productionId, onPersist }: ScriptItemProps) {
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

  // Edit mode state for page header
  const [isEditingPage, setIsEditingPage] = useState(false)
  const [editPageNumber, setEditPageNumber] = useState(page.pageNumber)
  const [editFirstCue, setEditFirstCue] = useState(page.firstCueNumber || '')
  const editPageNumberRef = useRef<HTMLInputElement>(null)

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

  // Combine and sort all scenes and songs by cue number, with orderIndex as tiebreaker
  const allItems = [...scenes, ...songs].sort((a, b) => {
    const cueA = a.firstCueNumber ? parseInt(a.firstCueNumber.match(/^(\d+)/)?.[1] || '0') : 0
    const cueB = b.firstCueNumber ? parseInt(b.firstCueNumber.match(/^(\d+)/)?.[1] || '0') : 0
    return cueA - cueB || a.orderIndex - b.orderIndex
  })

  // Page edit handlers
  const openPageEdit = () => {
    setEditPageNumber(page.pageNumber)
    setEditFirstCue(page.firstCueNumber || '')
    setIsEditingPage(true)
    setTimeout(() => editPageNumberRef.current?.focus(), 0)
  }

  const handleSavePage = async () => {
    if (!editPageNumber.trim()) return

    updatePage(page.id, {
      pageNumber: editPageNumber.trim(),
      firstCueNumber: editFirstCue.trim() || undefined,
    })

    // Validate after update
    if (editFirstCue.trim()) {
      const cueVal = validateCueNumber(editFirstCue.trim(), page.id)
      setCueValidation(cueVal.valid ? null : cueVal)
    } else {
      setCueValidation(null)
    }

    setTimeout(() => {
      const orderVal = validatePageOrder(page.id)
      setOrderValidation(orderVal.valid ? null : orderVal)
    }, 0)

    setIsEditingPage(false)
    await onPersist()
  }

  const handleCancelPageEdit = () => {
    setEditPageNumber(page.pageNumber)
    setEditFirstCue(page.firstCueNumber || '')
    setIsEditingPage(false)
  }

  const handlePageEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSavePage()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelPageEdit()
    }
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
      <div className="rounded-lg bg-bg-secondary border border-bg-tertiary shadow-xs">
        {/* Page Header */}
        <div className="flex items-center justify-between p-4 border-b border-bg-tertiary bg-bg-secondary/50">
          {isEditingPage ? (
            /* Edit Mode */
            <div className="flex items-center gap-compact-3 flex-1">
              <div className="flex items-center gap-compact-2">
                <FileText className="h-5 w-5 text-modules-cue" />
                <span className="text-sm font-semibold text-text-primary">Page</span>
                <input
                  ref={editPageNumberRef}
                  type="text"
                  value={editPageNumber}
                  onChange={(e) => setEditPageNumber(e.target.value)}
                  onKeyDown={handlePageEditKeyDown}
                  className="h-compact-7 bg-bg-tertiary border border-modules-cue rounded px-compact-3 text-sm font-semibold text-text-primary focus:outline-hidden focus:border-modules-cue min-w-[80px]"
                  placeholder="Page #"
                />
              </div>

              <div className="flex items-center gap-compact-2">
                <span className="text-sm text-text-secondary">First Cue:</span>
                <input
                  type="text"
                  value={editFirstCue}
                  onChange={(e) => setEditFirstCue(e.target.value)}
                  onKeyDown={handlePageEditKeyDown}
                  placeholder="None"
                  className="h-compact-7 bg-bg-tertiary border border-modules-cue rounded px-compact-2 text-sm text-text-primary focus:outline-hidden focus:border-modules-cue w-20"
                />
              </div>

              <div className="flex items-center gap-compact-1">
                <Button
                  size="sm"
                  variant="cue"
                  onClick={handleSavePage}
                  disabled={!editPageNumber.trim()}
                  className="h-7 px-2"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelPageEdit}
                  className="h-7 px-2"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <div
              className="flex items-center gap-compact-3 cursor-pointer group"
              onDoubleClick={openPageEdit}
              title="Double-click to edit"
            >
              <div className="flex items-center gap-compact-2">
                <FileText className="h-5 w-5 text-modules-cue" />
                <span className="text-sm font-semibold text-text-primary">Page</span>
                <span className="text-sm font-semibold text-text-primary px-compact-3 py-compact-1 rounded bg-bg-tertiary border border-bg-hover group-hover:border-modules-cue/50 transition-colors">
                  {page.pageNumber}
                </span>
              </div>

              {/* First Cue */}
              <div className="flex items-center gap-compact-2">
                <span className="text-sm text-text-secondary">First Cue:</span>
                <div className="flex items-center gap-compact-1">
                  <span className={cn(
                    "text-sm px-compact-2 py-compact-1 rounded border transition-colors",
                    page.firstCueNumber
                      ? "text-text-primary bg-bg-tertiary border-bg-hover group-hover:border-modules-cue/50"
                      : "text-text-muted bg-bg-tertiary border-bg-hover"
                  )}>
                    {page.firstCueNumber || 'None'}
                  </span>
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

              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  openPageEdit()
                }}
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Edit page"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

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
                    className="w-full h-9 rounded-lg bg-bg-secondary border border-bg-hover px-3 text-sm text-text-primary focus:outline-hidden focus:border-modules-cue disabled:opacity-50"
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
                      className="w-full h-9 rounded-lg bg-bg-secondary border border-bg-hover px-3 text-sm text-text-primary focus:outline-hidden focus:border-modules-cue"
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
                        className="h-7 rounded bg-bg-secondary border border-bg-hover px-2 text-xs text-text-primary focus:outline-hidden focus:border-modules-cue"
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
          <div className="px-3 pb-3 pt-2">
            <div className="border-l-2 border-bg-hover/50 pl-4 space-y-1.5">
              {allItems.map((item, index) => (
                <SceneSongItem
                  key={item.id}
                  item={item}
                  onPersist={onPersist}
                />
              ))}
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
  onPersist: () => Promise<void>
}

function SceneSongItem({ item, onPersist }: SceneSongItemProps) {
  const { updateSceneSong, deleteSceneSong, validateSceneSongCueNumber, getSortedPages, getContinuationChain, getNextPage, createContinuation, updateContinuationChain } = useScriptStore()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [cueValidation, setCueValidation] = useState<{ valid: boolean; message?: string } | null>(null)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editCueNumber, setEditCueNumber] = useState(item.firstCueNumber || '')
  const editNameRef = useRef<HTMLInputElement>(null)

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
  const canContinue = nextPage && isEndOfChain

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

  // Edit mode handlers
  const openEdit = () => {
    setEditName(item.name)
    setEditCueNumber(item.firstCueNumber || '')
    setIsEditing(true)
    setTimeout(() => editNameRef.current?.focus(), 0)
  }

  const handleSave = async () => {
    if (!editName.trim()) return

    // Update name (syncs across continuation chain)
    if (editName.trim() !== item.name) {
      updateContinuationChain(item.id, { name: editName.trim() })
    }

    // Update cue number
    const newCue = editCueNumber.trim() || undefined
    if (newCue !== item.firstCueNumber) {
      const validation = validateSceneSongCueNumber(editCueNumber.trim(), item.scriptPageId, item.id)
      setCueValidation(validation.valid ? null : validation)
      updateSceneSong(item.id, { firstCueNumber: newCue })
    }

    setIsEditing(false)
    await onPersist()
  }

  const handleCancelEdit = () => {
    setEditName(item.name)
    setEditCueNumber(item.firstCueNumber || '')
    setIsEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
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
      {isEditing ? (
        /* Edit Mode - inline form */
        <div className={cn(
          "rounded border p-3",
          item.type === 'scene'
            ? "bg-modules-work/10 border-modules-work/25"
            : "bg-modules-production/10 border-modules-production/25"
        )}>
          <div className="flex items-start gap-3">
            {/* Type icon */}
            {item.type === 'scene' ? (
              <Theater className="h-3.5 w-3.5 shrink-0 mt-2 text-modules-work" />
            ) : (
              <Music className="h-3.5 w-3.5 shrink-0 mt-2 text-modules-production" />
            )}

            {/* Name input */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1">
                {item.type === 'scene' ? 'Scene' : 'Song'} Name
              </label>
              <input
                ref={editNameRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full h-9 rounded-lg bg-bg-secondary border border-bg-hover px-3 text-sm text-text-primary focus:outline-hidden focus:border-modules-cue"
              />
            </div>

            {/* Cue input */}
            <div className="w-24">
              <label className="block text-xs font-medium text-text-secondary mb-1">
                First Cue
              </label>
              <input
                type="text"
                value={editCueNumber}
                onChange={(e) => setEditCueNumber(e.target.value)}
                onKeyDown={handleEditKeyDown}
                placeholder="None"
                className="w-full h-9 rounded-lg bg-bg-secondary border border-bg-hover px-3 text-sm text-text-primary focus:outline-hidden focus:border-modules-cue"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-compact-1 pt-5">
              <Button
                size="sm"
                variant="cue"
                onClick={handleSave}
                disabled={!editName.trim()}
                className="h-7 px-2"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                className="h-7 px-2"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-text-muted pl-6">
            <kbd className="px-1 py-0.5 rounded bg-bg-secondary">Enter</kbd> to save, <kbd className="px-1 py-0.5 rounded bg-bg-secondary">Esc</kbd> to cancel
          </div>
        </div>
      ) : (
        /* Display Mode */
        <div
          className={cn(
            "flex items-center gap-compact-3 py-compact-2 px-compact-3 rounded border cursor-pointer group",
            isContinuation
              ? "bg-bg-tertiary/30 border-bg-hover/20"
              : item.type === 'scene'
                ? "bg-modules-work/10 border-modules-work/25"
                : "bg-modules-production/10 border-modules-production/25"
          )}
          onDoubleClick={openEdit}
          title="Double-click to edit"
        >
          {/* Type icon */}
          {item.type === 'scene' ? (
            <Theater className={cn("h-3.5 w-3.5 shrink-0", isContinuation ? "text-text-tertiary" : "text-modules-work")} />
          ) : (
            <Music className={cn("h-3.5 w-3.5 shrink-0", isContinuation ? "text-text-tertiary" : "text-modules-production")} />
          )}

          {/* Name with continuation indicators */}
          <div className="flex items-center gap-compact-2 flex-1">
            {isContinuation && (
              <span className="text-xs text-text-tertiary font-mono" title="Continued from previous page">
                ←
              </span>
            )}
            <span className={cn(
              "text-sm",
              isContinuation ? "text-text-secondary" : "text-text-primary"
            )}>
              {item.name}
            </span>
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
              <span className={cn(
                "text-sm",
                item.firstCueNumber ? "text-text-primary" : "text-text-muted"
              )}>
                {item.firstCueNumber || 'None'}
              </span>
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
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                openEdit()
              }}
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            {canContinue && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  handleContinueToNext()
                }}
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
              onClick={(e) => {
                e.stopPropagation()
                setShowConfirmDelete(true)
              }}
              className="h-7 w-7 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

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
  const { getSortedPages, addPage, setScriptData } = useScriptStore()

  // Import wizard state
  const [isImportOpen, setIsImportOpen] = useState(false)

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
      // Read fresh from store to avoid stale closure (same pattern as handleImportComplete)
      const { scenes: currentScenes, songs: currentSongs } = useScriptStore.getState()
      const allScenesSongs = [...currentScenes, ...currentSongs]

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
  }, [isDemoMode, productionId, isAuthenticated, getSortedPages])

  // Import completion handler — persists directly with imported data to avoid stale closure
  const handleImportComplete = useCallback(async (importedPages: ScriptPage[], importedScenes: SceneSong[], importedSongs: SceneSong[]) => {
    setScriptData(importedPages, importedScenes, importedSongs)

    if (isDemoMode || !productionId || productionId === 'demo-production' || !isAuthenticated) {
      return
    }

    try {
      const adapter = createSupabaseStorageAdapter(productionId)
      const allScenesSongs = [...importedScenes, ...importedSongs]
      await adapter.script.setPages(importedPages)
      await adapter.script.setScenesSongs(allScenesSongs)
    } catch (error) {
      console.error('[ScriptManager] Failed to persist imported script data:', error)
    }
  }, [setScriptData, isDemoMode, productionId, isAuthenticated])

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
        <SheetHeader className="pb-6 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-modules-cue" />
            <SheetTitle>Script Setup</SheetTitle>
          </div>
          <SheetDescription>
            Configure your script structure with pages and their scenes/songs to enable automatic cue lookup
          </SheetDescription>
        </SheetHeader>

        {isImportOpen ? (
          <ScriptImportWizard
            productionId={productionId}
            hasExistingData={pages.length > 0}
            onImportComplete={handleImportComplete}
            onCancel={() => setIsImportOpen(false)}
          />
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Script Structure</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Organize your script with hierarchical pages, scenes, and songs
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsImportOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button
                  onClick={openAddPageForm}
                  variant="cue"
                  disabled={isAddingPage}
                >
                  <Plus className="h-5 w-5" />
                  Add Page
                </Button>
              </div>
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
                      className="w-full h-9 rounded-lg bg-bg-secondary border border-bg-hover px-3 text-sm text-text-primary focus:outline-hidden focus:border-modules-cue"
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
                      className="w-full h-9 rounded-lg bg-bg-secondary border border-bg-hover px-3 text-sm text-text-primary focus:outline-hidden focus:border-modules-cue"
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
        )}
      </SheetContent>
    </Sheet>
  )
}
