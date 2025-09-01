import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { createDocumentStyles, createTableStyles, createBadgeStyles, getStatusColor, getPriorityColor, getTypeColor, sanitizeStyles } from './pdf-styles'
import type { PageStylePreset } from '@/types'

interface PDFDocumentWrapperProps {
  children: React.ReactNode
  pageStyle: PageStylePreset
  title: string
}

export const PDFDocumentWrapper: React.FC<PDFDocumentWrapperProps> = ({ 
  children, 
  pageStyle, 
  title 
}) => {
  const documentStyles = createDocumentStyles(pageStyle)
  
  return (
    <Document title={title} author="LX Notes" producer="LX Notes">
      <Page size={[documentStyles.page.width, documentStyles.page.height]} style={documentStyles.page}>
        {children}
      </Page>
    </Document>
  )
}

interface PDFHeaderProps {
  productionName: string
  moduleName: string
  date: Date
  statusFilter?: string
  totalNotes: number
  logo?: string
}

export const PDFHeader: React.FC<PDFHeaderProps> = ({ 
  productionName, 
  moduleName, 
  date,
  statusFilter,
  totalNotes,
  logo
}) => {
  const documentStyles = createDocumentStyles({ config: { paperSize: 'letter', orientation: 'portrait', includeCheckboxes: false } } as PageStylePreset)
  
  // Format date like the example: "Aug 31, 25 at 9:18 PM"
  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear().toString().slice(-2)
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    return `${month} ${day}, ${year} at ${time}`
  }
  
  return (
    <View style={{ flexDirection: 'row', marginBottom: 15 }}>
      {/* Logo area - left side */}
      {logo && (
        <View style={{ width: 40, height: 40, marginRight: 10 }}>
          <Text style={{ fontSize: 20, textAlign: 'center' }}>{logo}</Text>
        </View>
      )}
      
      {/* Header content - left aligned */}
      <View style={{ flex: 1 }}>
        <Text style={documentStyles.productionName}>{productionName}</Text>
        <Text style={documentStyles.reportTitle}>{moduleName} Report</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={documentStyles.reportMeta}>
            Generated: {formatDate(date)}
          </Text>
          {statusFilter && (
            <Text style={documentStyles.reportMeta}>
              {"  •  "}Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </Text>
          )}
          <Text style={documentStyles.reportMeta}>
            {"  •  "}Total: {totalNotes} notes
          </Text>
        </View>
      </View>
    </View>
  )
}

interface ColumnConfig {
  key: string
  label: string
  width: string
}

interface PDFTableProps {
  children: React.ReactNode
  columns: ColumnConfig[]
}

export const PDFTable: React.FC<PDFTableProps> = ({ children, columns }) => {
  const tableStyles = createTableStyles()
  
  return (
    <View style={tableStyles.table}>
      {/* Table Header - fixed to repeat on each page */}
      <View style={tableStyles.headerRow} fixed>
        {columns.map((column) => (
          <View key={column.key} style={[tableStyles.headerCell, { width: column.width }]}>
            <Text>{column.label}</Text>
          </View>
        ))}
      </View>
      
      {/* Table Body */}
      {children}
    </View>
  )
}

interface PDFTableRowProps {
  children: React.ReactNode
  isEven: boolean
}

export const PDFTableRow: React.FC<PDFTableRowProps> = ({ children, isEven }) => {
  const tableStyles = createTableStyles()
  
  return (
    <View style={isEven ? tableStyles.rowAlt : tableStyles.row}>
      {children}
    </View>
  )
}

interface PDFTableCellProps {
  children: React.ReactNode
  width: string
}

export const PDFTableCell: React.FC<PDFTableCellProps> = ({ children, width }) => {
  const tableStyles = createTableStyles()
  
  return (
    <View style={[tableStyles.cell, { width }]}>
      {children}
    </View>
  )
}

interface PDFStatusBadgeProps {
  status: 'todo' | 'complete' | 'cancelled'
}

export const PDFStatusBadge: React.FC<PDFStatusBadgeProps> = ({ status }) => {
  try {
    const badgeStyles = createBadgeStyles()
    const backgroundColor = getStatusColor(status)
    
    const statusText = {
      todo: 'TODO',
      complete: 'DONE',
      cancelled: 'CANCELLED'
    }[status] || 'TODO'
    
    // Create and sanitize the final style object
    const finalStyle = sanitizeStyles({
      ...badgeStyles.statusBadge,
      backgroundColor: backgroundColor || '#6b7280',
    })
    
    console.log('PDFStatusBadge - Rendering with style:', finalStyle)
    
    return (
      <View style={finalStyle}>
        <Text>{statusText}</Text>
      </View>
    )
  } catch (error) {
    console.error('PDFStatusBadge - Error rendering badge:', {
      status,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Fallback rendering with minimal styles
    return (
      <View style={sanitizeStyles({ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#6b7280' })}>
        <Text style={sanitizeStyles({ color: '#ffffff', fontSize: 8 })}>
          {status?.toUpperCase() || 'TODO'}
        </Text>
      </View>
    )
  }
}

interface PDFPriorityBadgeProps {
  priority: string
}

export const PDFPriorityBadge: React.FC<PDFPriorityBadgeProps> = ({ priority }) => {
  try {
    const badgeStyles = createBadgeStyles()
    const backgroundColor = getPriorityColor(priority)
    const displayPriority = priority || 'medium'
    
    // Create and sanitize the final style object
    const finalStyle = sanitizeStyles({
      ...badgeStyles.priorityBadge,
      backgroundColor: backgroundColor || '#6b7280',
    })
    
    console.log('PDFPriorityBadge - Rendering with style:', { priority, backgroundColor, finalStyle })
    
    return (
      <View style={finalStyle}>
        <Text style={sanitizeStyles({ fontSize: 7 })}>{displayPriority.toUpperCase()}</Text>
      </View>
    )
  } catch (error) {
    console.error('PDFPriorityBadge - Error rendering badge:', {
      priority,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Fallback rendering with minimal styles
    return (
      <View style={sanitizeStyles({ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#6b7280' })}>
        <Text style={sanitizeStyles({ color: '#ffffff', fontSize: 7 })}>
          {(priority || 'MEDIUM').toUpperCase()}
        </Text>
      </View>
    )
  }
}

// Type badge with colored background
interface PDFTypeBadgeProps {
  type: string
}

export const PDFTypeBadge: React.FC<PDFTypeBadgeProps> = ({ type }) => {
  try {
    const backgroundColor = getTypeColor(type)
    const displayType = type || 'general'
    
    // Create and sanitize the final style objects
    const viewStyle = sanitizeStyles({
      backgroundColor: backgroundColor || '#6b7280',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 0, // Keep as 0 since this was already set correctly
      minHeight: 18,
      justifyContent: 'center',
    })
    
    const textStyle = sanitizeStyles({
      fontSize: 8,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    })
    
    console.log('PDFTypeBadge - Rendering with style:', { type, backgroundColor, viewStyle })
    
    return (
      <View style={viewStyle}>
        <Text style={textStyle}>
          {displayType.charAt(0).toUpperCase() + displayType.slice(1)}
        </Text>
      </View>
    )
  } catch (error) {
    console.error('PDFTypeBadge - Error rendering badge:', {
      type,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Fallback rendering with minimal styles
    return (
      <View style={sanitizeStyles({ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#6b7280' })}>
        <Text style={sanitizeStyles({ color: '#ffffff', fontSize: 8, fontWeight: 'bold', textAlign: 'center' })}>
          {(type || 'GENERAL').charAt(0).toUpperCase() + (type || 'general').slice(1)}
        </Text>
      </View>
    )
  }
}

interface PDFCheckboxProps {
  status: 'todo' | 'complete' | 'cancelled'
}

export const PDFCheckbox: React.FC<PDFCheckboxProps> = ({ status }) => {
  const checkbox = {
    todo: '☐',
    complete: '☑',
    cancelled: '☒'
  }[status]
  
  return (
    <Text style={{ fontSize: 12, textAlign: 'center' }}>
      {checkbox}
    </Text>
  )
}

interface PDFFooterProps {
  pageStyle: PageStylePreset
}

export const PDFFooter: React.FC<PDFFooterProps> = ({ pageStyle }) => {
  const documentStyles = createDocumentStyles(pageStyle)
  
  return (
    <Text 
      style={documentStyles.footer}
      render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      fixed
    />
  )
}

// Type section header for grouped PDFs
interface PDFTypeHeaderProps {
  typeName: string
  noteCount: number
}

export const PDFTypeHeader: React.FC<PDFTypeHeaderProps> = ({ typeName, noteCount }) => {
  const tableStyles = createTableStyles()
  
  return (
    <View style={tableStyles.typeHeader}>
      <Text style={tableStyles.typeHeaderText}>
        {typeName}
      </Text>
    </View>
  )
}

// Combined checkbox and priority component
interface PDFCheckboxPriorityProps {
  status: 'todo' | 'complete' | 'cancelled'
  priority: string
  includeCheckbox: boolean
}

export const PDFCheckboxPriority: React.FC<PDFCheckboxPriorityProps> = ({ 
  status, 
  priority, 
  includeCheckbox 
}) => {
  try {
    // Use proper box drawing characters instead of ASCII brackets
    const checkbox = {
      todo: '☐',
      complete: '☑',
      cancelled: '☒'
    }[status] || '☐'
    
    console.log('PDFCheckboxPriority - Rendering:', { 
      status, 
      priority, 
      includeCheckbox, 
      checkbox,
      fullText: `${checkbox} ${priority?.toUpperCase() || 'MEDIUM'}`
    })
    
    if (includeCheckbox) {
      // Use single Text element to ensure proper rendering
      return (
        <Text style={sanitizeStyles({ fontSize: 8, fontFamily: 'Helvetica' })}>
          {`${checkbox} ${priority?.toUpperCase() || 'MEDIUM'}`}
        </Text>
      )
    }
    
    return (
      <Text style={sanitizeStyles({ fontSize: 8 })}>
        {priority?.toUpperCase() || 'MEDIUM'}
      </Text>
    )
  } catch (error) {
    console.error('PDFCheckboxPriority - Error:', error)
    // Fallback rendering
    return (
      <Text style={sanitizeStyles({ fontSize: 8 })}>
        {includeCheckbox ? `☐ ${priority || 'MEDIUM'}` : (priority || 'MEDIUM').toUpperCase()}
      </Text>
    )
  }
}