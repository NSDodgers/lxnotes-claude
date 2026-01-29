import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { Header } from './components/header'
import { Footer } from './components/footer'

interface InvitationEmailProps {
  productionName: string
  inviterName: string
  role: 'admin' | 'member'
  inviteUrl: string
  expiresAt: string // ISO date string
}

/**
 * Invitation email template
 * Sent when a user is invited to join a production
 */
export function InvitationEmail({
  productionName = 'Production Name',
  inviterName = 'Team Member',
  role = 'member',
  inviteUrl = 'https://lxnotes.app',
  expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
}: InvitationEmailProps) {
  const roleText = role === 'admin' ? 'Admin' : 'Team Member'
  const expiresDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Html>
      <Head />
      <Preview>You've been invited to join {productionName} on LX Notes</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with purple accent (LX Notes brand) */}
          <Header
            title={productionName}
            subtitle="Production Invitation"
          />

          {/* Content */}
          <Section style={content}>
            <Text style={paragraph}>
              <strong>{inviterName}</strong> has invited you to join{' '}
              <strong>{productionName}</strong> as a <strong>{roleText}</strong> on LX Notes.
            </Text>

            <Text style={paragraph}>
              LX Notes is a collaborative production notes management tool for theatrical
              lighting teams. Track cue notes, work notes, and production notes all in one
              place.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={inviteUrl}>
                Accept Invitation
              </Button>
            </Section>

            {/* Expiration notice */}
            <Text style={expirationText}>
              This invitation expires on {expiresDate}.
            </Text>

            <Text style={mutedText}>
              If you didn't expect this invitation, you can safely ignore this email.
            </Text>
          </Section>

          <Footer />
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

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4b5563',
  margin: '0 0 16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#8b5cf6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const expirationText = {
  fontSize: '14px',
  color: '#9ca3af',
  margin: '0 0 8px 0',
}

const mutedText = {
  fontSize: '14px',
  color: '#9ca3af',
  margin: '0',
}

export default InvitationEmail
