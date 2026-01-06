# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts Next.js App Router routes for cue, work, and production notes; shared layouts live in `app/(...)` folders alongside page-level providers.
- `components/` contains reusable UI (layout, forms, widgets) built as modular React components; keep new UI elements colocated here.
- `lib/` and `types/` hold utilities (state stores, data parsers) and shared TypeScript definitions; update these when extending domain models.
- `tests/` groups Playwright end-to-end specs plus fixtures/util helpers, while `docs/` captures feature briefs and integration notes; static assets land in `public/`.

## Build, Test, and Development Commands
- `npm run dev` starts the dev server at http://localhost:3001 with mock data and relaxed auth.
- `npm run build` creates the production bundle; run before shipping config or dependency changes.
- `npm start` serves the built app for smoke-checking optimised output.
- `npm run lint` runs Next.js/ESLint rules; fix findings before opening a PR.
- `npm run test:e2e` executes the Playwright suite headlessly (chromium/firefox/webkit); add `:headed` for debug runs and `test:report` to open the HTML results.

## Coding Style & Naming Conventions
- TypeScript everywhere with 2-space indentation, single quotes, and no dangling semicolons in app code; mirror existing patterns when unsure.
- React components use `PascalCase` filenames, hooks/utilities use `camelCase`, and constants are `SCREAMING_SNAKE_CASE` when exported.
- Tailwind classes go in logical clusters (layout → spacing → color); lean on `cn` from `lib/utils.ts` for conditional styling.
- Run `npm run lint` (and optionally Prettier via your editor) before commits to keep imports ordered and unused code trimmed.

## Testing Guidelines
- End-to-end specs live under `tests/e2e` with `*.spec.ts` naming; fixtures and mock data sit in `tests/fixtures`.
- Playwright is configured in `playwright.config.ts` to auto-start `npm run dev`, so ensure port 3001 is free before running.
- Record new regression coverage when you touch workflow-critical flows (quick add, status transitions, CSV import) and update `TEST_EXECUTION_REPORT.md` if relevant to release notes.

## Commit & Pull Request Guidelines
- Follow the existing imperative style (`Implement…`, `Add…`) and keep subjects under ~72 characters; group related changes into a single commit when feasible.
- Pull requests need: a terse summary of scope, testing evidence (command snippets or screenshots), linked Jira/GitHub issues when applicable, and notes about environment updates (`.env.local`, Supabase keys) so reviewers can reproduce.
- Request at least one review from a module owner (cue/work/production), and wait for lint/tests to pass before merging.

## Environment & Security Tips
- Copy `.env.example` to `.env.local` for local overrides; never commit secrets—`.gitignore` already excludes local env files.
- Supabase credentials and external APIs remain optional; set `NEXT_PUBLIC_DEV_MODE=true` when working with mock data to match Playwright defaults.
- Avoid storing CSVs with patron data in the repo; use `sessions/` or local scratch space for temporary imports.
