import { Metadata } from 'next'
import { PublicPolicyLayout } from '@/components/layout/public-policy-layout'
import { PolicyEmbed } from '@/components/policies/policy-embed'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy - LX Notes',
  description: 'LX Notes Acceptable Use Policy',
}

export default function PublicAcceptableUsePage() {
  return (
    <PublicPolicyLayout title="Acceptable Use Policy">
      <PolicyEmbed
        accountId="QlGyI"
        documentType="acceptable-use"
        lang="en-us"
        mode="direct"
      />
    </PublicPolicyLayout>
  )
}
