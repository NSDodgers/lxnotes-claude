/**
 * Client-side production members functions
 */
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { ProductionMember, mapMember } from './production-members.types'

// Re-export types for convenience
export type { ProductionMember } from './production-members.types'

/**
 * Get production members (client-side)
 */
export async function getProductionMembersClient(productionId: string): Promise<ProductionMember[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('production_members')
    .select(`
      id,
      production_id,
      user_id,
      role,
      created_at,
      updated_at,
      users (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('production_id', productionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching production members:', error)
    throw error
  }

  return (data ?? []).map(mapMember)
}

/**
 * Update member role (client-side)
 */
export async function updateMemberRoleClient(
  memberId: string,
  role: 'admin' | 'member'
): Promise<void> {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('production_members')
    .update({ role })
    .eq('id', memberId)

  if (error) {
    console.error('Error updating member role:', error)
    throw error
  }
}

/**
 * Remove member (client-side)
 */
export async function removeProductionMemberClient(memberId: string): Promise<void> {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('production_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    console.error('Error removing production member:', error)
    throw error
  }
}
