/**
 * Server-side production sharing functions
 * Handles production short codes for sharing with team members
 *
 * NOTE: The short_code column is added by migration
 * 20251231000001_production_links.sql. Until that migration is run and types
 * are regenerated, we use type assertions to bypass TypeScript errors.
 *
 * Future: When Director Notes is built, this will be expanded to support
 * cross-app production linking.
 */
import { createClient } from '@/lib/supabase/server'
import type { AppId } from '@/types'

// Type helper for Supabase client with new columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

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
  const supabase = await createClient() as SupabaseAny

  const { data, error } = await supabase
    .from('productions')
    .select('id, name, short_code, app_id')
    .eq('short_code', shortCode.toUpperCase())
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    console.error('Error fetching production by short code:', error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    shortCode: data.short_code ?? '',
    appId: data.app_id as AppId | undefined,
  }
}
