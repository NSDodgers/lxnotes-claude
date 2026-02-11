/**
 * Demo Cookie Policy Page
 *
 * Renders the cookie policy in demo mode using the shared client component.
 * The DemoLayout from the parent provides the demo banner.
 */
'use client'

import { CookiePolicyClient } from '@/components/policies/cookie-policy-client'

export default function DemoCookiePolicyPage() {
  return <CookiePolicyClient />
}
