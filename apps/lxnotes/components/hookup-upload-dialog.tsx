'use client'

import { useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogScrollableContent,
  DialogStickyFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { HookupParser } from '@/lib/services/hookup-parser'
import { useFixtureStore } from '@/lib/stores/fixture-store'
import { createSupabaseStorageAdapter } from '@/lib/supabase/supabase-storage-adapter'
import { HookupHeaderMapping } from '@/components/hookup-header-mapping'
import { HookupDataPreview } from '@/components/hookup-data-preview'
import type {
  HookupUploadResult,
  ValidationResult,
  ImportOptions,
  HookupCSVRow,
  ParsedHookupRow
} from '@/types'

interface HookupUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  productionId: string
}

interface UploadState {
  isDragOver: boolean
  isProcessing: boolean
  file: File | null
  headers: string[]
  headerMapping: Record<string, string>
  parsedCsvData: HookupCSVRow[] | null
  validation: ValidationResult | null
  importOptions: ImportOptions
  result: HookupUploadResult | null
  error: string | null
  step: 'upload' | 'mapping' | 'preview' | 'result'
}

export function HookupUploadDialog({
  isOpen,
  onClose,
  productionId
}: HookupUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const isDemoMode = pathname.startsWith('/demo')
  const { uploadFixtures, isProcessing, getFixturesByProduction } = useFixtureStore()
  
  const [state, setState] = useState<UploadState>({
    isDragOver: false,
    isProcessing: false,
    file: null,
    headers: [],
    headerMapping: {},
    parsedCsvData: null,
    validation: null,
    importOptions: {
      skipInvalidChannels: true,
      skipMissingLwid: true,
      skipDuplicates: true,
      deactivateMissing: true,
      selectedRowsToSkip: []
    },
    result: null,
    error: null,
    step: 'upload'
  })

  const resetState = () => {
    setState({
      isDragOver: false,
      isProcessing: false,
      file: null,
      headers: [],
      headerMapping: {},
      parsedCsvData: null,
      validation: null,
      importOptions: {
        skipInvalidChannels: true,
        skipMissingLwid: true,
        skipDuplicates: true,
        deactivateMissing: true,
        selectedRowsToSkip: []
      },
      result: null,
      error: null,
      step: 'upload'
    })
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState(prev => ({ ...prev, isDragOver: true }))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState(prev => ({ ...prev, isDragOver: false }))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState(prev => ({ ...prev, isDragOver: false }))

    const files = Array.from(e.dataTransfer.files)
    const csvFile = files.find(file => 
      file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
    )

    if (csvFile) {
      handleFileSelect(csvFile)
    } else {
      setState(prev => ({ 
        ...prev, 
        error: 'Please select a CSV file.'
      }))
    }
  }, [])

  // File selection handler
  const handleFileSelect = async (file: File) => {
    // Validate file size (max 10MB)
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxFileSize) {
      setState(prev => ({ 
        ...prev, 
        error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 10MB.`
      }))
      return
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null, file }))

    try {
      const { headers, rows, headerMapping } = await HookupParser.parseCSV(file)
      
      // Validate row count (max 10,000 rows)
      const maxRows = 10000
      if (rows.length > maxRows) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: `File too large (${rows.length.toLocaleString()} rows). Maximum is ${maxRows.toLocaleString()} rows for performance.`
        }))
        return
      }

      // Store parsed data to avoid re-parsing
      setState(prev => ({
        ...prev,
        headers,
        headerMapping,
        // Store parsed rows in state to reuse
        parsedCsvData: rows,
        isProcessing: false,
        step: 'mapping'
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to parse CSV file'
      }))
    }
  }

  const handleBrowseFiles = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Auto-detect header mapping
  const handleAutoDetect = async () => {
    if (!state.file || !state.parsedCsvData) return
    
    setState(prev => ({ ...prev, isProcessing: true }))
    
    try {
      // Use cached data instead of re-parsing
      const headerMapping = HookupParser.detectHeaderMapping(state.headers)
      setState(prev => ({
        ...prev,
        headerMapping,
        isProcessing: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Auto-detection failed'
      }))
    }
  }

  // Proceed to data preview
  const handleProceedToPreview = async () => {
    if (!state.parsedCsvData) return
    
    setState(prev => ({ ...prev, isProcessing: true }))
    
    try {
      // Use cached data instead of re-parsing (now async)
      const validation = await HookupParser.validateRows(state.parsedCsvData, state.headerMapping)
      
      setState(prev => ({
        ...prev,
        validation,
        isProcessing: false,
        step: 'preview'
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }))
    }
  }

  // Process upload
  const handleUpload = async () => {
    if (!state.parsedCsvData) return

    setState(prev => ({ ...prev, isProcessing: true }))

    try {
      // Use cached data instead of re-parsing
      const parseResult = HookupParser.parseRows(state.parsedCsvData, state.headerMapping, state.importOptions)
      
      // Extract the successfully parsed rows for store upload
      const validParsedRows: ParsedHookupRow[] = []
      
      state.parsedCsvData.forEach((row, index) => {
        const rowNumber = index + 1
        
        // Skip if explicitly selected to skip
        if (state.importOptions.selectedRowsToSkip.includes(rowNumber)) {
          return
        }
        
        const lwid = row[state.headerMapping.lwid] || ''
        const channelStr = row[state.headerMapping.channel] || ''
        const channel = parseInt(channelStr, 10)
        
        // Skip infrastructure rows, invalid channels, missing LWIDs based on options
        if (!channelStr || 
            (!lwid && state.importOptions.skipMissingLwid) ||
            (isNaN(channel) && state.importOptions.skipInvalidChannels)) {
          return
        }
        
        // Only include valid fixture rows
        if (lwid && !isNaN(channel)) {
          // Parse position order if available
          const positionOrderStr = row[state.headerMapping.positionOrder] || ''
          let positionOrder: number | undefined
          if (positionOrderStr) {
            const parsed = parseInt(positionOrderStr, 10)
            if (!isNaN(parsed)) {
              positionOrder = parsed
            }
          }

          validParsedRows.push({
            lwid,
            channel,
            position: row[state.headerMapping.position] || '',
            unitNumber: row[state.headerMapping.unitNumber] || '',
            fixtureType: row[state.headerMapping.fixtureType] || '',
            purpose: row[state.headerMapping.purpose] || '',
            universeAddressRaw: row[state.headerMapping.universeAddress] || '',
            universe: undefined,
            address: undefined,
            positionOrder
          })
        }
      })

      // Upload to store (local state)
      const storeResult = uploadFixtures(productionId, validParsedRows, state.importOptions.deactivateMissing)

      // Persist to Supabase if not in demo mode
      if (!isDemoMode) {
        try {
          const storageAdapter = createSupabaseStorageAdapter(productionId)
          const fixturesForProduction = getFixturesByProduction(productionId)
          await storageAdapter.fixtures.upload(fixturesForProduction)
        } catch (supabaseError) {
          console.error('[HookupUploadDialog] Failed to persist fixtures to Supabase:', supabaseError)
          // Continue anyway - local state is updated, will try to sync later
        }
      }

      // Combine parser result with store result
      const combinedResult = {
        ...parseResult,
        inserted: storeResult.inserted,
        updated: storeResult.updated,
        inactivated: storeResult.inactivated
      }

      setState(prev => ({
        ...prev,
        result: combinedResult,
        isProcessing: false,
        step: 'result'
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }))
    }
  }

  const renderUploadStep = () => ({
    content: (
      <div className="space-y-6">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            state.isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-border",
            state.error && "border-destructive"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <Upload className={cn(
              "h-12 w-12",
              state.isDragOver ? "text-primary" : "text-muted-foreground"
            )} />
            
            <div>
              <p className="text-lg font-medium text-foreground mb-2">
                Drop your hookup CSV file here
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                or click to browse files
              </p>
              <Button 
                variant="outline" 
                onClick={handleBrowseFiles}
                disabled={state.isProcessing}
              >
                {state.isProcessing ? 'Processing...' : 'Browse Files'}
              </Button>
            </div>
          </div>
        </div>

        {state.error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {state.error}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    ),
    footer: null
  })

  // Step 2: Header Mapping
  const renderMappingStep = () => ({
    content: (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          {state.file?.name}
        </div>

        <HookupHeaderMapping
          headers={state.headers}
          headerMapping={state.headerMapping}
          onMappingChange={(mapping) => 
            setState(prev => ({ ...prev, headerMapping: mapping }))
          }
          onAutoDetect={handleAutoDetect}
        />

        {/* Large file warning */}
        {state.parsedCsvData && state.parsedCsvData.length > 1000 && (
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="text-sm text-orange-700 dark:text-orange-300">
              <strong>Large file detected</strong> ({state.parsedCsvData.length.toLocaleString()} rows). 
              Data processing may take a moment.
            </div>
          </div>
        )}
      </div>
    ),
    footer: (
      <div className="flex justify-between w-full">
        <Button variant="outline" onClick={resetState}>
          Back
        </Button>
        <Button 
          onClick={handleProceedToPreview}
          disabled={state.isProcessing || !state.headerMapping.lwid || !state.headerMapping.channel}
        >
          {state.isProcessing ? 'Analyzing data...' : 'Continue'}
        </Button>
      </div>
    )
  })

  // Step 3: Data Preview
  const renderPreviewStep = () => ({
    content: (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          {state.file?.name}
        </div>

        {state.validation && (
          <HookupDataPreview
            validation={state.validation}
            headerMapping={state.headerMapping}
            allCsvData={state.parsedCsvData || undefined}
            onRowToggleSkip={(rowNumber) => {
              const currentSkip = state.importOptions.selectedRowsToSkip
              const isCurrentlySkipped = currentSkip.includes(rowNumber)
              
              setState(prev => ({
                ...prev,
                importOptions: {
                  ...prev.importOptions,
                  selectedRowsToSkip: isCurrentlySkipped
                    ? currentSkip.filter(row => row !== rowNumber)
                    : [...currentSkip, rowNumber]
                }
              }))
            }}
            onBulkRowsSkip={(rowNumbers) => {
              setState(prev => ({
                ...prev,
                importOptions: {
                  ...prev.importOptions,
                  selectedRowsToSkip: [
                    ...new Set([...prev.importOptions.selectedRowsToSkip, ...rowNumbers])
                  ]
                }
              }))
            }}
            selectedRowsToSkip={state.importOptions.selectedRowsToSkip}
            onImport={handleUpload}
            isProcessing={state.isProcessing}
          />
        )}
      </div>
    ),
    footer: (
      <div className="flex justify-start w-full">
        <Button variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'mapping' }))}>
          Back to Mapping
        </Button>
      </div>
    )
  })


  const renderResultStep = () => ({
    content: (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          {state.result?.success ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}
          <h3 className="font-medium">
            {state.result?.success ? 'Upload Successful' : 'Upload Completed with Errors'}
          </h3>
        </div>

        {state.result && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {state.result.inserted}
              </div>
              <div className="text-sm text-muted-foreground">Inserted</div>
            </div>
            
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {state.result.updated}
              </div>
              <div className="text-sm text-muted-foreground">Updated</div>
            </div>
            
            {state.result.inactivated > 0 && (
              <div className="p-3 border rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {state.result.inactivated}
                </div>
                <div className="text-sm text-muted-foreground">Inactivated</div>
              </div>
            )}
            
            {state.result.skippedInfrastructure > 0 && (
              <div className="p-3 border rounded-lg text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {state.result.skippedInfrastructure}
                </div>
                <div className="text-sm text-muted-foreground">Infrastructure Skipped</div>
              </div>
            )}
            
            {state.result.errors.length > 0 && (
              <div className="p-3 border rounded-lg text-center">
                <div className="text-2xl font-bold text-destructive">
                  {state.result.errors.length}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Skip Reporting */}
        {state.result && (state.result.skippedInfrastructure > 0 || state.importOptions.selectedRowsToSkip.length > 0) && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Skipped Rows Summary</h4>
            
            {state.result.skippedInfrastructure > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>{state.result.skippedInfrastructure} infrastructure rows</strong> were automatically skipped (circuits, power connections, etc. without channel numbers).
                </div>
              </div>
            )}
            
            {state.importOptions.selectedRowsToSkip.length > 0 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  <strong>{state.importOptions.selectedRowsToSkip.length} rows with errors</strong> were manually skipped.
                  {state.validation && (
                    <div className="mt-2 space-y-1">
                      {state.validation.errors
                        .filter(error => state.importOptions.selectedRowsToSkip.includes(error.row))
                        .slice(0, 5)
                        .map((error, index) => (
                          <div key={index} className="text-xs">
                            Row {error.row}: {error.message}
                          </div>
                        ))
                      }
                      {state.validation.errors.filter(error => 
                        state.importOptions.selectedRowsToSkip.includes(error.row)
                      ).length > 5 && (
                        <div className="text-xs">
                          ... and {state.validation.errors.filter(error => 
                            state.importOptions.selectedRowsToSkip.includes(error.row)
                          ).length - 5} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {state.result?.errors && state.result.errors.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Errors</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {state.result.errors.map((error, index) => (
                <div key={index} className="text-sm text-destructive bg-destructive/5 p-2 rounded">
                  Row {error.row}: {error.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    footer: (
      <div className="flex justify-end w-full">
        <Button onClick={handleClose}>
          Close
        </Button>
      </div>
    )
  })

  const getCurrentStep = () => {
    switch (state.step) {
      case 'upload': return renderUploadStep()
      case 'mapping': return renderMappingStep()
      case 'preview': return renderPreviewStep()
      case 'result': return renderResultStep()
      default: return renderUploadStep()
    }
  }

  const currentStep = getCurrentStep()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Hookup CSV
          </DialogTitle>
        </DialogHeader>

        <DialogScrollableContent>
          {currentStep.content}
        </DialogScrollableContent>

        {currentStep.footer && (
          <DialogStickyFooter>
            {currentStep.footer}
          </DialogStickyFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
