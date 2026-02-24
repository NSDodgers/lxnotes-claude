# Bug Report Button — Design

## Overview

A floating button in LX Notes that lets authenticated users submit bug reports directly to the Discord `#bug-reports` forum channel. Reports include user-provided details plus auto-captured context (screenshot, page, browser info).

## User Experience

- Fixed-position bug icon button in the bottom-right corner, visible only to authenticated users.
- Clicking the button silently captures a screenshot of the current page via `html2canvas`, then opens a modal.
- The modal contains:
  - **Title** — short text input (required)
  - **Description** — textarea (required)
  - **Severity** — dropdown: Low / Medium / High / Critical
  - **Screenshot preview** — auto-captured thumbnail with option to remove
- On submit, a toast confirms success or shows an error.

### Auto-Enriched Context (not shown to user)

- Current page route
- Current module (inferred from route: Cue Notes, Work Notes, Production Notes, etc.)
- Browser and OS (user agent string)
- User email/name from auth session
- Timestamp (UTC)

## Technical Architecture

### Components

- `BugReportButton` — fixed-position floating button, renders only when authenticated
- `BugReportModal` — form dialog handling screenshot capture and submission

### API Route

`app/api/bug-report/route.ts` — POST endpoint that:

1. Validates the auth session
2. Receives form data (title, description, severity, screenshot base64, auto-enriched context)
3. Uploads the screenshot as a file attachment via Discord webhook
4. Creates a new forum post in `#bug-reports` using the webhook's `thread_name` parameter

### Environment Variable

- `DISCORD_BUG_REPORT_WEBHOOK_URL` — Discord webhook URL, stored server-side only (`.env.local` / production env)

### Dependencies

- `html2canvas` — DOM-to-canvas screenshot capture

## Discord Post Format

**Thread title:** `[High] Modal won't close on Work Notes page`

**Post body (Discord embed):**

- Description (user-provided)
- Severity
- Module
- Page route
- Reported by (email)
- Browser / OS
- Timestamp (UTC)
- Auto-captured screenshot (attached as image)

## Setup Requirements

1. In Discord, go to `#bug-reports` channel settings → Integrations → Webhooks → New Webhook
2. Copy the webhook URL
3. Add it to the app's environment as `DISCORD_BUG_REPORT_WEBHOOK_URL`
