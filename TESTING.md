# Testing Guide

## Commands

```bash
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

## MCP Browser Tools

Only use when explicitly requested by the user. Never use proactively.
