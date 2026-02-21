'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createProduction } from '@/lib/supabase/supabase-storage-adapter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, Loader2, Upload } from 'lucide-react'
import { MAX_SNAPSHOT_SIZE } from '@/lib/constants/snapshot'
import type { ProductionSnapshot } from '@/types/snapshot'

interface CreateProductionDialogProps {
  // Optional external control props
  isOpen?: boolean
  onClose?: () => void
  onSuccess?: () => void
  // If true, don't navigate after creation (used in admin dashboard)
  skipNavigation?: boolean
}

export function CreateProductionDialog({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  onSuccess,
  skipNavigation = false,
}: CreateProductionDialogProps = {}) {
  const router = useRouter()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [abbreviation, setAbbreviation] = useState('')
  const [description, setDescription] = useState('')

  const [mode, setMode] = useState<'blank' | 'snapshot'>('blank')
  const [snapshot, setSnapshot] = useState<ProductionSnapshot | null>(null)
  const [nameOverride, setNameOverride] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine if externally controlled
  const isControlled = externalIsOpen !== undefined
  const isOpen = isControlled ? externalIsOpen : internalIsOpen

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setAbbreviation('')
      setDescription('')
      setError(null)
      setMode('blank')
      setSnapshot(null)
      setNameOverride('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'blank') {
      if (!name.trim() || !abbreviation.trim()) {
        setError('Name and abbreviation are required')
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const production = await createProduction({
          name: name.trim(),
          abbreviation: abbreviation.trim().toUpperCase(),
          description: description.trim() || undefined,
        })

        handleClose()
        onSuccess?.()

        if (!skipNavigation) {
          router.push(`/production/${production.id}/cue-notes`)
        }
      } catch (err) {
        console.error('Failed to create production:', err)
        setError('Failed to create production. Please try again.')
        setIsLoading(false)
      }
    } else {
      if (!snapshot) {
        setError('Please select a snapshot file')
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const snapshotToSend = {
          ...snapshot,
          production: {
            ...snapshot.production,
            name: nameOverride.trim() || snapshot.productionName,
          },
        }

        const res = await fetch('/api/productions/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ snapshot: snapshotToSend }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create production from snapshot')
        }

        const data = await res.json()
        handleClose()
        onSuccess?.()

        if (!skipNavigation) {
          router.push(`/production/${data.productionId}/cue-notes`)
        }
      } catch (err) {
        console.error('Failed to create production from snapshot:', err)
        setError(err instanceof Error ? err.message : 'Failed to create production from snapshot.')
        setIsLoading(false)
      }
    }
  }

  const handleClose = () => {
    if (isControlled) {
      externalOnClose?.()
    } else {
      setInternalIsOpen(false)
    }
    setName('')
    setAbbreviation('')
    setDescription('')
    setError(null)
    setIsLoading(false)
    setMode('blank')
    setSnapshot(null)
    setNameOverride('')
  }

  // Auto-generate abbreviation from name
  const handleNameChange = (value: string) => {
    setName(value)
    if (!abbreviation || abbreviation === generateAbbreviation(name)) {
      setAbbreviation(generateAbbreviation(value))
    }
  }

  const handleModeChange = (newMode: 'blank' | 'snapshot') => {
    setMode(newMode)
    setError(null)
    if (newMode === 'blank') {
      setSnapshot(null)
      setNameOverride('')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SNAPSHOT_SIZE) {
      setError('Snapshot file is too large. Maximum size is 50 MB.')
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as ProductionSnapshot

      if (parsed.version !== 1) {
        setError('Unsupported snapshot version. Expected version 1.')
        return
      }

      if (!parsed.productionName || !parsed.production) {
        setError('Invalid snapshot file: missing production data.')
        return
      }

      setSnapshot(parsed)
      setNameOverride(`${parsed.productionName} (Copy)`)
      setError(null)
    } catch {
      setError('Invalid file: could not parse as a valid snapshot JSON.')
    }

    // Reset file input so re-selecting the same file triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const clearSnapshot = () => {
    setSnapshot(null)
    setNameOverride('')
    setError(null)
  }

  return (
    <>
      {/* Only show trigger button if not externally controlled */}
      {!isControlled && (
        <button
          onClick={() => setInternalIsOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary text-text-primary font-medium rounded-lg transition-all border border-border"
        >
          <Plus className="h-5 w-5" />
          New Production
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="relative bg-bg-secondary border border-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">
                Create New Production
              </h2>
              <button
                onClick={handleClose}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-1 p-1 bg-bg-tertiary rounded-lg mb-4">
              <button
                type="button"
                onClick={() => handleModeChange('blank')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'blank'
                    ? 'bg-bg-secondary text-text-primary shadow-xs'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Blank
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('snapshot')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center justify-center gap-1.5 ${
                  mode === 'snapshot'
                    ? 'bg-bg-secondary text-text-primary shadow-xs'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                From Snapshot
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'blank' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Production Name *
                    </label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Romeo and Juliet"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Abbreviation *
                    </label>
                    <Input
                      type="text"
                      value={abbreviation}
                      onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
                      placeholder="e.g., R&J"
                      maxLength={10}
                      required
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Short code used in notes and references
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Description
                    </label>
                    <Input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Spring 2024 Main Stage"
                    />
                  </div>
                </>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {!snapshot ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-text-muted transition-colors"
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-text-muted" />
                      <p className="text-sm font-medium text-text-secondary">Choose snapshot file</p>
                      <p className="text-xs text-text-muted mt-1">.json file exported from LX Notes</p>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {/* Snapshot Preview */}
                      <div className="bg-bg-tertiary rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-text-primary">
                            {snapshot.productionName}
                          </p>
                          <button
                            type="button"
                            onClick={clearSnapshot}
                            className="text-text-muted hover:text-text-primary transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-text-muted">
                          Exported {new Date(snapshot.exportedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {snapshot.counts.notes} notes, {snapshot.counts.fixtures} fixtures, {snapshot.counts.scriptPages} pages
                        </p>
                      </div>

                      {/* Name Override */}
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Production Name
                        </label>
                        <Input
                          type="text"
                          value={nameOverride}
                          onChange={(e) => setNameOverride(e.target.value)}
                          placeholder={snapshot.productionName}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                  disabled={isLoading || (mode === 'snapshot' && !snapshot)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : mode === 'blank' ? (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Production
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Create from Snapshot
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function generateAbbreviation(name: string): string {
  if (!name) return ''

  // Split by spaces and get first letter of each significant word
  const words = name.split(/\s+/).filter(w => w.length > 0)

  if (words.length === 1) {
    // Single word - take first 3-4 letters
    return words[0].substring(0, 4).toUpperCase()
  }

  // Multiple words - take first letter of each (up to 4)
  return words
    .slice(0, 4)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}
