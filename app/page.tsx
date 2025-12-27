import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { PolicyFooter } from '@/components/layout/policy-footer'
import { ProductionList } from '@/components/home/production-list'
import { CreateProductionDialog } from '@/components/home/create-production-dialog'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { UserMenu } from '@/components/auth/user-menu'
import { getCurrentUser, isSuperAdmin, getUserProductions } from '@/lib/auth'

// Force dynamic rendering since this page uses cookies for auth
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'LX Notes - Production Notes Management',
  description: 'Collaborative lighting and production notes for theatrical teams. Try our interactive demo with Pirates of Penzance sample data.',
  openGraph: {
    title: 'LX Notes - Production Notes Management',
    description: 'Try our interactive demo with Pirates of Penzance sample data',
    images: ['/images/lxnotes_logo_horiz.png'],
  }
}

export default async function HomePage() {
  const user = await getCurrentUser()
  const superAdmin = user ? await isSuperAdmin(user.id) : false
  const productions = user ? await getUserProductions(user.id) : []

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">

        {/* LX Notes Logo */}
        <div className="mb-8">
          <Image
            src="/images/lxnotes_logo_stacked.png"
            alt="LX Notes"
            width={300}
            height={150}
            className="mx-auto"
            priority
          />
        </div>

        {/* Tagline */}
        <h2 className="text-xl text-text-secondary mb-8 max-w-xl mx-auto font-display">
          Production Notes Management for Theatrical Lighting Teams
        </h2>

        {/* User Menu (top right) - only show when logged in */}
        {user && (
          <div className="fixed top-4 right-4">
            <UserMenu dropdownDirection="down" />
          </div>
        )}

        {/* Logged Out State */}
        {!user && (
          <>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              {/* Google Sign In */}
              <GoogleSignInButton />

              {/* Demo Button */}
              <Link
                href="/demo/cue-notes"
                className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-bg-secondary hover:bg-bg-tertiary text-text-primary font-semibold rounded-lg transition-all border border-border"
              >
                <svg
                  className="w-5 h-5"
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
            </div>

            <p className="text-sm text-text-muted mb-8">
              Sign in to access your productions, or try the demo
            </p>
          </>
        )}

        {/* Logged In - No Access State */}
        {user && productions.length === 0 && !superAdmin && (
          <div className="mb-8 p-6 bg-bg-secondary rounded-lg border border-border">
            <p className="text-text-secondary mb-4">
              You don&apos;t have access to any productions yet.
            </p>
            <p className="text-sm text-text-muted">
              Contact an admin to be added to a production, or try the demo below.
            </p>
            <Link
              href="/demo/cue-notes"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all"
            >
              Try Demo
            </Link>
          </div>
        )}

        {/* Logged In - With Access State */}
        {user && (productions.length > 0 || superAdmin) && (
          <>
            {/* Action Buttons for Super Admin */}
            {superAdmin && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <CreateProductionDialog />
                <Link
                  href="/demo/cue-notes"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary text-text-primary font-medium rounded-lg transition-all border border-border"
                >
                  Try Demo
                </Link>
              </div>
            )}

            {/* Productions Section */}
            <div className="mt-8 text-left">
              <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
                Your Productions
              </h3>
              <ProductionList initialProductions={productions} />
            </div>
          </>
        )}

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
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
        <div className="mt-12 pt-8 border-t border-border">
          <PolicyFooter layout="horizontal" className="text-text-muted" />
        </div>
      </div>
    </div>
  )
}
