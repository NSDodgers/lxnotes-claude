/**
 * Collaborative Mode Layout (Romeo and Juliet)
 *
 * Wraps all collaborative routes with the collaborative banner
 */

import { CollaborativeBanner } from '@/components/collaborative/collaborative-banner'

export const metadata = {
  title: 'Romeo & Juliet - LX Notes Collaborative',
  description: 'Collaborative lighting notes for Romeo and Juliet',
  robots: 'noindex, nofollow', // Don't index collaborative pages
}

export default function CollaborativeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CollaborativeBanner />
      {children}
    </>
  )
}
