import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getProductionByShortCode } from '@/lib/services/production-links'
import { addProductionMember, isProductionMember } from '@/lib/services/production-members'

/**
 * Handle short code URLs for production sharing
 * GET /p/ABC123
 *
 * Flow:
 * 1. Look up production by short code
 * 2. If not authenticated, redirect to login with return URL
 * 3. If already a member, redirect to production
 * 4. Otherwise, add as member and redirect to production
 *
 * Future: When Director Notes is built, this can be expanded to support
 * cross-app production linking via a link-or-join flow.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { origin } = new URL(request.url)

  // Look up production by short code
  const production = await getProductionByShortCode(code)
  if (!production) {
    return NextResponse.redirect(`${origin}/?error=invalid-code`)
  }

  // Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Store redirect and send to login
    // The auth callback will redirect back to this URL
    const loginUrl = new URL('/auth/login', origin)
    loginUrl.searchParams.set('next', `/p/${code}`)
    return NextResponse.redirect(loginUrl)
  }

  // Check if already a member
  const isMember = await isProductionMember(production.id, user.id)
  if (isMember) {
    // Already a member - just redirect to production
    return NextResponse.redirect(`${origin}/production/${production.id}/cue-notes`)
  }

  // Add user as member and redirect
  try {
    await addProductionMember(production.id, user.id, 'member')
    return NextResponse.redirect(`${origin}/production/${production.id}/cue-notes`)
  } catch (error) {
    console.error('Error adding user to production:', error)
    return NextResponse.redirect(`${origin}/?error=join-failed`)
  }
}
