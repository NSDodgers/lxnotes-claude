/**
 * Resend email service for sending invitations and notes distribution
 * Uses React Email templates rendered server-side
 *
 * Configuration is read from environment variables:
 * - RESEND_API_KEY (required)
 * - RESEND_FROM_EMAIL (optional, defaults to noreply@lxnotes.app)
 * - RESEND_FROM_NAME (optional, defaults to LX Notes)
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
    fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@lxnotes.app',
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
}

/**
 * Send test email to verify configuration
 */
export async function sendTestEmail(testEmail: string): Promise<void> {
  const settings = getResendSettings()
  const resend = new Resend(settings.apiKey)

  const { error } = await resend.emails.send({
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
  })

  if (error) {
    console.error('Error sending test email:', error)
    throw new Error(error.message)
  }
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

  const { error } = await resend.emails.send({
    from: `${settings.fromName} <${settings.fromEmail}>`,
    to: data.recipientEmail,
    subject: `You've been invited to join ${data.productionName} on LX Notes`,
    html,
    text,
  })

  if (error) {
    console.error('Error sending invitation email:', error)
    throw new Error(error.message)
  }
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

  const { error } = await resend.emails.send({
    from: `${settings.fromName} <${settings.fromEmail}>`,
    to: data.recipientEmails,
    replyTo: data.senderEmail,
    subject: data.subject,
    html,
    text,
    attachments,
  })

  if (error) {
    console.error('Error sending notes email:', error)
    throw new Error(error.message)
  }
}
