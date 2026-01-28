import React from 'react'
import { View, Text, Image } from '@react-pdf/renderer'
import { commonStyles } from './styles'
import { DEFAULT_PRODUCTION_LOGO } from '@/lib/stores/production-store'

interface PDFHeaderProps {
  productionName: string
  productionLogo?: string
  moduleTitle: string
  dateGenerated: Date
  noteCount: number
  filterPresetName?: string
}

export const PDFHeader: React.FC<PDFHeaderProps> = ({
  productionName,
  productionLogo,
  moduleTitle,
  dateGenerated,
  noteCount,
  filterPresetName
}) => {
  const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear().toString().slice(-2)
    return `${month} ${day}, ${year}`
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <View style={commonStyles.header}>
      {/* Logo on left - supports both file paths and base64 */}
      {productionLogo && productionLogo !== DEFAULT_PRODUCTION_LOGO && (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={productionLogo} style={commonStyles.logo} />
      )}

      {/* Production info stacked on right */}
      <View style={commonStyles.headerInfo}>
        <Text style={commonStyles.productionTitle}>{productionName}</Text>
        <Text style={commonStyles.moduleTitle}>{moduleTitle} Report</Text>
        <Text style={commonStyles.metadata}>
          Generated: {formatDate(dateGenerated)} at {formatTime(dateGenerated)}
          {filterPresetName && ` • ${filterPresetName}`}
          {' • '}{noteCount} {noteCount === 1 ? 'note' : 'notes'}
        </Text>
      </View>
    </View>
  )
}
