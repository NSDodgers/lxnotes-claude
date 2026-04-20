/**
 * Regression test: the share-code lookup must use the admin client + RPC.
 *
 * Context: /p/[code] resolves a production for users who are not yet members.
 * The productions SELECT policies only admit members or demo rows, so reading
 * the table through the user-scoped client returned null and rendered
 * "Invalid Link / has expired" to the exact audience the share link targets.
 * The fix routes the lookup through a SECURITY DEFINER RPC called via the
 * service-role admin client. If someone ever reverts to the anon client,
 * this test fails.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const mockRpc = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ rpc: mockRpc }),
}))

// Guard: if any test path imports the user-scoped server client, it should
// throw. Service code must not fall back to RLS-bound reads for this flow.
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => {
    throw new Error('production-links must not use the user-scoped client')
  },
}))

import { getProductionByShortCode } from '@/lib/services/production-links'

describe('getProductionByShortCode', () => {
  beforeEach(() => {
    mockRpc.mockReset()
  })

  it('calls the SECURITY DEFINER RPC via the admin client with the uppercased code', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ id: 'prod-1', name: 'The Emporium', short_code: 'X9K3QL' }],
      error: null,
    })

    const result = await getProductionByShortCode('x9k3ql')

    expect(mockRpc).toHaveBeenCalledWith('get_production_by_short_code', {
      p_code: 'x9k3ql',
    })
    expect(result).toEqual({
      id: 'prod-1',
      name: 'The Emporium',
      shortCode: 'X9K3QL',
    })
  })

  it('returns null when the RPC returns no rows', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null })
    expect(await getProductionByShortCode('NOPE01')).toBeNull()
  })

  it('returns null on RPC error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error('boom') })
    expect(await getProductionByShortCode('ANYCOD')).toBeNull()
  })
})

describe('share-code migration', () => {
  it('defines both get_production_by_short_code and join_production_by_short_code', () => {
    const sql = readFileSync(
      join(__dirname, '../../../supabase/migrations/20260420000000_share_code_lookup_rpc.sql'),
      'utf8'
    )
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.get_production_by_short_code/)
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.join_production_by_short_code/)
    expect(sql).toMatch(/SECURITY DEFINER/)
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.get_production_by_short_code/)
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.join_production_by_short_code/)
  })
})
