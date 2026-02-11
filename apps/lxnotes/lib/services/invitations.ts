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
      ),
      users!production_invitations_invited_by_fkey (
        id,
        email,
        full_name
      )
    `)
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    ...mapInvitation(row as RawInvitationRow),
    production: row.productions ? {
      id: row.productions.id,
      name: row.productions.name,
    } : undefined,
    inviter: row.users ? {
      id: row.users.id,
      email: row.users.email,
      fullName: row.users.full_name,
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
      return
    }
  } catch {
    // Non-critical: invitation auto-acceptance is best-effort
  }
}

/** Result type for get_invitation_by_token RPC */
interface GetInvitationByTokenResult {
  found: boolean
  error?: 'invalid_token' | 'production_deleted'
  id?: string
  status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
  role?: 'admin' | 'member'
  email?: string
  expires_at?: string
  is_expired?: boolean
  production?: { id: string; name: string }
  inviter?: { id: string; email: string; full_name: string | null }
}

/**
 * Get invitation details by token (server-side)
 * Uses admin client to bypass RLS
 */
export async function getInvitationByToken(token: string): Promise<GetInvitationByTokenResult | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    let adminClient

    try {
      adminClient = createAdminClient()
    } catch {
      console.warn('Could not create admin client for invitation lookup')
      return null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient.rpc as any)('get_invitation_by_token', {
      p_token: token,
    }) as { data: GetInvitationByTokenResult | null; error: Error | null }

    if (error) {
      return null
    }

    return data
  } catch {
    return null
  }
}

/** Result type for accept_invitation_by_token RPC */
interface AcceptInvitationByTokenResult {
  success: boolean
  /**
   * Error codes returned by the SQL function:
   * - 'invalid_token': Token doesn't exist OR production was deleted (intentionally
   *   conflated to prevent information leakage about deleted productions)
   * - 'already_accepted': Invitation was already accepted by someone
   * - 'cancelled': Invitation was cancelled by an admin
   * - 'expired': Invitation passed its expiration date
   */
  error?: 'invalid_token' | 'already_accepted' | 'cancelled' | 'expired'
  production_id?: string
  role?: string
  is_member?: boolean
  already_member?: boolean
}

/**
 * Accept invitation by token (server-side)
 * Uses admin client to bypass RLS
 */
export async function acceptInvitationByToken(
  token: string,
  userId: string
): Promise<AcceptInvitationByTokenResult> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    let adminClient

    try {
      adminClient = createAdminClient()
    } catch {
      console.warn('Could not create admin client for invitation acceptance')
      return { success: false, error: 'invalid_token' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient.rpc as any)('accept_invitation_by_token', {
      p_token: token,
      p_user_id: userId,
    }) as { data: AcceptInvitationByTokenResult | null; error: Error | null }

    if (error) {
      return { success: false, error: 'invalid_token' }
    }

    return data ?? { success: false, error: 'invalid_token' }
  } catch {
    return { success: false, error: 'invalid_token' }
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
      return 0
    }

    return data?.length ?? 0
  } catch {
    return 0
  }
}
