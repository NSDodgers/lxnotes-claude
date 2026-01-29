/**
 * Supabase Storage Adapter
 *
 * Implements the StorageAdapter interface using Supabase as the backend.
 * All operations are scoped to a specific production ID.
 */

import { createClient } from './client'
import type { StorageAdapter, ProductionData, ScriptPage, SceneSong } from '@/lib/storage/adapter'
import type { Note, FixtureInfo, ModuleType } from '@/types'
import type { Database } from './database.types'

type DbNote = Database['public']['Tables']['notes']['Row']
type DbFixture = Database['public']['Tables']['fixtures']['Row']
type DbScriptPage = Database['public']['Tables']['script_pages']['Row']
type DbSceneSong = Database['public']['Tables']['scenes_songs']['Row']
type DbProduction = Database['public']['Tables']['productions']['Row']

// Convert database row to Note type
function dbNoteToNote(row: DbNote): Note {
  return {
    id: row.id,
    productionId: row.production_id,
    moduleType: row.module_type as ModuleType,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type ?? undefined,
    priority: row.priority,
    status: row.status as 'todo' | 'complete' | 'cancelled',
    createdBy: row.created_by ?? undefined,
    assignedTo: row.assigned_to ?? undefined,
    completedBy: row.completed_by ?? undefined,
    createdAt: new Date(row.created_at!),
    updatedAt: new Date(row.updated_at!),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    cueNumber: row.cue_number ?? undefined,
    scriptPageId: row.script_page_id ?? undefined,
    sceneSongId: row.scene_song_id ?? undefined,
    lightwrightItemId: row.lightwright_item_id ?? undefined,
    channelNumbers: row.channel_numbers ?? undefined,
    positionUnit: row.position_unit ?? undefined,
    sceneryNeeds: row.scenery_needs ?? undefined,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
    deletedBy: row.deleted_by ?? undefined,
  }
}

// Convert Note to database insert/update format
function noteToDbNote(note: Partial<Note> & { productionId: string; moduleType: ModuleType; title: string }): Database['public']['Tables']['notes']['Insert'] {
  return {
    production_id: note.productionId,
    module_type: note.moduleType,
    title: note.title,
    description: note.description ?? null,
    type: note.type ?? null,
    priority: note.priority ?? 'medium',
    status: note.status ?? 'todo',
    created_by: note.createdBy ?? null,
    assigned_to: note.assignedTo ?? null,
    completed_by: note.completedBy ?? null,
    completed_at: note.completedAt?.toISOString() ?? null,
    due_date: note.dueDate?.toISOString() ?? null,
    cue_number: note.cueNumber ?? null,
    script_page_id: note.scriptPageId ?? null,
    scene_song_id: note.sceneSongId ?? null,
    lightwright_item_id: note.lightwrightItemId ?? null,
    channel_numbers: note.channelNumbers ?? null,
    position_unit: note.positionUnit ?? null,
    scenery_needs: note.sceneryNeeds ?? null,
  }
}

// Convert database row to FixtureInfo type
function dbFixtureToFixture(row: DbFixture): FixtureInfo {
  return {
    id: row.id,
    productionId: row.production_id,
    lwid: row.lwid,
    channel: row.channel,
    position: row.position,
    unitNumber: row.unit_number,
    fixtureType: row.fixture_type,
    purpose: row.purpose ?? '',
    universe: row.universe ?? undefined,
    address: row.address ?? undefined,
    universeAddressRaw: row.universe_address_raw ?? '',
    positionOrder: row.position_order ?? undefined,
    isActive: row.is_active ?? true,
    source: row.source ?? 'Hookup CSV',
    sourceUploadedAt: row.source_uploaded_at ? new Date(row.source_uploaded_at) : new Date(),
    createdAt: new Date(row.created_at!),
    updatedAt: new Date(row.updated_at!),
    removedAt: row.removed_at ? new Date(row.removed_at) : undefined,
  }
}

// Convert FixtureInfo to database insert format
function fixtureToDbFixture(fixture: FixtureInfo): Database['public']['Tables']['fixtures']['Insert'] {
  return {
    id: fixture.id,
    production_id: fixture.productionId,
    lwid: fixture.lwid,
    channel: fixture.channel,
    position: fixture.position,
    unit_number: fixture.unitNumber,
    fixture_type: fixture.fixtureType,
    purpose: fixture.purpose || null,
    universe: fixture.universe ?? null,
    address: fixture.address ?? null,
    universe_address_raw: fixture.universeAddressRaw || null,
    position_order: fixture.positionOrder ?? null,
    is_active: fixture.isActive,
    source: fixture.source,
    source_uploaded_at: fixture.sourceUploadedAt?.toISOString() ?? null,
    removed_at: fixture.removedAt?.toISOString() ?? null,
  }
}

export function createSupabaseStorageAdapter(productionId: string): StorageAdapter {
  const supabase = createClient()

  return {
    notes: {
      async getAll(moduleType: ModuleType): Promise<Note[]> {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('production_id', productionId)
          .eq('module_type', moduleType)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (error) throw error
        return (data || []).map(dbNoteToNote)
      },

      async get(id: string): Promise<Note | null> {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', id)
          .eq('production_id', productionId)
          .is('deleted_at', null)
          .single()

        if (error) {
          if (error.code === 'PGRST116') return null // Not found
          throw error
        }
        return data ? dbNoteToNote(data) : null
      },

      async getIncludingDeleted(id: string): Promise<Note | null> {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', id)
          .eq('production_id', productionId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') return null // Not found
          throw error
        }
        return data ? dbNoteToNote(data) : null
      },

      async create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
        const { data, error } = await supabase
          .from('notes')
          .insert(noteToDbNote({ ...note, productionId }))
          .select()
          .single()

        if (error) throw error
        return dbNoteToNote(data)
      },

      async update(id: string, updates: Partial<Note>): Promise<Note> {
        const dbUpdates: Database['public']['Tables']['notes']['Update'] = {}

        if (updates.title !== undefined) dbUpdates.title = updates.title
        if (updates.description !== undefined) dbUpdates.description = updates.description ?? null
        if (updates.type !== undefined) dbUpdates.type = updates.type ?? null
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority
        if (updates.status !== undefined) dbUpdates.status = updates.status
        if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo ?? null
        if (updates.completedBy !== undefined) dbUpdates.completed_by = updates.completedBy ?? null
        if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt?.toISOString() ?? null
        if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate?.toISOString() ?? null
        if (updates.cueNumber !== undefined) dbUpdates.cue_number = updates.cueNumber ?? null
        if (updates.scriptPageId !== undefined) dbUpdates.script_page_id = updates.scriptPageId ?? null
        if (updates.sceneSongId !== undefined) dbUpdates.scene_song_id = updates.sceneSongId ?? null
        if (updates.lightwrightItemId !== undefined) dbUpdates.lightwright_item_id = updates.lightwrightItemId ?? null
        if (updates.channelNumbers !== undefined) dbUpdates.channel_numbers = updates.channelNumbers ?? null
        if (updates.positionUnit !== undefined) dbUpdates.position_unit = updates.positionUnit ?? null
        if (updates.sceneryNeeds !== undefined) dbUpdates.scenery_needs = updates.sceneryNeeds ?? null

        const { data, error } = await supabase
          .from('notes')
          .update(dbUpdates)
          .eq('id', id)
          .eq('production_id', productionId)
          .select()
          .single()

        if (error) throw error
        return dbNoteToNote(data)
      },

      async delete(id: string, userId?: string): Promise<void> {
        // Soft delete by setting deleted_at timestamp
        const { error } = await supabase
          .from('notes')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: userId ?? null,
          })
          .eq('id', id)
          .eq('production_id', productionId)

        if (error) throw error
      },

      // softDelete is an alias for delete (both perform soft delete)
      softDelete: async function(id: string, userId?: string): Promise<void> {
        return this.delete(id, userId)
      },

      async restore(id: string): Promise<Note> {
        // Restore a soft-deleted note
        const { data, error } = await supabase
          .from('notes')
          .update({
            deleted_at: null,
            deleted_by: null,
          })
          .eq('id', id)
          .eq('production_id', productionId)
          .select()
          .single()

        if (error) throw error
        return dbNoteToNote(data)
      },

      async hardDelete(id: string): Promise<void> {
        // Permanent deletion - use with caution
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', id)
          .eq('production_id', productionId)

        if (error) throw error
      },

      async createMany(notes: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Note[]> {
        const dbNotes = notes.map(note => noteToDbNote({ ...note, productionId }))

        const { data, error } = await supabase
          .from('notes')
          .insert(dbNotes)
          .select()

        if (error) throw error
        return (data || []).map(dbNoteToNote)
      },
    },

    fixtures: {
      async getAll(): Promise<FixtureInfo[]> {
        const { data, error } = await supabase
          .from('fixtures')
          .select('*')
          .eq('production_id', productionId)
          .order('channel', { ascending: true })

        if (error) throw error
        return (data || []).map(dbFixtureToFixture)
      },

      async upload(fixtures: FixtureInfo[]): Promise<{ success: boolean; count: number }> {
        const dbFixtures = fixtures.map(f => fixtureToDbFixture({ ...f, productionId }))

        // Upsert based on production_id + lwid
        const { data, error } = await supabase
          .from('fixtures')
          .upsert(dbFixtures, { onConflict: 'production_id,lwid' })
          .select()

        if (error) throw error
        return { success: true, count: data?.length || 0 }
      },

      async clear(): Promise<void> {
        const { error } = await supabase
          .from('fixtures')
          .delete()
          .eq('production_id', productionId)

        if (error) throw error
      },
    },

    script: {
      async getPages(): Promise<ScriptPage[]> {
        const { data, error } = await supabase
          .from('script_pages')
          .select('*')
          .eq('production_id', productionId)
          .order('page_number', { ascending: true })

        if (error) throw error
        return (data || []).map((row: DbScriptPage) => ({
          id: row.id,
          pageNumber: row.page_number,
          firstCueNumber: row.first_cue_number ?? undefined,
        }))
      },

      async setPages(pages: ScriptPage[]): Promise<void> {
        // Delete existing pages
        await supabase
          .from('script_pages')
          .delete()
          .eq('production_id', productionId)

        // Insert new pages
        if (pages.length > 0) {
          const dbPages = pages.map(p => ({
            id: p.id,
            production_id: productionId,
            page_number: p.pageNumber,
            first_cue_number: p.firstCueNumber ?? null,
          }))

          const { error } = await supabase
            .from('script_pages')
            .insert(dbPages)

          if (error) throw error
        }
      },

      async getScenesSongs(): Promise<SceneSong[]> {
        const { data, error } = await supabase
          .from('scenes_songs')
          .select('*')
          .eq('production_id', productionId)
          .order('order_index', { ascending: true })

        if (error) throw error
        return (data || []).map((row: DbSceneSong) => ({
          id: row.id,
          name: row.name,
          type: row.type as 'scene' | 'song',
        }))
      },

      async setScenesSongs(scenesSongs: SceneSong[]): Promise<void> {
        // Delete existing scenes/songs
        await supabase
          .from('scenes_songs')
          .delete()
          .eq('production_id', productionId)

        // Insert new scenes/songs
        if (scenesSongs.length > 0) {
          const dbScenesSongs = scenesSongs.map((ss, index) => ({
            id: ss.id,
            production_id: productionId,
            module_type: 'cue' as const,
            name: ss.name,
            type: ss.type,
            order_index: index,
          }))

          const { error } = await supabase
            .from('scenes_songs')
            .insert(dbScenesSongs)

          if (error) throw error
        }
      },
    },

    production: {
      async get(): Promise<ProductionData | null> {
        const { data, error } = await supabase
          .from('productions')
          .select('name, abbreviation, logo')
          .eq('id', productionId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') return null
          throw error
        }

        return data ? {
          name: data.name,
          abbreviation: data.abbreviation,
          logo: data.logo || '',
        } : null
      },

      async set(data: ProductionData): Promise<void> {
        const { error } = await supabase
          .from('productions')
          .update({
            name: data.name,
            abbreviation: data.abbreviation,
            logo: data.logo || null,
          })
          .eq('id', productionId)

        if (error) throw error
      },
    },

    async clear(): Promise<void> {
      // Clear all data for this production (notes, fixtures, script pages, scenes/songs)
      await Promise.all([
        supabase.from('notes').delete().eq('production_id', productionId),
        supabase.from('fixtures').delete().eq('production_id', productionId),
        supabase.from('script_pages').delete().eq('production_id', productionId),
        supabase.from('scenes_songs').delete().eq('production_id', productionId),
      ])
    },

    async isInitialized(): Promise<boolean> {
      // Check if production exists
      const { data, error } = await supabase
        .from('productions')
        .select('id')
        .eq('id', productionId)
        .single()

      if (error) return false
      return !!data
    },
  }
}

// Export a function to get all productions (for homepage)
// This filters out deleted productions
export async function getAllProductions() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('productions')
    .select('*')
    .eq('is_demo', false)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return (data || []).map((row: DbProduction) => ({
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
  }))
}

// Export a function to create a new production
export async function createProduction(data: {
  name: string
  abbreviation: string
  logo?: string
  description?: string
  startDate?: Date
  endDate?: Date
}) {
  const supabase = createClient()

  const { data: production, error } = await supabase
    .from('productions')
    .insert({
      name: data.name,
      abbreviation: data.abbreviation,
      logo: data.logo ?? null,
      description: data.description ?? null,
      start_date: data.startDate?.toISOString().split('T')[0] ?? null,
      end_date: data.endDate?.toISOString().split('T')[0] ?? null,
      is_demo: false,
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: production.id,
    name: production.name,
    abbreviation: production.abbreviation,
    logo: production.logo ?? undefined,
    description: production.description ?? undefined,
    startDate: production.start_date ? new Date(production.start_date) : undefined,
    endDate: production.end_date ? new Date(production.end_date) : undefined,
    isDemo: production.is_demo ?? false,
    createdAt: new Date(production.created_at!),
    updatedAt: new Date(production.updated_at!),
  }
}

// Export a function to get a single production
export async function getProduction(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('productions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    abbreviation: data.abbreviation,
    logo: data.logo ?? undefined,
    description: data.description ?? undefined,
    startDate: data.start_date ? new Date(data.start_date) : undefined,
    endDate: data.end_date ? new Date(data.end_date) : undefined,
    isDemo: data.is_demo ?? false,
    emailPresets: ((data as Record<string, unknown>).email_presets ?? []) as import('@/types').EmailMessagePreset[],
    createdAt: new Date(data.created_at!),
    updatedAt: new Date(data.updated_at!),
    deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined,
    deletedBy: data.deleted_by ?? undefined,
  }
}

// Helper to map production row to Production type
function mapProductionRow(row: DbProduction) {
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
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
    deletedBy: row.deleted_by ?? undefined,
  }
}

// Update a production
export async function updateProduction(id: string, data: {
  name?: string
  abbreviation?: string
  logo?: string
  description?: string
  startDate?: Date
  endDate?: Date
}) {
  const supabase = createClient()

  const updates: Database['public']['Tables']['productions']['Update'] = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.abbreviation !== undefined) updates.abbreviation = data.abbreviation
  if (data.logo !== undefined) updates.logo = data.logo || null
  if (data.description !== undefined) updates.description = data.description || null
  if (data.startDate !== undefined) updates.start_date = data.startDate?.toISOString().split('T')[0] ?? null
  if (data.endDate !== undefined) updates.end_date = data.endDate?.toISOString().split('T')[0] ?? null

  const { data: production, error } = await supabase
    .from('productions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapProductionRow(production)
}

// Soft-delete a production (move to trash)
export async function softDeleteProduction(id: string, userId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('productions')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq('id', id)

  if (error) throw error
}

// Restore a production from trash
export async function restoreProduction(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('productions')
    .update({
      deleted_at: null,
      deleted_by: null,
    })
    .eq('id', id)

  if (error) throw error
}

// Permanently delete a production
export async function permanentlyDeleteProduction(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('productions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get all productions for admin (including deleted)
export async function getAllProductionsForAdmin() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('productions')
    .select('*')
    .eq('is_demo', false)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapProductionRow)
}

// Get only deleted productions (trash)
export async function getDeletedProductions() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('productions')
    .select('*')
    .eq('is_demo', false)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapProductionRow)
}

// Get active productions only (excluding deleted)
export async function getActiveProductions() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('productions')
    .select('*')
    .eq('is_demo', false)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapProductionRow)
}
