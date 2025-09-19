import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PDFConfiguration, PDFFormattedNote, PDFStrategy } from './types'

export class PDFTemplateEngine {
  private doc: jsPDF
  private config: PDFConfiguration
  private strategy: PDFStrategy

  constructor(config: PDFConfiguration, strategy: PDFStrategy) {
    this.config = config
    this.strategy = strategy

    // Initialize jsPDF with configuration
    this.doc = new jsPDF({
      orientation: config.orientation,
      unit: 'pt',
      format: config.paperSize
    })
  }

  generatePDF(notes: PDFFormattedNote[]): Blob {
    this.addHeader(notes.length)
    this.addNotesTable(notes)
    this.addFooter()

    return this.doc.output('blob')
  }

  private addHeader(noteCount: number): void {
    let yPos = 40

    // Add production logo if available (like "🎭" or base64 image)
    if (this.config.productionLogo) {
      if (this.isBase64Image(this.config.productionLogo)) {
        // Handle base64 image data
        try {
          this.doc.addImage(this.config.productionLogo, 'JPEG', 40, yPos - 30, 30, 30)
          yPos += 35
        } catch (error) {
          console.warn('Failed to add logo image, falling back to text:', error)
          // Fallback to text if image fails
          this.doc.setFontSize(30)
          this.doc.setFont('helvetica', 'normal')
          this.doc.text('🎭', 40, yPos)
          yPos += 35
        }
      } else {
        // Handle text/emoji logo
        this.doc.setFontSize(30)
        this.doc.setFont('helvetica', 'normal')
        this.doc.text(this.config.productionLogo, 40, yPos)
        yPos += 35
      }
    }

    // Production title (show name) - larger and more prominent like the example
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(this.config.productionName, this.config.productionLogo ? 75 : 40, this.config.productionLogo ? yPos - 35 : yPos)
    yPos += 25

    // Module title as subtitle
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`${this.strategy.getModuleTitle()} Report`, 40, yPos)
    yPos += 20

    // Generation metadata line matching the example format
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(100, 100, 100)
    
    const dateStr = this.formatDateLikeExample(this.config.dateGenerated)
    const timeStr = this.formatTimeLikeExample(this.config.dateGenerated)
    
    // Format: "Generated: Sep 1, 25 at 9:56 AM • Status: Todo • Total: X notes"
    const metadataText = `Generated: ${dateStr} at ${timeStr} • Status: Todo • Total: ${noteCount} notes`
    this.doc.text(metadataText, 40, yPos)

    // Reset text color
    this.doc.setTextColor(0, 0, 0)
  }

  private formatDateLikeExample(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear().toString().slice(-2)
    return `${month} ${day}, ${year}`
  }

  private formatTimeLikeExample(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  private addNotesTable(notes: PDFFormattedNote[]): void {
    const headers = this.strategy.getColumnHeaders()
    const tableData = this.formatTableData(notes)

    autoTable(this.doc, {
      head: [headers],
      body: tableData,
      startY: 110,
      styles: {
        fontSize: 9,
        cellPadding: 5,
        lineColor: [180, 180, 180],
        lineWidth: 0.5,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [140, 140, 140],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 15 }, // Checkbox column
        1: { cellWidth: 60 }, // Priority  
        2: { cellWidth: 80 }, // Type - wider for colored badges
        3: { cellWidth: 50 }, // Cue # / Channels
        4: { cellWidth: 80 }, // Scene/Song / Position/Unit
        5: { cellWidth: 'auto' }, // Note
        6: { cellWidth: 60 }, // Created
      },
      didDrawCell: (data: any) => {
        // Add checkboxes in first column when enabled
        if (this.config.includeCheckboxes && data.column.index === 0 && data.section === 'body') {
          const note = notes[data.row.index]
          this.addCheckbox(data.cell.x + 3, data.cell.y + 6, note.status)
        }
        
        // Add colored type badges like in the example
        if (data.column.index === 2 && data.section === 'body') {
          const note = notes[data.row.index]
          if (note.type) {
            this.addColoredTypeBadge(data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4, note.type)
          }
        }
      },
      margin: { top: 40, right: 40, bottom: 40, left: 40 }
    })
  }

  private addColoredTypeBadge(x: number, y: number, width: number, height: number, type: string): void {
    // Color mapping based on the design example
    const typeColors: Record<string, [number, number, number]> = {
      'cue': [52, 152, 219], // Blue
      'director': [231, 76, 60], // Red/Pink
      'designer': [155, 89, 182], // Purple
      'stage_manager': [230, 126, 34], // Orange
      'programmer': [149, 165, 166], // Gray
      'choreographer': [231, 76, 60], // Pink/Red
      'spot': [149, 165, 166], // Gray
      'assistant': [149, 165, 166], // Gray
      'associate': [46, 204, 113], // Green
      'paperwork': [52, 152, 219], // Blue
      'think': [149, 165, 166], // Gray
    }

    const color = typeColors[type.toLowerCase()] || [149, 165, 166] // Default gray

    // Draw colored background
    this.doc.setFillColor(color[0], color[1], color[2])
    this.doc.rect(x, y, width, height, 'F')

    // Add white text
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'bold')
    
    // Center the text in the badge
    const formattedType = this.formatType(type)
    const textWidth = this.doc.getTextWidth(formattedType)
    const textX = x + (width - textWidth) / 2
    const textY = y + height / 2 + 2
    
    this.doc.text(formattedType, textX, textY)

    // Reset text color
    this.doc.setTextColor(0, 0, 0)
  }

  private formatTableData(notes: PDFFormattedNote[]): string[][] {
    return notes.map(note => {
      const moduleType = this.config.moduleType

      // Format the note description with title
      const noteText = `${note.title}: ${note.description || ''}`

      // New column structure: [Checkbox, Priority, Type, Cue#, Scene/Song, Note, Created]
      if (moduleType === 'cue') {
        return [
          '', // Checkbox column (handled in didDrawCell)
          this.formatPriority(note.priority),
          this.formatType(note.type || '-'),
          note.moduleSpecificData.scriptPage || '-',
          note.moduleSpecificData.sceneSong || '-',
          noteText,
          this.formatDateLikeExample(note.createdAt)
        ]
      } else if (moduleType === 'work') {
        return [
          '', // Checkbox column
          this.formatPriority(note.priority),
          this.formatType(note.type || '-'),
          note.moduleSpecificData.channels || '-',
          note.moduleSpecificData.positionUnit || '-',
          noteText,
          this.formatDateLikeExample(note.createdAt)
        ]
      } else { // production
        return [
          '', // Checkbox column
          this.formatPriority(note.priority),
          this.formatType(note.type || '-'),
          noteText,
          this.formatDateLikeExample(note.createdAt)
        ]
      }
    })
  }

  private addCheckbox(x: number, y: number, status: string): void {
    const size = 10

    // Draw proper square checkbox outline like in the example
    this.doc.setDrawColor(0, 0, 0)
    this.doc.setLineWidth(1)
    this.doc.rect(x, y, size, size)

    // Add text based on status - following the example format  
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    
    if (status === 'complete') {
      // Add checkmark for completed items
      this.doc.text('✓', x + 2, y + 7)
    } else if (status === 'cancelled') {
      // Add X mark for cancelled items  
      this.doc.text('✗', x + 2, y + 7)
    }
    // For 'todo' status, leave checkbox empty like in the example

    // Reset styles
    this.doc.setDrawColor(0, 0, 0)
  }

  private addFooter(): void {
    const pageCount = (this.doc as any).getNumberOfPages()
    const pageWidth = this.doc.internal.pageSize.getWidth()
    const pageHeight = this.doc.internal.pageSize.getHeight()

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`Page ${i} of ${pageCount}`,
        pageWidth / 2, pageHeight - 20, { align: 'center' })

      // Add generation info with current print date/time
      const printDateTime = new Date()
      const printDateStr = this.formatDateLikeExample(printDateTime)
      const printTimeStr = this.formatTimeLikeExample(printDateTime)
      this.doc.text(`Generated with LX Notes • Printed: ${printDateStr} at ${printTimeStr}`,
        pageWidth / 2, pageHeight - 10, { align: 'center' })
    }
  }

  private formatPriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      'critical': 'CRITICAL',
      'high': 'HIGH',
      'medium': 'MEDIUM',
      'low': 'LOW',
      'very_low': 'VERY_LOW'
    }
    return priorityMap[priority] || priority.toUpperCase()
  }

  private formatType(type: string): string {
    if (type === '-') return '-'
    
    // Capitalize first letter and handle special cases
    const typeMap: Record<string, string> = {
      'cue': 'Cue',
      'director': 'Director',
      'designer': 'Designer',
      'stage_manager': 'Stage_manager',
      'programmer': 'Programmer',
      'choreographer': 'Choreographer',
      'spot': 'Spot',
      'assistant': 'Assistant',
      'associate': 'Associate',
      'paperwork': 'Paperwork',
      'think': 'Think'
    }
    
    return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'todo': 'To Do',
      'complete': 'Complete',
      'cancelled': 'Cancelled'
    }
    return statusMap[status] || status
  }

  private isBase64Image(str: string): boolean {
    // Check if the string is a base64 data URL
    return str.startsWith('data:image/') && str.includes('base64,')
  }
}