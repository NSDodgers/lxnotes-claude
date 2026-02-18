'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Upload, FileText, AlertCircle, CheckCircle, ChevronRight, AlertTriangle, Download, ChevronDown, ChevronUp, Apple, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthContext } from '@/components/auth/auth-provider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

interface HookupImportSidebarProps {
  isOpen: boolean
  onClose: () => void
  productionId: string
  onImportComplete?: (result: HookupUploadResult) => void
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
  hasExistingData: boolean
  differencePercentage: number | null
  showDifferenceWarning: boolean
  isSetupExpanded: boolean
}

const steps = [
  { id: 'upload', label: 'Upload File', description: 'Select CSV file' },
  { id: 'mapping', label: 'Map Headers', description: 'Configure column mapping' },
  { id: 'preview', label: 'Preview Data', description: 'Review and validate' },
  { id: 'result', label: 'Results', description: 'Import summary' }
]

export function HookupImportSidebar({
  isOpen,
  onClose,
  productionId,
  onImportComplete
}: HookupImportSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const isDemoMode = pathname.startsWith('/demo')
  const { isAuthenticated } = useAuthContext()
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
    step: 'upload',
    hasExistingData: false,
    differencePercentage: null,
    showDifferenceWarning: false,
    isSetupExpanded: false
  })

  const syncFixtures = useFixtureStore((state) => state.syncFixtures)

  // Fetch fresh fixture data from Supabase when sidebar opens
  useEffect(() => {
    if (!isOpen || isDemoMode || !isAuthenticated || !productionId || productionId === 'demo-production') {
      return
    }

    const fetchFixtureData = async () => {
      try {
        const storageAdapter = createSupabaseStorageAdapter(productionId)
        const fixtures = await storageAdapter.fixtures.getAll()
        syncFixtures(productionId, fixtures)
      } catch (error) {
        console.error('[HookupImportSidebar] Failed to fetch fixture data:', error)
      }
    }

    fetchFixtureData()
  }, [isOpen, isDemoMode, isAuthenticated, productionId, syncFixtures])

  const resetState = () => {
    // Check for existing data when resetting
    const existingFixtures = getFixturesByProduction(productionId)
    const hasExistingData = existingFixtures.length > 0

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
      step: 'upload',
      hasExistingData,
      differencePercentage: null,
      showDifferenceWarning: false,
      isSetupExpanded: false
    })
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  // Get current step index for progress indicator
  const currentStepIndex = steps.findIndex(step => step.id === state.step)

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
      const validation = await HookupParser.validateRows(state.parsedCsvData, state.headerMapping)

      // Calculate difference percentage if existing data exists
      let differencePercentage: number | null = null
      let showDifferenceWarning = false

      if (state.hasExistingData) {
        const existingFixtures = getFixturesByProduction(productionId)
        const existingLwids = new Set(existingFixtures.map(f => f.lwid))

        // Get LWIDs from new CSV data
        const newLwids = new Set(
          state.parsedCsvData
            .map(row => row[state.headerMapping.lwid])
            .filter(lwid => lwid && lwid.trim() !== '')
        )

        if (newLwids.size > 0) {
          // Calculate how many LWIDs are different
          const intersectionSize = new Set([...existingLwids].filter(lwid => newLwids.has(lwid))).size
          const unionSize = new Set([...existingLwids, ...newLwids]).size
          const totalLwids = Math.max(existingLwids.size, newLwids.size)

          // Calculate percentage of difference
          differencePercentage = totalLwids > 0 ? Math.round(((totalLwids - intersectionSize) / totalLwids) * 100) : 0

          // Show warning if more than 30% difference
          showDifferenceWarning = differencePercentage > 30
        }
      }

      setState(prev => ({
        ...prev,
        validation,
        differencePercentage,
        showDifferenceWarning,
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

      // Persist to Supabase if not in demo mode and authenticated
      if (!isDemoMode && isAuthenticated) {
        try {
          const storageAdapter = createSupabaseStorageAdapter(productionId)
          const fixturesForProduction = getFixturesByProduction(productionId)
          await storageAdapter.fixtures.upload(fixturesForProduction)
        } catch (supabaseError: unknown) {
          const errorMessage = supabaseError instanceof Error ? supabaseError.message : String(supabaseError)
          console.error('[HookupImportSidebar] Failed to persist fixtures to Supabase:', errorMessage)
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

      // Call completion callback if provided
      if (onImportComplete) {
        onImportComplete(combinedResult)
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }))
    }
  }

  // Step navigation
  const canProceedFromMapping = state.headerMapping.lwid && state.headerMapping.channel
  const canProceedFromPreview = state.validation && !state.isProcessing

  const renderStepContent = () => {
    switch (state.step) {
      case 'upload':
        return (
          <div className="space-y-6">
            {/* Existing Data Warning */}
            {state.hasExistingData && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Existing Data Will Be Overwritten</AlertTitle>
                <AlertDescription>
                  This production already contains hookup data. Importing a new CSV will replace all existing fixture information.
                </AlertDescription>
              </Alert>
            )}

            <div
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                state.isDragOver
                  ? "border-modules-work bg-modules-work/5"
                  : "border-bg-hover",
                state.error && "border-destructive"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <Upload className={cn(
                  "h-12 w-12",
                  state.isDragOver ? "text-modules-work" : "text-text-muted"
                )} />

                <div>
                  <p className="text-lg font-medium text-text-primary mb-2">
                    Drop your hookup CSV file here
                  </p>
                  <p className="text-text-secondary text-sm mb-4">
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

            {/* Lightwright Automated Action Section */}
            <div className="border border-bg-hover rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, isSetupExpanded: !prev.isSetupExpanded }))}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-bg-tertiary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-modules-work" />
                  <div>
                    <div className="font-medium text-text-primary">Lightwright Automated Action</div>
                    <div className="text-sm text-text-secondary">Export your hookup with the correct format</div>
                  </div>
                </div>
                {state.isSetupExpanded ? (
                  <ChevronUp className="h-5 w-5 text-text-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-text-muted" />
                )}
              </button>

              {state.isSetupExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-bg-hover">
                  <p className="text-sm text-text-secondary pt-4">
                    Install this automated action in Lightwright to export your hookup data in the format LX Notes expects.
                  </p>

                  <a
                    href="/lxnotes-with-position.lwa"
                    download="lxnotes with position.lwa"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-modules-work hover:bg-modules-work/90 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Automated Action
                  </a>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-medium text-text-primary">Installation Instructions</h4>

                    <div className="flex items-start gap-3 p-3 bg-bg-tertiary rounded-lg">
                      <Apple className="h-5 w-5 text-text-secondary mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-text-primary">macOS</div>
                        <div className="text-sm text-text-secondary mt-1">
                          Place the downloaded file in:
                        </div>
                        <code className="block mt-1 text-xs bg-bg-secondary px-2 py-1 rounded text-modules-work break-all">
                          /Users/Shared/Lightwright 6/Automated Actions
                        </code>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-bg-tertiary rounded-lg">
                      <Monitor className="h-5 w-5 text-text-secondary mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-text-primary">Windows</div>
                        <div className="text-sm text-text-secondary mt-1">
                          Place the downloaded file in:
                        </div>
                        <code className="block mt-1 text-xs bg-bg-secondary px-2 py-1 rounded text-modules-work break-all">
                          C:\Users\Public\Documents\Lightwright 6\Automated Actions
                        </code>
                      </div>
                    </div>

                    <p className="text-xs text-text-muted">
                      After placing the file, restart Lightwright. The action will appear in the Automated Actions menu.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'mapping':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
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
        )

      case 'preview':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <FileText className="h-4 w-4" />
              {state.file?.name}
            </div>

            {/* Significant Difference Warning */}
            {state.showDifferenceWarning && state.differencePercentage !== null && (
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800 dark:text-orange-200">Significant Data Changes Detected</AlertTitle>
                <AlertDescription className="text-orange-700 dark:text-orange-300">
                  This CSV file appears to be significantly different from your existing data (~{state.differencePercentage}% of fixtures will change).
                  Please review the data carefully before importing to ensure this is intended.
                </AlertDescription>
              </Alert>
            )}

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
              />
            )}
          </div>
        )

      case 'result':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              {state.result?.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <h3 className="font-medium">
                {state.result?.success ? 'Import Successful' : 'Import Completed with Errors'}
              </h3>
            </div>

            {state.result && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {state.result.inserted}
                  </div>
                  <div className="text-sm text-text-secondary">Inserted</div>
                </div>

                <div className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-modules-work">
                    {state.result.updated}
                  </div>
                  <div className="text-sm text-text-secondary">Updated</div>
                </div>

                {state.result.inactivated > 0 && (
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {state.result.inactivated}
                    </div>
                    <div className="text-sm text-text-secondary">Inactivated</div>
                  </div>
                )}

                {state.result.skippedInfrastructure > 0 && (
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-text-muted">
                      {state.result.skippedInfrastructure}
                    </div>
                    <div className="text-sm text-text-secondary">Infrastructure Skipped</div>
                  </div>
                )}

                {state.result.errors.length > 0 && (
                  <div className="p-3 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-destructive">
                      {state.result.errors.length}
                    </div>
                    <div className="text-sm text-text-secondary">Errors</div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Skip Reporting */}
            {state.result && (state.result.skippedInfrastructure > 0 || state.importOptions.selectedRowsToSkip.length > 0) && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Skipped Rows Summary</h4>

                {state.result.skippedInfrastructure > 0 && (
                  <div className="p-3 bg-modules-work/10 border border-modules-work/30 rounded-lg">
                    <div className="text-sm text-modules-work">
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
        )

      default:
        return null
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl max-w-none flex flex-col">
        <SheetHeader className="pb-6">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-modules-work" />
            <SheetTitle>Import Hookup CSV</SheetTitle>
          </div>
          <SheetDescription>
            Upload and process your hookup CSV data with automatic validation and mapping
          </SheetDescription>
        </SheetHeader>

        {/* Step Progress Indicator */}
        <div className="flex items-center gap-2 mb-6 p-4 bg-bg-tertiary rounded-lg">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors",
                index <= currentStepIndex
                  ? "bg-modules-work border-modules-work text-white"
                  : "bg-bg-secondary border-bg-hover text-text-muted"
              )}>
                {index + 1}
              </div>
              <div className="hidden sm:block">
                <div className={cn(
                  "text-sm font-medium",
                  index <= currentStepIndex ? "text-text-primary" : "text-text-muted"
                )}>
                  {step.label}
                </div>
                <div className="text-xs text-text-secondary">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-text-muted mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          {renderStepContent()}
        </div>

        {/* Sticky Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-bg-secondary border-t border-bg-tertiary">
          <div className="flex justify-between items-center">
            {/* Back/Cancel Button */}
            <div>
              {state.step === 'upload' && (
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              )}
              {state.step === 'mapping' && (
                <Button variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'upload' }))}>
                  Back
                </Button>
              )}
              {state.step === 'preview' && (
                <Button variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'mapping' }))}>
                  Back to Mapping
                </Button>
              )}
              {state.step === 'result' && (
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              )}
            </div>

            {/* Primary Action Button */}
            <div>
              {state.step === 'mapping' && (
                <Button
                  onClick={handleProceedToPreview}
                  disabled={state.isProcessing || !canProceedFromMapping}
                  className="bg-modules-work hover:bg-modules-work/90"
                >
                  {state.isProcessing ? 'Analyzing data...' : 'Continue to Preview'}
                </Button>
              )}
              {state.step === 'preview' && canProceedFromPreview && (
                <div className="text-right">
                  <p className="text-sm text-text-secondary mb-2">
                    Ready to import {state.validation?.validRows || 0} fixtures
                  </p>
                  <Button
                    onClick={handleUpload}
                    disabled={state.isProcessing}
                    className="bg-modules-work hover:bg-modules-work/90"
                  >
                    {state.isProcessing ? 'Importing...' : 'Import Data'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
