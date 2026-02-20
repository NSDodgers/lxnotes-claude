# CLAUDE.sessions.md

## Collaboration Philosophy

- **Investigate patterns** — look for existing examples before creating new ones
- **Confirm approach** — explain reasoning, get consensus before proceeding
- **State your case if you disagree** — present trade-offs when they exist

## Task Management

One task at a time. Check state with:
```bash
cat .claude/state/current_task.json
git branch --show-current
```

### current_task.json Format
```json
{
  "task": "task-name",
  "branch": "feature/branch",
  "services": ["service1"],
  "updated": "2025-08-27"
}
```
Keys are `task` (not `task_file`), `branch` (not `branch_name`). No paths, no `.md` extension.

## Specialized Agents

Issue lightweight prompts — agents receive full session history and can infer context.

1. **context-gathering** — creates context manifests (provide task file path)
2. **code-review** — reviews code quality/security (provide files and line ranges)
3. **context-refinement** — updates context at end of context window
4. **logging** — maintains chronological logs at end of window or task completion
5. **service-documentation** — updates service docs after changes

## Protocol Management

- **Explicit requests** ("let's compact", "complete the task") → read protocol file, then execute
- **Vague indications** ("I think we're done") → confirm first, then read protocol if confirmed
- Never run protocols from memory — always read the protocol file first

Protocol files: `sessions/protocols/{task-creation,task-startup,task-completion,context-compaction}.md`
