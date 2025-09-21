'use client'

import { useState, useMemo } from 'react'
import { Search, Database, Download, Calendar, Trash2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { usePositionStore } from '@/lib/stores/position-store'
import type { FixtureInfo } from '@/types'

interface FixtureDataViewerProps {
  isOpen: boolean
  onClose: () => void
  productionId: string
}

type SortField = 'channel' | 'position' | 'unitNumber' | 'fixtureType' | 'purpose' | 'universe'
type SortDirection = 'asc' | 'desc'

export function FixtureDataViewer({
  isOpen,
  onClose,
  productionId
}: FixtureDataViewerProps) {
  const { getFixturesByProduction, clearData } = useFixtureStore()
  const { clearOrder } = usePositionStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('channel')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Get fixtures for this production
  const allFixtures = getFixturesByProduction(productionId)

  // Calculate statistics
  const stats = useMemo(() => {
    const latestUpload = allFixtures.length > 0 
      ? Math.max(...allFixtures.map(f => f.sourceUploadedAt.getTime()))
      : null

    return {
      total: allFixtures.length,
      lastUpload: latestUpload ? new Date(latestUpload) : null
    }
  }, [allFixtures])

  // Filter and sort fixtures
  const filteredAndSortedFixtures = useMemo(() => {
    let filtered = allFixtures

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(fixture => 
        fixture.channel.toString().includes(search) ||
        fixture.position.toLowerCase().includes(search) ||
        fixture.unitNumber.toLowerCase().includes(search) ||
        fixture.fixtureType.toLowerCase().includes(search) ||
        fixture.purpose.toLowerCase().includes(search) ||
        fixture.lwid.toLowerCase().includes(search)
      )
    }


    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'channel':
          aValue = a.channel
          bValue = b.channel
          break
        case 'universe':
          aValue = a.universe || 0
          bValue = b.universe || 0
          break
        default:
          aValue = (a[sortField] || '').toString().toLowerCase()
          bValue = (b[sortField] || '').toString().toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return sorted
  }, [allFixtures, searchTerm, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleExportCSV = () => {
    const csvHeaders = [
      'Channel',
      'Position', 
      'Unit Number',
      'Fixture Type',
      'Purpose',
      'Universe',
      'Address',
      'Universe/Address',
      'LWID'
    ]

    const csvData = filteredAndSortedFixtures.map(fixture => [
      fixture.channel,
      fixture.position,
      fixture.unitNumber,
      fixture.fixtureType,
      fixture.purpose,
      fixture.universe || '',
      fixture.address || '',
      fixture.universeAddressRaw,
      fixture.lwid
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `lightwright-fixtures-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  const formatUniverseAddress = (fixture: FixtureInfo) => {
    if (fixture.universe !== undefined && fixture.address !== undefined) {
      return `${fixture.universe}/${fixture.address}`
    } else if (fixture.universeAddressRaw) {
      return fixture.universeAddressRaw
    } else if (fixture.address !== undefined) {
      return fixture.address.toString()
    }
    return '—'
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="ml-1 text-xs">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </TableHead>
  )

  const handleDeleteAllFixtures = () => {
    // Clear fixture data and position order
    clearData()
    clearOrder(productionId)

    // Close the confirmation dialog and the viewer
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete All Fixtures
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all fixture data from the system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <div className="font-medium text-foreground mb-2">What will happen:</div>
              <ul className="text-sm space-y-1 ml-4">
                <li>• All fixture information will be removed</li>
                <li>• Position sort order will be cleared</li>
                <li>• Work notes will keep their LWID references</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>

            <div>
              <div className="font-medium text-foreground mb-2">Work notes will NOT be affected:</div>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Your work notes remain intact</li>
                <li>• They will automatically reconnect when you re-upload fixtures with matching LWIDs</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <strong>To update fixtures:</strong> Re-upload a new CSV file with current data.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllFixtures}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete All Fixtures
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-4xl max-w-none">
        <SheetHeader className="pb-6">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-modules-work" />
            <SheetTitle>Fixtures</SheetTitle>
          </div>
          <SheetDescription asChild>
            <div className="space-y-2">
              {stats.lastUpload ? (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Last updated: {formatDate(stats.lastUpload)}</span>
                </div>
              ) : (
                <div className="text-muted-foreground">No fixture data uploaded</div>
              )}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">{stats.total} fixtures loaded</span>
              </div>
            </div>
          </SheetDescription>
        </SheetHeader>

        {allFixtures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Fixture Data</h3>
            <p className="text-muted-foreground mb-4">
              Upload a hookup CSV file to view fixture data here.
            </p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search channels, positions, types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="default"
                  disabled={filteredAndSortedFixtures.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Results count */}
            {searchTerm ? (
              <div className="text-sm text-muted-foreground">
                Showing {filteredAndSortedFixtures.length} of {allFixtures.length} fixtures
              </div>
            ) : null}

            {/* Data Table */}
            <div className="rounded-lg border max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background border-b">
                  <TableRow>
                    <SortableHeader field="channel">Ch</SortableHeader>
                    <SortableHeader field="position">Position</SortableHeader>
                    <SortableHeader field="unitNumber">Unit #</SortableHeader>
                    <SortableHeader field="fixtureType">Type</SortableHeader>
                    <SortableHeader field="purpose">Purpose</SortableHeader>
                    <SortableHeader field="universe">U/A</SortableHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedFixtures.map((fixture) => (
                    <TableRow key={fixture.id}>
                      <TableCell className="font-medium font-mono">
                        {fixture.channel}
                      </TableCell>
                      <TableCell className="font-medium">
                        {fixture.position}
                      </TableCell>
                      <TableCell className="text-center">
                        {fixture.unitNumber || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate" title={fixture.fixtureType}>
                          {fixture.fixtureType || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate" title={fixture.purpose}>
                          {fixture.purpose || '—'}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatUniverseAddress(fixture)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredAndSortedFixtures.length === 0 && searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No fixtures match your search criteria</p>
              </div>
            )}

            {/* Delete All Fixtures Button */}
            {allFixtures.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <div className="flex justify-center">
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete All Fixtures
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  This will remove all fixture data. Work notes will keep their LWID references.
                </p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
    </>
  )
}