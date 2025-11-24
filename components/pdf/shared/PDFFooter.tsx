import React from 'react'
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { commonStyles } from './styles'
import { LX_NOTES_LOGO_BASE64 } from '@/lib/constants/pdf-assets'

interface PDFFooterProps {
  pageNumber: number
  totalPages: number
}

const footerStyles = StyleSheet.create({
  footerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 6.5,
    color: '#6b7280'
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  logo: {
    width: 50,
    height: 19
  },
  footerCenter: {
    flex: 1,
    textAlign: 'center'
  },
  footerRight: {
    textAlign: 'right'
  }
})

export const PDFFooter: React.FC<PDFFooterProps> = ({ pageNumber, totalPages }) => {
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

  const printDateTime = new Date()

  return (
    <View style={footerStyles.footerContainer} fixed>
      <View style={footerStyles.footerLeft}>
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={LX_NOTES_LOGO_BASE64} style={footerStyles.logo} />
      </View>
      <View style={footerStyles.footerCenter}>
        <Text>Page {pageNumber} of {totalPages}</Text>
      </View>
      <View style={footerStyles.footerRight}>
        <Text>Printed: {formatDate(printDateTime)} at {formatTime(printDateTime)}</Text>
      </View>
    </View>
  )
}
