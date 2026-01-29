import {
  Container,
  Hr,
  Section,
  Text,
} from '@react-email/components'

interface FooterProps {
  senderName?: string
}

/**
 * Standard footer component for all email templates
 */
export function Footer({ senderName }: FooterProps) {
  return (
    <Section
      style={{
        padding: '0 24px 24px 24px',
        backgroundColor: '#ffffff',
        borderRadius: '0 0 8px 8px',
      }}
    >
      <Container>
        <Hr
          style={{
            borderColor: '#e5e7eb',
            margin: '24px 0',
          }}
        />

        {senderName && (
          <Text
            style={{
              fontSize: '12px',
              color: '#9ca3af',
              margin: '0 0 8px 0',
            }}
          >
            Sent from LX Notes by {senderName}
          </Text>
        )}

        <Text
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: '0',
          }}
        >
          LX Notes - Production notes management for theatrical lighting teams
        </Text>
      </Container>
    </Section>
  )
}
