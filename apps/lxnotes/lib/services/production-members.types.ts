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

// Raw database member type (snake_case from Supabase)
export interface RawMemberRow {
  id: string
  production_id: string
  user_id: string
  role: string
  created_at: string | null
  updated_at: string | null
  // Joined user data (optional)
  users?: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export function mapMember(row: RawMemberRow): ProductionMember {
  return {
    id: row.id,
    productionId: row.production_id,
    userId: row.user_id,
    role: row.role as 'admin' | 'member',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    user: row.users ? {
      id: row.users.id,
      email: row.users.email,
      fullName: row.users.full_name,
      avatarUrl: row.users.avatar_url,
    } : undefined,
  }
}
