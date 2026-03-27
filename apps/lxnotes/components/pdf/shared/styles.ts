import { StyleSheet } from '@react-pdf/renderer'

// Module color themes
export const moduleColors = {
  cue: {
    primary: '#9333ea', // Purple
    light: '#e9d5ff',
    dark: '#581c87'
  },
  work: {
    primary: '#3b82f6', // Blue
    light: '#dbeafe',
    dark: '#1e3a8a'
  },
  production: {
    primary: '#06b6d4', // Cyan
    light: '#cffafe',
    dark: '#0e7490'
  },
  electrician: {
    primary: '#22c55e', // Green
    light: '#dcfce7',
    dark: '#15803d'
  }
}

// Priority colors
export const priorityColors = {
  critical: '#dc2626',
  very_high: '#ea580c',
  high: '#f59e0b',
  medium_high: '#b0b5bd',
  medium: '#9ca3af',
  medium_low: '#868c96',
  low: '#6b7280',
  very_low: '#4b5563',
  uncritical: '#374151'
}

// Type colors (matching current design)
export const typeColors: Record<string, string> = {
  'cue': '#3b82f6',
  'director': '#e74c3c',
  'designer': '#9b59b6',
  'stage_manager': '#e67e22',
  'programmer': '#95a5a6',
  'choreographer': '#e74c3c',
  'spot': '#95a5a6',
  'assistant': '#95a5a6',
  'associate': '#2ecc71',
  'paperwork': '#3b82f6',
  'think': '#95a5a6'
}

// Common styles used across all PDF documents
export const commonStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },

  // Compact Header styles - logo left, info stacked right
  header: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
    gap: 10
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 10,
    objectFit: 'contain' as const,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  productionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1
  },
  moduleTitle: {
    fontSize: 12,
    marginBottom: 1
  },
  metadata: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 0
  },

  // Table styles - compact for high density
  table: {
    marginTop: 6,
    width: '100%'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    minHeight: 24,
    alignItems: 'center'
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    minHeight: 28,
    alignItems: 'center'
  },
  tableHeader: {
    padding: 4,
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff'
  },
  tableCell: {
    padding: 4,
    fontSize: 9,
    color: '#000000'
  },

  // Checkbox styles - compact
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 0.5,
    borderColor: '#000000',
    marginRight: 2
  },
  checkboxChecked: {
    backgroundColor: '#22c55e'
  },
  checkboxCancelled: {
    backgroundColor: '#ef4444'
  },

  // Badge styles - compact
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: 2,
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center'
  },

  // Footer styles - compact
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280'
  },

  // Utility styles
  flexRow: {
    flexDirection: 'row'
  },
  textCenter: {
    textAlign: 'center'
  },
  textBold: {
    fontFamily: 'Helvetica-Bold'
  },
  mb4: {
    marginBottom: 4
  },
  mb8: {
    marginBottom: 8
  },
  mb12: {
    marginBottom: 12
  }
})
