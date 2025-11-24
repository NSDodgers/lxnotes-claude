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
  dateGenerated?: Date
  filterPresetName?: string
  groupByType?: boolean
}

export const WorkNotesPDF: React.FC<WorkNotesPDFProps> = ({
  notes,
  productionName,
  productionLogo,
  includeCheckboxes = false,
  dateGenerated = new Date(),
  filterPresetName,
  groupByType = false
}) => {
  const columns = [
    {
      header: 'Priority',
      width: 60,
      render: (note: PDFFormattedNote) => <PriorityBadge priority={note.priority} />
    },
    {
      header: 'Type',
      width: 80,
      render: (note: PDFFormattedNote) => <TypeBadge type={note.type || '-'} />
    },
    {
      header: 'Channels',
      width: 50,
      render: (note: PDFFormattedNote) => {
        const channels = note.moduleSpecificData?.channels
        return <Text>{typeof channels === 'string' ? channels : '-'}</Text>
      }
    },
    {
      header: 'Position/Unit',
      width: 80,
      render: (note: PDFFormattedNote) => {
        const positionUnit = note.moduleSpecificData?.positionUnit
        return <Text>{typeof positionUnit === 'string' ? positionUnit : '-'}</Text>
      }
    },
    {
      header: 'Note',
      render: (note: PDFFormattedNote) => {
        const noteText = `${note.title}${note.description ? ': ' + note.description : ''}`
        return <Text>{noteText}</Text>
      }
    },
    {
      header: 'Created',
      width: 60,
      render: (note: PDFFormattedNote) => <Text>{formatDate(note.createdAt)}</Text>
    }
  ]

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={commonStyles.page}>
        <PDFHeader
          productionName={productionName}
          productionLogo={productionLogo}
          moduleTitle="Work Notes"
          dateGenerated={dateGenerated}
          noteCount={notes.length}
          filterPresetName={filterPresetName}
        />

        <PDFTable
          notes={notes}
          columns={columns}
          includeCheckboxes={includeCheckboxes}
          groupByType={groupByType}
        />

        <PDFFooter pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  )
}
