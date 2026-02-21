'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Production } from '@/types'

interface EditProductionDialogProps {
  production: Production
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditProductionDialog({
  production,
  isOpen,
  onClose,
  onSuccess,
}: EditProductionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(production.name)
  const [abbreviation, setAbbreviation] = useState(production.abbreviation)
  const [description, setDescription] = useState(production.description || '')
  const [startDate, setStartDate] = useState(
    production.startDate ? production.startDate.toISOString().split('T')[0] : ''
  )
  const [endDate, setEndDate] = useState(
    production.endDate ? production.endDate.toISOString().split('T')[0] : ''
  )

  // Reset form when production changes
  useEffect(() => {
    setName(production.name)
    setAbbreviation(production.abbreviation)
    setDescription(production.description || '')
    setStartDate(production.startDate ? production.startDate.toISOString().split('T')[0] : '')
    setEndDate(production.endDate ? production.endDate.toISOString().split('T')[0] : '')
    setError(null)
  }, [production])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !abbreviation.trim()) {
      setError('Name and abbreviation are required')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/productions/${production.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          abbreviation: abbreviation.trim().toUpperCase(),
          description: description.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update production')
      }

      onSuccess()
    } catch (err) {
      console.error('Failed to update production:', err)
      setError(err instanceof Error ? err.message : 'Failed to update production')
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setIsLoading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
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
            Edit Production
          </h2>
          <button
            onClick={handleClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Production Name *
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

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
              className="flex-1 bg-modules-production hover:bg-modules-production/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
