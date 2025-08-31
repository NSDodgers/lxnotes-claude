'use client'

import { useState } from 'react'
import { AlertTriangle, CheckSquare, Square, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { ValidationResult, RowError, ImportOptions } from '@/types'

interface ErrorHandlingProps {
  validation: ValidationResult
  importOptions: ImportOptions
  onOptionsChange: (options: ImportOptions) => void
}

export function LightwrightErrorHandling({
  validation,
  importOptions,
  onOptionsChange
}: ErrorHandlingProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const errorsByType = validation.errors.reduce((acc, error) => {
    if (!acc[error.type]) acc[error.type] = []
    acc[error.type].push(error)
    return acc
  }, {} as Record<string, RowError[]>)

  const errorTypeInfo = {
    invalid_channel: {
      label: 'Invalid Channel Numbers',
      description: 'Channels with non-numeric values (e.g., "Cut", "N/A")',
      color: 'text-red-600',
      defaultSkip: true
    },
    missing_lwid: {
      label: 'Missing Lightwright ID',
      description: 'Fixtures without a Lightwright ID',
      color: 'text-orange-600',
      defaultSkip: true
    },
    duplicate_lwid: {
      label: 'Duplicate Lightwright ID',
      description: 'Multiple rows with the same LWID',
      color: 'text-yellow-600',
      defaultSkip: false
    },
    missing_channel: {
      label: 'Missing Channel',
      description: 'Infrastructure rows without channel numbers',
      color: 'text-blue-600',
      defaultSkip: true
    },
    parsing_error: {
      label: 'Parsing Errors',
      description: 'General data parsing issues',
      color: 'text-purple-600',
      defaultSkip: true
    }
  }

  const handleBulkSkip = (errorType: string, skip: boolean) => {
    const errorsOfType = errorsByType[errorType] || []
    const rowsToToggle = errorsOfType.map(error => error.row)
    
    let updatedSkipList = [...importOptions.selectedRowsToSkip]
    
    if (skip) {
      // Add rows to skip list
      rowsToToggle.forEach(row => {
        if (!updatedSkipList.includes(row)) {
          updatedSkipList.push(row)
        }
      })
    } else {
      // Remove rows from skip list
      updatedSkipList = updatedSkipList.filter(row => !rowsToToggle.includes(row))
    }
    
    onOptionsChange({
      ...importOptions,
      selectedRowsToSkip: updatedSkipList
    })
  }

  const handleSingleRowSkip = (rowNumber: number, skip: boolean) => {
    let updatedSkipList = [...importOptions.selectedRowsToSkip]
    
    if (skip) {
      if (!updatedSkipList.includes(rowNumber)) {
        updatedSkipList.push(rowNumber)
      }
    } else {
      updatedSkipList = updatedSkipList.filter(row => row !== rowNumber)
    }
    
    onOptionsChange({
      ...importOptions,
      selectedRowsToSkip: updatedSkipList
    })
  }

  const handleOptionChange = (option: keyof ImportOptions, value: boolean) => {
    onOptionsChange({
      ...importOptions,
      [option]: value
    })
  }

  if (validation.errorRows === 0) {
    return (
      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
        <div className="flex items-center gap-2 text-green-600">
          <CheckSquare className="h-4 w-4" />
          <span className="font-medium">No data issues found</span>
        </div>
        <p className="text-sm text-green-600/80 mt-1">
          All fixture rows are valid and ready for import.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Summary */}
      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">
            {validation.errorRows} rows have issues
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">
          Choose how to handle problematic rows. You can skip individual rows or entire categories of errors.
        </p>

        {/* Bulk Actions by Error Type */}
        <div className="space-y-3">
          {Object.entries(errorsByType).map(([errorType, errors]) => {
            const info = errorTypeInfo[errorType as keyof typeof errorTypeInfo]
            const allSkipped = errors.every(error => 
              importOptions.selectedRowsToSkip.includes(error.row)
            )
            const someSkipped = errors.some(error => 
              importOptions.selectedRowsToSkip.includes(error.row)
            )
            
            return (
              <div key={errorType} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={allSkipped ? true : someSkipped ? 'indeterminate' : false}
                    onCheckedChange={(checked) => handleBulkSkip(errorType, checked === true)}
                  />
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium text-sm", info?.color)}>
                        {info?.label || errorType}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {errors.length} row{errors.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {info?.description || 'Data validation error'}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant={allSkipped ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => handleBulkSkip(errorType, !allSkipped)}
                >
                  {allSkipped ? 'Include All' : 'Skip All'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Individual Row Details */}
      <div className="space-y-2">
        <Button 
          variant="ghost" 
          className="w-full justify-between p-3 h-auto"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Individual Row Actions</span>
          </div>
          <Badge variant="outline">
            {validation.errors.length} issues
          </Badge>
        </Button>
        
        {isExpanded && (
          <div className="space-y-2">
            <div className="border-t" />
            
            <div className="max-h-64 overflow-y-auto space-y-2">
            {validation.errors.slice(0, 25).map((error, index) => {
              const isSkipped = importOptions.selectedRowsToSkip.includes(error.row)
              const info = errorTypeInfo[error.type as keyof typeof errorTypeInfo]
              
              return (
                <div 
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-2 border rounded text-sm",
                    isSkipped && "bg-muted/30 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Checkbox
                      checked={isSkipped}
                      onCheckedChange={(checked) => 
                        handleSingleRowSkip(error.row, checked === true)
                      }
                    />
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">Row {error.row}:</span>
                        <span className={info?.color}>{error.message}</span>
                      </div>
                      
                      {error.value && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Value: <span className="font-mono">'{error.value}'</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Badge 
                    variant={isSkipped ? "destructive" : "outline"}
                    className="text-xs"
                  >
                    {isSkipped ? 'Skipped' : 'Include'}
                  </Badge>
                </div>
              )
            })}
            
            {validation.errors.length > 25 && (
              <div className="text-center text-xs text-muted-foreground py-2">
                ... and {validation.errors.length - 25} more issues
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Import Summary */}
      <div className="p-3 border rounded-lg bg-muted/30">
        <h4 className="font-medium text-sm mb-2">Import Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-green-600 font-medium">
              {validation.validRows - importOptions.selectedRowsToSkip.filter(row => 
                validation.errors.some(error => error.row === row)
              ).length}
            </span>
            <span className="text-muted-foreground ml-1">fixtures will be imported</span>
          </div>
          <div>
            <span className="text-destructive font-medium">
              {importOptions.selectedRowsToSkip.length}
            </span>
            <span className="text-muted-foreground ml-1">rows will be skipped</span>
          </div>
        </div>
      </div>
    </div>
  )
}