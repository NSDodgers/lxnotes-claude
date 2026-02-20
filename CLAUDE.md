# CLAUDE.md

## Session Management

See [@CLAUDE.sessions.md](./CLAUDE.sessions.md) for task protocols and agent usage.

## Development Commands

```bash
npm run dev          # Dev server on localhost:3001
npm run build        # Production build
npm run lint         # Lint
npm run test:e2e     # Playwright E2E tests
```

## Dev Mode

- `NEXT_PUBLIC_DEV_MODE=true` disables auth, uses mock Supabase client
- Mock data is not persisted

## Non-Obvious Conventions

- Module color themes: Cue Notes = purple, Work Notes = blue, Production Notes = cyan
- Status colors: blue=todo, green=complete, gray=cancelled
- Priority colors: red=high, orange=medium, green=low
- Dark theme is the default — always verify UI in dark mode
- data-testid naming: `[module]-[element]-[action]`
- `@/*` path alias for imports from project root

## Common Pitfalls

### Don't
- Mix module-specific logic into shared components
- Hardcode module colors — use module-specific classes
- Skip `waitForAppReady()` in Playwright tests
- Use CSS class selectors in tests — always use data-testid
- Create new patterns when existing ones exist in other modules
- Over-abstract or add features beyond what was requested

### Do
- Check existing module implementations before adding features
- When adding a feature to one module, check how other modules handle it
- Keep related code close together (locality over abstraction)
- Make minimal necessary changes for bug fixes
- Solve today's problems, not hypothetical future ones

## Testing

See [@TESTING.md](./TESTING.md) for test commands and patterns.

Only use MCP browser tools when explicitly requested. Never use proactively.
