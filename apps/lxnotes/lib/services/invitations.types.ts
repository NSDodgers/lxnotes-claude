/**
 * Shared types for invitations - can be imported by both client and server
 */

export interface ProductionInvitation {
  id: string
  productionId: string
  email: string
  role: 'admin' | 'member'
  invitedBy: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  token: string
  expiresAt: Date
  createdAt: Date
  acceptedAt?: Date
  // Joined data
  production?: {
    id: string
    name: string
  }
  inviter?: {
    id: string
    email: string
    fullName: string | null
  }
}

// Raw database invitation type (snake_case from Supabase)
export interface RawInvitationRow {
  id: string
  production_id: string
  email: string
  role: string
  invited_by: string
  status: string
  token: string | null
  expires_at: string | null
  created_at: string | null
  accepted_at?: string | null
  // Joined data (optional)
  users?: { id: string; email: string; full_name: string | null }
  productions?: { id: string; name: string }
}

export function mapInvitation(row: RawInvitationRow): ProductionInvitation {
  return {
    id: row.id,
    productionId: row.production_id,
    email: row.email,
    role: row.role as 'admin' | 'member',
    invitedBy: row.invited_by,
    status: row.status as 'pending' | 'accepted' | 'expired' | 'cancelled',
    token: row.token ?? '',
    expiresAt: row.expires_at ? new Date(row.expires_at) : new Date(),
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at) : undefined,
  }
}
