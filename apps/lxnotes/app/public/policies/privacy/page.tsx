import { Metadata } from 'next'
import { PublicPolicyLayout } from '@/components/layout/public-policy-layout'
import { PolicyEmbed } from '@/components/policies/policy-embed'

export const metadata: Metadata = {
  title: 'Privacy Policy - LX Notes',
  description: 'LX Notes Privacy Policy',
}

export default function PublicPrivacyPage() {
  return (
    <PublicPolicyLayout title="Privacy Policy">
      <PolicyEmbed
        accountId="QlGyI"
        documentType="privacy"
        lang="en-us"
        mode="direct"
      />
    </PublicPolicyLayout>
  )
}
