'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'

interface PublicPolicyLayoutProps {
  children: React.ReactNode
  title: string
}

/**
 * PublicPolicyLayout Component
 *
 * Minimal layout for public policy pages accessed from the home page.
 * Provides a simple header with logo and back-to-home navigation.
 */
export function PublicPolicyLayout({ children, title }: PublicPolicyLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Logo */}
          <div className="mb-6">
            <Image
              src="/images/lxnotes_logo_horiz.png"
              alt="LX Notes"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white">
            {title}
          </h1>
        </div>

        {/* Policy Content */}
        <div className="bg-white rounded-lg p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  )
}
