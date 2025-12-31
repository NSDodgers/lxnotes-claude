import { createClient } from '@/lib/supabase/server'

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user && data.user.email) {
      // Try to auto-accept pending invitations
      try {
        const { acceptPendingInvitations } = await import('@/lib/services/invitations')
        await acceptPendingInvitations(data.user.email, data.user.id)
      } catch (inviteError) {
        console.error('Error processing invitations in callback:', inviteError)
        // Don't block login if invitation processing fails
      }

      // Handle redirect based on environment
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return to error page if code exchange fails
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
