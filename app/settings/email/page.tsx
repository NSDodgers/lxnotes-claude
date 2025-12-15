'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Save, Send, Shield, Loader2, Check, AlertCircle } from 'lucide-react'
import { useAuthContext } from '@/components/auth/auth-provider'

interface EmailSettings {
  apiKey?: string
  apiKeySet?: boolean
  fromEmail?: string
  fromName?: string
  templateId?: string
}

export default function EmailSettingsPage() {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuthContext()
  const [settings, setSettings] = useState<EmailSettings>({
    fromEmail: 'noreply@lxnotes.app',
    fromName: 'LX Notes',
  })
  const [newApiKey, setNewApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!authLoading && user && isSuperAdmin) {
      fetchSettings()
    }
  }, [authLoading, user, isSuperAdmin])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/email-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: newApiKey || settings.apiKey,
          fromEmail: settings.fromEmail,
          fromName: settings.fromName,
          templateId: settings.templateId,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
        setNewApiKey('')
        fetchSettings()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendTest = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Please enter a test email address' })
      return
    }

    setIsSendingTest(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Test email sent to ${testEmail}` })
        setTestEmail('')
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to send test email' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test email' })
    } finally {
      setIsSendingTest(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
      </div>
    )
  }

  if (!user || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-secondary mb-6">
            This page is only accessible to super administrators.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-modules-production hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Mail className="h-6 w-6 text-modules-production" />
              Email Settings
            </h1>
            <p className="text-text-secondary mt-1">
              Configure MailerSend for invitation emails
            </p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Settings Form */}
        <div className="space-y-6">
          {/* API Key */}
          <div className="bg-bg-secondary rounded-lg p-6 border border-bg-tertiary">
            <h2 className="text-lg font-semibold text-text-primary mb-4">MailerSend API Key</h2>
            <div className="space-y-4">
              {settings.apiKeySet && (
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">API key is configured: {settings.apiKey}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {settings.apiKeySet ? 'Update API Key (optional)' : 'API Key'}
                </label>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder={settings.apiKeySet ? 'Enter new key to update...' : 'mlsn.xxxxx...'}
                  className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-modules-production"
                />
                <p className="text-xs text-text-muted mt-1">
                  Get your API key from{' '}
                  <a
                    href="https://app.mailersend.com/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-modules-production hover:underline"
                  >
                    MailerSend Dashboard
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Sender Settings */}
          <div className="bg-bg-secondary rounded-lg p-6 border border-bg-tertiary">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Sender Settings</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  From Email
                </label>
                <input
                  type="email"
                  value={settings.fromEmail || ''}
                  onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                  placeholder="noreply@lxnotes.app"
                  className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-modules-production"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  From Name
                </label>
                <input
                  type="text"
                  value={settings.fromName || ''}
                  onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                  placeholder="LX Notes"
                  className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-modules-production"
                />
              </div>
            </div>
          </div>

          {/* Template ID (optional) */}
          <div className="bg-bg-secondary rounded-lg p-6 border border-bg-tertiary">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Template (Optional)</h2>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                MailerSend Template ID
              </label>
              <input
                type="text"
                value={settings.templateId || ''}
                onChange={(e) => setSettings({ ...settings, templateId: e.target.value })}
                placeholder="Leave empty to use default template"
                className="w-full rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-modules-production"
              />
              <p className="text-xs text-text-muted mt-1">
                If set, invitation emails will use this MailerSend template instead of the
                default HTML template.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-modules-production text-white rounded-lg hover:bg-modules-production/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>

          {/* Test Email Section */}
          {settings.apiKeySet && (
            <div className="bg-bg-secondary rounded-lg p-6 border border-bg-tertiary mt-8">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Test Configuration</h2>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email to receive test..."
                  className="flex-1 rounded-lg bg-bg-tertiary border border-bg-hover px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-modules-production"
                />
                <button
                  onClick={handleSendTest}
                  disabled={isSendingTest || !testEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-50"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Test
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
