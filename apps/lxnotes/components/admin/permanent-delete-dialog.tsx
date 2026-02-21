'use client'

import { useState } from 'react'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import type { Production } from '@/types'

interface PermanentDeleteDialogProps {
  production: Production
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PermanentDeleteDialog({
  production,
  isOpen,
  onClose,
  onSuccess,
}: PermanentDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleDelete = async () => {
    if (confirmText !== production.name) return

    try {
      setIsLoading(true)

      const response = await fetch(`/api/admin/productions/${production.id}/permanent`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to permanently delete production')
      }

      onSuccess()
    } catch (err) {
      console.error('Failed to permanently delete production:', err)
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmText('')
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Permanently Delete Production
          </AlertDialogTitle>
          <AlertDialogDescription className="text-text-secondary">
            <p className="mb-3">
              You are about to <strong className="text-red-400">permanently delete</strong>{' '}
              <strong className="text-text-primary">{production.name}</strong>.
            </p>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
              <p className="text-sm text-red-300 font-medium mb-2">
                This action cannot be undone!
              </p>
              <ul className="text-sm text-red-200/80 list-disc list-inside space-y-1">
                <li>All notes will be deleted</li>
                <li>All fixtures and hookup data will be deleted</li>
                <li>All script pages and scenes will be deleted</li>
                <li>All presets and settings will be deleted</li>
                <li>All team members will lose access</li>
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Type <strong className="text-text-primary">{production.name}</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-hidden focus:ring-2 focus:ring-red-500"
                placeholder={production.name}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={handleClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading || confirmText !== production.name}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Forever
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
