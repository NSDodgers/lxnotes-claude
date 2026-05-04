# Testing Guide

## Commands

```bash
npm run test:unit                         # Run Vitest unit tests
npm run test:unit:watch                   # Run unit tests in watch mode
npm run test:e2e                          # Run all E2E tests
npx playwright test --headed              # Visible browser
npx playwright test --ui                  # Interactive runner
npx playwright show-report                # View results
npx playwright test tests/e2e/work-notes.spec.ts  # Specific file
npx playwright test --grep "position order"        # By name
npx playwright test --debug tests/e2e/file.spec.ts # Debug mode
npx playwright test --update-snapshots             # Update snapshots
```

## Key Rules

- Always call `waitForAppReady()` before interactions
- Use data-testid selectors, never CSS classes
- Use `TestHelpers` from `tests/utils/test-helpers.ts` for navigation and form interaction
- Follow existing test files for patterns — don't invent new conventions
- Test data and fixtures live in `tests/fixtures/`

## Authenticated tests against a deployed environment

The default E2E suite (`npm run test:e2e`) starts `next dev` with
`NEXT_PUBLIC_DEV_MODE=true` and a mock Supabase client, so it never exercises
real auth. For authenticated checks against a live URL (preview, staging, or
prod), use the separate config:

```bash
# 1. One-time interactive login. Opens a visible Chromium at the configured
#    baseURL's /auth/login. Sign in normally; state saves on success.
npm run test:auth:setup
# state file: apps/lxnotes/tests/.auth/default.json (gitignored)

# 2. Re-run any authenticated assertion using the saved state, headlessly.
npm run test:auth:verify

# Override target URL (default https://www.lxnotes.app):
LXNOTES_TEST_BASE_URL=https://lx-notes-git-main-lxnotes.vercel.app \
  npm run test:auth:verify

# Multiple accounts / personas (state file is keyed by LXNOTES_TEST_ACCOUNT):
LXNOTES_TEST_ACCOUNT=admin npm run test:auth:setup
LXNOTES_TEST_ACCOUNT=admin npm run test:auth:verify
```

Authenticated test specs match `tests/auth-*.spec.ts`. Add new specs there
when you need a real-Supabase verification (e.g. RLS, redirect flow, auth
guard). Re-run `test:auth:setup` when the Supabase JWT expires (verifier
fails with a redirect-to-login).

`tests/.auth/` is gitignored. Never commit a state file.

## MCP Browser Tools

Only use when explicitly requested by the user. Never use proactively.
