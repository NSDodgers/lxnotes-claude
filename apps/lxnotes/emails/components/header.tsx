import {
  Container,
  Heading,
  Hr,
  Img,
  Section,
  Text,
} from '@react-email/components'

interface HeaderProps {
  title: string
  subtitle?: string
  accentColor?: string
}

// LX Notes brand purple
const BRAND_PURPLE = '#8b5cf6'

/**
 * Dark header component with LX Notes branding
 * Used across all email templates
 */
export function Header({ title, subtitle, accentColor = BRAND_PURPLE }: HeaderProps) {
  return (
    <Section
      style={{
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1f1f1f 100%)',
        padding: '32px 24px',
        borderRadius: '8px 8px 0 0',
      }}
    >
      <Container>
        {/* Logo */}
        <Img
          src="https://lxnotes.app/images/lxnotes_logo_horiz.png"
          alt="LX Notes"
          width="180"
          height="70"
          style={{
            margin: '0 0 8px 0',
          }}
        />

        {/* Accent bar */}
        <Hr
          style={{
            borderColor: accentColor,
            borderWidth: '2px',
            margin: '12px 0',
            width: '60px',
          }}
        />

        {/* Title */}
        <Heading
          as="h1"
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#ffffff',
            margin: '16px 0 0 0',
          }}
        >
          {title}
        </Heading>

        {/* Optional subtitle */}
        {subtitle && (
          <Text
            style={{
              fontSize: '14px',
              color: '#a1a1aa',
              margin: '8px 0 0 0',
            }}
          >
            {subtitle}
          </Text>
        )}
      </Container>
    </Section>
  )
}
