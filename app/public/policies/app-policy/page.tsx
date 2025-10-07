import { Metadata } from 'next'
import { PublicPolicyLayout } from '@/components/layout/public-policy-layout'
import { PolicyEmbed } from '@/components/policies/policy-embed'

export const metadata: Metadata = {
  title: 'App Policy - LX Notes',
  description: 'LX Notes App Policy',
}

export default function PublicAppPolicyPage() {
  return (
    <PublicPolicyLayout title="App Policy">
      <PolicyEmbed
        accountId="QlGyI"
        documentType="app-privacy"
        lang="en-us"
        mode="direct"
      />
    </PublicPolicyLayout>
  )
}
