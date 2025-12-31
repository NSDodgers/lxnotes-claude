import { Metadata } from 'next'
import { PublicPolicyLayout } from '@/components/layout/public-policy-layout'
import { PolicyEmbed } from '@/components/policies/policy-embed'

export const metadata: Metadata = {
  title: 'Terms of Service - LX Notes',
  description: 'LX Notes Terms of Service',
}

export default function PublicTermsPage() {
  return (
    <PublicPolicyLayout title="Terms of Service">
      <PolicyEmbed
        accountId="QlGyI"
        documentType="terms-of-service"
        lang="en-us"
        mode="direct"
      />
    </PublicPolicyLayout>
  )
}
