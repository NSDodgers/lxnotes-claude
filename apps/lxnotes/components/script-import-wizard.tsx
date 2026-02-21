'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, ChevronRight, AlertTriangle, Theater, Music, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScriptCSVParser } from '@/lib/services/script-csv-parser'
import type { ScriptCSVRow, ScriptParseResult } from '@/lib/services/script-csv-parser'
import type { ScriptPage, SceneSong } from '@/types'

interface ScriptImportWizardProps {
  productionId: string
  hasExistingData: boolean
  onImportComplete: (pages: ScriptPage[], scenes: SceneSong[], songs: SceneSong[]) => void
  onCancel: () => void
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'result'

interface WizardState {
  step: WizardStep
  inputMode: 'file' | 'paste'
  isDragOver: boolean
  isProcessing: boolean
  file: File | null
  pastedText: string
  headers: string[]
  rows: ScriptCSVRow[]
  headerMapping: Record<string, string>
  parseResult: ScriptParseResult | null
  error: string | null
}

const steps = [
  { id: 'upload', label: 'Upload / Paste', description: 'Provide data' },
  { id: 'mapping', label: 'Map Columns', description: 'Configure mapping' },
  { id: 'preview', label: 'Preview', description: 'Review data' },
  { id: 'result', label: 'Result', description: 'Import summary' },
]

export function ScriptImportWizard({
  productionId,
  hasExistingData,
  onImportComplete,
  onCancel,
}: ScriptImportWizardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<WizardState>({
    step: 'upload',
    inputMode: 'file',
    isDragOver: false,
    isProcessing: false,
    file: null,
    pastedText: '',
    headers: [],
    rows: [],
    headerMapping: {},
    parseResult: null,
    error: null,
  })

  const currentStepIndex = steps.findIndex(s => s.id === state.step)

  // --- Upload Step Handlers ---

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
      file.type === 'text/csv' ||
      file.type === 'text/tab-separated-values' ||
      file.name.toLowerCase().endsWith('.csv') ||
      file.name.toLowerCase().endsWith('.tsv')
    )

    if (csvFile) {
      handleFileSelect(csvFile)
    } else {
      setState(prev => ({ ...prev, error: 'Please select a CSV or TSV file.' }))
    }
  }, [])

  const handleFileSelect = async (file: File) => {
    const maxFileSize = 5 * 1024 * 1024
    if (file.size > maxFileSize) {
      setState(prev => ({
        ...prev,
        error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 5MB.`,
      }))
      return
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null, file }))

    try {
      const { headers, rows, headerMapping } = await ScriptCSVParser.parseCSV(file)

      setState(prev => ({
        ...prev,
        headers,
        rows,
        headerMapping,
        isProcessing: false,
        step: 'mapping',
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to parse file',
      }))
    }
  }

  const handlePasteSubmit = () => {
    if (!state.pastedText.trim()) return

    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      const { headers, rows, headerMapping } = ScriptCSVParser.parsePastedText(state.pastedText)

      if (rows.length === 0) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: 'No data rows found. Make sure you include a header row.',
        }))
        return
      }

      setState(prev => ({
        ...prev,
        headers,
        rows,
        headerMapping,
        isProcessing: false,
        step: 'mapping',
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to parse pasted data',
      }))
    }
  }

  // --- Mapping Step Handlers ---

  const handleMappingChange = (field: string, header: string) => {
    setState(prev => {
      const newMapping = { ...prev.headerMapping }
      if (header === '') {
        delete newMapping[field]
      } else {
        // Remove any existing mapping to this header
        for (const [key, val] of Object.entries(newMapping)) {
          if (val === header && key !== field) {
            delete newMapping[key]
          }
        }
        newMapping[field] = header
      }
      return { ...prev, headerMapping: newMapping }
    })
  }

  const canProceedFromMapping = !!(
    state.headerMapping.pageNumber &&
    (state.headerMapping.scene || state.headerMapping.song)
  )

  // --- Preview Step ---

  const handleProceedToPreview = () => {
    setState(prev => ({ ...prev, isProcessing: true }))

    try {
      const parseResult = ScriptCSVParser.parseRows(state.rows, state.headerMapping, productionId)
      setState(prev => ({
        ...prev,
        parseResult,
        isProcessing: false,
        step: 'preview',
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to parse data',
      }))
    }
  }

  // --- Import ---

  const handleImport = () => {
    if (!state.parseResult) return

    onImportComplete(state.parseResult.pages, state.parseResult.scenes, state.parseResult.songs)
    setState(prev => ({ ...prev, step: 'result' }))
  }

  // --- Render Steps ---

  const renderUploadStep = () => (
    <div className="space-y-6">
      {hasExistingData && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Existing Script Data</AlertTitle>
          <AlertDescription>
            This production already has script data. Importing will replace all existing pages, scenes, and songs.
          </AlertDescription>
        </Alert>
      )}

      {/* Tab toggle */}
      <div className="flex border-b border-bg-tertiary">
        <button
          type="button"
          onClick={() => setState(prev => ({ ...prev, inputMode: 'file', error: null }))}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            state.inputMode === 'file'
              ? 'border-modules-cue text-modules-cue'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setState(prev => ({ ...prev, inputMode: 'paste', error: null }))}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            state.inputMode === 'paste'
              ? 'border-modules-cue text-modules-cue'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          Paste from Spreadsheet
        </button>
      </div>

      {state.inputMode === 'file' ? (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            state.isDragOver
              ? 'border-modules-cue bg-modules-cue/5'
              : 'border-bg-hover',
            state.error && 'border-destructive'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <Upload className={cn(
              'h-12 w-12',
              state.isDragOver ? 'text-modules-cue' : 'text-text-muted'
            )} />
            <div>
              <p className="text-lg font-medium text-text-primary mb-2">
                Drop your CSV or TSV file here
              </p>
              <p className="text-text-secondary text-sm mb-4">
                or click to browse files
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={state.isProcessing}
              >
                {state.isProcessing ? 'Processing...' : 'Browse Files'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Copy rows from your spreadsheet (including the header row) and paste below.
          </p>
          <textarea
            value={state.pastedText}
            onChange={(e) => setState(prev => ({ ...prev, pastedText: e.target.value, error: null }))}
            placeholder={"Page Number\tScene\tScene continues\tScene First Cue\tSong\tSong continues\tSong First Cue\n1\tAct 1, Scene 1\tFalse\t1\t\t\t\n2\tAct 1, Scene 1\tTrue\t\tOpening Number\tFalse\t10"}
            className="w-full h-48 rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-sm text-text-primary font-mono focus:outline-hidden focus:border-modules-cue resize-none"
          />
          <Button
            variant="cue"
            onClick={handlePasteSubmit}
            disabled={!state.pastedText.trim() || state.isProcessing}
          >
            {state.isProcessing ? 'Processing...' : 'Parse Data'}
          </Button>
        </div>
      )}

      {state.error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
        className="hidden"
      />

      {/* Expected format reference */}
      <div className="border border-bg-hover rounded-lg p-4">
        <h4 className="text-sm font-medium text-text-primary mb-3">Expected Column Format</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-bg-hover">
                <th className="text-left py-1 pr-4 text-text-secondary font-medium">Column</th>
                <th className="text-left py-1 pr-4 text-text-secondary font-medium">Required</th>
                <th className="text-left py-1 text-text-secondary font-medium">Example</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              <tr className="border-b border-bg-hover/50">
                <td className="py-1 pr-4 font-medium">Page Number</td>
                <td className="py-1 pr-4 text-modules-cue">Yes</td>
                <td className="py-1 text-text-secondary">1, 2, PDF_3, ii</td>
              </tr>
              <tr className="border-b border-bg-hover/50">
                <td className="py-1 pr-4">Page First Cue</td>
                <td className="py-1 pr-4 text-text-muted">No</td>
                <td className="py-1 text-text-secondary">1, 45.5</td>
              </tr>
              <tr className="border-b border-bg-hover/50">
                <td className="py-1 pr-4">Scene</td>
                <td className="py-1 pr-4 text-text-muted">*</td>
                <td className="py-1 text-text-secondary">SCENE 1: HOSPITAL</td>
              </tr>
              <tr className="border-b border-bg-hover/50">
                <td className="py-1 pr-4">Scene continues</td>
                <td className="py-1 pr-4 text-text-muted">No</td>
                <td className="py-1 text-text-secondary">True / False</td>
              </tr>
              <tr className="border-b border-bg-hover/50">
                <td className="py-1 pr-4">Scene First Cue</td>
                <td className="py-1 pr-4 text-text-muted">No</td>
                <td className="py-1 text-text-secondary">45</td>
              </tr>
              <tr className="border-b border-bg-hover/50">
                <td className="py-1 pr-4">Song</td>
                <td className="py-1 pr-4 text-text-muted">*</td>
                <td className="py-1 text-text-secondary">Opening Number</td>
              </tr>
              <tr className="border-b border-bg-hover/50">
                <td className="py-1 pr-4">Song continues</td>
                <td className="py-1 pr-4 text-text-muted">No</td>
                <td className="py-1 text-text-secondary">True / False</td>
              </tr>
              <tr>
                <td className="py-1 pr-4">Song First Cue</td>
                <td className="py-1 pr-4 text-text-muted">No</td>
                <td className="py-1 text-text-secondary">50</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-text-muted mt-2">* At least one of Scene or Song is required</p>
        </div>
      </div>
    </div>
  )

  const renderMappingStep = () => {
    const fieldOptions = ScriptCSVParser.getFieldOptions()
    // Get sample values for each header (first 3 rows)
    const sampleValues = new Map<string, string[]>()
    for (const header of state.headers) {
      const samples = state.rows.slice(0, 3).map(row => row[header] || '').filter(Boolean)
      sampleValues.set(header, samples)
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <FileText className="h-4 w-4" />
          {state.file ? state.file.name : 'Pasted data'}
          <span className="text-text-muted">({state.rows.length} rows)</span>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text-primary">Column Mapping</h4>
          <p className="text-xs text-text-secondary">
            Map your spreadsheet columns to the expected fields. Auto-detected mappings are pre-filled.
          </p>

          <div className="space-y-2">
            {fieldOptions.map(({ value, label, required }) => {
              const currentMapping = state.headerMapping[value] || ''
              const samples = currentMapping ? sampleValues.get(currentMapping) || [] : []

              return (
                <div key={value} className="flex items-center gap-3 py-2 border-b border-bg-hover/50 last:border-0">
                  <div className="w-36 shrink-0">
                    <span className="text-sm text-text-primary">
                      {label}
                      {required && <span className="text-modules-cue ml-1">*</span>}
                    </span>
                  </div>
                  <select
                    value={currentMapping}
                    onChange={(e) => handleMappingChange(value, e.target.value)}
                    className="h-8 flex-1 rounded bg-bg-tertiary border border-bg-hover px-2 text-sm text-text-primary focus:outline-hidden focus:border-modules-cue"
                  >
                    <option value="">-- Not mapped --</option>
                    {state.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                  {samples.length > 0 && (
                    <div className="w-40 shrink-0 text-xs text-text-muted truncate" title={samples.join(', ')}>
                      {samples.join(', ')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {state.error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.error}
          </div>
        )}
      </div>
    )
  }

  const renderPreviewStep = () => {
    if (!state.parseResult) return null

    const { pages, scenes, songs, warnings, stats } = state.parseResult

    // Build a tree view: page → scenes/songs
    const sortedPages = [...pages].sort((a, b) => {
      const matchA = a.pageNumber.match(/^(\d+)/)
      const matchB = b.pageNumber.match(/^(\d+)/)
      const numA = matchA ? parseInt(matchA[1]) : 0
      const numB = matchB ? parseInt(matchB[1]) : 0
      if (numA !== numB) return numA - numB
      return a.pageNumber.localeCompare(b.pageNumber)
    })

    return (
      <div className="space-y-6">
        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 border border-bg-hover rounded-lg text-center">
            <div className="text-2xl font-bold text-modules-cue">{stats.pageCount}</div>
            <div className="text-xs text-text-secondary">Pages</div>
          </div>
          <div className="p-3 border border-bg-hover rounded-lg text-center">
            <div className="text-2xl font-bold text-modules-work">{stats.sceneCount}</div>
            <div className="text-xs text-text-secondary">Scenes</div>
          </div>
          <div className="p-3 border border-bg-hover rounded-lg text-center">
            <div className="text-2xl font-bold text-modules-production">{stats.songCount}</div>
            <div className="text-xs text-text-secondary">Songs</div>
          </div>
          <div className="p-3 border border-bg-hover rounded-lg text-center">
            <div className="text-2xl font-bold text-text-secondary">{stats.continuationCount}</div>
            <div className="text-xs text-text-secondary">Continuations</div>
          </div>
        </div>

        {/* Acts detected */}
        {stats.actsDetected.length > 0 && (
          <div className="text-sm text-text-secondary">
            Acts detected: {stats.actsDetected.join(', ')}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-yellow-500 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Warnings ({warnings.length})
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {warnings.map((w, i) => (
                <div key={i} className="text-xs text-yellow-500/80 bg-yellow-500/5 px-2 py-1 rounded">
                  Row {w.row}: {w.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tree preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-primary">Structure Preview</h4>
          <div className="max-h-80 overflow-y-auto space-y-1 border border-bg-hover rounded-lg p-3">
            {sortedPages.map(page => {
              const pageScenes = scenes.filter(s => s.scriptPageId === page.id)
              const pageSongs = songs.filter(s => s.scriptPageId === page.id)
              const pageItems = [...pageScenes, ...pageSongs].sort((a, b) => a.orderIndex - b.orderIndex)

              return (
                <div key={page.id} className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-3.5 w-3.5 text-modules-cue shrink-0" />
                    <span className="font-medium text-text-primary">Page {page.pageNumber}</span>
                    {page.firstCueNumber && (
                      <span className="text-xs text-text-muted">(cue {page.firstCueNumber})</span>
                    )}
                  </div>
                  {pageItems.map(item => {
                    const isScene = item.type === 'scene'
                    const iconColor = isScene ? 'text-modules-work' : 'text-modules-production'
                    const Icon = isScene ? Theater : Music
                    return (
                      <div key={item.id} className="flex items-center gap-2 text-xs pl-6">
                        {item.continuesFromId && (
                          <ArrowRight className={cn('h-3 w-3 shrink-0', iconColor)} />
                        )}
                        <Icon className={cn('h-3 w-3 shrink-0', iconColor)} />
                        <span className={cn(
                          'text-text-secondary',
                          item.continuesFromId && 'italic'
                        )}>
                          {item.name}
                          {item.continuesFromId && ' (cont.)'}
                        </span>
                        {item.firstCueNumber && (
                          <span className="text-text-muted">(cue {item.firstCueNumber})</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderResultStep = () => {
    if (!state.parseResult) return null

    const { stats } = state.parseResult

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <h3 className="font-medium text-text-primary">Import Complete</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border border-bg-hover rounded-lg text-center">
            <div className="text-2xl font-bold text-modules-cue">{stats.pageCount}</div>
            <div className="text-sm text-text-secondary">Pages imported</div>
          </div>
          <div className="p-3 border border-bg-hover rounded-lg text-center">
            <div className="text-2xl font-bold text-modules-work">{stats.sceneCount}</div>
            <div className="text-sm text-text-secondary">Scenes created</div>
          </div>
          <div className="p-3 border border-bg-hover rounded-lg text-center">
            <div className="text-2xl font-bold text-modules-production">{stats.songCount}</div>
            <div className="text-sm text-text-secondary">Songs created</div>
          </div>
          <div className="p-3 border border-bg-hover rounded-lg text-center">
            <div className="text-2xl font-bold text-text-secondary">{stats.continuationCount}</div>
            <div className="text-sm text-text-secondary">Continuations</div>
          </div>
        </div>

        {stats.skippedRows > 0 && (
          <div className="text-sm text-text-muted">
            {stats.skippedRows} rows were skipped (missing page number).
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Upload className="h-5 w-5 text-modules-cue" />
          <h2 className="text-lg font-semibold text-text-primary">Import Script Breakdown</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Import pages, scenes, and songs from a CSV file or spreadsheet
        </p>
      </div>

      {/* Step Progress Indicator */}
      <div className="flex items-center gap-2 mb-6 p-4 bg-bg-tertiary rounded-lg">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-1.5">
            <div className={cn(
              'flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs font-medium transition-colors',
              index <= currentStepIndex
                ? 'bg-modules-cue border-modules-cue text-white'
                : 'bg-bg-secondary border-bg-hover text-text-muted'
            )}>
              {index + 1}
            </div>
            <div className="hidden sm:block">
              <div className={cn(
                'text-xs font-medium',
                index <= currentStepIndex ? 'text-text-primary' : 'text-text-muted'
              )}>
                {step.label}
              </div>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="h-3 w-3 text-text-muted mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {state.step === 'upload' && renderUploadStep()}
        {state.step === 'mapping' && renderMappingStep()}
        {state.step === 'preview' && renderPreviewStep()}
        {state.step === 'result' && renderResultStep()}
      </div>

      {/* Sticky Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-bg-secondary border-t border-bg-tertiary">
        <div className="flex justify-between items-center">
          <div>
            {state.step === 'upload' && (
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
            )}
            {state.step === 'mapping' && (
              <Button variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'upload', error: null }))}>
                Back
              </Button>
            )}
            {state.step === 'preview' && (
              <Button variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'mapping', error: null }))}>
                Back to Mapping
              </Button>
            )}
            {state.step === 'result' && (
              <Button variant="outline" onClick={onCancel}>Done</Button>
            )}
          </div>

          <div>
            {state.step === 'mapping' && (
              <Button
                onClick={handleProceedToPreview}
                disabled={state.isProcessing || !canProceedFromMapping}
                variant="cue"
              >
                {state.isProcessing ? 'Processing...' : 'Continue to Preview'}
              </Button>
            )}
            {state.step === 'preview' && state.parseResult && (
              <div className="text-right">
                <p className="text-xs text-text-secondary mb-1">
                  {state.parseResult.stats.pageCount} pages, {state.parseResult.stats.sceneCount} scenes, {state.parseResult.stats.songCount} songs
                </p>
                <Button onClick={handleImport} variant="cue">
                  Import Data
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
