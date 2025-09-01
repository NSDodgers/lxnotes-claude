import type { PageStylePreset } from '@/types'

// Properties not supported by @react-pdf/renderer
const UNSUPPORTED_PROPERTIES = new Set([
  'borderRadius', // Not supported in all contexts
  'boxShadow',
  'textShadow',
  'background', // Use backgroundColor instead
  'outline',
  'cursor',
  'userSelect',
  'pointerEvents',
  'filter',
  'backdropFilter',
  'transform', // Limited support
  'transition',
  'animation'
])

// Utility to remove undefined values and unsupported properties from style objects for @react-pdf/renderer compatibility
export const sanitizeStyles = (styles: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(styles)) {
    if (value !== undefined && value !== null) {
      if (UNSUPPORTED_PROPERTIES.has(key)) {
        console.warn(`PDF Styles: Removing unsupported property '${key}' with value '${value}'`)
        continue
      }
      sanitized[key] = value
    }
  }
  
  return sanitized
}

export const pdfTheme = {
  // Colors (consistent across all modules)
  colors: {
    primary: '#1e293b',      // Dark text
    secondary: '#64748b',    // Muted text
    border: '#e2e8f0',      // Table borders
    headerBg: '#f8fafc',    // Table header background
    rowAltBg: '#f1f5f9',    // Alternating row background
    
    // Status colors (same for all modules)
    statusTodo: '#3b82f6',
    statusComplete: '#10b981',
    statusCancelled: '#6b7280',
    
    // Priority colors (same for all modules)
    priorityHigh: '#ef4444',
    priorityMedium: '#f97316',
    priorityLow: '#10b981',
  },
  
  // Typography (consistent across all modules)
  fonts: {
    header: { size: 20, weight: 'bold' as const },
    subheader: { size: 14, weight: 'semibold' as const },
    body: { size: 10, weight: 'normal' as const },
    caption: { size: 8, weight: 'normal' as const },
  },
  
  // Spacing (more compact layout)
  spacing: {
    page: { top: 20, right: 20, bottom: 50, left: 20 }, // Increased bottom padding for footer space
    row: { padding: 3 }, // Reduced from 6 to 3
    cell: { padding: 1 }, // Reduced from 2 to 1
  },
  
  // Layout configurations (more compact)
  layout: {
    narrow: { margin: 15 },
    normal: { margin: 20 }, // Reduced from 30 to 20
    wide: { margin: 30 }, // Reduced from 45 to 30
  },
  
  // Type colors for different note types
  typeColors: {
    director: '#E91E63',      // Pink/Magenta
    choreographer: '#E91E63', // Pink variant
    cue: '#2196F3',          // Blue
    designer: '#9C27B0',     // Purple
    stage_manager: '#FF9800', // Orange
    associate: '#4CAF50',     // Green
    general: '#757575',       // Gray
    default: '#757575',       // Default gray
  }
}

// Paper size definitions in points (72 points = 1 inch)
export const paperSizes = {
  letter: { width: 612, height: 792 },   // 8.5 x 11 inches
  legal: { width: 612, height: 1008 },   // 8.5 x 14 inches
  a4: { width: 595, height: 842 },       // 210 x 297 mm
}

export const createDocumentStyles = (pageStylePreset: PageStylePreset) => {
  const paperSize = paperSizes[pageStylePreset.config.paperSize as keyof typeof paperSizes]
  const isLandscape = pageStylePreset.config.orientation === 'landscape'
  const spacing = pdfTheme.spacing.page
  
  return {
    page: {
      width: isLandscape ? paperSize.height : paperSize.width,
      height: isLandscape ? paperSize.width : paperSize.height,
      paddingTop: spacing.top,
      paddingBottom: spacing.bottom,
      paddingLeft: spacing.left,
      paddingRight: spacing.right,
      backgroundColor: '#ffffff',
      fontFamily: 'Helvetica',
      fontSize: pdfTheme.fonts.body.size,
      color: pdfTheme.colors.primary,
    },
    // Compact header styles
    productionName: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      color: pdfTheme.colors.primary,
      marginBottom: 1,
    },
    reportTitle: {
      fontSize: 12,
      fontWeight: 'normal' as const,
      color: pdfTheme.colors.primary,
      marginBottom: 1,
    },
    reportMeta: {
      fontSize: 10,
      fontWeight: 'normal' as const,
      color: pdfTheme.colors.secondary,
      marginBottom: 8, // Reduced from 15 to 8
    },
    footer: {
      position: 'absolute' as const,
      bottom: 20, // Positioned higher up from bottom edge for better visibility
      right: 20, // Add some margin from right edge
      fontSize: pdfTheme.fonts.caption.size,
      color: pdfTheme.colors.secondary,
      textAlign: 'right' as const,
    }
  }
}

export const createTableStyles = () => ({
  table: {
    width: '100%',
    marginTop: 5, // Reduced from 10 to 5
  },
  headerRow: {
    backgroundColor: '#6B7280', // Dark gray like the example
    flexDirection: 'row' as const,
    paddingVertical: 2, // Reduced from 4 to 2
  },
  row: {
    flexDirection: 'row' as const,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
    minHeight: 18, // Reduced from 24 to 18
  },
  rowAlt: {
    flexDirection: 'row' as const,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    minHeight: 18, // Reduced from 24 to 18
  },
  cell: {
    padding: pdfTheme.spacing.cell.padding,
    fontSize: 8, // Reduced from 9 to 8 for more compact
    color: pdfTheme.colors.primary,
    textAlign: 'left' as const,
    justifyContent: 'center' as const,
  },
  headerCell: {
    padding: 2, // Reduced from 3 to 2
    fontSize: 8, // Reduced from 9 to 8
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    textAlign: 'left' as const,
  },
  typeHeader: {
    backgroundColor: '#6B7280', // Dark gray section header
    paddingVertical: 3, // Reduced from 6 to 3
    paddingHorizontal: 6, // Reduced from 8 to 6
    marginTop: 6, // Reduced from 10 to 6
    marginBottom: 0,
  },
  typeHeaderText: {
    fontSize: 9, // Reduced from 10 to 9
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
  }
})

export const createBadgeStyles = () => {
  try {
    const rawStyles = {
      statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: pdfTheme.fonts.caption.size || 8,
        fontWeight: 'bold' as const,
        color: '#ffffff',
        textAlign: 'center' as const,
      },
      priorityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: pdfTheme.fonts.caption.size || 8,
        fontWeight: 'bold' as const,
        color: '#ffffff',
        textAlign: 'center' as const,
      }
    }
    
    // Sanitize each style object to remove any undefined values
    return {
      statusBadge: sanitizeStyles(rawStyles.statusBadge),
      priorityBadge: sanitizeStyles(rawStyles.priorityBadge),
    }
  } catch (error) {
    console.error('Error creating badge styles:', error)
    // Return sanitized fallback styles
    const fallbackStyles = {
      statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 8,
        fontWeight: 'bold' as const,
        color: '#ffffff',
        textAlign: 'center' as const,
      },
      priorityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 8,
        fontWeight: 'bold' as const,
        color: '#ffffff',
        textAlign: 'center' as const,
      }
    }
    
    return {
      statusBadge: sanitizeStyles(fallbackStyles.statusBadge),
      priorityBadge: sanitizeStyles(fallbackStyles.priorityBadge),
    }
  }
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo':
      return pdfTheme.colors.statusTodo
    case 'complete':
      return pdfTheme.colors.statusComplete
    case 'cancelled':
      return pdfTheme.colors.statusCancelled
    default:
      return pdfTheme.colors.secondary
  }
}

export const getPriorityColor = (priority: string) => {
  if (!priority || typeof priority !== 'string') {
    return pdfTheme.colors.secondary
  }
  
  const normalizedPriority = priority.toLowerCase()
  
  switch (normalizedPriority) {
    case 'critical':
    case 'high':
    case 'very high':
    case 'very_high':
    case 'veryhigh':
      return pdfTheme.colors.priorityHigh
    case 'medium':
      return pdfTheme.colors.priorityMedium
    case 'low':
    case 'very low':
    case 'very_low':
    case 'verylow':
      return pdfTheme.colors.priorityLow
    default:
      return pdfTheme.colors.secondary
  }
}

export const getTypeColor = (type: string) => {
  if (!type || typeof type !== 'string') {
    return pdfTheme.typeColors.default
  }
  
  const normalizedType = type.toLowerCase()
  return (pdfTheme.typeColors as any)[normalizedType] || pdfTheme.typeColors.default
}