/**
 * GitHub API Proxy Route
 *
 * This route proxies requests to the GitHub Contents API, keeping the
 * GitHub Personal Access Token (PAT) secure on the server side.
 *
 * Used by the collaborative mode to read/write JSON data files.
 */

import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_PAT
const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO
const GITHUB_BRANCH = process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main'

const GITHUB_API_BASE = 'https://api.github.com'

interface GitHubError {
  message: string
  documentation_url?: string
}

function getGitHubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'LXNotes-App',
  }

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
  }

  return headers
}

function validateConfig(): { valid: boolean; error?: string } {
  if (!GITHUB_OWNER) {
    return { valid: false, error: 'NEXT_PUBLIC_GITHUB_OWNER is not configured' }
  }
  if (!GITHUB_REPO) {
    return { valid: false, error: 'NEXT_PUBLIC_GITHUB_REPO is not configured' }
  }
  if (!GITHUB_TOKEN) {
    return { valid: false, error: 'GITHUB_PAT is not configured' }
  }
  return { valid: true }
}

/**
 * GET /api/github/[...path]
 *
 * Reads a file from the GitHub repository.
 * Returns the file content (decoded from base64) and SHA.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const config = validateConfig()
  if (!config.valid) {
    return NextResponse.json({ error: config.error }, { status: 500 })
  }

  const { path } = await params
  const filePath = path.join('/')

  try {
    const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`

    const response = await fetch(url, {
      method: 'GET',
      headers: getGitHubHeaders(),
      // Don't cache - we want fresh data
      cache: 'no-store',
    })

    if (response.status === 404) {
      return NextResponse.json({ error: 'File not found', exists: false }, { status: 404 })
    }

    if (!response.ok) {
      const error: GitHubError = await response.json()
      return NextResponse.json(
        { error: error.message || 'GitHub API error' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8')

    return NextResponse.json({
      content,
      sha: data.sha,
      path: data.path,
      size: data.size,
    })
  } catch (error) {
    console.error('GitHub API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from GitHub' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/github/[...path]
 *
 * Creates or updates a file in the GitHub repository.
 * Requires: content (string), sha (string, for updates), message (string)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const config = validateConfig()
  if (!config.valid) {
    return NextResponse.json({ error: config.error }, { status: 500 })
  }

  const { path } = await params
  const filePath = path.join('/')

  try {
    const body = await request.json()
    const { content, sha, message = 'Update from LX Notes' } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`

    // Encode content to base64
    const encodedContent = Buffer.from(content, 'utf-8').toString('base64')

    const requestBody: Record<string, string> = {
      message,
      content: encodedContent,
      branch: GITHUB_BRANCH,
    }

    // SHA is required for updates (not for creates)
    if (sha) {
      requestBody.sha = sha
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...getGitHubHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error: GitHubError = await response.json()

      // Handle conflict (file was modified by someone else)
      if (response.status === 409) {
        return NextResponse.json(
          { error: 'Conflict: file was modified. Please refresh and try again.', conflict: true },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: error.message || 'GitHub API error' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      sha: data.content.sha,
      path: data.content.path,
      committed: true,
    })
  } catch (error) {
    console.error('GitHub API PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to write to GitHub' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/github/[...path]
 *
 * Deletes a file from the GitHub repository.
 * Requires: sha (string), message (string, optional)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const config = validateConfig()
  if (!config.valid) {
    return NextResponse.json({ error: config.error }, { status: 500 })
  }

  const { path } = await params
  const filePath = path.join('/')

  try {
    const body = await request.json()
    const { sha, message = 'Delete from LX Notes' } = body

    if (!sha) {
      return NextResponse.json({ error: 'SHA is required for deletion' }, { status: 400 })
    }

    const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...getGitHubHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sha,
        branch: GITHUB_BRANCH,
      }),
    })

    if (!response.ok) {
      const error: GitHubError = await response.json()
      return NextResponse.json(
        { error: error.message || 'GitHub API error' },
        { status: response.status }
      )
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('GitHub API DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete from GitHub' },
      { status: 500 }
    )
  }
}
