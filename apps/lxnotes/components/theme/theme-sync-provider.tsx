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

  // Fetch on sign-in: server-truth wins.
  useEffect(() => {
    if (IS_DEV_MODE || !user) return

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
        if (isThemeValue(serverTheme)) {
          lastPersistedRef.current = serverTheme
          if (serverTheme !== theme) {
            hydratedFromServerRef.current = true
            setTheme(serverTheme)
          }
        }
      } catch {
        // Demo mode mock or transient network — silently no-op.
      }
    })()

    return () => {
      cancelled = true
    }
    // theme intentionally omitted: we want to fetch once per user, not per change
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          data?.user_preferences && typeof data.user_preferences === 'object'
            ? data.user_preferences
            : {}

        const next = { ...existing, theme }

        await userSettingsTable().upsert(
          { user_id: user.id, user_preferences: next },
          { onConflict: 'user_id' }
        )

        lastPersistedRef.current = theme
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
  useEffect(() => {
    if (!user && saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
      lastPersistedRef.current = null
    }
  }, [user])

  return <>{children}</>
}
