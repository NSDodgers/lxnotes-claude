/**
 * Server-side auth functions - only import in server components/routes
 */
import { createClient } from '@/lib/supabase/server'

// Re-export from constants for backwards compatibility
export { SUPER_ADMIN_EMAIL } from './constants'
import { SUPER_ADMIN_EMAIL } from './constants'

export interface AuthUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
}

/**
 * Get the current authenticated user (server-side)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    return {
      id: user.id,
      email: user.email ?? '',
      fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    }
  } catch (error) {
    // If Supabase is not configured, return null (no user)
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if a user is the super admin (server-side)
 */
export async function isSuperAdmin(userId?: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    if (userId) {
      const { data } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      return data?.email === SUPER_ADMIN_EMAIL
    }

    // Check current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user?.email === SUPER_ADMIN_EMAIL
  } catch (error) {
    // If Supabase is not configured, return false
    console.error('Error checking super admin status:', error)
    return false
  }
}

export interface Production {
  id: string
  name: string
  abbreviation: string
  logo?: string
  description?: string
  startDate?: Date
  endDate?: Date
  isDemo?: boolean
  createdAt: Date
  updatedAt: Date
}

// Raw database row type (snake_case)
interface RawProductionRow {
  id: string
  name: string
  abbreviation: string
  logo?: string | null
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  is_demo?: boolean | null
  created_at: string | null
  updated_at: string | null
}

function mapProduction(row: RawProductionRow): Production {
  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation,
    logo: row.logo ?? undefined,
    description: row.description ?? undefined,
    startDate: row.start_date ? new Date(row.start_date) : undefined,
    endDate: row.end_date ? new Date(row.end_date) : undefined,
    isDemo: row.is_demo ?? false,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  }
}

/**
 * Get user productions (server-side)
 * Returns productions the user has access to
 */
export async function getUserProductions(userId: string): Promise<Production[]> {
  try {
    const supabase = await createClient()

    // Get productions the user is a member of (superadmins use admin dashboard for full list)
    const { data: memberships } = await supabase
      .from('production_members')
      .select('production_id')
      .eq('user_id', userId)

    if (!memberships || memberships.length === 0) {
      return []
    }

    const productionIds = memberships.map((m) => m.production_id)

    const { data: productions } = await supabase
      .from('productions')
      .select('*')
      .in('id', productionIds)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    return (productions ?? []).map(mapProduction)
  } catch (error) {
    // If Supabase is not configured, return empty array
    console.error('Error getting user productions:', error)
    return []
  }
}

/**
 * Get production IDs where user is an admin (server-side)
 * Returns a Set for O(1) lookup
 */
export async function getUserAdminProductionIds(userId: string): Promise<Set<string>> {
  try {
    const supabase = await createClient()

    const { data: adminMemberships } = await supabase
      .from('production_members')
      .select('production_id')
      .eq('user_id', userId)
      .eq('role', 'admin')

    if (!adminMemberships || adminMemberships.length === 0) {
      return new Set()
    }

    return new Set(adminMemberships.map((m) => m.production_id))
  } catch (error) {
    console.error('Error getting user admin production IDs:', error)
    return new Set()
  }
}

// Extended production interface for deleted items
export interface DeletedProduction extends Production {
  deletedAt: Date
  deletedBy?: string
}

// Raw database row type with deleted fields
interface RawDeletedProductionRow extends RawProductionRow {
  deleted_at: string
  deleted_by?: string | null
}

function mapDeletedProduction(row: RawDeletedProductionRow): DeletedProduction {
  return {
    ...mapProduction(row),
    deletedAt: new Date(row.deleted_at),
    deletedBy: row.deleted_by ?? undefined,
  }
}

/**
 * Get user's deleted (trashed) productions (server-side)
 * Only returns productions where user is an admin
 */
export async function getUserDeletedProductions(userId: string): Promise<DeletedProduction[]> {
  try {
    const supabase = await createClient()

    // Get productions where user is admin AND deleted_at is set
    const { data: adminMemberships } = await supabase
      .from('production_members')
      .select('production_id')
      .eq('user_id', userId)
      .eq('role', 'admin')

    if (!adminMemberships || adminMemberships.length === 0) {
      return []
    }

    const productionIds = adminMemberships.map((m) => m.production_id)

    const { data: deletedProductions } = await supabase
      .from('productions')
      .select('*')
      .in('id', productionIds)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    return (deletedProductions ?? []).map((row) => mapDeletedProduction(row as RawDeletedProductionRow))
  } catch (error) {
    console.error('Error getting user deleted productions:', error)
    return []
  }
}
