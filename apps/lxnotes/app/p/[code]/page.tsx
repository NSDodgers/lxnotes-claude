import { createClient } from '@/lib/supabase/server'
import { getProductionByShortCode } from '@/lib/services/production-links'
import { isProductionMember } from '@/lib/services/production-members'
import { JoinProductionButton } from '@/components/production/join-production-button'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function JoinProductionPage({
    params,
}: {
    params: Promise<{ code: string }>
}) {
    const { code } = await params

    // 1. Look up production
    const production = await getProductionByShortCode(code)

    if (!production) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg-primary text-text-primary">
                <div className="text-center space-y-4 max-w-md">
                    <h1 className="text-2xl font-bold">Invalid Link</h1>
                    <p className="text-text-secondary">
                        This invitation link is invalid or has expired. Please check the code and try again.
                    </p>
                    <Button asChild variant="outline">
                        <Link href="/">Back to Home</Link>
                    </Button>
                </div>
            </div>
        )
    }

    // 2. Check Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // Redirect to login with return URL
        const loginUrl = new URL('/auth/login', 'https://lxnotes.app') // Base URL doesn't matter for path calc
        loginUrl.searchParams.set('next', `/p/${code}`)
        redirect(loginUrl.pathname + loginUrl.search)
    }

    // 3. Check if already member
    const isMember = await isProductionMember(production.id, user.id)

    if (isMember) {
        redirect(`/production/${production.id}/cue-notes`)
    }

    // 4. Show Join Page
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg-primary text-text-primary">
            <div className="w-full max-w-md space-y-8 text-center p-8 rounded-xl bg-bg-secondary border border-bg-tertiary shadow-lg">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Join Production</h1>
                    <p className="text-text-secondary">
                        You've been invited to join
                    </p>
                    <div className="py-4">
                        <div className="text-xl font-semibold text-primary">
                            {production.name}
                        </div>
                        {production.shortCode && (
                            <div className="text-xs text-text-muted font-mono mt-1">
                                Code: {production.shortCode}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-center">
                    <JoinProductionButton
                        productionId={production.id}
                        productionName={production.name}
                    />
                </div>

                <div className="pt-4 border-t border-bg-tertiary">
                    <p className="text-xs text-text-muted">
                        Logged in as {user.email}
                    </p>
                    <Button variant="link" size="sm" asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/auth/signout">Not you? Sign out</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
