/**
 * MailerSend email service for sending invitations and notes distribution
 */
import { MailerSend, EmailParams, Sender, Recipient, Attachment } from 'mailersend'

export interface MailerSendSettings {
  apiKey: string
  fromEmail: string
  fromName: string
  templateId?: string                    // For invitation emails
  notesDistributionTemplateId?: string   // For notes distribution emails
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

/**
 * Validate MailerSend API key by checking account info
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const mailerSend = new MailerSend({ apiKey })

    // Try to get domains list to validate the API key
    const response = await mailerSend.email.domain.list()
    return response.body?.data !== undefined
  } catch (error) {
    console.error('MailerSend API key validation failed:', error)
    return false
  }
}

/**
 * Get available email templates from MailerSend
 */
export async function getTemplates(apiKey: string) {
  try {
    const mailerSend = new MailerSend({ apiKey })
    const response = await mailerSend.email.template.list()
    return response.body?.data ?? []
  } catch (error) {
    console.error('Error fetching MailerSend templates:', error)
    throw error
  }
}

/**
 * Send invitation email using MailerSend
 */
export async function sendInvitationEmail(
  settings: MailerSendSettings,
  data: InvitationEmailData
): Promise<void> {
  const mailerSend = new MailerSend({ apiKey: settings.apiKey })

  const sender = new Sender(settings.fromEmail, settings.fromName)
  const recipients = [new Recipient(data.recipientEmail, data.recipientName || data.recipientEmail)]

  const roleText = data.role === 'admin' ? 'Admin' : 'Team Member'

  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo(recipients)
    .setSubject(`You've been invited to join ${data.productionName} on LX Notes`)

  // Use template if provided
  if (settings.templateId) {
    emailParams
      .setTemplateId(settings.templateId)
      .setPersonalization([
        {
          email: data.recipientEmail,
          data: {
            // Template variables - match MailerSend template exactly
            productionTitle: data.productionName,
            userRole: roleText,
            loginUrl: data.inviteUrl,
            // Legacy variable names for backwards compatibility
            production_name: data.productionName,
            inviter_name: data.inviterName,
            role: roleText,
            invite_url: data.inviteUrl,
            expires_at: data.expiresAt.toLocaleDateString(),
          },
        },
      ])
  } else {
    // Fallback to plain HTML email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">You've been invited to ${data.productionName}</h2>
        <p style="color: #4b5563;">
          ${data.inviterName} has invited you to join <strong>${data.productionName}</strong>
          as a <strong>${roleText}</strong> on LX Notes.
        </p>
        <p style="color: #4b5563;">
          LX Notes is a collaborative production notes management tool for theatrical lighting teams.
        </p>
        <div style="margin: 30px 0;">
          <a href="${data.inviteUrl}"
             style="background-color: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">
          This invitation expires on ${data.expiresAt.toLocaleDateString()}.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `

    const textContent = `
You've been invited to ${data.productionName}

${data.inviterName} has invited you to join ${data.productionName} as a ${roleText} on LX Notes.

LX Notes is a collaborative production notes management tool for theatrical lighting teams.

Accept your invitation here: ${data.inviteUrl}

This invitation expires on ${data.expiresAt.toLocaleDateString()}.

If you didn't expect this invitation, you can safely ignore this email.
    `

    emailParams.setHtml(htmlContent).setText(textContent.trim())
  }

  try {
    await mailerSend.email.send(emailParams)
  } catch (error) {
    console.error('Error sending invitation email:', error)
    throw error
  }
}

/**
 * Send test email to verify configuration
 */
export async function sendTestEmail(
  settings: MailerSendSettings,
  testEmail: string
): Promise<void> {
  const mailerSend = new MailerSend({ apiKey: settings.apiKey })

  const sender = new Sender(settings.fromEmail, settings.fromName)
  const recipients = [new Recipient(testEmail, testEmail)]

  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo(recipients)
    .setSubject('LX Notes - MailerSend Test Email')
    .setHtml(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">MailerSend Configuration Test</h2>
        <p style="color: #4b5563;">
          This is a test email from LX Notes to verify your MailerSend configuration is working correctly.
        </p>
        <p style="color: #14b8a6;">
          Your email settings are configured correctly!
        </p>
      </div>
    `)
    .setText('This is a test email from LX Notes to verify your MailerSend configuration is working correctly.')

  try {
    await mailerSend.email.send(emailParams)
  } catch (error) {
    console.error('Error sending test email:', error)
    throw error
  }
}

/**
 * Data for sending notes distribution emails
 */
export interface NoteEmailData {
  recipientEmails: string[]
  subject: string
  message: string
  htmlMessage?: string
  productionName: string
  moduleName: string
  senderName: string
  senderEmail: string           // Used for Reply-To header
  noteCount: number
  todoCount: number
  completeCount: number
  cancelledCount: number
  filterDescription: string
  includeNotesInBody: boolean
  notesTableHtml?: string       // Pre-generated HTML table of notes
  pdfAttachment?: {
    filename: string
    content: string             // Base64-encoded PDF
  }
}

/**
 * Generate default HTML email for notes distribution
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateDefaultNoteEmailHtml(data: NoteEmailData): string {
  const notesSection = data.includeNotesInBody && data.notesTableHtml
    ? `
      <div style="margin: 20px 0;">
        ${data.notesTableHtml}
      </div>
    `
    : ''

  const attachmentNote = data.pdfAttachment
    ? `<p style="color: #9ca3af; font-size: 14px;">📎 PDF attached: ${escapeHtml(data.pdfAttachment.filename)}</p>`
    : ''

  // Safe to interpolate generated HTML (notesTableHtml) but user content must be escaped
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">${escapeHtml(data.moduleName)} - ${escapeHtml(data.productionName)}</h2>
      <p style="color: #4b5563; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
      <div style="margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 6px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          <strong>Summary:</strong> ${data.noteCount} notes
          (${data.todoCount} todo, ${data.completeCount} complete, ${data.cancelledCount} cancelled)
        </p>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
          <strong>Filter:</strong> ${escapeHtml(data.filterDescription)}
        </p>
      </div>
      ${notesSection}
      ${attachmentNote}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #9ca3af; font-size: 12px;">
        Sent from LX Notes by ${escapeHtml(data.senderName)}
      </p>
    </div>
  `
}

/**
 * Generate plain text version of notes email
 */
function generateNoteEmailText(data: NoteEmailData): string {
  return `
${data.moduleName} - ${data.productionName}

${data.message}

Summary: ${data.noteCount} notes (${data.todoCount} todo, ${data.completeCount} complete, ${data.cancelledCount} cancelled)
Filter: ${data.filterDescription}

${data.pdfAttachment ? `PDF attached: ${data.pdfAttachment.filename}` : ''}

Sent from LX Notes by ${data.senderName}
  `.trim()
}

/**
 * Send notes distribution email using MailerSend
 */
export async function sendNoteEmail(
  settings: MailerSendSettings,
  data: NoteEmailData
): Promise<void> {
  const mailerSend = new MailerSend({ apiKey: settings.apiKey })
  const sender = new Sender(settings.fromEmail, settings.fromName)

  const recipients = data.recipientEmails.map(email => new Recipient(email, email))

  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo(recipients)
    .setReplyTo(new Recipient(data.senderEmail, data.senderName))
    .setSubject(data.subject)

  // Use notes distribution template if configured
  if (settings.notesDistributionTemplateId) {
    emailParams
      .setTemplateId(settings.notesDistributionTemplateId)
      .setPersonalization(data.recipientEmails.map(email => ({
        email,
        data: {
          productionTitle: data.productionName,
          moduleName: data.moduleName,
          userFullName: data.senderName,
          senderEmail: data.senderEmail,
          noteCount: String(data.noteCount),
          todoCount: String(data.todoCount),
          completeCount: String(data.completeCount),
          cancelledCount: String(data.cancelledCount),
          filterDescription: data.filterDescription,
          message: data.message,
          attachmentFilename: data.pdfAttachment?.filename || '',
        },
      })))
  } else {
    // Fallback to default HTML template
    emailParams
      .setHtml(data.htmlMessage || generateDefaultNoteEmailHtml(data))
      .setText(generateNoteEmailText(data))
  }

  // Add PDF attachment if provided
  if (data.pdfAttachment) {
    emailParams.setAttachments([
      new Attachment(
        data.pdfAttachment.content,
        data.pdfAttachment.filename,
        'attachment'
      )
    ])
  }

  try {
    await mailerSend.email.send(emailParams)
  } catch (error) {
    console.error('Error sending notes email:', error)
    throw error
  }
}
