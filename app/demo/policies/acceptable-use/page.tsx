/**
 * Demo Acceptable Use Policy Page
 *
 * Renders the acceptable use policy in demo mode using the shared client component.
 * The DemoLayout from the parent provides the demo banner.
 */
'use client'

import { AcceptableUseClient } from '@/components/policies/acceptable-use-client'

export default function DemoAcceptableUsePage() {
  return <AcceptableUseClient />
}
