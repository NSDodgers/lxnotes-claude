import React from 'react'
import { Document, Page, Text } from '@react-pdf/renderer'
import { PDFHeader } from './shared/PDFHeader'
import { PDFFooter } from './shared/PDFFooter'
import { PDFTable, PriorityBadge, TypeBadge, formatDate } from './shared/PDFTable'
import { commonStyles } from './shared/styles'
import type { PDFFormattedNote } from '@/lib/services/pdf/types'

interface ProductionNotesPDFProps {
  notes: PDFFormattedNote[]
  productionName: string
  productionLogo?: string
  includeCheckboxes?: boolean
  dateGenerated?: Date
  filterPresetName?: string
  groupByType?: boolean
}

export const ProductionNotesPDF: React.FC<ProductionNotesPDFProps> = ({
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
      render: (note: PDFFormattedNote) => {
        const department = note.moduleSpecificData?.department || note.type
        return <TypeBadge type={typeof department === 'string' ? department : '-'} />
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
          moduleTitle="Production Notes"
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
