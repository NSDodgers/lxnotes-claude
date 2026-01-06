# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working with This Project

This project uses the Claude Code Sessions system for task management and collaboration. See [@CLAUDE.sessions.md](./CLAUDE.sessions.md) for:
- Task creation and completion protocols
- Context compaction workflows
- Specialized agent usage

**Quick check current task:**
```bash
cat .claude/state/current_task.json
git branch --show-current
```

## Directory Structure

```
lxnotes-claude/
├── app/                      # Next.js 15 App Router pages
│   ├── cue-notes/           # Purple-themed cue management
│   ├── work-notes/          # Blue-themed equipment tracking
│   ├── production-notes/   # Cyan-themed cross-department
│   └── settings/            # App configuration
├── components/
│   ├── layout/              # Sidebar, dashboard layout
│   ├── notes-table/         # Module-specific table components
│   ├── pdf/                 # PDF generation components
│   └── providers.tsx        # React Query, theme providers
├── lib/
│   ├── supabase/            # Mock client for dev mode
│   ├── utils.ts             # cn() and utility functions
│   └── constants/           # App-wide constants
├── types/                   # TypeScript type definitions
├── tests/
│   ├── e2e/                 # Playwright test suites
│   ├── utils/               # TestHelpers and shared patterns
│   └── fixtures/            # Mock data, CSV samples
└── .claude/                 # Claude Code configuration
```

## Development Commands

```bash
# Start development server (runs on localhost:3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture Overview

This is **LX Notes**, a theatrical production notes management system built with Next.js 15 and TypeScript. The app manages three distinct note modules for theater lighting and production teams.

### Core Architecture

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with dark theme as default
- **State Management**: Zustand for client state
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase (with mock client for development)

### Module Structure

The app is organized around three core modules:

1. **Cue Notes** (`/cue-notes`) - Purple theme
   - Lighting cues and effects management
   - Links to script pages and scenes/songs
   - Uses `scriptPageId` and `sceneSongId` fields

2. **Work Notes** (`/work-notes`) - Blue theme
   - Equipment and technical task tracking
   - Lightwright CSV data integration
   - Uses `lightwrightItemId` field

3. **Production Notes** (`/production-notes`) - Cyan theme
   - Cross-department communication
   - No external lookups required

### Key Data Models

All notes share common fields defined in `types/index.ts`:
- `moduleType`: 'cue' | 'work' | 'production'
- `status`: 'todo' | 'complete' | 'cancelled'
- `priority`: 'high' | 'medium' | 'low'

Module-specific fields:
- `scriptPageId` - for Cue Notes
- `sceneSongId` - for Cue Notes
- `lightwrightItemId` - for Work Notes

### Development Mode

The app uses a development mode system:
- Mock Supabase client in `lib/supabase/client.ts`
- No authentication required when `NEXT_PUBLIC_DEV_MODE=true`
- All data is mock data, not persisted
- Dark theme enabled by default in root layout

### Component Organization

- `app/` - Next.js App Router pages for each module
- `components/layout/` - Sidebar and dashboard layout components
- `components/providers.tsx` - React Query and other providers
- `lib/utils.ts` - Utility functions including `cn()` for conditional classes

### Styling System

- Dark theme optimized for theater environments
- Module-specific color coding (purple/blue/cyan)
- Status indicators (blue=todo, green=complete, gray=cancelled)
- Priority colors (red=high, orange=medium, green=low)
- Responsive sidebar that collapses

### Path Aliases

Uses `@/*` for absolute imports from project root via tsconfig paths.

## Coding Standards

### TypeScript
- Strict mode enabled
- Use Zod for runtime validation
- Prefer type inference over explicit types where clear
- All notes use shared types from `types/index.ts`

### Component Patterns
- Server Components by default (Next.js 15 App Router)
- Client Components: Use 'use client' only when needed (interactivity, hooks, browser APIs)
- Co-locate related utilities with components
- Keep module-specific logic in module directories

### Naming Conventions
- Components: PascalCase (`NotesTable.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_PAGE_SIZE`)
- Module types: Literal unions ('cue' | 'work' | 'production')
- Test IDs: `[module]-[element]-[action]` format

### State Management
- Zustand for client-side state (stores in `lib/stores/`)
- TanStack Query for server state
- Avoid prop drilling - use context/stores for shared state
- Module-specific stores when state doesn't need sharing

### Styling
- Use Tailwind CSS utility classes
- Use `cn()` helper from `lib/utils.ts` for conditional classes
- Follow module color conventions strictly
- Dark theme is default - test all UI in dark mode

## Development Workflows

### Feature Development
1. **Investigate** - Check existing patterns in similar modules
2. **Plan** - Outline changes needed across components/stores
3. **Implement** - Follow module-specific conventions
4. **Test** - Write/update E2E tests for user-facing changes
5. **Verify** - Test in dev mode with mock data

### Bug Fixes
1. **Reproduce** - Verify issue in current code
2. **Locate** - Use file search/grep to find relevant code
3. **Fix** - Make minimal necessary changes
4. **Test** - Ensure fix works without regressions

### Adding Module Features
When adding features to a module:
- Check how it's implemented in other modules first
- Maintain consistency across all three modules
- Update shared types if the feature applies to all modules
- Test in all affected modules

### Testing Strategy
- E2E tests for user workflows (primary approach)
- Use TestHelpers for consistency
- Test all three modules if shared logic changes
- See [@TESTING.md](./TESTING.md) for detailed patterns

## Testing

The project uses Playwright for E2E testing. See [@TESTING.md](./TESTING.md) for:
- Test architecture and patterns
- TestHelpers usage examples
- Common testing scenarios
- Visual regression testing
- MCP browser automation (when explicitly requested)

**Quick start:**
```bash
npm run test:e2e                    # Run all tests
npx playwright test --ui            # Interactive mode
npx playwright test --headed        # Visual debugging
```

**IMPORTANT: Only use MCP browser tools when user explicitly requests testing/interaction. Never use proactively.**

## Common Pitfalls

### ❌ Don't
- Mix module-specific logic into shared components
- Hardcode module colors - use theme system and module-specific classes
- Skip `waitForAppReady()` in Playwright tests
- Use CSS class selectors in tests - always use data-testid
- Create new patterns when existing ones exist in other modules
- Over-abstract - keep solutions simple and focused
- Add features beyond what was requested

### ✅ Do
- Check existing module implementations before adding features
- Maintain color consistency (purple/blue/cyan for modules)
- Use mock Supabase client in development
- Follow data-testid naming: `[module]-[element]-[action]`
- Keep related code close together (locality of behavior)
- Solve today's problems, not hypothetical future ones
- Make minimal necessary changes for bug fixes

## Key Principles

### Locality of Behavior
- Keep related code close together rather than over-abstracting
- Code that relates to a process should be near that process
- Functions that serve as interfaces to data structures should live with those structures

### Solve Today's Problems
- Deal with local problems that exist today
- Avoid excessive abstraction for hypothetical future problems
- Three similar lines of code is better than a premature abstraction

### Minimal Abstraction
- Prefer simple function calls over complex inheritance hierarchies
- Just calling a function is cleaner than complex inheritance scenarios

### Readability > Cleverness
- Code should be obvious and easy to follow
- Same structure in every file reduces cognitive load
- Don't add comments where the logic is self-evident
