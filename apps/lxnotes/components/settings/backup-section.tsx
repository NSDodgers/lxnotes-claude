'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  HardDrive,
  Download,
  Upload,
  Loader2,
  AlertTriangle,
  Check,
  Trash2,
  RotateCcw,
  Save,
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronRight,
  GitCompareArrows,
  Plus,
  Minus,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { useProductionOptional } from '@/components/production/production-provider'
import { useAuthContext } from '@/components/auth/auth-provider'
import { downloadFile, generateExportFilename } from '@/lib/utils/download'
import { cn } from '@/lib/utils'
import { MAX_SNAPSHOT_SIZE } from '@/lib/constants/snapshot'
import type { ProductionSnapshot, ProductionSnapshotCounts, SnapshotListItem, SnapshotTriggerReason, SnapshotDiff, DiffSection } from '@/types/snapshot'

// ─── Export Section ───────────────────────────────────────────────────────────

function ExportSection({ productionId, productionName }: { productionId: string; productionName: string }) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/productions/${productionId}/snapshot`)
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to export snapshot')
      }

      const snapshot = await response.json()
      const json = JSON.stringify(snapshot, null, 2)
      const prefix = productionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-snapshot'
      const filename = generateExportFilename(prefix, 'json')
      downloadFile(json, filename, 'application/json')
      toast.success('Snapshot exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to export snapshot')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="rounded-lg bg-bg-secondary p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5 text-text-secondary" />
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Export Snapshot</h3>
          <p className="text-sm text-text-secondary">
            Download a complete backup of this production as a JSON file
          </p>
        </div>
      </div>

      <button
        data-testid="export-snapshot-button"
        onClick={handleExport}
        disabled={isExporting}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          'bg-modules-production text-white hover:bg-modules-production/90',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Export Snapshot
          </>
        )}
      </button>
    </div>
  )
}

// ─── Import Section ───────────────────────────────────────────────────────────

function CountsGrid({ counts }: { counts: ProductionSnapshotCounts }) {
  const items = [
    { label: 'Notes', value: counts.activeNotes, sub: counts.deletedNotes > 0 ? `+${counts.deletedNotes} deleted` : undefined },
    { label: 'Script Pages', value: counts.scriptPages },
    { label: 'Scenes/Songs', value: counts.scenesSongs },
    { label: 'Fixtures', value: counts.fixtures },
    { label: 'Fixture Links', value: counts.workNoteFixtureLinks },
    { label: 'Departments', value: counts.departments },
    { label: 'Members', value: counts.members },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-bg-primary p-3">
          <div className="text-xl font-bold text-text-primary">{item.value}</div>
          <div className="text-xs text-text-secondary">{item.label}</div>
          {item.sub && <div className="text-xs text-text-muted">{item.sub}</div>}
        </div>
      ))}
    </div>
  )
}

function ImportSection({
  productionId,
  productionName,
  isAdmin,
  onRestoreComplete,
}: {
  productionId: string
  productionName: string
  isAdmin: boolean
  onRestoreComplete: () => void
}) {
  const [snapshot, setSnapshot] = useState<ProductionSnapshot | null>(null)
  const [mode, setMode] = useState<'restore' | 'clone' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preRestoreSnapshot, setPreRestoreSnapshot] = useState<ProductionSnapshot | null>(null)
  const [cloneResult, setCloneResult] = useState<{ productionId: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SNAPSHOT_SIZE) {
      toast.error('Snapshot file is too large. Maximum size is 50 MB.')
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)

      if (parsed.version !== 1) {
        toast.error('Unsupported snapshot version')
        return
      }

      setSnapshot(parsed as ProductionSnapshot)
      setMode(null)
      setPreRestoreSnapshot(null)
      setCloneResult(null)
    } catch {
      toast.error('Invalid snapshot file: could not parse JSON')
    }

    // Reset file input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRestore = async () => {
    if (!snapshot) return
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/productions/${productionId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to restore snapshot')
      }

      const result = await response.json()
      setPreRestoreSnapshot(result.preRestoreSnapshot || null)
      toast.success('Production restored from snapshot')
      onRestoreComplete()
    } catch (error) {
      console.error('Restore error:', error)
      toast.error('Failed to restore snapshot. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClone = async () => {
    if (!snapshot) return
    setIsProcessing(true)
    try {
      // Append "(Copy)" to production name so the clone is distinguishable
      const snapshotToSend = {
        ...snapshot,
        production: {
          ...snapshot.production,
          name: `${snapshot.production.name || snapshot.productionName} (Copy)`,
        },
      }

      const response = await fetch('/api/productions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: snapshotToSend }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to clone production')
      }

      const result = await response.json()
      setCloneResult({ productionId: result.productionId })
      toast.success('Production cloned successfully')
    } catch (error) {
      console.error('Clone error:', error)
      toast.error('Failed to clone production. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadPreRestore = () => {
    if (!preRestoreSnapshot) return
    const json = JSON.stringify(preRestoreSnapshot, null, 2)
    const prefix = productionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-pre-restore'
    const filename = generateExportFilename(prefix, 'json')
    downloadFile(json, filename, 'application/json')
  }

  const clearUpload = () => {
    setSnapshot(null)
    setMode(null)
    setPreRestoreSnapshot(null)
    setCloneResult(null)
  }

  return (
    <div className="rounded-lg bg-bg-secondary p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Upload className="h-5 w-5 text-text-secondary" />
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Import from Snapshot</h3>
          <p className="text-sm text-text-secondary">
            Restore this production or create a new one from a snapshot file
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="snapshot-file-input"
      />

      {!snapshot ? (
        <button
          data-testid="choose-snapshot-file-button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            'bg-bg-tertiary text-text-primary border border-bg-hover hover:bg-bg-hover'
          )}
        >
          <Upload className="h-4 w-4" />
          Choose Snapshot File
        </button>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="rounded-lg bg-bg-tertiary p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-text-primary">{snapshot.productionName}</div>
                <div className="text-xs text-text-secondary">
                  Exported {new Date(snapshot.exportedAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={clearUpload}
                className="text-text-muted hover:text-text-secondary transition-colors p-1"
                title="Clear"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <CountsGrid counts={snapshot.counts} />
          </div>

          {/* Mode selector */}
          {!preRestoreSnapshot && !cloneResult && (
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  data-testid="restore-mode-button"
                  onClick={() => setMode('restore')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    mode === 'restore'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-bg-tertiary text-text-primary border border-bg-hover hover:bg-bg-hover'
                  )}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </button>
              )}
              <button
                data-testid="clone-mode-button"
                onClick={() => setMode('clone')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  mode === 'clone'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-bg-tertiary text-text-primary border border-bg-hover hover:bg-bg-hover'
                )}
              >
                <ExternalLink className="h-4 w-4" />
                Clone as New Production
              </button>
            </div>
          )}

          {/* Restore warning + confirm */}
          {mode === 'restore' && !preRestoreSnapshot && (
            <div className="space-y-3">
              <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-sm text-red-300">
                  <p className="font-medium">This will replace all data in &ldquo;{productionName}&rdquo;</p>
                  <p className="mt-1 text-red-300/80">
                    All current notes, fixtures, script pages, and other data will be replaced with the snapshot contents.
                    A backup of the current state will be created automatically.
                  </p>
                </div>
              </div>
              <button
                data-testid="confirm-restore-button"
                onClick={handleRestore}
                disabled={isProcessing}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  'bg-red-600 text-white hover:bg-red-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Confirm Restore
                  </>
                )}
              </button>
            </div>
          )}

          {/* Clone confirm */}
          {mode === 'clone' && !cloneResult && (
            <button
              data-testid="confirm-clone-button"
              onClick={handleClone}
              disabled={isProcessing}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                'bg-emerald-600 text-white hover:bg-emerald-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cloning...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Create Clone
                </>
              )}
            </button>
          )}

          {/* Post-restore: offer pre-restore download */}
          {preRestoreSnapshot && (
            <div className="rounded-lg bg-emerald-900/20 border border-emerald-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="h-5 w-5" />
                <span className="font-medium">Production restored successfully</span>
              </div>
              <button
                onClick={handleDownloadPreRestore}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-tertiary text-text-primary border border-bg-hover hover:bg-bg-hover transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download pre-restore backup
              </button>
            </div>
          )}

          {/* Post-clone: link to new production */}
          {cloneResult && (
            <div className="rounded-lg bg-emerald-900/20 border border-emerald-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="h-5 w-5" />
                <span className="font-medium">Production cloned successfully</span>
              </div>
              <a
                href={`/production/${cloneResult.productionId}/cue-notes`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-tertiary text-text-primary border border-bg-hover hover:bg-bg-hover transition-colors w-fit"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open cloned production
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Snapshot History Section ─────────────────────────────────────────────────

const TRIGGER_BADGES: Record<SnapshotTriggerReason, { label: string; className: string }> = {
  manual: { label: 'Checkpoint', className: 'bg-emerald-500/20 text-emerald-400' },
  before_restore: { label: 'Pre-Restore', className: 'bg-amber-500/20 text-amber-400' },
  before_fixture_import: { label: 'Pre-Import', className: 'bg-blue-500/20 text-blue-400' },
  before_script_replace: { label: 'Pre-Script', className: 'bg-purple-500/20 text-purple-400' },
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return 'Just now'
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// ─── Diff Panel ──────────────────────────────────────────────────────────────

function DiffSectionPanel({ section }: { section: DiffSection }) {
  const [isOpen, setIsOpen] = useState(true)
  const total = section.totalAdded + section.totalRemoved + section.totalModified

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-bg-tertiary hover:bg-bg-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-text-muted" /> : <ChevronRight className="h-3.5 w-3.5 text-text-muted" />}
          <span className="text-sm font-medium text-text-primary">{section.label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {section.totalAdded > 0 && (
            <span className="text-red-400">+{section.totalAdded}</span>
          )}
          {section.totalRemoved > 0 && (
            <span className="text-emerald-400">&minus;{section.totalRemoved}</span>
          )}
          {section.totalModified > 0 && (
            <span className="text-amber-400">~{section.totalModified}</span>
          )}
          {total === 0 && <span className="text-text-muted">no changes</span>}
        </div>
      </button>

      {isOpen && total > 0 && (
        <div className="divide-y divide-border">
          {section.added.length > 0 && (
            <div className="px-3 py-2 space-y-1">
              <div className="text-xs font-medium text-red-400 flex items-center gap-1">
                <Plus className="h-3 w-3" />
                Added since snapshot ({section.totalAdded}) — would be lost on restore
              </div>
              {section.added.map((entry, i) => (
                <div key={i} className="flex items-baseline gap-2 pl-4 text-xs">
                  <span className="text-text-primary">{entry.label}</span>
                  {entry.detail && <span className="text-text-muted">{entry.detail}</span>}
                </div>
              ))}
              {section.totalAdded > section.added.length && (
                <div className="text-text-muted pl-4 text-xs">…and {section.totalAdded - section.added.length} more</div>
              )}
            </div>
          )}
          {section.removed.length > 0 && (
            <div className="px-3 py-2 space-y-1">
              <div className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <Minus className="h-3 w-3" />
                Removed since snapshot ({section.totalRemoved}) — would return on restore
              </div>
              {section.removed.map((entry, i) => (
                <div key={i} className="flex items-baseline gap-2 pl-4 text-xs">
                  <span className="text-text-primary">{entry.label}</span>
                  {entry.detail && <span className="text-text-muted">{entry.detail}</span>}
                </div>
              ))}
              {section.totalRemoved > section.removed.length && (
                <div className="text-text-muted pl-4 text-xs">…and {section.totalRemoved - section.removed.length} more</div>
              )}
            </div>
          )}
          {section.modified.length > 0 && (
            <div className="px-3 py-2 space-y-1">
              <div className="text-xs font-medium text-amber-400 flex items-center gap-1">
                <Pencil className="h-3 w-3" />
                Modified since snapshot ({section.totalModified}) — would revert on restore
              </div>
              {section.modified.map((entry, i) => (
                <div key={i} className="pl-4 text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="text-text-primary">{entry.label}</span>
                    {entry.detail && <span className="text-text-muted">{entry.detail}</span>}
                  </div>
                  {entry.changes && entry.changes.length > 0 && (
                    <div className="text-text-muted pl-2 mt-0.5">
                      {entry.changes.join(' · ')}
                    </div>
                  )}
                </div>
              ))}
              {section.totalModified > section.modified.length && (
                <div className="text-text-muted pl-4 text-xs">…and {section.totalModified - section.modified.length} more</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SnapshotDiffPanel({ productionId, snapshotId }: { productionId: string; snapshotId: string }) {
  const [diff, setDiff] = useState<SnapshotDiff | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchDiff() {
      try {
        const response = await fetch(`/api/productions/${productionId}/snapshots/${snapshotId}/diff`)
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to load diff')
        }
        const data = await response.json()
        if (!cancelled) setDiff(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load diff')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchDiff()
    return () => { cancelled = true }
  }, [productionId, snapshotId])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-text-secondary py-3 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Comparing with current state...
      </div>
    )
  }

  if (error) {
    return <div className="text-red-400 text-xs py-2">{error}</div>
  }

  if (!diff) return null

  if (diff.sections.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-xs py-2">
        <Check className="h-3.5 w-3.5" />
        This snapshot matches the current production state
      </div>
    )
  }

  return (
    <div className="space-y-2 pt-1">
      <div className="text-xs text-text-muted">
        Changes since this snapshot — restoring would undo these:
      </div>
      {diff.sections.map(section => (
        <DiffSectionPanel key={section.key} section={section} />
      ))}
    </div>
  )
}

// ─── Snapshot History Section ─────────────────────────────────────────────────

function SnapshotHistorySection({
  productionId,
  productionName,
  isAdmin,
  refreshKey,
  onRestoreComplete,
}: {
  productionId: string
  productionName: string
  isAdmin: boolean
  refreshKey: number
  onRestoreComplete: () => void
}) {
  const [snapshots, setSnapshots] = useState<SnapshotListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [checkpointNote, setCheckpointNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [diffId, setDiffId] = useState<string | null>(null)

  const fetchSnapshots = useCallback(async () => {
    try {
      const response = await fetch(`/api/productions/${productionId}/snapshots`)
      if (!response.ok) return
      const data = await response.json()
      setSnapshots(data)
    } catch {
      // Snapshots table may not exist yet
    } finally {
      setIsLoading(false)
    }
  }, [productionId])

  useEffect(() => {
    fetchSnapshots()
  }, [fetchSnapshots, refreshKey])

  const handleSaveCheckpoint = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/productions/${productionId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: checkpointNote || undefined }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save checkpoint')
      }

      toast.success('Checkpoint saved')
      setCheckpointNote('')
      setShowNoteInput(false)
      fetchSnapshots()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save checkpoint')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadSnapshot = async (snapshotId: string) => {
    setProcessingId(snapshotId)
    try {
      const response = await fetch(`/api/productions/${productionId}/snapshots/${snapshotId}`)
      if (!response.ok) throw new Error('Failed to fetch snapshot')

      const data = await response.json()
      const json = JSON.stringify(data.snapshot_data, null, 2)
      const prefix = productionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-snapshot'
      const filename = generateExportFilename(prefix, 'json')
      downloadFile(json, filename, 'application/json')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download snapshot')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRestoreFromHistory = async (snapshotId: string) => {
    setConfirmRestoreId(null)
    setProcessingId(snapshotId)
    try {
      const fetchResponse = await fetch(`/api/productions/${productionId}/snapshots/${snapshotId}`)
      if (!fetchResponse.ok) throw new Error('Failed to fetch snapshot')
      const { snapshot_data } = await fetchResponse.json()

      const restoreResponse = await fetch(`/api/productions/${productionId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: snapshot_data }),
      })

      if (!restoreResponse.ok) {
        const err = await restoreResponse.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to restore snapshot')
      }

      toast.success('Production restored from snapshot')
      onRestoreComplete()
      setExpandedId(null)
      setDiffId(null)
      fetchSnapshots()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restore snapshot')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteSnapshot = async (snapshotId: string) => {
    setProcessingId(snapshotId)
    try {
      const response = await fetch(`/api/productions/${productionId}/snapshots/${snapshotId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to delete snapshot')
      }

      toast.success('Snapshot deleted')
      setConfirmDeleteId(null)
      if (expandedId === snapshotId) {
        setExpandedId(null)
        setDiffId(null)
      }
      fetchSnapshots()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete snapshot')
    } finally {
      setProcessingId(null)
    }
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setDiffId(null)
    } else {
      setExpandedId(id)
      setDiffId(null)
      setConfirmDeleteId(null)
      setConfirmRestoreId(null)
    }
  }

  if (!isLoading && snapshots.length === 0 && !isAdmin) return null

  return (
    <div className="rounded-lg bg-bg-secondary p-6 space-y-4">
      {/* Save Checkpoint */}
      {isAdmin && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Save className="h-5 w-5 text-text-secondary" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Save Checkpoint</h3>
              <p className="text-sm text-text-secondary">
                Create a server-side snapshot you can restore from later
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showNoteInput && (
              <input
                type="text"
                value={checkpointNote}
                onChange={(e) => setCheckpointNote(e.target.value)}
                placeholder="Optional note..."
                className="flex-1 rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-modules-production"
                data-testid="checkpoint-note-input"
              />
            )}
            {!showNoteInput && (
              <button
                onClick={() => setShowNoteInput(true)}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                + Add note
              </button>
            )}
            <button
              data-testid="save-checkpoint-button"
              onClick={handleSaveCheckpoint}
              disabled={isSaving}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                'bg-emerald-600 text-white hover:bg-emerald-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Checkpoint
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Snapshot History */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-text-secondary" />
          <h3 className="text-lg font-semibold text-text-primary">Snapshot History</h3>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-text-secondary py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading snapshots...
          </div>
        ) : snapshots.length === 0 ? (
          <p className="text-sm text-text-muted py-4">
            No snapshots yet. Export a snapshot or save a checkpoint to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {snapshots.map((snap) => {
              const badge = TRIGGER_BADGES[snap.trigger_reason]
              const isProcessingThis = processingId === snap.id
              const isExpanded = expandedId === snap.id

              return (
                <div
                  key={snap.id}
                  className={cn(
                    'rounded-lg bg-bg-tertiary transition-colors',
                    isExpanded && 'ring-1 ring-border'
                  )}
                >
                  {/* Row header — always visible */}
                  <button
                    onClick={() => toggleExpand(snap.id)}
                    className="w-full p-3 flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded
                        ? <ChevronDown className="h-3.5 w-3.5 text-text-muted shrink-0" />
                        : <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
                      }
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-primary">
                            {formatRelativeTime(snap.created_at)}
                          </span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', badge.className)}>
                            {badge.label}
                          </span>
                        </div>
                        {snap.note && (
                          <div className="text-xs text-text-muted mt-0.5 truncate">{snap.note}</div>
                        )}
                        {!isExpanded && snap.entity_counts && (
                          <div className="text-xs text-text-muted mt-0.5">
                            {snap.entity_counts.activeNotes} notes, {snap.entity_counts.fixtures} fixtures
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inline actions for collapsed rows */}
                    {!isExpanded && (
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isProcessingThis ? (
                          <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />
                        ) : (
                          <button
                            onClick={() => handleDownloadSnapshot(snap.id)}
                            className="p-1.5 rounded hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3">
                      {/* Full counts grid */}
                      {snap.entity_counts && <CountsGrid counts={snap.entity_counts} />}

                      {/* Timestamp detail */}
                      <div className="text-xs text-text-muted">
                        {new Date(snap.created_at).toLocaleString()}
                      </div>

                      {/* Preview Changes toggle */}
                      {diffId === snap.id ? (
                        <SnapshotDiffPanel productionId={productionId} snapshotId={snap.id} />
                      ) : (
                        <button
                          onClick={() => setDiffId(snap.id)}
                          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <GitCompareArrows className="h-3.5 w-3.5" />
                          Preview Changes
                        </button>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-border" onClick={(e) => e.stopPropagation()}>
                        {isProcessingThis ? (
                          <div className="flex items-center gap-2 text-xs text-text-secondary">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleDownloadSnapshot(snap.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </button>
                            {isAdmin && (
                              confirmRestoreId === snap.id ? (
                                <button
                                  onClick={() => handleRestoreFromHistory(snap.id)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 transition-colors"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Confirm Restore
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setConfirmRestoreId(snap.id); setConfirmDeleteId(null) }}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Restore
                                </button>
                              )
                            )}
                            {isAdmin && (
                              confirmDeleteId === snap.id ? (
                                <button
                                  onClick={() => handleDeleteSnapshot(snap.id)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors ml-auto"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Confirm Delete
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setConfirmDeleteId(snap.id); setConfirmRestoreId(null) }}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-text-muted hover:text-red-400 hover:bg-bg-hover transition-colors ml-auto"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BackupSection() {
  const productionContext = useProductionOptional()
  const { isSuperAdmin } = useAuthContext()
  const [refreshKey, setRefreshKey] = useState(0)

  if (!productionContext) return null

  const { productionId, production, isAdmin: contextIsAdmin } = productionContext
  const isAdmin = contextIsAdmin || isSuperAdmin
  const productionName = production?.name || 'Production'

  const handleRestoreComplete = () => {
    productionContext.refetch()
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HardDrive className="h-6 w-6 text-text-secondary" />
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Backup & Restore</h2>
          <p className="text-sm text-text-secondary">
            Export, import, and manage production snapshots
          </p>
        </div>
      </div>

      <ExportSection productionId={productionId} productionName={productionName} />
      <ImportSection
        productionId={productionId}
        productionName={productionName}
        isAdmin={isAdmin}
        onRestoreComplete={handleRestoreComplete}
      />
      <SnapshotHistorySection
        productionId={productionId}
        productionName={productionName}
        isAdmin={isAdmin}
        refreshKey={refreshKey}
        onRestoreComplete={handleRestoreComplete}
      />
    </div>
  )
}
