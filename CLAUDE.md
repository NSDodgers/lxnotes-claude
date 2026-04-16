# CLAUDE.md

## Session Management

See [@CLAUDE.sessions.md](./CLAUDE.sessions.md) for task protocols and agent usage.

## Development Commands

```bash
npm run dev          # Dev server on localhost:3005
npm run build        # Production build
npm run lint         # Lint
npm run test:unit    # Vitest unit tests
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

## gstack

Use the /browse skill from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.

Available skills: /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /review, /ship, /browse, /qa, /qa-only, /design-review, /setup-browser-cookies, /retro, /document-release.

## Testing

See [@TESTING.md](./TESTING.md) for test commands and patterns.

Only use MCP browser tools when explicitly requested. Never use proactively.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
