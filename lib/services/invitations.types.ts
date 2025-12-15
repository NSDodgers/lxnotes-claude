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

export function mapInvitation(row: any): ProductionInvitation {
  return {
    id: row.id,
    productionId: row.production_id,
    email: row.email,
    role: row.role,
    invitedBy: row.invited_by,
    status: row.status,
    token: row.token,
    expiresAt: row.expires_at ? new Date(row.expires_at) : new Date(),
    createdAt: new Date(row.created_at),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at) : undefined,
  }
}
