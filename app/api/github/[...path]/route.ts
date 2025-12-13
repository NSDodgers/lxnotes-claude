/**
 * GitHub API Proxy Route
 *
 * This route proxies requests to the GitHub Contents API, keeping the
 * GitHub Personal Access Token (PAT) secure on the server side.
 *
 * Used by the collaborative mode to read/write JSON data files.
 *
 * Security features:
 * - Path validation: Only allows access to specific directories
 * - Rate limiting: Prevents abuse with per-IP request limits
 */

import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_PAT
const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER
const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO
const GITHUB_BRANCH = process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main'

const GITHUB_API_BASE = 'https://api.github.com'

// Security: Allowed path prefixes for GitHub API access
const ALLOWED_PATH_PREFIXES = [
  '.collaborative/',  // Collaborative mode data files
  'data/',            // General data files
]

// Security: Allowed file extensions
const ALLOWED_EXTENSIONS = ['.json', '.md', '.txt']

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60 // 60 requests per minute per IP

// In-memory rate limit store (resets on server restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface GitHubError {
  message: string
  documentation_url?: string
}

/**
 * Get client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return 'unknown'
}

/**
 * Check rate limit for a client IP
 * Returns true if request is allowed, false if rate limited
 */
function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitStore.get(clientIP)

  if (!record || now > record.resetTime) {
    // First request or window expired - create new record
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS }
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limited
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now }
  }

  // Increment count
  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetIn: record.resetTime - now }
}

/**
 * Validate that the requested path is allowed
 */
function validatePath(filePath: string): { valid: boolean; error?: string } {
  // Normalize path to prevent traversal attacks
  const normalizedPath = filePath.replace(/\\/g, '/').replace(/\/+/g, '/')

  // Block path traversal attempts
  if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
    return { valid: false, error: 'Invalid path: path traversal not allowed' }
  }

  // Check if path starts with an allowed prefix
  const isAllowedPrefix = ALLOWED_PATH_PREFIXES.some(prefix =>
    normalizedPath.startsWith(prefix)
  )

  if (!isAllowedPrefix) {
    return { valid: false, error: `Forbidden: path must start with one of: ${ALLOWED_PATH_PREFIXES.join(', ')}` }
  }

  // Check file extension
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some(ext =>
    normalizedPath.toLowerCase().endsWith(ext)
  )

  if (!hasAllowedExtension) {
    return { valid: false, error: `Forbidden: only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed` }
  }

  return { valid: true }
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
  // Security: Rate limiting
  const clientIP = getClientIP(request)
  const rateLimit = checkRateLimit(clientIP)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  const config = validateConfig()
  if (!config.valid) {
    return NextResponse.json({ error: config.error }, { status: 500 })
  }

  const { path } = await params
  const filePath = path.join('/')

  // Security: Path validation
  const pathValidation = validatePath(filePath)
  if (!pathValidation.valid) {
    return NextResponse.json({ error: pathValidation.error }, { status: 403 })
  }

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

    return NextResponse.json(
      {
        content,
        sha: data.sha,
        path: data.path,
        size: data.size,
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    )
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
  // Security: Rate limiting
  const clientIP = getClientIP(request)
  const rateLimit = checkRateLimit(clientIP)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  const config = validateConfig()
  if (!config.valid) {
    return NextResponse.json({ error: config.error }, { status: 500 })
  }

  const { path } = await params
  const filePath = path.join('/')

  // Security: Path validation
  const pathValidation = validatePath(filePath)
  if (!pathValidation.valid) {
    return NextResponse.json({ error: pathValidation.error }, { status: 403 })
  }

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

    return NextResponse.json(
      {
        sha: data.content.sha,
        path: data.content.path,
        committed: true,
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    )
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
  // Security: Rate limiting
  const clientIP = getClientIP(request)
  const rateLimit = checkRateLimit(clientIP)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  const config = validateConfig()
  if (!config.valid) {
    return NextResponse.json({ error: config.error }, { status: 500 })
  }

  const { path } = await params
  const filePath = path.join('/')

  // Security: Path validation
  const pathValidation = validatePath(filePath)
  if (!pathValidation.valid) {
    return NextResponse.json({ error: pathValidation.error }, { status: 403 })
  }

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

    return NextResponse.json(
      { deleted: true },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    )
  } catch (error) {
    console.error('GitHub API DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete from GitHub' },
      { status: 500 }
    )
  }
}
