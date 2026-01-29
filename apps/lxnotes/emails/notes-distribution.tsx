import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { Header } from './components/header'
import { Footer } from './components/footer'
import { SummaryCard } from './components/summary-card'
import type { ModuleType } from '@/types'

interface NotesDistributionEmailProps {
  productionName: string
  moduleType: ModuleType
  moduleName: string
  message: string
  senderName: string
  todoCount: number
  completeCount: number
  cancelledCount: number
  filterDescription: string
  pdfFilename?: string
}

/**
 * Get module accent color based on module type
 */
function getModuleColor(moduleType: ModuleType): string {
  const colors: Record<ModuleType, string> = {
    cue: '#8b5cf6',        // Purple
    work: '#3b82f6',       // Blue
    production: '#06b6d4', // Cyan
    actor: '#f59e0b',      // Amber
  }
  return colors[moduleType] || '#14b8a6'
}

/**
 * Notes distribution email template
 * Sent when sharing notes with team members
 */
export function NotesDistributionEmail({
  productionName = 'Production Name',
  moduleType = 'work',
  moduleName = 'Work Notes',
  message = 'Here are the latest notes from the production.',
  senderName = 'Team Member',
  todoCount = 5,
  completeCount = 3,
  cancelledCount = 1,
  filterDescription = 'All notes',
  pdfFilename,
}: NotesDistributionEmailProps) {
  const accentColor = getModuleColor(moduleType)

  return (
    <Html>
      <Head />
      <Preview>{moduleName} - {productionName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with module-specific color */}
          <Header
            title={moduleName}
            subtitle={productionName}
            accentColor={accentColor}
          />

          {/* Content */}
          <Section style={content}>
            {/* User message */}
            <Text style={messageText}>{message}</Text>

            {/* Summary card */}
            <SummaryCard
              todoCount={todoCount}
              completeCount={completeCount}
              cancelledCount={cancelledCount}
              filterDescription={filterDescription}
            />

            {/* PDF attachment indicator */}
            {pdfFilename && (
              <Text style={attachmentText}>
                Attached: {pdfFilename}
              </Text>
            )}
          </Section>

          <Footer senderName={senderName} />
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
}

const content = {
  padding: '24px',
}

const messageText = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4b5563',
  margin: '0 0 16px 0',
  whiteSpace: 'pre-wrap' as const,
}

const attachmentText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '16px 0 0 0',
  padding: '12px 16px',
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  borderLeft: '3px solid #8b5cf6',
}

export default NotesDistributionEmail
