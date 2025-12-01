import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { PolicyFooter } from '@/components/layout/policy-footer'

export const metadata: Metadata = {
  title: 'LX Notes - Production Notes Management',
  description: 'Collaborative lighting and production notes for theatrical teams. Try our interactive demo with Pirates of Penzance sample data.',
  openGraph: {
    title: 'LX Notes - Production Notes Management',
    description: 'Try our interactive demo with Pirates of Penzance sample data',
    images: ['/images/lxnotes_logo_horiz.png'],
  }
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">

        {/* LX Notes Logo */}
        <div className="mb-12">
          <Image
            src="/images/lxnotes_logo_stacked.png"
            alt="LX Notes"
            width={400}
            height={200}
            className="mx-auto"
            priority
          />
        </div>

        {/* Tagline */}
        <h2 className="text-xl text-text-secondary mb-12 max-w-xl mx-auto font-display">
          Production Notes Management for Theatrical Lighting Teams
        </h2>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Demo Button - Primary CTA */}
          <Link
            href="/demo/cue-notes"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 transform duration-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Try Demo
          </Link>

          {/* Collaborative Button - Romeo and Juliet */}
          <Link
            href="/romeo-juliet/cue-notes"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white text-lg font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 transform duration-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Romeo & Juliet
          </Link>
        </div>

        <p className="text-sm text-text-muted mt-4 mb-8">
          Try the demo, or collaborate on Romeo & Juliet in real-time
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="p-4 bg-bg-secondary rounded-lg border border-border hover:border-modules-cue/50 transition-colors">
            <div className="text-modules-cue mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1 font-display">Cue Notes</h3>
            <p className="text-xs text-text-secondary">
              Track lighting cues and design moments
            </p>
          </div>

          <div className="p-4 bg-bg-secondary rounded-lg border border-border hover:border-modules-work/50 transition-colors">
            <div className="text-modules-work mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1 font-display">Work Notes</h3>
            <p className="text-xs text-text-secondary">
              Manage equipment and technical tasks
            </p>
          </div>

          <div className="p-4 bg-bg-secondary rounded-lg border border-border hover:border-modules-production/50 transition-colors">
            <div className="text-modules-production mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1 font-display">Production Notes</h3>
            <p className="text-xs text-text-secondary">
              Cross-department communication
            </p>
          </div>
        </div>

        {/* Policy Links */}
        <div className="mt-16 pt-8 border-t border-border">
          <PolicyFooter layout="horizontal" className="text-text-muted" />
        </div>
      </div>
    </div>
  )
}