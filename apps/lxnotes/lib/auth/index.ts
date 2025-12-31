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

function mapProduction(row: any): Production {
  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation,
    logo: row.logo ?? undefined,
    description: row.description ?? undefined,
    startDate: row.start_date ? new Date(row.start_date) : undefined,
    endDate: row.end_date ? new Date(row.end_date) : undefined,
    isDemo: row.is_demo ?? false,
    createdAt: new Date(row.created_at!),
    updatedAt: new Date(row.updated_at!),
  }
}

/**
 * Get user productions (server-side)
 * Returns productions the user has access to
 */
export async function getUserProductions(userId: string): Promise<Production[]> {
  try {
    const supabase = await createClient()

    // Check if super admin - they see all
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (userData?.email === SUPER_ADMIN_EMAIL) {
      const { data: allProductions } = await supabase
        .from('productions')
        .select('*')
        .eq('is_demo', false)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })

      return (allProductions ?? []).map(mapProduction)
    }

    // For regular users, get productions they're members of
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
