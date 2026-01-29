import {
  Container,
  Section,
  Text,
} from '@react-email/components'

interface SummaryCardProps {
  todoCount: number
  completeCount: number
  cancelledCount: number
  filterDescription: string
}

/**
 * Summary card showing note statistics
 * Used in notes distribution emails
 */
export function SummaryCard({
  todoCount,
  completeCount,
  cancelledCount,
  filterDescription,
}: SummaryCardProps) {
  return (
    <Section
      style={{
        backgroundColor: '#f3f4f6',
        padding: '16px',
        borderRadius: '8px',
        margin: '20px 0',
      }}
    >
      <Container>
        <Text
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 12px 0',
          }}
        >
          Summary
        </Text>

        {/* Stats row */}
        <Text
          style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 8px 0',
          }}
        >
          <span style={{ color: '#3b82f6' }}>{todoCount} todo</span>
          {' '}&bull;{' '}
          <span style={{ color: '#22c55e' }}>{completeCount} complete</span>
          {' '}&bull;{' '}
          <span style={{ color: '#9ca3af' }}>{cancelledCount} cancelled</span>
        </Text>

        {/* Filter description */}
        <Text
          style={{
            fontSize: '13px',
            color: '#6b7280',
            margin: '0',
          }}
        >
          Filter: {filterDescription}
        </Text>
      </Container>
    </Section>
  )
}
