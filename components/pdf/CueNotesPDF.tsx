import React from 'react'
import { Document, Page, Text } from '@react-pdf/renderer'
import { PDFHeader } from './shared/PDFHeader'
import { PDFFooter } from './shared/PDFFooter'
import { PDFTable, PriorityBadge, TypeBadge, formatDate } from './shared/PDFTable'
import { commonStyles } from './shared/styles'
import type { PDFFormattedNote } from '@/lib/services/pdf/types'

interface CueNotesPDFProps {
  notes: PDFFormattedNote[]
  productionName: string
  productionLogo?: string
  includeCheckboxes?: boolean
  dateGenerated?: Date
  filterPresetName?: string
  groupByType?: boolean
}

export const CueNotesPDF: React.FC<CueNotesPDFProps> = ({
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
      header: 'Cue #',
      width: 50,
      render: (note: PDFFormattedNote) => {
        const scriptPage = note.moduleSpecificData?.scriptPage
        return <Text>{typeof scriptPage === 'string' ? scriptPage : '-'}</Text>
      }
    },
    {
      header: 'Scene/Song',
      width: 80,
      render: (note: PDFFormattedNote) => {
        const sceneSong = note.moduleSpecificData?.sceneSong
        return <Text>{typeof sceneSong === 'string' ? sceneSong : '-'}</Text>
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
          moduleTitle="Cue Notes"
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
