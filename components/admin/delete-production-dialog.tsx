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

interface DeleteProductionDialogProps {
  production: Production
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeleteProductionDialog({
  production,
  isOpen,
  onClose,
  onSuccess,
}: DeleteProductionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/admin/productions/${production.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete production')
      }

      onSuccess()
    } catch (err) {
      console.error('Failed to delete production:', err)
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-text-primary">
            <Trash2 className="h-5 w-5 text-red-400" />
            Move to Trash
          </AlertDialogTitle>
          <AlertDialogDescription className="text-text-secondary">
            <p className="mb-3">
              Are you sure you want to move <strong className="text-text-primary">{production.name}</strong> to trash?
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-200">
                <p className="font-medium">30-day retention period</p>
                <p className="mt-1 text-yellow-200/80">
                  This production and all its data will be permanently deleted after 30 days unless restored.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Moving...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Move to Trash
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
