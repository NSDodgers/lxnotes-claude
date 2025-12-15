/**
 * Client-side auth functions - safe to import in client components
 */
import { createClient } from '@/lib/supabase/client'

/**
 * Sign in with Google OAuth (client-side)
 */
export async function signInWithGoogle() {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  // Debug logging
  console.log('Sign in with Google, redirectTo:', `${window.location.origin}/auth/callback`)

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
