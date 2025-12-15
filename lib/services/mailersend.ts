/**
 * MailerSend email service for sending invitations
 */
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'

export interface MailerSendSettings {
  apiKey: string
  fromEmail: string
  fromName: string
  templateId?: string
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
