import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { Text } from '@react-pdf/renderer'
import {
  PDFDocumentWrapper,
  PDFHeader,
  PDFTable,
  PDFTableRow,
  PDFTableCell,
  PDFStatusBadge,
  PDFPriorityBadge,
  PDFTypeBadge,
  PDFCheckboxPriority,
  PDFTypeHeader,
  PDFFooter,
} from './pdf-components'
import {
  getModuleColumns,
  extractNoteContent,
  applyFilters,
  applySorting,
  groupNotesByType,
  getFilterSummary,
  type FormattedNoteContent,
  type ColumnConfig,
} from './pdf-formatters'
import type { Note, ModuleType, FilterSortPreset, PageStylePreset, LightwrightInfo, ScriptPage, SceneSong } from '@/types'

export interface PDFGenerationOptions {
  notes: Note[]
  moduleType: ModuleType
  filterPreset: FilterSortPreset
  pageStylePreset: PageStylePreset
  productionName?: string
  productionLogo?: string
  
  // Optional lookup data
  lightwrightData?: Map<string, LightwrightInfo[]>
  scriptPages?: Map<string, ScriptPage>
  scenesSongs?: Map<string, SceneSong>
}

interface NotePDFDocumentProps {
  processedNotes: FormattedNoteContent[]
  columns: ColumnConfig[]
  moduleType: ModuleType
  pageStylePreset: PageStylePreset
  productionName: string
  filterPreset: FilterSortPreset
  productionLogo?: string
}

const NotePDFDocument: React.FC<NotePDFDocumentProps> = ({ 
  processedNotes, 
  columns, 
  moduleType, 
  pageStylePreset, 
  productionName,
  filterPreset,
  productionLogo
}) => {
  const moduleName = {
    cue: 'Cue Notes',
    work: 'Work Notes', 
    production: 'Production Notes'
  }[moduleType]

  const includeCheckboxes = pageStylePreset.config.includeCheckboxes
  const statusFilter = filterPreset.config.statusFilter

  return (
    <PDFDocumentWrapper 
      pageStyle={pageStylePreset} 
      title={`${productionName} - ${moduleName}`}
    >
      <PDFHeader 
        productionName={productionName}
        moduleName={moduleName}
        date={new Date()}
        statusFilter={statusFilter || undefined}
        totalNotes={processedNotes.length}
        logo={productionLogo}
      />
      
      <PDFTable columns={columns}>
        {processedNotes.map((note, index) => (
          <PDFTableRow key={`${note.title}-${index}`} isEven={index % 2 === 0}>
            {columns.map(column => (
              <PDFTableCell key={column.key} width={column.width}>
                {renderCellContent(column.key, note, includeCheckboxes)}
              </PDFTableCell>
            ))}
          </PDFTableRow>
        ))}
      </PDFTable>
      
      <PDFFooter pageStyle={pageStylePreset} />
    </PDFDocumentWrapper>
  )
}

const renderCellContent = (key: string, content: FormattedNoteContent, includeCheckboxes: boolean): React.ReactNode => {
  switch(key) {
    case 'checkboxPriority':
      console.log('PDF Generator - Rendering checkboxPriority:', {
        status: content.status,
        priority: content.priority,
        includeCheckboxes
      })
      return (
        <PDFCheckboxPriority 
          status={content.status}
          priority={content.priority}
          includeCheckbox={includeCheckboxes}
        />
      )
    case 'priority':
      return <PDFPriorityBadge priority={content.priority} />
    case 'type':
      return <PDFTypeBadge type={content.type} />
    case 'cueNumber':
      return <Text style={{ fontSize: 8 }}>{content.cueNumber || '-'}</Text>
    case 'sceneSong':
      return <Text style={{ fontSize: 8 }}>{content.sceneSong || '-'}</Text>
    case 'note':
      // This combines title and description for a more compact display
      const noteText = content.title + (content.description ? ': ' + content.description : '')
      return <Text style={{ fontSize: 8, lineHeight: 1.1 }}>{noteText}</Text>
    case 'created':
      return <Text style={{ fontSize: 7 }}>{content.createdAt.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</Text>
    case 'channel':
      return <Text style={{ fontSize: 8 }}>{content.channel || '-'}</Text>
    case 'position':
      return <Text style={{ fontSize: 8 }}>{content.position || '-'}</Text>
    case 'instrument':
      return <Text style={{ fontSize: 8 }}>{content.instrument || '-'}</Text>
    case 'department':
      return <Text style={{ fontSize: 8 }}>{content.department || '-'}</Text>
    case 'status':
      return <PDFStatusBadge status={content.status} />
    // Legacy fields for backward compatibility
    case 'title':
      return <Text style={{ fontWeight: 'bold', fontSize: 8 }}>{content.title}</Text>
    case 'description':
      return <Text style={{ fontSize: 8 }}>{content.description || '-'}</Text>
    default:
      return <Text style={{ fontSize: 8 }}>{(content as any)[key] || '-'}</Text>
  }
}

const GroupedNotePDFDocument: React.FC<NotePDFDocumentProps & { groupedNotes: Map<string, FormattedNoteContent[]> }> = ({ 
  groupedNotes,
  columns, 
  moduleType, 
  pageStylePreset, 
  productionName,
  filterPreset,
  productionLogo
}) => {
  const moduleName = {
    cue: 'Cue Notes',
    work: 'Work Notes', 
    production: 'Production Notes'
  }[moduleType]

  const includeCheckboxes = pageStylePreset.config.includeCheckboxes
  const statusFilter = filterPreset.config.statusFilter
  const totalNotes = Array.from(groupedNotes.values()).reduce((sum, notes) => sum + notes.length, 0)

  return (
    <PDFDocumentWrapper 
      pageStyle={pageStylePreset} 
      title={`${productionName} - ${moduleName}`}
    >
      <PDFHeader 
        productionName={productionName}
        moduleName={moduleName}
        date={new Date()}
        statusFilter={statusFilter || undefined}
        totalNotes={totalNotes}
        logo={productionLogo}
      />
      
      {Array.from(groupedNotes.entries()).map(([type, notes]) => (
        <React.Fragment key={type}>
          {/* Type Section Header */}
          <PDFTypeHeader 
            typeName={type}
            noteCount={notes.length}
          />
          
          {/* Table for this type */}
          <PDFTable columns={columns}>
            {notes.map((note, index) => (
              <PDFTableRow key={`${type}-${note.title}-${index}`} isEven={index % 2 === 0}>
                {columns.map(column => (
                  <PDFTableCell key={column.key} width={column.width}>
                    {renderCellContent(column.key, note, includeCheckboxes)}
                  </PDFTableCell>
                ))}
              </PDFTableRow>
            ))}
          </PDFTable>
        </React.Fragment>
      ))}
      
      <PDFFooter pageStyle={pageStylePreset} />
    </PDFDocumentWrapper>
  )
}

export async function generatePDF(options: PDFGenerationOptions): Promise<Blob> {
  console.log('PDF Generation - Starting with options:', {
    notesCount: options.notes?.length,
    moduleType: options.moduleType,
    filterPresetName: options.filterPreset?.name,
    pageStylePresetName: options.pageStylePreset?.name,
    productionName: options.productionName
  })

  try {
    const {
      notes,
      moduleType,
      filterPreset,
      pageStylePreset,
      productionName = 'Production',
      lightwrightData,
      scriptPages,
      scenesSongs,
    } = options

    // Validate required inputs with detailed logging
    if (!notes || !Array.isArray(notes)) {
      const error = new Error('Notes array is required for PDF generation')
      console.error('PDF Generation - Validation Error:', error.message, { notes })
      throw error
    }
    
    if (!filterPreset || !filterPreset.config) {
      const error = new Error('Valid filter preset is required for PDF generation')
      console.error('PDF Generation - Validation Error:', error.message, { filterPreset })
      throw error
    }
    
    if (!pageStylePreset || !pageStylePreset.config) {
      const error = new Error('Valid page style preset is required for PDF generation')
      console.error('PDF Generation - Validation Error:', error.message, { pageStylePreset })
      throw error
    }
    
    console.log('PDF Generation - Input validation passed:', {
      notesCount: notes.length,
      moduleType,
      filterConfig: JSON.stringify(filterPreset.config, null, 2),
      pageConfig: JSON.stringify(pageStylePreset.config, null, 2)
    })

    // Apply filters and sorting
    console.log('PDF Generation - Applying filters and sorting...')
    let filteredNotes = applyFilters(notes, filterPreset)
    console.log(`PDF Generation - After filtering: ${filteredNotes.length} notes`)
    
    filteredNotes = applySorting(filteredNotes, filterPreset)
    console.log('PDF Generation - Sorting applied')

    // Get module-specific columns
    const columns = getModuleColumns(moduleType, pageStylePreset.config.includeCheckboxes)
    console.log('PDF Generation - Column configuration:', columns.map(c => ({ key: c.key, label: c.label, width: c.width })))

    // Extract and format note content with enhanced error handling
    console.log('PDF Generation - Processing notes for content extraction...')
    const processedNotes = filteredNotes.map((note, index) => {
      try {
        if (!note || typeof note !== 'object') {
          console.warn(`PDF Generation - Invalid note at index ${index}:`, note)
          return {
            title: 'Invalid Note',
            description: '',
            status: 'todo' as const,
            priority: 'medium',
            type: 'general',
            createdAt: new Date(),
          }
        }
        
        const extracted = extractNoteContent(note, moduleType, {
          lightwrightData,
          scriptPages,
          scenesSongs,
        })
        
        console.log(`PDF Generation - Successfully processed note ${index}:`, {
          id: note.id,
          title: extracted.title,
          status: extracted.status,
          priority: extracted.priority,
          type: extracted.type
        })
        
        return extracted
      } catch (noteError) {
        console.error(`PDF Generation - Error processing note at index ${index}:`, {
          noteId: note.id,
          error: noteError instanceof Error ? noteError.message : String(noteError),
          stack: noteError instanceof Error ? noteError.stack : undefined,
          note: {
            id: note.id,
            title: note.title,
            status: note.status,
            priority: note.priority,
            type: note.type
          }
        })
        return {
          title: note.title || 'Error Processing Note',
          description: note.description || '',
          status: note.status || 'todo',
          priority: note.priority || 'medium',
          type: note.type || 'general',
          createdAt: note.createdAt || new Date(),
        }
      }
    }).filter(Boolean) // Remove any null/undefined entries

    console.log(`PDF Generation - Processed ${processedNotes.length} notes successfully`)

    let document: React.ReactElement

    if (filterPreset.config.groupByType) {
      // Create grouped document
      const rawGroups = groupNotesByType(filteredNotes)
      const processedGroups = new Map<string, FormattedNoteContent[]>()
      
      rawGroups.forEach((notes, type) => {
        const processedTypeNotes = notes.map(note => 
          extractNoteContent(note, moduleType, {
            lightwrightData,
            scriptPages,
            scenesSongs,
          })
        )
        processedGroups.set(type, processedTypeNotes)
      })

      document = (
        <GroupedNotePDFDocument
          processedNotes={processedNotes}
          groupedNotes={processedGroups}
          columns={columns}
          moduleType={moduleType}
          pageStylePreset={pageStylePreset}
          productionName={productionName}
          filterPreset={filterPreset}
          productionLogo={options.productionLogo}
        />
      )
    } else {
      // Create standard document
      document = (
        <NotePDFDocument
          processedNotes={processedNotes}
          columns={columns}
          moduleType={moduleType}
          pageStylePreset={pageStylePreset}
          productionName={productionName}
          filterPreset={filterPreset}
          productionLogo={options.productionLogo}
        />
      )
    }

    // Generate PDF blob with enhanced error handling
    console.log('PDF Generation - Creating PDF document...')
    try {
      const pdfBlob = await pdf(document as any).toBlob()
      console.log('PDF Generation - Successfully created PDF blob:', {
        size: pdfBlob.size,
        type: pdfBlob.type
      })
      return pdfBlob
    } catch (pdfError) {
      console.error('PDF Generation - Error during PDF blob creation:', {
        error: pdfError instanceof Error ? pdfError.message : String(pdfError),
        stack: pdfError instanceof Error ? pdfError.stack : undefined,
        documentType: filterPreset.config.groupByType ? 'GroupedNotePDFDocument' : 'NotePDFDocument',
        processedNotesCount: processedNotes.length
      })
      throw pdfError
    }

  } catch (error) {
    console.error('PDF Generation - Top-level error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      options: {
        notesCount: options.notes?.length,
        moduleType: options.moduleType,
        filterPresetName: options.filterPreset?.name,
        pageStylePresetName: options.pageStylePreset?.name,
        productionName: options.productionName
      }
    })
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function downloadPDF(blob: Blob, filename: string) {
  try {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF download error:', error)
    throw new Error('Failed to download PDF')
  }
}

export function createPDFFilename(moduleType: ModuleType, productionName?: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
  const production = productionName ? `${productionName.replace(/[^a-zA-Z0-9]/g, '-')}-` : ''
  return `${production}${moduleType}-notes-${timestamp}.pdf`
}