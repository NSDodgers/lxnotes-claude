import { createAdminClient } from './admin'

const BUCKET = 'production-snapshots'

/**
 * Upload a snapshot JSON blob to Supabase Storage.
 * Best-effort: logs errors but never throws.
 * @returns The storage path on success, or null on failure.
 */
export async function uploadSnapshotToStorage(
  productionId: string,
  snapshotId: string,
  snapshotData: unknown
): Promise<string | null> {
  try {
    const path = `${productionId}/${snapshotId}.json`
    const blob = new Blob([JSON.stringify(snapshotData)], {
      type: 'application/json',
    })

    const supabase = createAdminClient()
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: 'application/json', upsert: false })

    if (error) {
      console.error(
        `Failed to upload snapshot ${snapshotId} to storage:`,
        error.message
      )
      return null
    }

    return path
  } catch (err) {
    console.error(
      `Unexpected error uploading snapshot ${snapshotId} to storage:`,
      err
    )
    return null
  }
}

/**
 * Remove snapshot files from Supabase Storage.
 * Best-effort: logs errors but never throws.
 * @returns The number of files successfully removed.
 */
export async function removeSnapshotsFromStorage(
  paths: string[]
): Promise<number> {
  if (paths.length === 0) return 0

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.storage.from(BUCKET).remove(paths)

    if (error) {
      console.error('Failed to remove snapshots from storage:', error.message)
      return 0
    }

    return data?.length ?? 0
  } catch (err) {
    console.error('Unexpected error removing snapshots from storage:', err)
    return 0
  }
}
