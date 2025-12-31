/**
 * Demo App Policy Page
 *
 * Renders the app policy in demo mode using the shared client component.
 * The DemoLayout from the parent provides the demo banner.
 */
'use client'

import { AppPolicyClient } from '@/components/policies/app-policy-client'

export default function DemoAppPolicyPage() {
  return <AppPolicyClient />
}
