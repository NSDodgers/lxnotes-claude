import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { ThemeSyncProvider } from '@/components/theme/theme-sync-provider'

// Hoisted mocks: vi.mock factories run before imports, so anything they touch
// must be set up via vi.hoisted.
const mocks = vi.hoisted(() => ({
  useTheme: vi.fn(),
  useAuthContext: vi.fn(),
  supabaseClient: {
    selectResult: { data: null as unknown, error: null as { code?: string } | null },
    upsertCalls: [] as unknown[],
  },
}))

vi.mock('next-themes', () => ({
  useTheme: () => mocks.useTheme(),
}))

vi.mock('@/components/auth/auth-provider', () => ({
  useAuthContext: () => mocks.useAuthContext(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (_table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: string) => ({
          single: () =>
            Promise.resolve({
              data: mocks.supabaseClient.selectResult.data,
              error: mocks.supabaseClient.selectResult.error,
            }),
        }),
      }),
      upsert: (payload: unknown) => {
        mocks.supabaseClient.upsertCalls.push(payload)
        return Promise.resolve({ error: null })
      },
    }),
  }),
}))

// Flush microtasks (Promise resolution chain) without advancing timers.
// We can't use setTimeout(0) here because fake timers are on and would swallow it.
const flushAsync = async () => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
  }
}

describe('ThemeSyncProvider', () => {
  let setTheme: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    mocks.supabaseClient.upsertCalls = []
    mocks.supabaseClient.selectResult = { data: null, error: { code: 'PGRST116' } }
    setTheme = vi.fn()
    mocks.useTheme.mockReturnValue({ theme: 'system', setTheme, resolvedTheme: 'dark' })
    mocks.useAuthContext.mockReturnValue({ user: { id: 'u1' } })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does nothing when no user is signed in', async () => {
    mocks.useAuthContext.mockReturnValue({ user: null })
    render(<ThemeSyncProvider><div /></ThemeSyncProvider>)
    await act(async () => { await flushAsync() })
    expect(mocks.supabaseClient.upsertCalls).toHaveLength(0)
  })

  it('PGRST116 (no row yet) does not throw and does not call setTheme', async () => {
    render(<ThemeSyncProvider><div /></ThemeSyncProvider>)
    await act(async () => { await flushAsync() })
    expect(setTheme).not.toHaveBeenCalled()
    expect(mocks.supabaseClient.upsertCalls).toHaveLength(0)
  })

  it('hydrates from server when server theme differs from local', async () => {
    mocks.supabaseClient.selectResult = {
      data: { user_preferences: { theme: 'light' } },
      error: null,
    }
    render(<ThemeSyncProvider><div /></ThemeSyncProvider>)
    await act(async () => { await flushAsync() })
    expect(setTheme).toHaveBeenCalledWith('light')
    // Server-driven setTheme should NOT trigger an upsert echo back.
    expect(mocks.supabaseClient.upsertCalls).toHaveLength(0)
  })

  it('debounces upsert and coalesces rapid theme changes', async () => {
    // Initial theme matches PGRST116 default so no server-hydration setTheme runs.
    const { rerender } = render(<ThemeSyncProvider><div /></ThemeSyncProvider>)
    await act(async () => { await flushAsync() })

    // Simulate 3 rapid toggles ending on a value different from the persisted default.
    mocks.useTheme.mockReturnValue({ theme: 'dark', setTheme, resolvedTheme: 'dark' })
    rerender(<ThemeSyncProvider><div /></ThemeSyncProvider>)

    mocks.useTheme.mockReturnValue({ theme: 'light', setTheme, resolvedTheme: 'light' })
    rerender(<ThemeSyncProvider><div /></ThemeSyncProvider>)

    mocks.useTheme.mockReturnValue({ theme: 'dark', setTheme, resolvedTheme: 'dark' })
    rerender(<ThemeSyncProvider><div /></ThemeSyncProvider>)

    // No upsert before debounce fires
    expect(mocks.supabaseClient.upsertCalls).toHaveLength(0)

    // Advance past the 500ms debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
      await flushAsync()
    })

    // Exactly one upsert with the final value (dark)
    expect(mocks.supabaseClient.upsertCalls).toHaveLength(1)
    const call = mocks.supabaseClient.upsertCalls[0] as { user_preferences: { theme: string } }
    expect(call.user_preferences.theme).toBe('dark')
  })

  it('clears pending upsert when user becomes null (sign-out)', async () => {
    const { rerender } = render(<ThemeSyncProvider><div /></ThemeSyncProvider>)
    await act(async () => { await flushAsync() })

    // Trigger a theme change → schedules upsert
    mocks.useTheme.mockReturnValue({ theme: 'dark', setTheme, resolvedTheme: 'dark' })
    rerender(<ThemeSyncProvider><div /></ThemeSyncProvider>)

    // Sign out before debounce fires
    mocks.useAuthContext.mockReturnValue({ user: null })
    rerender(<ThemeSyncProvider><div /></ThemeSyncProvider>)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
      await flushAsync()
    })

    expect(mocks.supabaseClient.upsertCalls).toHaveLength(0)
  })

  it('preserves other user_preferences keys via read-modify-write', async () => {
    // Server has theme=dark plus extra keys. Initial useTheme also returns 'dark'
    // so no hydration setTheme fires and lastPersistedRef settles to 'dark'.
    mocks.supabaseClient.selectResult = {
      data: { user_preferences: { theme: 'dark', font_size: 'large', density: 'compact' } },
      error: null,
    }
    mocks.useTheme.mockReturnValue({ theme: 'dark', setTheme, resolvedTheme: 'dark' })
    const { rerender } = render(<ThemeSyncProvider><div /></ThemeSyncProvider>)
    await act(async () => { await flushAsync() })

    // User toggles to light — different from persisted, schedules upsert.
    mocks.useTheme.mockReturnValue({ theme: 'light', setTheme, resolvedTheme: 'light' })
    rerender(<ThemeSyncProvider><div /></ThemeSyncProvider>)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
      await flushAsync()
    })

    expect(mocks.supabaseClient.upsertCalls).toHaveLength(1)
    const call = mocks.supabaseClient.upsertCalls[0] as { user_preferences: Record<string, unknown> }
    expect(call.user_preferences).toEqual({
      theme: 'light',
      font_size: 'large',
      density: 'compact',
    })
  })
})
