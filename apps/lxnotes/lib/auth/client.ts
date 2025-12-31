/**
 * Client-side auth functions - safe to import in client components
 */
import { createClient } from '@/lib/supabase/client'

/**
 * Get the base URL for the application
 * Checks NEXT_PUBLIC_BASE_URL env var first, falls back to window.location.origin
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Fallback for SSR (shouldn't happen in client components)
  return ''
}

/**
 * Sign in with Google OAuth (client-side)
 */
export async function signInWithGoogle() {
  const supabase = createClient()
  const baseUrl = getBaseUrl()
  const redirectTo = `${baseUrl}/auth/callback`

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  // Debug logging
  console.log('Sign in with Google, redirectTo:', redirectTo)

  if (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

/**
 * Sign out the current user (client-side)
 */
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
    throw error
  }

  // Redirect to home page
  window.location.href = '/'
}
