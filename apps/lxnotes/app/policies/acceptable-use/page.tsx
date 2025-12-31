import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PolicyEmbed } from '@/components/policies/policy-embed'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy - LX Notes',
  description: 'LX Notes Acceptable Use Policy',
}

export default function AcceptableUsePage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/cue-notes"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-text-primary mb-8">
          Acceptable Use Policy
        </h1>

        {/* Policy Embed */}
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <PolicyEmbed
            accountId="QlGyI"
            documentType="acceptable-use"
            lang="en-us"
            mode="direct"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
