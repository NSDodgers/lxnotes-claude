/**
 * Server-side production members functions
 */
import { createClient } from '@/lib/supabase/server'
import { ProductionMember, RawMemberRow, mapMember } from './production-members.types'

// Re-export types for convenience
export type { ProductionMember } from './production-members.types'

/**
 * Get all members of a production (server-side)
 */
export async function getProductionMembers(productionId: string): Promise<ProductionMember[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('production_members')
    .select(`
      id,
      production_id,
      user_id,
      role,
      created_at,
      updated_at,
      users (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('production_id', productionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching production members:', error)
    throw error
  }

  return (data ?? []).map((row) => mapMember(row as RawMemberRow))
}

/**
 * Add a user as a member of a production (server-side)
 */
export async function addProductionMember(
  productionId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<ProductionMember> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('production_members')
    .insert({
      production_id: productionId,
      user_id: userId,
      role,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding production member:', error)
    throw error
  }

  return {
    id: data.id,
    productionId: data.production_id,
    userId: data.user_id,
    role: data.role as 'admin' | 'member',
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
  }
}

/**
 * Update a member's role (server-side)
 */
export async function updateMemberRole(
  memberId: string,
  role: 'admin' | 'member'
): Promise<ProductionMember> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('production_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single()

  if (error) {
    console.error('Error updating member role:', error)
    throw error
  }

  return {
    id: data.id,
    productionId: data.production_id,
    userId: data.user_id,
    role: data.role as 'admin' | 'member',
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
  }
}

/**
 * Remove a member from a production (server-side)
 */
export async function removeProductionMember(memberId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('production_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    console.error('Error removing production member:', error)
    throw error
  }
}

/**
 * Check if a user is a member of a production (server-side)
 */
export async function isProductionMember(
  productionId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('production_members')
    .select('id')
    .eq('production_id', productionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error checking production membership:', error)
    return false
  }

  return !!data
}

/**
 * Check if a user is an admin of a production (server-side)
 */
export async function isProductionAdmin(
  productionId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('production_members')
    .select('id')
    .eq('production_id', productionId)
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle()

  if (error) {
    console.error('Error checking production admin:', error)
    return false
  }

  return !!data
}

