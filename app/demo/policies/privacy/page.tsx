/**
 * Demo Privacy Policy Page
 *
 * Renders the privacy policy in demo mode using the shared client component.
 * The DemoLayout from the parent provides the demo banner.
 */
'use client'

import { PrivacyClient } from '@/components/policies/privacy-client'

export default function DemoPrivacyPage() {
  return <PrivacyClient />
}
