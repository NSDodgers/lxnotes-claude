/**
 * Demo Mode Layout
 *
 * Wraps all demo routes with the demo banner and initialization logic
 */

import { DemoBanner } from '@/components/demo/demo-banner'

export const metadata = {
  title: 'Demo - LX Notes',
  description: 'Try LX Notes with Pirates of Penzance sample data',
  robots: 'noindex, nofollow', // Don't index demo pages
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DemoBanner />
      {children}
    </>
  )
}