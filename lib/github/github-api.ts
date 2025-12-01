/**
 * GitHub API Client
 *
 * Provides a clean interface for reading and writing files to GitHub
 * via our API proxy route. All operations go through /api/github/[...path]
 * to keep the GitHub PAT secure.
 */

export interface GitHubFileResponse {
  content: string
  sha: string
  path: string
  size?: number
}

export interface GitHubWriteResponse {
  sha: string
  path: string
  committed: boolean
}

export interface GitHubError {
  error: string
  conflict?: boolean
  exists?: boolean
}

const API_BASE = '/api/github'

/**
 * Constructs the full path for collaborative data files
 */
export function getCollaborativeDataPath(fileName: string): string {
  return `public/collaborative-data/romeo-juliet/${fileName}`
}

/**
 * Read a file from the GitHub repository
 *
 * @param path - Path to the file (e.g., 'public/collaborative-data/romeo-juliet/notes.json')
 * @returns File content and SHA, or null if not found
 */
export async function readFile(path: string): Promise<GitHubFileResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Bypass browser cache to get fresh data
      cache: 'no-store',
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      const error: GitHubError = await response.json()
      throw new Error(error.error || 'Failed to read file')
    }

    return await response.json()
  } catch (error) {
    console.error(`GitHub API: Failed to read ${path}:`, error)
    throw error
  }
}

/**
 * Write (create or update) a file in the GitHub repository
 *
 * @param path - Path to the file
 * @param content - File content (will be JSON stringified if object)
 * @param sha - Current SHA (required for updates, omit for creates)
 * @param message - Commit message
 * @returns New SHA and path
 */
export async function writeFile(
  path: string,
  content: string | object,
  sha?: string,
  message?: string
): Promise<GitHubWriteResponse> {
  const stringContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : content

  try {
    const response = await fetch(`${API_BASE}/${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: stringContent,
        sha,
        message: message || `Update ${path.split('/').pop()}`,
      }),
    })

    if (!response.ok) {
      const error: GitHubError = await response.json()

      if (error.conflict) {
        throw new ConflictError('File was modified by another user. Please refresh.')
      }

      throw new Error(error.error || 'Failed to write file')
    }

    return await response.json()
  } catch (error) {
    console.error(`GitHub API: Failed to write ${path}:`, error)
    throw error
  }
}

/**
 * Delete a file from the GitHub repository
 *
 * @param path - Path to the file
 * @param sha - Current SHA (required)
 * @param message - Commit message
 */
export async function deleteFile(
  path: string,
  sha: string,
  message?: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha,
        message: message || `Delete ${path.split('/').pop()}`,
      }),
    })

    if (!response.ok) {
      const error: GitHubError = await response.json()
      throw new Error(error.error || 'Failed to delete file')
    }
  } catch (error) {
    console.error(`GitHub API: Failed to delete ${path}:`, error)
    throw error
  }
}

/**
 * Read and parse a JSON file from GitHub
 *
 * @param path - Path to the JSON file
 * @returns Parsed JSON data and SHA, or null if not found
 */
export async function readJsonFile<T>(path: string): Promise<{ data: T; sha: string } | null> {
  const file = await readFile(path)

  if (!file) {
    return null
  }

  try {
    const data = JSON.parse(file.content) as T
    return { data, sha: file.sha }
  } catch (error) {
    console.error(`GitHub API: Failed to parse JSON from ${path}:`, error)
    throw new Error(`Invalid JSON in ${path}`)
  }
}

/**
 * Write a JSON file to GitHub (with retry on conflict)
 *
 * @param path - Path to the JSON file
 * @param data - Data to write (will be JSON stringified)
 * @param sha - Current SHA (required for updates)
 * @param message - Commit message
 * @param retryOnConflict - Whether to retry once on conflict (default: true)
 * @returns New SHA
 */
export async function writeJsonFile<T extends object>(
  path: string,
  data: T,
  sha: string,
  message?: string,
  retryOnConflict = true
): Promise<string> {
  try {
    const result = await writeFile(path, data as object, sha, message)
    return result.sha
  } catch (error) {
    if (error instanceof ConflictError && retryOnConflict) {
      console.log(`GitHub API: Conflict on ${path}, refetching and retrying...`)

      // Refetch current data to get new SHA
      const current = await readFile(path)

      if (current) {
        // Retry with new SHA (last-write-wins strategy)
        const result = await writeFile(path, data as object, current.sha, message)
        return result.sha
      }

      // File was deleted, create it fresh
      const result = await writeFile(path, data as object, undefined, message)
      return result.sha
    }

    throw error
  }
}

/**
 * Custom error for conflict situations
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

/**
 * Check if a file exists in the repository
 */
export async function fileExists(path: string): Promise<boolean> {
  const file = await readFile(path)
  return file !== null
}
