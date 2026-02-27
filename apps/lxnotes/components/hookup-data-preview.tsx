'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Database, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  ValidationResult,
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
  const [showRawHeaders, setShowRawHeaders] = useState(true)

  // Use all CSV data if available, otherwise fall back to validation sample
  const allDisplayData = allCsvData || validation.sampleData
  
  // Helper function to get cell value (moved up to avoid lexical declaration error)
  const getCellValue = (row: HookupCSVRow, field: string) => {
    const headerName = headerMapping[field]
    if (!headerName) return '—'
    return row[headerName] || '—'
  }
  
  // Filter to show only valid records in the main table
  const validRecords = allDisplayData.filter((row) => {
    const channelStr = getCellValue(row, 'channel')
    const lwid = getCellValue(row, 'lwid')
    // Only show records that have both LWID and Channel
    return (channelStr && channelStr !== '—') && (lwid && lwid !== '—')
  })

  const totalRows = validRecords.length

  // Get actual row number in the original dataset for valid records
  const getActualRowNumber = (validRecordIndex: number) => {
    // Find the original row number from the filtered valid record
    const validRecord = validRecords[validRecordIndex]
    if (!validRecord) return validRecordIndex + 1

    // Find this record's position in the original dataset
    const originalIndex = allDisplayData.findIndex(row => row === validRecord)
    return originalIndex + 1
  }

  // Get error for a specific actual row number
  const getRowError = (actualRowNumber: number) => {
    return validation.errors.find(error => error.row === actualRowNumber)
  }

  // Get row status for display
  const getRowStatus = (actualRowNumber: number, validRecordIndex: number) => {
    const error = getRowError(actualRowNumber)
    const isSkipped = selectedRowsToSkip.includes(actualRowNumber)

    if (isSkipped) {
      return { type: 'skipped', message: 'Will be skipped', color: 'text-muted-foreground' }
    }

    // Check if this row would be parsed
    const row = validRecords[validRecordIndex]
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
          
          {/* Row Count Display */}
          <div className="text-sm text-muted-foreground">
            Showing 1-{totalRows} of {totalRows} rows
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
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
              {validRecords.map((row, validRecordIndex) => {
                const actualRowNumber = getActualRowNumber(validRecordIndex)
                const error = getRowError(actualRowNumber)
                const status = getRowStatus(actualRowNumber, validRecordIndex)
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
            
            {/* Error Count Display */}
            <div className="text-sm text-muted-foreground">
              Showing 1-{validation.errors.length} of {validation.errors.length} issues
            </div>
          </div>
          <div className="space-y-1 border rounded-lg p-3 max-h-48 overflow-y-auto">
            {validation.errors.map((error, index) => {
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
                    {error.value && (
                      <span className="text-muted-foreground"> (&apos;{error.value}&apos;)</span>
                    )}
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
        const skippedRecords = allDisplayData.filter((row) => {
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
              
              {/* Skipped Records Count Display */}
              <div className="text-sm text-muted-foreground">
                Showing 1-{skippedRecords.length} of {skippedRecords.length} records
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
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
                  {skippedRecords.map((row, index) => {
                    const channelStr = getCellValue(row, 'channel')
                    const lwid = getCellValue(row, 'lwid')
                    const originalRowNumber = allDisplayData.findIndex(r => r === row) + 1

                    const reasons: string[] = []
                    if (!channelStr || channelStr === '—') reasons.push('No channel')
                    if (!lwid || lwid === '—') reasons.push('No LWID')
                    
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
                            {reasons.join(', ')}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              </div>
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
