import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

// Singleton client instance for browser
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Reuse the same client instance to avoid realtime subscription issues
  // See: https://github.com/supabase/realtime-js/issues/209
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}
