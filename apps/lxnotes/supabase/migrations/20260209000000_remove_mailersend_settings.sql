-- Remove deprecated MailerSend settings (app now uses Resend via env vars)
DELETE FROM app_settings WHERE key = 'mailersend';
