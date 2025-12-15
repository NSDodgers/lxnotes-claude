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
      // Check for pending invitations for this user's email
      const { data: invitations } = await supabase
        .from('production_invitations')
        .select('id, production_id, role')
        .eq('email', data.user.email.toLowerCase())
        .eq('status', 'pending')

      // Auto-accept pending invitations
      if (invitations && invitations.length > 0) {
        for (const invitation of invitations) {
          // Add user as production member
          await supabase.from('production_members').insert({
            production_id: invitation.production_id,
            user_id: data.user.id,
            role: invitation.role,
          })

          // Mark invitation as accepted
          await supabase
            .from('production_invitations')
            .update({
              status: 'accepted',
              accepted_at: new Date().toISOString(),
            })
            .eq('id', invitation.id)
        }
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
