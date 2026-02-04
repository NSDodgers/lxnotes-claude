/**
 * Server-side invitation functions
 */
import { createClient } from '@/lib/supabase/server'
import { ProductionInvitation, RawInvitationRow, mapInvitation } from './invitations.types'

// Re-export types for convenience
export type { ProductionInvitation } from './invitations.types'

/**
 * Create a new invitation (server-side)
 */
export async function createInvitation(
  productionId: string,
  email: string,
  role: 'admin' | 'member',
  invitedBy: string
): Promise<ProductionInvitation> {
  const supabase = await createClient()

  // Check if there's already a pending invitation for this email and production
  const { data: existing } = await supabase
    .from('production_invitations')
    .select('id')
    .eq('production_id', productionId)
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    throw new Error('An invitation for this email already exists')
  }

  const { data, error } = await supabase
    .from('production_invitations')
    .insert({
      production_id: productionId,
      email: email.toLowerCase(),
      role,
      invited_by: invitedBy,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating invitation:', error)
    throw error
  }

  return mapInvitation(data)
}

/**
 * Get pending invitations for a production (server-side)
 */
export async function getPendingInvitations(productionId: string): Promise<ProductionInvitation[]> {
  const supabase = await createClient()

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

  return (data ?? []).map((row) => ({
    ...mapInvitation(row as RawInvitationRow),
    inviter: row.users ? {
      id: row.users.id,
      email: row.users.email,
      fullName: row.users.full_name,
    } : undefined,
  }))
}

/**
 * Get pending invitations for a user's email (server-side)
 */
export async function getPendingInvitationsForEmail(email: string): Promise<ProductionInvitation[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('production_invitations')
    .select(`
      *,
      productions (
        id,
        name
      )
    `)
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invitations for email:', error)
    throw error
  }

  return (data ?? []).map((row) => ({
    ...mapInvitation(row as RawInvitationRow),
    production: row.productions ? {
      id: row.productions.id,
      name: row.productions.name,
    } : undefined,
  }))
}

/** Result type for accept_invitation RPC */
interface AcceptInvitationResult {
  success: boolean
  error?: string
  production_id?: string
  role?: string
}

/**
 * Accept an invitation (server-side)
 *
 * Uses atomic database function to ensure member addition and invitation
 * status update happen together or both fail.
 *
 * SECURITY: The database function verifies that the accepting user's email
 * matches the invitation's email to prevent privilege escalation attacks.
 */
export async function acceptInvitation(invitationId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('accept_invitation', {
    p_invitation_id: invitationId,
    p_user_id: userId,
  }) as { data: AcceptInvitationResult | null; error: Error | null }

  if (error) {
    console.error('Error calling accept_invitation:', error)
    throw new Error('Failed to accept invitation')
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to accept invitation')
  }
}

/**
 * Cancel an invitation (server-side)
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  const supabase = await createClient()

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

/**
 * Resend an invitation (server-side)
 * Creates a new invitation and cancels the old one
 */
export async function resendInvitation(invitationId: string): Promise<ProductionInvitation> {
  const supabase = await createClient()

  // Get the existing invitation
  const { data: existing, error: fetchError } = await supabase
    .from('production_invitations')
    .select('*')
    .eq('id', invitationId)
    .single()

  if (fetchError || !existing) {
    throw new Error('Invitation not found')
  }

  // Cancel the old invitation
  await supabase
    .from('production_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)

  // Create a new invitation
  return createInvitation(
    existing.production_id,
    existing.email,
    existing.role as 'admin' | 'member',
    existing.invited_by
  )
}

/** Result type for accept_pending_invitations_for_user RPC */
interface AcceptPendingResult {
  success: boolean
  error?: string
  accepted_count: number
  accepted?: Array<{ invitation_id: string; production_id: string }>
}

/**
 * Accept all pending invitations for a user email (server-side)
 *
 * Uses atomic database function to ensure all acceptances happen in a single
 * transaction. Uses admin client to bypass RLS since the user might not be
 * a member yet.
 */
export async function acceptPendingInvitations(email: string, userId: string): Promise<void> {
  try {
    // We need admin client because the RPC function uses SECURITY DEFINER
    // but we want to ensure it runs with elevated privileges
    const { createAdminClient } = await import('@/lib/supabase/admin')
    let adminClient

    try {
      adminClient = createAdminClient()
    } catch (e) {
      console.warn('Skipping invitation check: Supabase Admin client could not be created (missing service key?)')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient.rpc as any)('accept_pending_invitations_for_user', {
      p_user_id: userId,
    }) as { data: AcceptPendingResult | null; error: Error | null }

    if (error) {
      console.error('Error calling accept_pending_invitations_for_user:', error)
      return
    }

    if (data?.accepted_count && data.accepted_count > 0) {
      console.log(`Successfully accepted ${data.accepted_count} pending invitation(s) for ${email}`)
    }
  } catch (error) {
    console.error('Error processing pending invitations:', error)
  }
}

/**
 * Clean up expired invitations (server-side)
 *
 * Marks all pending invitations that have passed their expiration date as 'expired'.
 * Can be called on app load or as a cron job via Supabase Edge Function.
 *
 * @returns Number of invitations marked as expired
 */
export async function cleanupExpiredInvitations(): Promise<number> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    let adminClient

    try {
      adminClient = createAdminClient()
    } catch (e) {
      console.warn('Skipping invitation cleanup: Supabase Admin client could not be created')
      return 0
    }

    const now = new Date().toISOString()

    // Find and update all expired pending invitations
    const { data, error } = await adminClient
      .from('production_invitations')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', now)
      .select('id')

    if (error) {
      console.error('Error cleaning up expired invitations:', error)
      return 0
    }

    const count = data?.length ?? 0
    if (count > 0) {
      console.log(`Marked ${count} expired invitation(s) as expired`)
    }

    return count
  } catch (error) {
    console.error('Error in cleanupExpiredInvitations:', error)
    return 0
  }
}
