'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Database,
  Shield,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { useAuthContext } from '@/components/auth/auth-provider'
import { CreateProductionDialog } from '@/components/home/create-production-dialog'
import { EditProductionDialog } from '@/components/admin/edit-production-dialog'
import { DeleteProductionDialog } from '@/components/admin/delete-production-dialog'
import { PermanentDeleteDialog } from '@/components/admin/permanent-delete-dialog'
import type { Production } from '@/types'

type TabType = 'active' | 'trash'

export default function AdminDashboardPage() {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuthContext()
  const [productions, setProductions] = useState<Production[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProduction, setEditingProduction] = useState<Production | null>(null)
  const [deletingProduction, setDeletingProduction] = useState<Production | null>(null)
  const [permanentlyDeletingProduction, setPermanentlyDeletingProduction] = useState<Production | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const fetchProductions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/productions')
      if (response.ok) {
        const data = await response.json()
        // Parse dates
        const parsed = data.map((p: Record<string, unknown>) => ({
          ...p,
          createdAt: p.createdAt ? new Date(p.createdAt as string) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt as string) : new Date(),
          deletedAt: p.deletedAt ? new Date(p.deletedAt as string) : undefined,
          startDate: p.startDate ? new Date(p.startDate as string) : undefined,
          endDate: p.endDate ? new Date(p.endDate as string) : undefined,
        }))
        setProductions(parsed)
      }
    } catch (error) {
      console.error('Error fetching productions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user && isSuperAdmin) {
      fetchProductions()
    }
  }, [authLoading, user, isSuperAdmin, fetchProductions])

  const handleRestore = async (id: string) => {
    setRestoringId(id)
    try {
      const response = await fetch(`/api/admin/productions/${id}/restore`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchProductions()
      }
    } catch (error) {
      console.error('Error restoring production:', error)
    } finally {
      setRestoringId(null)
    }
  }

  const handleDeleteComplete = () => {
    setDeletingProduction(null)
    fetchProductions()
  }

  const handlePermanentDeleteComplete = () => {
    setPermanentlyDeletingProduction(null)
    fetchProductions()
  }

  const handleEditComplete = () => {
    setEditingProduction(null)
    fetchProductions()
  }

  const handleCreateComplete = () => {
    setIsCreateOpen(false)
    fetchProductions()
  }

  // Filter productions by active/deleted status
  const activeProductions = productions.filter(p => !p.deletedAt)
  const deletedProductions = productions.filter(p => p.deletedAt)

  // Calculate days until permanent deletion
  const getDaysUntilDeletion = (deletedAt: Date) => {
    const thirtyDaysLater = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    const now = new Date()
    const daysLeft = Math.ceil((thirtyDaysLater.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    return Math.max(0, daysLeft)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
      </div>
    )
  }

  if (!user || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-secondary mb-6">
            This page is only accessible to super administrators.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-modules-production hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-text-secondary" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Database className="h-6 w-6 text-yellow-500" />
                Admin Dashboard
              </h1>
              <p className="text-text-secondary mt-1">
                Manage all productions in the system
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-modules-production text-white rounded-lg hover:bg-modules-production/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Production
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-modules-production text-modules-production'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Active Productions ({activeProductions.length})
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'trash'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Trash ({deletedProductions.length})
            </span>
          </button>
        </div>

        {/* Trash Info Banner */}
        {activeTab === 'trash' && deletedProductions.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-200">
              Items in trash will be permanently deleted after 30 days.
              Restore them to prevent permanent deletion.
            </p>
          </div>
        )}

        {/* Productions Table */}
        <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Abbreviation</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">
                  {activeTab === 'active' ? 'Created' : 'Deleted'}
                </th>
                {activeTab === 'trash' && (
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Auto-delete</th>
                )}
                <th className="text-right px-4 py-3 text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'active' ? activeProductions : deletedProductions).map((production) => (
                <tr key={production.id} className="border-b border-border last:border-0 hover:bg-bg-tertiary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {production.logo ? (
                        <Image
                          src={production.logo}
                          alt={production.name}
                          width={32}
                          height={32}
                          className="rounded object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-bg-tertiary flex items-center justify-center text-text-muted text-sm">
                          {production.abbreviation.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-text-primary font-medium">{production.name}</p>
                        {production.description && (
                          <p className="text-text-muted text-sm truncate max-w-xs">{production.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{production.abbreviation}</td>
                  <td className="px-4 py-3 text-text-secondary text-sm">
                    {activeTab === 'active'
                      ? production.createdAt.toLocaleDateString()
                      : production.deletedAt?.toLocaleDateString()}
                  </td>
                  {activeTab === 'trash' && production.deletedAt && (
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-yellow-400">
                        <Clock className="h-3 w-3" />
                        {getDaysUntilDeletion(production.deletedAt)} days left
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {activeTab === 'active' ? (
                        <>
                          <button
                            onClick={() => setEditingProduction(production)}
                            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduction(production)}
                            className="p-2 text-text-secondary hover:text-red-400 hover:bg-bg-tertiary rounded transition-colors"
                            title="Move to Trash"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestore(production.id)}
                            disabled={restoringId === production.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors disabled:opacity-50"
                          >
                            {restoringId === production.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Restore
                          </button>
                          <button
                            onClick={() => setPermanentlyDeletingProduction(production)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete Forever
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(activeTab === 'active' ? activeProductions : deletedProductions).length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'trash' ? 5 : 4} className="px-4 py-12 text-center text-text-muted">
                    {activeTab === 'active'
                      ? 'No productions yet. Create one to get started.'
                      : 'Trash is empty.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <CreateProductionDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateComplete}
        skipNavigation={true}
      />

      {editingProduction && (
        <EditProductionDialog
          production={editingProduction}
          isOpen={!!editingProduction}
          onClose={() => setEditingProduction(null)}
          onSuccess={handleEditComplete}
        />
      )}

      {deletingProduction && (
        <DeleteProductionDialog
          production={deletingProduction}
          isOpen={!!deletingProduction}
          onClose={() => setDeletingProduction(null)}
          onSuccess={handleDeleteComplete}
        />
      )}

      {permanentlyDeletingProduction && (
        <PermanentDeleteDialog
          production={permanentlyDeletingProduction}
          isOpen={!!permanentlyDeletingProduction}
          onClose={() => setPermanentlyDeletingProduction(null)}
          onSuccess={handlePermanentDeleteComplete}
        />
      )}
    </div>
  )
}
