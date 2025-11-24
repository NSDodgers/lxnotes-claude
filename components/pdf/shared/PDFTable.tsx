import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { commonStyles, priorityColors, typeColors } from './styles'
import type { PDFFormattedNote } from '@/lib/services/pdf/types'

interface TableColumn {
  header: string
  width?: string | number
  render: (note: PDFFormattedNote, index: number) => React.ReactNode
}

interface PDFTableProps {
  notes: PDFFormattedNote[]
  columns: TableColumn[]
  includeCheckboxes?: boolean
  groupByType?: boolean
}

const styles = StyleSheet.create({
  checkboxContainer: {
    width: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkmark: {
    fontSize: 8,
    color: '#22c55e'
  },
  cancelmark: {
    fontSize: 8,
    color: '#ef4444'
  },
  typeGroupHeader: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 8,
    paddingRight: 8
  },
  typeGroupText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
})

export const PDFTable: React.FC<PDFTableProps> = ({ notes, columns, includeCheckboxes = false, groupByType = false }) => {
  // Filter out Type column when grouping is enabled
  let displayColumns = columns
  if (groupByType) {
    displayColumns = columns.filter(col => col.header.toLowerCase() !== 'type')
  }

  const allColumns = includeCheckboxes
    ? [{ header: '', width: 15, render: (note: PDFFormattedNote) => <StatusCheckbox status={note.status} /> }, ...displayColumns]
    : displayColumns

  // Helper to format type names for display
  const formatTypeName = (type: string): string => {
    if (!type || type === '-') return 'Uncategorized'

    const typeMap: Record<string, string> = {
      'cue': 'Cue Notes',
      'director': 'Director Notes',
      'designer': 'Designer Notes',
      'stage_manager': 'Stage Manager Notes',
      'programmer': 'Programmer Notes',
      'choreographer': 'Choreographer Notes',
      'spot': 'Spot Notes',
      'assistant': 'Assistant Notes',
      'associate': 'Associate Notes',
      'paperwork': 'Paperwork Notes',
      'think': 'Think Notes'
    }

    return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1)
  }

  // Helper to get type color
  const getTypeColor = (type: string): string => {
    return typeColors[type.toLowerCase()] || '#95a5a6'
  }

  return (
    <View style={commonStyles.table}>
      {/* Table Header */}
      <View style={commonStyles.tableHeaderRow}>
        {allColumns.map((col, index) => (
          <View
            key={index}
            style={[
              commonStyles.tableHeader,
              { width: col.width || 'auto', flex: col.width ? undefined : 1 }
            ]}
          >
            <Text>{col.header}</Text>
          </View>
        ))}
      </View>

      {/* Table Body with optional type grouping */}
      {notes.map((note, noteIndex) => {
        const previousNote = noteIndex > 0 ? notes[noteIndex - 1] : null
        const currentType = note.type || '-'
        const previousType = previousNote?.type || '-'
        const showTypeHeader = groupByType && currentType !== previousType

        return (
          <React.Fragment key={note.id}>
            {/* Type Group Header */}
            {showTypeHeader && (
              <View style={[styles.typeGroupHeader, { backgroundColor: getTypeColor(currentType) }]}>
                <Text style={styles.typeGroupText}>{formatTypeName(currentType)}</Text>
              </View>
            )}

            {/* Note Row */}
            <View style={commonStyles.tableRow}>
              {allColumns.map((col, colIndex) => (
                <View
                  key={colIndex}
                  style={[
                    commonStyles.tableCell,
                    { width: col.width || 'auto', flex: col.width ? undefined : 1 }
                  ]}
                >
                  {col.render(note, noteIndex)}
                </View>
              ))}
            </View>
          </React.Fragment>
        )
      })}
    </View>
  )
}

// Helper component for status checkbox
const StatusCheckbox: React.FC<{ status: string }> = ({ status }) => {
  return (
    <View style={styles.checkboxContainer}>
      {status === 'complete' && (
        <View style={commonStyles.checkbox}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
      {status === 'cancelled' && (
        <View style={commonStyles.checkbox}>
          <Text style={styles.cancelmark}>✗</Text>
        </View>
      )}
      {status === 'todo' && <View style={commonStyles.checkbox} />}
    </View>
  )
}

// Helper component for priority badge
export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const color = priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium

  const priorityLabels: Record<string, string> = {
    'critical': 'CRITICAL',
    'very_high': 'VERY HIGH',
    'high': 'HIGH',
    'medium': 'MEDIUM',
    'low': 'LOW',
    'very_low': 'VERY LOW'
  }

  return (
    <View style={[commonStyles.badge, { backgroundColor: color }]}>
      <Text>{priorityLabels[priority] || priority.toUpperCase()}</Text>
    </View>
  )
}

// Helper component for type badge
export const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  if (type === '-') return <Text>-</Text>

  const color = typeColors[type.toLowerCase()] || '#95a5a6'

  const formatType = (t: string): string => {
    const typeMap: Record<string, string> = {
      'cue': 'Cue',
      'director': 'Director',
      'designer': 'Designer',
      'stage_manager': 'Stage Manager',
      'programmer': 'Programmer',
      'choreographer': 'Choreographer',
      'spot': 'Spot',
      'assistant': 'Assistant',
      'associate': 'Associate',
      'paperwork': 'Paperwork',
      'think': 'Think'
    }
    return typeMap[t.toLowerCase()] || t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
  }

  return (
    <View style={[commonStyles.badge, { backgroundColor: color }]}>
      <Text>{formatType(type)}</Text>
    </View>
  )
}

// Helper to format dates
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (!dateObj || isNaN(dateObj.getTime())) {
    return '-'
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[dateObj.getMonth()]
  const day = dateObj.getDate()
  const year = dateObj.getFullYear().toString().slice(-2)
  return `${month} ${day}, ${year}`
}
