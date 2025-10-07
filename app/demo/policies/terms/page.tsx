/**
 * Demo Terms of Service Page
 *
 * Renders the terms of service in demo mode using the shared client component.
 * The DemoLayout from the parent provides the demo banner.
 */
'use client'

import { TermsClient } from '@/components/policies/terms-client'

export default function DemoTermsPage() {
  return <TermsClient />
}
