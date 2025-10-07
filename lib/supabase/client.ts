import { createBrowserClient } from '@supabase/ssr'

// For development, we'll use a mock client that doesn't require real Supabase credentials
export function createClient() {
  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  
  if (isDev) {
    // Return a mock client for development
    const mockClient = {
      auth: {
        getUser: async () => ({ data: { user: { id: 'dev-user', email: 'dev@lxnotes.app' } }, error: null }),
        signIn: async () => ({ data: {}, error: null }),
        signOut: async () => ({ error: null }),
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            execute: async () => ({ data: [], error: null }),
          }),
          execute: async () => ({ data: [], error: null }),
        }),
        insert: async <T extends Record<string, unknown>>(data: T) => ({ data, error: null }),
        update: async <T extends Record<string, unknown>>(data: T) => ({ data, error: null }),
        delete: async () => ({ data: null, error: null }),
      }),
    }

    return mockClient as unknown as ReturnType<typeof createBrowserClient>
  }

  // Real Supabase client for production
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
