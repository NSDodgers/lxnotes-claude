import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProductionMember } from '@/lib/services/production-members'
import { sendNoteEmail, isResendConfigured, NoteEmailData } from '@/lib/services/resend'
import type { ModuleType } from '@/types'
import { resolvePlaceholders, PlaceholderData } from '@/lib/utils/placeholders'

/**
 * Request body for sending note emails
 */
interface SendEmailRequest {
  productionId: string
  moduleType: ModuleType

  // From email preset config
  recipients: string              // Comma-separated, already validated client-side
  subject: string                 // With placeholders (resolve server-side)
  message: string                 // With placeholders (resolve server-side)
  includeNotesInBody: boolean

  // PDF attachment (optional)
  attachPdf: boolean
  pdfBase64?: string              // Base64-encoded PDF blob
  pdfFilename?: string            // e.g., "Work_Notes_2026-01-13.pdf"

  // Stats for placeholder resolution
  noteStats: {
    total: number
    todo: number
    complete: number
    cancelled: number
  }
  filterDescription: string
  sortDescription: string
  dateRange: string
}

/**
 * Get module display name
 */
function getModuleName(moduleType: ModuleType): string {
  const names: Record<ModuleType, string> = {
    cue: 'Cue Notes',
    work: 'Work Notes',
    production: 'Production Notes',
    actor: 'Actor Notes',
  }
  return names[moduleType] || moduleType
}

/**
 * Parse full name into first/last
 */
function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

/**
 * POST /api/email/send
 * Send notes distribution email
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body: SendEmailRequest = await request.json()
    const {
      productionId,
      moduleType,
      recipients,
      subject,
      message,
      includeNotesInBody,
      attachPdf,
      pdfBase64,
      pdfFilename,
      noteStats,
      filterDescription,
      sortDescription,
      dateRange,
    } = body

    // Validate required fields
    if (!productionId || !recipients || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check production membership
    const isMember = await isProductionMember(productionId, user.id)
    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this production' },
        { status: 403 }
      )
    }

    // Check if Resend is configured
    if (!isResendConfigured()) {
      return NextResponse.json(
        { error: 'Email service is not configured. RESEND_API_KEY environment variable is not set.' },
        { status: 503 }
      )
    }

    // Get production name
    const { data: production, error: productionError } = await supabase
      .from('productions')
      .select('name')
      .eq('id', productionId)
      .single()

    if (productionError || !production) {
      return NextResponse.json(
        { error: 'Production not found' },
        { status: 404 }
      )
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const fullName = userProfile?.full_name || user.email?.split('@')[0] || 'Unknown User'
    const { firstName, lastName } = parseFullName(fullName)
    const senderEmail = userProfile?.email || user.email || ''

    // Prepare placeholder data
    const placeholderData: PlaceholderData = {
      productionTitle: production.name,
      userFullName: fullName,
      userFirstName: firstName,
      userLastName: lastName,
      noteStats: noteStats || { total: 0, todo: 0, complete: 0, cancelled: 0 },
      filterDescription: filterDescription || 'All notes',
      sortDescription: sortDescription || 'Default order',
      dateRange: dateRange || 'All dates',
    }

    // Resolve placeholders in subject and message
    const resolvedSubject = resolvePlaceholders(subject, placeholderData)
    const resolvedMessage = resolvePlaceholders(message, placeholderData)

    // Parse recipients
    const recipientEmails = recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0)

    if (recipientEmails.length === 0) {
      return NextResponse.json(
        { error: 'No valid recipients provided' },
        { status: 400 }
      )
    }

    // Validate PDF size if provided (max 5MB)
    if (pdfBase64) {
      const sizeInBytes = (pdfBase64.length * 3) / 4 // Approximate base64 to bytes
      const maxSizeBytes = 5 * 1024 * 1024 // 5MB
      if (sizeInBytes > maxSizeBytes) {
        return NextResponse.json(
          { error: 'PDF attachment is too large (max 5MB)' },
          { status: 400 }
        )
      }
    }

    // Generate idempotency key to prevent duplicate sends on retry/double-click
    // Key is based on production, module, user, and timestamp (rounded to minute)
    // This allows the same user to intentionally send again after 1 minute
    const timestampMinute = Math.floor(Date.now() / 60000)
    const idempotencyKey = `notes-${productionId}-${moduleType}-${user.id}-${timestampMinute}`

    // Prepare email data
    const emailData: NoteEmailData = {
      recipientEmails,
      subject: resolvedSubject,
      message: resolvedMessage,
      productionName: production.name,
      moduleType,
      moduleName: getModuleName(moduleType),
      senderName: fullName,
      senderEmail,
      noteCount: noteStats?.total || 0,
      todoCount: noteStats?.todo || 0,
      completeCount: noteStats?.complete || 0,
      cancelledCount: noteStats?.cancelled || 0,
      filterDescription: filterDescription || 'All notes',
      includeNotesInBody,
      pdfAttachment: attachPdf && pdfBase64 ? {
        filename: pdfFilename || `${moduleType}_notes.pdf`,
        content: pdfBase64,
      } : undefined,
      idempotencyKey,
    }

    // Send email
    await sendNoteEmail(emailData)

    return NextResponse.json({
      success: true,
      recipientCount: recipientEmails.length,
    })
  } catch (error) {
    console.error('Error sending notes email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}
