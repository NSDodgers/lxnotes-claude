'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Database, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import type { 
  HookupCSVRow, 
  ParsedHookupRow, 
  ValidationResult, 
  RowError 
} from '@/types'

interface HookupDataPreviewProps {
  validation: ValidationResult
  headerMapping: Record<string, string>
  onRowToggleSkip?: (rowNumber: number) => void
  onBulkRowsSkip?: (rowNumbers: number[]) => void
  selectedRowsToSkip?: number[]
  allCsvData?: HookupCSVRow[] // Full CSV data for pagination
  onImport?: () => void
  isProcessing?: boolean
}

export function HookupDataPreview({
  validation,
  headerMapping,
  onRowToggleSkip,
  onBulkRowsSkip,
  selectedRowsToSkip = [],
  allCsvData,
  onImport,
  isProcessing = false
}: HookupDataPreviewProps) {
  // Pagination state for Valid Records
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [showRawHeaders, setShowRawHeaders] = useState(true)
  
  // Pagination state for Data Issues
  const [errorsCurrentPage, setErrorsCurrentPage] = useState(0)
  const [errorsPageSize, setErrorsPageSize] = useState(10)
  
  // Pagination state for Records to be Skipped
  const [skippedCurrentPage, setSkippedCurrentPage] = useState(0)
  const [skippedPageSize, setSkippedPageSize] = useState(10)

  // Use all CSV data if available, otherwise fall back to validation sample
  const allDisplayData = allCsvData || validation.sampleData
  
  // Helper function to get cell value (moved up to avoid lexical declaration error)
  const getCellValue = (row: HookupCSVRow, field: string) => {
    const headerName = headerMapping[field]
    if (!headerName) return '—'
    return row[headerName] || '—'
  }
  
  // Filter to show only valid records in the main table
  const validRecords = allDisplayData.filter((row, index) => {
    const channelStr = getCellValue(row, 'channel')
    const lwid = getCellValue(row, 'lwid')
    // Only show records that have both LWID and Channel
    return (channelStr && channelStr !== '—') && (lwid && lwid !== '—')
  })
  
  const totalRows = validRecords.length
  const totalPages = Math.ceil(totalRows / pageSize)
  const startRow = currentPage * pageSize
  const endRow = Math.min(startRow + pageSize, totalRows)
  const currentPageData = validRecords.slice(startRow, endRow)

  // Navigation functions
  const goToFirstPage = () => setCurrentPage(0)
  const goToPreviousPage = () => setCurrentPage(Math.max(0, currentPage - 1))
  const goToNextPage = () => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
  const goToLastPage = () => setCurrentPage(totalPages - 1)
  
  // Reset to first page when page size changes
  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize))
    setCurrentPage(0)
  }

  // Get actual row number in the original dataset for valid records
  const getActualRowNumber = (pageIndex: number) => {
    // Find the original row number from the filtered valid record
    const validRecord = currentPageData[pageIndex]
    if (!validRecord) return startRow + pageIndex + 1
    
    // Find this record's position in the original dataset
    const originalIndex = allDisplayData.findIndex(row => row === validRecord)
    return originalIndex + 1
  }

  // Get error for a specific actual row number
  const getRowError = (actualRowNumber: number) => {
    return validation.errors.find(error => error.row === actualRowNumber)
  }

  // Get row status for display
  const getRowStatus = (actualRowNumber: number, pageIndex: number) => {
    const error = getRowError(actualRowNumber)
    const isSkipped = selectedRowsToSkip.includes(actualRowNumber)
    
    if (isSkipped) {
      return { type: 'skipped', message: 'Will be skipped', color: 'text-muted-foreground' }
    }
    
    // For paginated data, we need to check if this row would be parsed
    const row = currentPageData[pageIndex]
    const channelStr = getCellValue(row, 'channel')
    
    if (!channelStr || channelStr === '—') {
      return { type: 'infrastructure', message: 'Record without a channel number (will be skipped)', color: 'text-blue-600' }
    }
    if (error) {
      return { type: 'error', message: error.message, color: 'text-destructive' }
    }
    return { type: 'valid', message: 'Valid fixture', color: 'text-green-600' }
  }

  const formatCellValue = (value: string, field: string, hasError: boolean) => {
    if (value === '—') return value
    
    // Highlight problematic values
    if (hasError && field === 'channel' && isNaN(parseInt(value, 10))) {
      return (
        <span className="bg-destructive/10 text-destructive px-1 rounded">
          {value}
        </span>
      )
    }
    
    if (field === 'channel') {
      return <span className="font-mono">{value}</span>
    }
    
    return value
  }

  // Calculate import summary
  const validFixturesCount = validRecords.length
  const totalSkippedCount = validation.infrastructureRows + selectedRowsToSkip.length
  const hasErrors = validation.errors.length > 0
  const hasUnresolvedErrors = validation.errors.some(error => 
    error.canSkip && !selectedRowsToSkip.includes(error.row)
  )

  return (
    <div className="space-y-4">
      {/* Import Summary */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Database className="h-4 w-4" />
          Import Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              <span className="font-bold text-green-600">{validFixturesCount}</span> fixtures will be imported
            </span>
          </div>
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-bold text-muted-foreground">{totalSkippedCount}</span> records will be skipped
            </span>
          </div>
        </div>
        
        {hasUnresolvedErrors && (
          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Some data issues need to be resolved or skipped before importing
          </div>
        )}
      </div>

      {/* Validation Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 border rounded-lg text-center">
          <div className="text-lg font-bold text-green-600">
            {validation.validRows}
          </div>
          <div className="text-xs text-muted-foreground">Valid</div>
        </div>
        
        <div className="p-3 border rounded-lg text-center">
          <div className="text-lg font-bold text-blue-600">
            {validation.infrastructureRows}
          </div>
          <div className="text-xs text-muted-foreground">Records without a channel number (will be skipped)</div>
        </div>
        
        <div className="p-3 border rounded-lg text-center">
          <div className="text-lg font-bold text-destructive">
            {validation.errorRows}
          </div>
          <div className="text-xs text-muted-foreground">Errors</div>
        </div>
        
        <div className="p-3 border rounded-lg text-center">
          <div className="text-lg font-bold text-muted-foreground">
            {validation.totalRows}
          </div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
      </div>

      {/* Data Preview Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <h3 className="font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Valid Records
            </h3>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawHeaders(!showRawHeaders)}
              className="text-xs"
            >
              {showRawHeaders ? 'Hide' : 'Show'} CSV Headers
            </Button>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              Showing {startRow + 1}-{endRow} of {totalRows} rows
            </span>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-xs text-muted-foreground px-2">
                Page {currentPage + 1} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              {/* Raw CSV Headers Row */}
              {showRawHeaders && (
                <TableRow className="bg-blue-50 dark:bg-blue-950/20 border-b text-xs">
                  <TableHead className="w-12 text-center">CSV</TableHead>
                  <TableHead className="font-mono">
                    {headerMapping.lwid || <span className="text-muted-foreground">—</span>}
                  </TableHead>
                  <TableHead className="w-20 font-mono">
                    {headerMapping.channel || <span className="text-muted-foreground">—</span>}
                  </TableHead>
                  <TableHead className="font-mono">
                    {headerMapping.position || <span className="text-muted-foreground">—</span>}
                  </TableHead>
                  <TableHead className="w-20 font-mono">
                    {headerMapping.positionOrder || <span className="text-muted-foreground">—</span>}
                  </TableHead>
                  <TableHead className="font-mono">
                    {headerMapping.unitNumber || <span className="text-muted-foreground">—</span>}
                  </TableHead>
                  <TableHead className="font-mono">
                    {headerMapping.fixtureType || <span className="text-muted-foreground">—</span>}
                  </TableHead>
                  <TableHead className="font-mono">
                    {headerMapping.purpose || <span className="text-muted-foreground">—</span>}
                  </TableHead>
                  <TableHead className="font-mono">
                    {headerMapping.universeAddress || <span className="text-muted-foreground">—</span>}
                  </TableHead>
                </TableRow>
              )}
              
              {/* Field Names Row */}
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">Row</TableHead>
                <TableHead>LWID</TableHead>
                <TableHead className="w-20">Channel</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="w-20">Pos Order</TableHead>
                <TableHead>Unit #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Universe/Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageData.map((row, pageIndex) => {
                const actualRowNumber = getActualRowNumber(pageIndex)
                const error = getRowError(actualRowNumber)
                const status = getRowStatus(actualRowNumber, pageIndex)
                const isSkipped = selectedRowsToSkip.includes(actualRowNumber)
                
                return (
                  <TableRow 
                    key={actualRowNumber}
                    className={cn(
                      status.type === 'error' && "bg-destructive/5",
                      status.type === 'infrastructure' && "bg-blue-50 dark:bg-blue-950/20",
                      isSkipped && "opacity-50 bg-muted/20"
                    )}
                  >
                    <TableCell className="font-mono text-xs">
                      {actualRowNumber}
                    </TableCell>
                    
                    <TableCell className="font-mono text-xs max-w-24 truncate">
                      {formatCellValue(getCellValue(row, 'lwid'), 'lwid', error?.field === 'lwid')}
                    </TableCell>
                    
                    <TableCell>
                      {formatCellValue(getCellValue(row, 'channel'), 'channel', error?.field === 'channel')}
                    </TableCell>
                    
                    <TableCell className="max-w-32 truncate">
                      {getCellValue(row, 'position')}
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs">
                      {getCellValue(row, 'positionOrder')}
                    </TableCell>

                    <TableCell className="text-center">
                      {getCellValue(row, 'unitNumber')}
                    </TableCell>
                    
                    <TableCell className="max-w-32 truncate">
                      {getCellValue(row, 'fixtureType')}
                    </TableCell>
                    
                    <TableCell className="max-w-32 truncate">
                      {getCellValue(row, 'purpose')}
                    </TableCell>
                    
                    <TableCell className="font-mono text-xs">
                      {getCellValue(row, 'universeAddress')}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Error Details */}
      {validation.errors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Data Issues ({validation.errors.length})
              </h4>
              
              {(onRowToggleSkip || onBulkRowsSkip) && (
                <Button
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    // Get ALL skippable errors (not just current page)
                    const skippableErrors = validation.errors.filter(error => error.canSkip)
                    const rowsToSkip = skippableErrors
                      .filter(error => !selectedRowsToSkip.includes(error.row))
                      .map(error => error.row)
                    
                    if (onBulkRowsSkip && rowsToSkip.length > 0) {
                      // Use bulk skip for better performance and reliability
                      onBulkRowsSkip(rowsToSkip)
                    } else if (onRowToggleSkip && rowsToSkip.length > 0) {
                      // Fallback to individual skips if bulk not available
                      rowsToSkip.forEach(rowNumber => onRowToggleSkip(rowNumber))
                    }
                  }}
                  className="text-xs"
                >
                  Skip All Issues ({validation.errors.filter(error => error.canSkip).length})
                </Button>
              )}
            </div>
            
            {/* Navigation Controls for Errors */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                Showing {errorsCurrentPage * errorsPageSize + 1}-{Math.min((errorsCurrentPage + 1) * errorsPageSize, validation.errors.length)} of {validation.errors.length} issues
              </span>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setErrorsCurrentPage(Math.max(0, errorsCurrentPage - 1))}
                  disabled={errorsCurrentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-xs text-muted-foreground px-2">
                  Page {errorsCurrentPage + 1} of {Math.ceil(validation.errors.length / errorsPageSize)}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setErrorsCurrentPage(Math.min(Math.ceil(validation.errors.length / errorsPageSize) - 1, errorsCurrentPage + 1))}
                  disabled={errorsCurrentPage === Math.ceil(validation.errors.length / errorsPageSize) - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Select 
                  value={errorsPageSize.toString()} 
                  onValueChange={(value) => {
                    setErrorsPageSize(parseInt(value))
                    setErrorsCurrentPage(0)
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-1 border rounded-lg p-3">
            {validation.errors.slice(errorsCurrentPage * errorsPageSize, (errorsCurrentPage + 1) * errorsPageSize).map((error, index) => {
              const isSkipped = selectedRowsToSkip.includes(error.row)
              
              return (
                <div 
                  key={index} 
                  className={cn(
                    "text-sm flex items-center justify-between p-2 bg-destructive/5 rounded",
                    isSkipped && "opacity-50 bg-muted/20"
                  )}
                >
                  <span className={isSkipped ? "line-through" : ""}>
                    <strong>Row {error.row}:</strong> {error.message}
                    {error.value && <span className="text-muted-foreground"> ('{error.value}')</span>}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {error.canSkip && onRowToggleSkip ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSkipped}
                          onChange={() => onRowToggleSkip(error.row)}
                          className="w-4 h-4 rounded border-gray-300 text-destructive focus:ring-destructive focus:ring-2"
                          id={`skip-error-${error.row}`}
                        />
                        <label 
                          htmlFor={`skip-error-${error.row}`}
                          className="text-xs text-muted-foreground cursor-pointer"
                        >
                          Skip this record
                        </label>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Cannot skip
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Records to be Skipped Section */}
      {(() => {
        // Get records that will be automatically skipped
        const skippedRecords = allDisplayData.filter((row, index) => {
          const channelStr = getCellValue(row, 'channel')
          const lwid = getCellValue(row, 'lwid')
          return (!channelStr || channelStr === '—') || (!lwid || lwid === '—')
        })
        
        return skippedRecords.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <X className="h-4 w-4 text-blue-600" />
                Records to be Skipped ({skippedRecords.length})
              </h4>
              
              {/* Navigation Controls for Skipped Records */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  Showing {skippedCurrentPage * skippedPageSize + 1}-{Math.min((skippedCurrentPage + 1) * skippedPageSize, skippedRecords.length)} of {skippedRecords.length} records
                </span>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSkippedCurrentPage(Math.max(0, skippedCurrentPage - 1))}
                    disabled={skippedCurrentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-xs text-muted-foreground px-2">
                    Page {skippedCurrentPage + 1} of {Math.ceil(skippedRecords.length / skippedPageSize)}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSkippedCurrentPage(Math.min(Math.ceil(skippedRecords.length / skippedPageSize) - 1, skippedCurrentPage + 1))}
                    disabled={skippedCurrentPage === Math.ceil(skippedRecords.length / skippedPageSize) - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Select 
                    value={skippedPageSize.toString()} 
                    onValueChange={(value) => {
                      setSkippedPageSize(parseInt(value))
                      setSkippedCurrentPage(0)
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead>LWID</TableHead>
                    <TableHead className="w-20">Channel</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="w-20">Pos Order</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skippedRecords.slice(skippedCurrentPage * skippedPageSize, (skippedCurrentPage + 1) * skippedPageSize).map((row, index) => {
                    const channelStr = getCellValue(row, 'channel')
                    const lwid = getCellValue(row, 'lwid')
                    const originalRowNumber = allDisplayData.findIndex(r => r === row) + 1
                    
                    let reason = []
                    if (!channelStr || channelStr === '—') reason.push('No channel')
                    if (!lwid || lwid === '—') reason.push('No LWID')
                    
                    return (
                      <TableRow 
                        key={index}
                        className="bg-blue-50 dark:bg-blue-950/20 opacity-75"
                      >
                        <TableCell className="font-mono text-xs">
                          {originalRowNumber}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-24 truncate">
                          {lwid || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {channelStr || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="max-w-32 truncate">
                          {getCellValue(row, 'position')}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {getCellValue(row, 'positionOrder')}
                        </TableCell>
                        <TableCell className="max-w-32 truncate">
                          {getCellValue(row, 'fixtureType')}
                        </TableCell>
                        <TableCell className="max-w-32 truncate">
                          {getCellValue(row, 'purpose')}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {reason.join(', ')}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      })()}

      {/* Action Buttons */}
      {onImport && (
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Ready to import {validFixturesCount} fixtures
            {totalSkippedCount > 0 && ` (${totalSkippedCount} records will be skipped)`}
          </div>
          <Button 
            onClick={onImport}
            disabled={isProcessing || hasUnresolvedErrors}
            className="min-w-32"
          >
            {isProcessing ? 'Importing...' : 'Import Fixtures'}
          </Button>
        </div>
      )}
    </div>
  )
}