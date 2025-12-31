'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { SUPER_ADMIN_EMAIL } from './index'

export interface UseAuthReturn {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  isSuperAdmin: boolean
  signOut: () => Promise<void>
}

/**
 * Hook for accessing auth state on the client side
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }, [supabase.auth])

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isSuperAdmin: user?.email === SUPER_ADMIN_EMAIL,
    signOut: handleSignOut,
  }
}

/**
 * Hook that redirects to home if not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/'
    }
  }, [isAuthenticated, isLoading])

  return { isLoading, isAuthenticated }
}
