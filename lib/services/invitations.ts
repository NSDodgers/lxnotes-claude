/**
 * Server-side invitation functions
 */
import { createClient } from '@/lib/supabase/server'
import { ProductionInvitation, mapInvitation } from './invitations.types'

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

  return (data ?? []).map((row: any) => ({
    ...mapInvitation(row),
    production: row.productions ? {
      id: row.productions.id,
      name: row.productions.name,
    } : undefined,
  }))
}

/**
 * Accept an invitation (server-side)
 */
export async function acceptInvitation(invitationId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  // Get the invitation
  const { data: invitation, error: fetchError } = await supabase
    .from('production_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('status', 'pending')
    .single()

  if (fetchError || !invitation) {
    throw new Error('Invitation not found or already processed')
  }

  // Check if expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('production_invitations')
      .update({ status: 'expired' })
      .eq('id', invitationId)
    throw new Error('Invitation has expired')
  }

  // Add user as production member
  const { error: memberError } = await supabase
    .from('production_members')
    .insert({
      production_id: invitation.production_id,
      user_id: userId,
      role: invitation.role,
    })

  if (memberError) {
    // If already a member, just update the invitation status
    if (memberError.code !== '23505') {
      console.error('Error adding member:', memberError)
      throw memberError
    }
  }

  // Update invitation status
  const { error: updateError } = await supabase
    .from('production_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitationId)

  if (updateError) {
    console.error('Error updating invitation:', updateError)
    throw updateError
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

/**
 * Accept all pending invitations for a user email (server-side)
 * Uses admin client to bypass RLS since the user might not be a member yet
 */
export async function acceptPendingInvitations(email: string, userId: string): Promise<void> {
  try {
    // We need admin client because we are searching for invitations by email (which might be restricted)
    // and inserting into production_members (which usually requires being an admin of the production)
    const { createAdminClient } = await import('@/lib/supabase/admin')
    let adminClient

    try {
      adminClient = createAdminClient()
    } catch (e) {
      console.warn('Skipping invitation check: Supabase Admin client could not be created (missing service key?)')
      return
    }

    // Check for pending invitations for this user's email
    const { data: invitations, error: invitationsError } = await adminClient
      .from('production_invitations')
      .select('id, production_id, role')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')

    if (invitationsError) {
      console.error('Error fetching pending invitations:', invitationsError)
      return
    }

    if (!invitations || invitations.length === 0) {
      return
    }

    console.log(`Found ${invitations.length} pending invitations for ${email}`)

    for (const invitation of invitations) {
      // Add user as production member
      const { error: memberError } = await adminClient
        .from('production_members')
        .insert({
          production_id: invitation.production_id,
          user_id: userId,
          role: invitation.role,
        })

      if (memberError) {
        // If unique constraint violation, user is already a member, so we can proceed to mark as accepted
        if (memberError.code !== '23505') {
          console.error(`Error adding member for invitation ${invitation.id}:`, memberError)
          continue
        }
      }

      // Mark invitation as accepted
      const { error: updateError } = await adminClient
        .from('production_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)

      if (updateError) {
        console.error(`Error updating invitation ${invitation.id} status:`, updateError)
      } else {
        console.log(`Successfully accepted invitation ${invitation.id} for production ${invitation.production_id}`)
      }
    }
  } catch (error) {
    console.error('Error processing pending invitations:', error)
  }
}
