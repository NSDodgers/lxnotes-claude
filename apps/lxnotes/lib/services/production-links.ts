/**
 * Server-side production sharing functions
 * Handles production short codes for sharing with team members.
 *
 * The lookup uses the admin client and a SECURITY DEFINER RPC because the
 * /p/[code] join flow must resolve the target production for users who are
 * not yet members. The productions RLS policies deny non-members, so a
 * direct anon-client SELECT returns null and the page renders "Invalid
 * Link / has expired".
 */
import type { AppId } from '@/types'

/** Shape returned by the get_production_by_short_code RPC. */
interface ShortCodeLookupRow {
  id: string
  name: string
  short_code: string
}

/**
 * Get production by short code
 * Used when someone visits /p/[code] to join a production
 */
export async function getProductionByShortCode(shortCode: string): Promise<{
  id: string
  name: string
  shortCode: string
  appId?: AppId
} | null> {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  let adminClient
  try {
    adminClient = createAdminClient()
  } catch {
    console.warn('Could not create admin client for short code lookup')
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient.rpc as any)('get_production_by_short_code', {
    p_code: shortCode,
  }) as { data: ShortCodeLookupRow[] | null; error: Error | null }

  if (error) {
    console.error('Error fetching production by short code:', error)
    return null
  }

  const row = data?.[0]
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    shortCode: row.short_code ?? '',
  }
}
