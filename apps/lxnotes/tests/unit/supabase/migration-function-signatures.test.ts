/**
 * Regression test: migrations must not leave conflicting function overloads.
 *
 * Context: bug fixed in #70 was caused by migration 20260401000000 using
 * `CREATE OR REPLACE FUNCTION export_production_snapshot(...)` with a
 * signature that differed from the original defined in 20260211000000.
 * Because `CREATE OR REPLACE` only replaces functions with matching
 * signatures, PG added a second overload instead of replacing the first.
 * Calls with 1 arg then matched both candidates (the 4-arg version via
 * defaults), producing 42725 ambiguous_function at runtime.
 *
 * This test replays migrations in timestamp order, tracking the set of
 * live signatures for each function name. It handles both CREATE OR
 * REPLACE FUNCTION (adds or replaces) and DROP FUNCTION (removes). At
 * the end, any function with more than one live signature is flagged.
 *
 * This catches the exact class of bug that #70 fixed: a migration that
 * "replaces" a function with a new signature but accidentally creates
 * an overload instead.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const MIGRATIONS_DIR = join(__dirname, '../../../supabase/migrations')

/**
 * Normalize a signature for comparison. Strips:
 * - DEFAULT clauses (they don't change the signature identity)
 * - Inline comments
 * - Extra whitespace
 * - Case (Postgres type names are case-insensitive)
 * - Parameter names (only types matter for PG function identity)
 *
 * What remains is the sequence of parameter types, which is what PG
 * uses for function identity.
 */
function normalizeSignature(rawArgs: string): string {
  // Strip comments and normalize whitespace
  const cleaned = rawArgs
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned === '') return ''

  // Split on commas at the top level (not inside parens for type parameters).
  // Each part is one parameter. Extract the TYPE only (strip param name + DEFAULT).
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of cleaned) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim() !== '') parts.push(current)

  const types = parts.map(p => {
    // Strip DEFAULT clause
    let s = p.replace(/DEFAULT\s+[^,)]+/gi, '').trim()
    // First whitespace-separated token is param name (unless starts with IN/OUT/INOUT).
    // Strip param name to isolate type.
    const tokens = s.split(/\s+/)
    if (tokens.length >= 2) {
      const first = tokens[0].toUpperCase()
      if (first === 'IN' || first === 'OUT' || first === 'INOUT' || first === 'VARIADIC') {
        // Mode token — skip it, next token is name, rest is type
        tokens.shift()
      }
      // Drop the param name (first remaining token) — what's left is the type
      tokens.shift()
      s = tokens.join(' ')
    }
    return s.trim().toLowerCase()
  })

  return types.join(', ')
}

interface FunctionDef {
  signature: string
  file: string
}

/**
 * Extract all CREATE OR REPLACE FUNCTION <name>(<args>) declarations from SQL.
 * Returns [name, rawArgs][]. Handles multi-line signatures.
 */
function extractCreates(sql: string): Array<{ name: string; rawArgs: string }> {
  const results: Array<{ name: string; rawArgs: string }> = []
  const re = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?(\w+)\s*\(/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(sql)) !== null) {
    const name = match[1]
    const parenStart = re.lastIndex - 1
    let depth = 1
    let i = parenStart + 1
    while (i < sql.length && depth > 0) {
      if (sql[i] === '(') depth++
      else if (sql[i] === ')') depth--
      i++
    }
    if (depth !== 0) continue
    const rawArgs = sql.slice(parenStart + 1, i - 1)
    results.push({ name, rawArgs })
  }
  return results
}

/**
 * Extract DROP FUNCTION statements. Supports both:
 * - DROP FUNCTION name(args)
 * - DROP FUNCTION IF EXISTS name(args)
 * - Dynamic DROP inside DO blocks (we parse the format() string)
 */
function extractDrops(sql: string): Array<{ name: string; rawArgs: string }> {
  const results: Array<{ name: string; rawArgs: string }> = []

  // Literal DROP FUNCTION name(args)
  const literalRe = /DROP\s+FUNCTION\s+(?:IF\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(/gi
  let match: RegExpExecArray | null
  while ((match = literalRe.exec(sql)) !== null) {
    const name = match[1]
    const parenStart = literalRe.lastIndex - 1
    let depth = 1
    let i = parenStart + 1
    while (i < sql.length && depth > 0) {
      if (sql[i] === '(') depth++
      else if (sql[i] === ')') depth--
      i++
    }
    if (depth !== 0) continue
    const rawArgs = sql.slice(parenStart + 1, i - 1)
    results.push({ name, rawArgs })
  }

  // Dynamic DROP inside DO blocks: format('DROP FUNCTION public.X(%s) ...', rec.args)
  // We treat this as "drops ALL existing overloads of X" since we can't resolve
  // the variable. That's the intent of the pattern used in this repo.
  const dynamicRe = /format\s*\(\s*['"]DROP\s+FUNCTION\s+(?:public\.)?(\w+)\s*\(%s\)/gi
  while ((match = dynamicRe.exec(sql)) !== null) {
    results.push({ name: match[1], rawArgs: '__ALL__' })
  }

  return results
}

describe('migration function signatures', () => {
  it('replaying migrations produces at most one live signature per function', () => {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort() // timestamp-prefixed, so alphabetical = chronological

    expect(files.length).toBeGreaterThan(0)

    // name -> set of live FunctionDefs (one per unique signature)
    const live = new Map<string, Map<string, FunctionDef>>()

    for (const file of files) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')

      for (const { name, rawArgs } of extractCreates(sql)) {
        const sig = normalizeSignature(rawArgs)
        if (!live.has(name)) live.set(name, new Map())
        live.get(name)!.set(sig, { signature: sig, file })
      }

      for (const { name, rawArgs } of extractDrops(sql)) {
        const defs = live.get(name)
        if (!defs) continue
        if (rawArgs === '__ALL__') {
          defs.clear()
        } else {
          const sig = normalizeSignature(rawArgs)
          defs.delete(sig)
        }
      }
    }

    const violations: string[] = []
    for (const [name, defs] of live.entries()) {
      if (defs.size > 1) {
        const detail = Array.from(defs.values())
          .map(d => `    ${d.file}: (${d.signature})`)
          .join('\n')
        violations.push(`  ${name}() has ${defs.size} live signatures:\n${detail}`)
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Found ${violations.length} function(s) with multiple live signatures. ` +
        `CREATE OR REPLACE only replaces an existing function when the signature matches; ` +
        `a differing signature adds an overload instead of replacing, which can produce ` +
        `PG 42725 ambiguous_function at runtime (see #70).\n\n` +
        `To fix: DROP FUNCTION <name>(<old_args>) in a migration before (or in the same ` +
        `migration as) the CREATE OR REPLACE with the new signature.\n\n` +
        violations.join('\n')
      )
    }
  })
})
