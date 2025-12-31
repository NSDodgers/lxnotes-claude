/**
 * App Policy Client Component
 *
 * Shared client component for rendering the App Policy.
 * Detects context (demo vs public) and renders appropriate layout.
 */
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PublicPolicyLayout } from '@/components/layout/public-policy-layout'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PolicyEmbed } from '@/components/policies/policy-embed'

export function AppPolicyClient() {
  const pathname = usePathname()
  const isDemoMode = pathname.startsWith('/demo')

  const content = (
    <PolicyEmbed
      accountId="QlGyI"
      documentType="app-privacy"
      lang="en-us"
      mode="direct"
    />
  )

  if (isDemoMode) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <Link
              href="/demo/cue-notes"
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-text-primary mb-8">
            App Policy
          </h1>

          {/* Policy Embed */}
          <div className="bg-white rounded-lg p-8 shadow-lg">
            {content}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <PublicPolicyLayout title="App Policy">
      {content}
    </PublicPolicyLayout>
  )
}
