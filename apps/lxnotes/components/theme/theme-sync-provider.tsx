'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { useAuthContext } from '@/components/auth/auth-provider'

const VALID_THEMES = ['light', 'dark', 'system'] as const
type ThemeValue = (typeof VALID_THEMES)[number]

const SAVE_DEBOUNCE_MS = 500
const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

function isThemeValue(v: unknown): v is ThemeValue {
  return typeof v === 'string' && (VALID_THEMES as readonly string[]).includes(v)
}

function userSettingsTable() {
  const supabase = createClient()
  // user_settings + user_preferences not yet in generated Supabase types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from('user_settings')
}

/**
 * Mirrors the user's theme choice to user_settings.user_preferences.theme so it
 * follows them across devices. Mirrors the persistence pattern in
 * lib/stores/sidebar-config-store.ts (server-truth = Supabase, local cache =
 * next-themes localStorage).
 *
 * Behavior:
 * - On user sign-in, fetch user_preferences.theme. If different from local,
 *   call setTheme() so the server value wins.
 * - On theme change (when user-initiated), debounced 500ms read-modify-write
 *   upsert that preserves any other keys in user_preferences.
 * - Skips upsert when the change came from a cross-tab `storage` event (next-themes
 *   syncs that automatically; the other tab already wrote).
 * - Clears any pending upsert on sign-out so we don't fire against a logged-out session.
 * - PGRST116 (no row yet) on fetch -> default to 'system'.
 * - Demo mode (NEXT_PUBLIC_DEV_MODE=true) is a no-op.
 */
export function ThemeSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext()
  const { theme, setTheme } = useTheme()

  // Tracks the last value we persisted, so storage-event-driven changes don't
  // re-upsert (the other tab already wrote it).
  const lastPersistedRef = useRef<string | null>(null)
  // Tracks whether we just hydrated from the server, so the resulting setTheme()
  // doesn't echo back as a write.
  const hydratedFromServerRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tracks which user.id we've already fetched for. Prevents the fetch from
  // re-running when AuthProvider emits multiple setUser calls with fresh
  // session.user references on initial mount (getInitialSession +
  // onAuthStateChange INITIAL_SESSION) or on TOKEN_REFRESHED. Each of those
  // would otherwise re-trigger the [user, setTheme] effect and stomp the
  // user's just-clicked theme with a stale-closure setTheme(serverTheme).
  const fetchedForUserIdRef = useRef<string | null>(null)
  // Always-current theme value, readable from inside async callbacks without
  // closing over a stale value. Synced via effect (React forbids updating
  // refs during render under the new react-hooks/refs lint rule).
  const themeRef = useRef(theme)
  useEffect(() => {
    themeRef.current = theme
  })

  // Fetch on sign-in: server-truth wins UNLESS the user has interacted with
  // the toggle since the fetch started (in which case their click takes
  // precedence).
  useEffect(() => {
    if (IS_DEV_MODE || !user) return
    if (fetchedForUserIdRef.current === user.id) return
    fetchedForUserIdRef.current = user.id

    // Snapshot the local theme at the moment we kick off the fetch. If the
    // user clicks the toggle while the fetch is in flight, themeRef.current
    // will diverge from this snapshot and we'll know to skip the hydration.
    const themeAtStart = themeRef.current
    let cancelled = false

    ;(async () => {
      try {
        const { data, error } = await userSettingsTable()
          .select('user_preferences')
          .eq('user_id', user.id)
          .single()

        if (cancelled) return

        if (error) {
          // PGRST116 = no row yet (new user). Treat as 'system' default.
          if (error.code === 'PGRST116') {
            lastPersistedRef.current = 'system'
          }
          return
        }

        const serverTheme = data?.user_preferences?.theme
        if (!isThemeValue(serverTheme)) return

        lastPersistedRef.current = serverTheme

        // Race guard: if the user clicked the toggle while we were fetching,
        // do not stomp their choice. The upsert effect will persist the new
        // local value to the server shortly.
        if (themeRef.current !== themeAtStart) return

        if (serverTheme !== themeAtStart) {
          hydratedFromServerRef.current = true
          setTheme(serverTheme)
        }
      } catch {
        // Demo mode mock or transient network — silently no-op.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, setTheme])

  // Debounced upsert on theme change.
  useEffect(() => {
    if (IS_DEV_MODE || !user) return
    if (!isThemeValue(theme)) return

    // Skip if the change was the server hydration we just performed.
    if (hydratedFromServerRef.current) {
      hydratedFromServerRef.current = false
      return
    }

    // Skip if the value already matches what's persisted (cross-tab storage event).
    if (theme === lastPersistedRef.current) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        // Read-modify-write so future preference keys aren't clobbered.
        const { data } = await userSettingsTable()
          .select('user_preferences')
          .eq('user_id', user.id)
          .single()

        const existing =
          data?.user_preferences &&
          typeof data.user_preferences === 'object' &&
          !Array.isArray(data.user_preferences)
            ? data.user_preferences
            : {}

        const next = { ...existing, theme }

        // Note: Supabase JS does not throw on RLS rejection — it returns { error }.
        // We must read the error explicitly before updating lastPersistedRef,
        // otherwise a silent server-side rejection causes client/server drift
        // and the next sign-in fetch will revert the user's choice.
        const { error: upsertError } = await userSettingsTable().upsert(
          { user_id: user.id, user_preferences: next },
          { onConflict: 'user_id' }
        )

        if (!upsertError) {
          lastPersistedRef.current = theme
        }
      } catch {
        // Failure is non-fatal — next sign-in's fetch will reconcile.
      }
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [theme, user])

  // Clear any pending save on sign-out so we don't upsert against a logged-out session.
  // Also reset the fetched-for-user marker so the next sign-in re-fetches.
  useEffect(() => {
    if (!user) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      lastPersistedRef.current = null
      fetchedForUserIdRef.current = null
    }
  }, [user])

  return <>{children}</>
}
