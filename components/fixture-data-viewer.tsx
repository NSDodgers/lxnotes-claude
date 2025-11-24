'use client'

import { useState, useMemo } from 'react'
import { Search, Database, Download, Calendar, Trash2, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { usePositionStore } from '@/lib/stores/position-store'
import type { FixtureInfo } from '@/types'
import { createFixtureColumns } from '@/components/notes-table/columns/fixture-columns'

interface FixtureDataViewerProps {
  isOpen: boolean
  onClose: () => void
  productionId: string
}

export function FixtureDataViewer({
  isOpen,
  onClose,
  productionId
}: FixtureDataViewerProps) {
  // Use selectors to prevent subscribing to entire store (avoids infinite re-render loop)
  const getFixturesByProduction = useFixtureStore((state) => state.getFixturesByProduction)
  const clearData = useFixtureStore((state) => state.clearData)
  const clearOrder = usePositionStore((state) => state.clearOrder)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Only fetch and compute data when the Sheet is actually open
  // This prevents expensive operations and infinite render loops when closed
  const allFixtures = useMemo(() =>
    isOpen ? getFixturesByProduction(productionId) : [],
    [isOpen, getFixturesByProduction, productionId]
  )

  // Calculate statistics
  const stats = useMemo(() => {
    const latestUpload = allFixtures.length > 0
      ? Math.max(...allFixtures.map(f => new Date(f.sourceUploadedAt).getTime()))
      : null

    return {
      total: allFixtures.length,
      lastUpload: latestUpload ? new Date(latestUpload) : null
    }
  }, [allFixtures])

  // Filter fixtures based on search term
  const filteredFixtures = useMemo(() => {
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

    return filtered
  }, [allFixtures, searchTerm])

  // Memoize columns
  const columns = useMemo(() => createFixtureColumns(), [])

  // Create table instance with TanStack
  const table = useReactTable({
    data: filteredFixtures,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
    maxMultiSortColCount: 2,
    initialState: {
      sorting: [
        { id: 'channel', desc: false }
      ]
    },
  })

  /**
   * Renders the sort indicator for a header
   */
  function renderSortIndicator(isSorted: false | 'asc' | 'desc', sortIndex?: number) {
    if (!isSorted) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />
    }

    const isMultiSort = sortIndex !== undefined && sortIndex >= 0

    return (
      <div className="flex items-center gap-1">
        {isSorted === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
        {isMultiSort && (
          <span className="text-xs font-bold">{sortIndex + 1}</span>
        )}
      </div>
    )
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

    const csvData = table.getRowModel().rows.map(row => {
      const fixture = row.original
      return [
        fixture.channel,
        fixture.position,
        fixture.unitNumber,
        fixture.fixtureType,
        fixture.purpose,
        fixture.universe || '',
        fixture.address || '',
        fixture.universeAddressRaw,
        fixture.lwid
      ]
    })

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
                    disabled={table.getRowModel().rows.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Results count */}
              {searchTerm ? (
                <div className="text-sm text-muted-foreground">
                  Showing {table.getRowModel().rows.length} of {allFixtures.length} fixtures
                </div>
              ) : null}

              {/* Data Table */}
              <div className="rounded-lg border max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background border-b z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          const canSort = header.column.getCanSort()
                          const isSorted = header.column.getIsSorted()
                          const sortIndex = header.column.getSortIndex()

                          return (
                            <TableHead
                              key={header.id}
                              className={cn(
                                canSort && 'cursor-pointer hover:bg-muted/50 transition-colors'
                              )}
                              onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                              style={{
                                width: header.getSize(),
                              }}
                            >
                              {header.isPlaceholder ? null : (
                                <div className="flex items-center gap-1">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                  {canSort && renderSortIndicator(isSorted, sortIndex)}
                                </div>
                              )}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              style={{
                                width: cell.column.getSize(),
                              }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center text-muted-foreground"
                        >
                          {searchTerm ? 'No fixtures match your search criteria' : 'No fixtures found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

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