/**
 * Resend email service for sending invitations and notes distribution
 * Uses React Email templates rendered server-side
 *
 * Configuration is read from environment variables:
 * - RESEND_API_KEY (required)
 * - RESEND_FROM_EMAIL (optional, defaults to notifications@lxnotes.app)
 * - RESEND_FROM_NAME (optional, defaults to LX Notes)
 *
 * Features:
 * - Idempotency keys to prevent duplicate sends on retry
 * - Exponential backoff retry for transient failures
 */
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { InvitationEmail } from '@/emails/invitation'
import { NotesDistributionEmail } from '@/emails/notes-distribution'
import type { ModuleType } from '@/types'

interface ResendSettings {
  apiKey: string
  fromEmail: string
  fromName: string
}

/** Maximum retry attempts for transient failures */
const MAX_RETRIES = 3

/** Base delay in ms for exponential backoff */
const BASE_DELAY_MS = 1000

/** Maximum delay cap in ms */
const MAX_DELAY_MS = 30000

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if an error is retryable (transient)
 */
function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as { statusCode: number }).statusCode
    // Retry on server errors (5xx) and rate limits (429)
    return statusCode >= 500 || statusCode === 429
  }
  // Retry on network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes('timeout') ||
           message.includes('network') ||
           message.includes('etimedout') ||
           message.includes('econnreset')
  }
  return false
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateBackoffDelay(attempt: number): number {
  const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt)
  const cappedDelay = Math.min(exponentialDelay, MAX_DELAY_MS)
  // Add random jitter (0-1000ms) to prevent thundering herd
  const jitter = Math.random() * 1000
  return cappedDelay + jitter
}

/**
 * Get Resend settings from environment variables
 * Throws if RESEND_API_KEY is not set
 */
function getResendSettings(): ResendSettings {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return {
    apiKey,
    // Changed from noreply@ to notifications@ so users can reply
    fromEmail: process.env.RESEND_FROM_EMAIL || 'notifications@lxnotes.app',
    fromName: process.env.RESEND_FROM_NAME || 'LX Notes',
  }
}

/**
 * Check if Resend is configured (API key is set)
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

export interface InvitationEmailData {
  recipientEmail: string
  recipientName?: string
  productionName: string
  inviterName: string
  role: 'admin' | 'member'
  inviteUrl: string
  expiresAt: Date
  /** Invitation ID for idempotency (prevents duplicate sends on retry) */
  invitationId: string
}

export interface NoteEmailData {
  recipientEmails: string[]
  subject: string
  message: string
  productionName: string
  moduleType: ModuleType
  moduleName: string
  senderName: string
  senderEmail: string
  noteCount: number
  todoCount: number
  completeCount: number
  cancelledCount: number
  filterDescription: string
  includeNotesInBody: boolean
  pdfAttachment?: {
    filename: string
    content: string // Base64-encoded PDF
  }
  /** Unique key for idempotency (prevents duplicate sends on retry) */
  idempotencyKey: string
}

/**
 * Send email with retry logic for transient failures
 */
async function sendWithRetry(
  resend: Resend,
  emailData: Parameters<Resend['emails']['send']>[0],
  idempotencyKey?: string
): Promise<void> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { error } = await resend.emails.send(emailData, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      })

      if (error) {
        // Check if this is a retryable error
        if (isRetryableError(error) && attempt < MAX_RETRIES - 1) {
          const delay = calculateBackoffDelay(attempt)
          console.warn(`Email send failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${Math.round(delay)}ms:`, error)
          await sleep(delay)
          continue
        }
        throw new Error(error.message)
      }

      // Success
      return
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // Check if we should retry
      if (isRetryableError(err) && attempt < MAX_RETRIES - 1) {
        const delay = calculateBackoffDelay(attempt)
        console.warn(`Email send failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${Math.round(delay)}ms:`, err)
        await sleep(delay)
        continue
      }

      // Non-retryable error or final attempt
      throw lastError
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error('Failed to send email after retries')
}

/**
 * Send test email to verify configuration
 */
export async function sendTestEmail(testEmail: string): Promise<void> {
  const settings = getResendSettings()
  const resend = new Resend(settings.apiKey)

  // Generate idempotency key based on email + timestamp (rounded to minute)
  const timestampMinute = Math.floor(Date.now() / 60000)
  const idempotencyKey = `test-${testEmail}-${timestampMinute}`

  await sendWithRetry(
    resend,
    {
      from: `${settings.fromName} <${settings.fromEmail}>`,
      to: testEmail,
      subject: 'LX Notes - Resend Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Resend Configuration Test</h2>
          <p style="color: #4b5563;">
            This is a test email from LX Notes to verify your Resend configuration is working correctly.
          </p>
          <p style="color: #14b8a6;">
            Your email settings are configured correctly!
          </p>
        </div>
      `,
      text: 'This is a test email from LX Notes to verify your Resend configuration is working correctly.',
    },
    idempotencyKey
  )
}

/**
 * Send invitation email using Resend with React Email template
 */
export async function sendInvitationEmail(
  data: InvitationEmailData
): Promise<void> {
  const settings = getResendSettings()
  const resend = new Resend(settings.apiKey)

  // Render the React Email template to HTML
  const html = await render(
    InvitationEmail({
      productionName: data.productionName,
      inviterName: data.inviterName,
      role: data.role,
      inviteUrl: data.inviteUrl,
      expiresAt: data.expiresAt.toISOString(),
    })
  )

  // Generate plain text version
  const text = `
You've been invited to ${data.productionName}

${data.inviterName} has invited you to join ${data.productionName} as a ${data.role === 'admin' ? 'Admin' : 'Team Member'} on LX Notes.

LX Notes is a collaborative production notes management tool for theatrical lighting teams.

Accept your invitation here: ${data.inviteUrl}

This invitation expires on ${data.expiresAt.toLocaleDateString()}.

If you didn't expect this invitation, you can safely ignore this email.
  `.trim()

  // Idempotency key based on invitation ID prevents duplicate sends
  const idempotencyKey = `invitation-${data.invitationId}`

  await sendWithRetry(
    resend,
    {
      from: `${settings.fromName} <${settings.fromEmail}>`,
      to: data.recipientEmail,
      subject: `You've been invited to join ${data.productionName} on LX Notes`,
      html,
      text,
    },
    idempotencyKey
  )
}

/**
 * Send notes distribution email using Resend with React Email template
 */
export async function sendNoteEmail(
  data: NoteEmailData
): Promise<void> {
  const settings = getResendSettings()
  const resend = new Resend(settings.apiKey)

  // Render the React Email template to HTML
  const html = await render(
    NotesDistributionEmail({
      productionName: data.productionName,
      moduleType: data.moduleType,
      moduleName: data.moduleName,
      message: data.message,
      senderName: data.senderName,
      todoCount: data.todoCount,
      completeCount: data.completeCount,
      cancelledCount: data.cancelledCount,
      filterDescription: data.filterDescription,
      pdfFilename: data.pdfAttachment?.filename,
    })
  )

  // Generate plain text version
  const text = `
${data.moduleName} - ${data.productionName}

${data.message}

Summary: ${data.noteCount} notes (${data.todoCount} todo, ${data.completeCount} complete, ${data.cancelledCount} cancelled)
Filter: ${data.filterDescription}

${data.pdfAttachment ? `PDF attached: ${data.pdfAttachment.filename}` : ''}

Sent from LX Notes by ${data.senderName}
  `.trim()

  // Prepare attachments if PDF provided
  const attachments = data.pdfAttachment
    ? [
        {
          filename: data.pdfAttachment.filename,
          content: data.pdfAttachment.content,
        },
      ]
    : undefined

  await sendWithRetry(
    resend,
    {
      from: `${settings.fromName} <${settings.fromEmail}>`,
      to: data.recipientEmails,
      replyTo: data.senderEmail,
      subject: data.subject,
      html,
      text,
      attachments,
    },
    data.idempotencyKey
  )
}
