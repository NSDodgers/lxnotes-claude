'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduction } from '@/lib/supabase/supabase-storage-adapter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, Loader2 } from 'lucide-react'

export function CreateProductionDialog() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [abbreviation, setAbbreviation] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

      // Navigate to the new production
      router.push(`/production/${production.id}/cue-notes`)
    } catch (err) {
      console.error('Failed to create production:', err)
      setError('Failed to create production. Please try again.')
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setName('')
    setAbbreviation('')
    setDescription('')
    setError(null)
  }

  // Auto-generate abbreviation from name
  const handleNameChange = (value: string) => {
    setName(value)
    if (!abbreviation || abbreviation === generateAbbreviation(name)) {
      setAbbreviation(generateAbbreviation(value))
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
        className="border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/10"
      >
        <Plus className="h-5 w-5" />
        New Production
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Production
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
