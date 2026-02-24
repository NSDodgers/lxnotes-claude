/**
 * Discord webhook service for submitting bug reports to a forum channel.
 *
 * Configuration:
 * - DISCORD_BUG_REPORT_WEBHOOK_URL (required) — Discord webhook URL for the #bug-reports forum channel
 */

export interface BugReport {
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  route: string
  module: string
  browser: string
  os: string
  reporterEmail: string
  reporterName: string
  timestamp: string
  screenshotBase64?: string
}

const SEVERITY_COLORS: Record<BugReport['severity'], number> = {
  critical: 0xdc2626, // red
  high: 0xf97316, // orange
  medium: 0xeab308, // yellow
  low: 0x22c55e, // green
}

/**
 * Check if the Discord bug report webhook is configured
 */
export function isDiscordWebhookConfigured(): boolean {
  return !!process.env.DISCORD_BUG_REPORT_WEBHOOK_URL
}

/**
 * Submit a bug report to the Discord #bug-reports forum channel
 */
export async function submitBugReport(report: BugReport): Promise<void> {
  const webhookUrl = process.env.DISCORD_BUG_REPORT_WEBHOOK_URL
  if (!webhookUrl) {
    throw new Error('DISCORD_BUG_REPORT_WEBHOOK_URL is not configured')
  }

  const severityLabel = report.severity.charAt(0).toUpperCase() + report.severity.slice(1)
  const threadName = `[${severityLabel}] ${report.title}`.slice(0, 100)

  const embed = {
    title: report.title,
    description: report.description,
    color: SEVERITY_COLORS[report.severity],
    fields: [
      { name: 'Severity', value: severityLabel, inline: true },
      { name: 'Module', value: report.module, inline: true },
      { name: 'Route', value: `\`${report.route}\``, inline: false },
      { name: 'Reported By', value: report.reporterName ? `${report.reporterName} (${report.reporterEmail})` : report.reporterEmail, inline: false },
      { name: 'Browser / OS', value: `${report.browser} / ${report.os}`, inline: false },
      { name: 'Timestamp', value: report.timestamp, inline: false },
    ],
    ...(report.screenshotBase64 ? { image: { url: 'attachment://screenshot.png' } } : {}),
  }

  const payload = {
    thread_name: threadName,
    embeds: [embed],
  }

  const formData = new FormData()
  formData.append('payload_json', JSON.stringify(payload))

  if (report.screenshotBase64) {
    const buffer = Buffer.from(report.screenshotBase64, 'base64')
    const blob = new Blob([buffer], { type: 'image/png' })
    formData.append('files[0]', blob, 'screenshot.png')
  }

  const response = await fetch(`${webhookUrl}?wait=true`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Discord webhook failed (${response.status}): ${text}`)
  }
}
