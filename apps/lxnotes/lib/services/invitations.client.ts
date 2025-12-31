/**
 * Client-side invitation functions
 */
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { ProductionInvitation, mapInvitation } from './invitations.types'

// Re-export types for convenience
export type { ProductionInvitation } from './invitations.types'

/**
 * Get pending invitations for a production (client-side)
 */
export async function getPendingInvitationsClient(productionId: string): Promise<ProductionInvitation[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('production_invitations')
    .select(`
      *,
      users!production_invitations_invited_by_fkey (
        id,
        email,
        full_name
      )
    `)
    .eq('production_id', productionId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invitations:', error)
    throw error
  }

  return (data ?? []).map((row: any) => ({
    ...mapInvitation(row),
    inviter: row.users ? {
      id: row.users.id,
      email: row.users.email,
      fullName: row.users.full_name,
    } : undefined,
  }))
}

/**
 * Cancel invitation (client-side)
 */
export async function cancelInvitationClient(invitationId: string): Promise<void> {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('production_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('status', 'pending')

  if (error) {
    console.error('Error cancelling invitation:', error)
    throw error
  }
}
