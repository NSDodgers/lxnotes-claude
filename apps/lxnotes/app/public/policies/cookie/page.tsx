import { Metadata } from 'next'
import { PublicPolicyLayout } from '@/components/layout/public-policy-layout'
import { PolicyEmbed } from '@/components/policies/policy-embed'

export const metadata: Metadata = {
  title: 'Cookie Policy - LX Notes',
  description: 'LX Notes Cookie Policy',
}

export default function PublicCookiePolicyPage() {
  return (
    <PublicPolicyLayout title="Cookie Policy">
      <PolicyEmbed
        accountId="QlGyI"
        documentType="cookies"
        lang="en-us"
        mode="direct"
      />
    </PublicPolicyLayout>
  )
}
