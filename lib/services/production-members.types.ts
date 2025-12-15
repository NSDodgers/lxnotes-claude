/**
 * Shared types for production members - can be imported by both client and server
 */

export interface ProductionMember {
  id: string
  productionId: string
  userId: string
  role: 'admin' | 'member'
  createdAt: Date
  updatedAt: Date
  // Joined user data
  user?: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
  }
}

export function mapMember(row: any): ProductionMember {
  return {
    id: row.id,
    productionId: row.production_id,
    userId: row.user_id,
    role: row.role,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    user: row.users ? {
      id: row.users.id,
      email: row.users.email,
      fullName: row.users.full_name,
      avatarUrl: row.users.avatar_url,
    } : undefined,
  }
}
