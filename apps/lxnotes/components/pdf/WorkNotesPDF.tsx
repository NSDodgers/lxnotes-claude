import React from 'react'
import { Document, Page, Text } from '@react-pdf/renderer'
import { PDFHeader } from './shared/PDFHeader'
import { PDFFooter } from './shared/PDFFooter'
import { PDFTable, PriorityBadge, TypeBadge, formatDate } from './shared/PDFTable'
import { commonStyles } from './shared/styles'
import type { PDFFormattedNote } from '@/lib/services/pdf/types'

interface WorkNotesPDFProps {
  notes: PDFFormattedNote[]
  productionName: string
  productionLogo?: string
  includeCheckboxes?: boolean
  paperSize?: 'a4' | 'letter' | 'legal'
  orientation?: 'portrait' | 'landscape'
  dateGenerated?: Date
  filterPresetName?: string
  groupByType?: boolean
  typeColorMap?: Record<string, string>
  moduleTitle?: string
}

export const WorkNotesPDF: React.FC<WorkNotesPDFProps> = ({
  notes,
  productionName,
  productionLogo,
  includeCheckboxes = false,
  paperSize = 'letter',
  orientation = 'landscape',
  dateGenerated = new Date(),
  filterPresetName,
  groupByType = false,
  typeColorMap,
  moduleTitle = 'Work Notes'
}) => {
  const columns = [
    {
      header: 'Priority',
      width: 75,
      render: (note: PDFFormattedNote) => <PriorityBadge priority={note.priority} />
    },
    {
      header: 'Type',
      width: 95,
      render: (note: PDFFormattedNote) => <TypeBadge type={note.type || '-'} typeColorMap={typeColorMap} />
    },
    {
      header: 'Channels',
      width: 60,
      render: (note: PDFFormattedNote) => {
        const channels = note.moduleSpecificData?.channels
        return <Text>{typeof channels === 'string' ? channels : '-'}</Text>
      }
    },
    {
      header: 'Position/Unit',
      width: 95,
      render: (note: PDFFormattedNote) => {
        const positionUnit = note.moduleSpecificData?.positionUnit
        if (typeof positionUnit !== 'string' || positionUnit === '-') {
          return <Text>-</Text>
        }
        const lines = positionUnit.split('\n')
        if (lines.length === 1) {
          return <Text>{lines[0]}</Text>
        }
        return <Text>{lines.map(line => `• ${line}`).join('\n')}</Text>
      }
    },
    {
      header: 'Note',
      render: (note: PDFFormattedNote) => {
        const noteText = note.description || ''
        return <Text>{noteText}</Text>
      }
    },
    {
      header: 'Created',
      width: 70,
      render: (note: PDFFormattedNote) => <Text>{formatDate(note.createdAt)}</Text>
    }
  ]

  return (
    <Document>
      <Page size={paperSize.toUpperCase() as 'LETTER' | 'A4' | 'LEGAL'} orientation={orientation} style={commonStyles.page}>
        <PDFHeader
          productionName={productionName}
          productionLogo={productionLogo}
          moduleTitle={moduleTitle}
          dateGenerated={dateGenerated}
          noteCount={notes.length}
          filterPresetName={filterPresetName}
        />

        <PDFTable
          notes={notes}
          columns={columns}
          includeCheckboxes={includeCheckboxes}
          groupByType={groupByType}
          typeColorMap={typeColorMap}
        />

        <PDFFooter pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  )
}
