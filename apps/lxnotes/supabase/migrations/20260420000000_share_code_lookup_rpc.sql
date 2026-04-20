-- Share-code join flow (RPC pair)
--
-- The /p/[code] share flow needs to resolve a production by short_code for
-- users who are not yet members — that is the entire point of the flow.
-- The productions SELECT policy only admits existing members or demo rows,
-- and the production_members INSERT policy is admin-only. A direct anon
-- client call therefore returns null on the preview page and fails on
-- join. Both RPCs are SECURITY DEFINER so the short-code path works for
-- non-members, while still scoping access to callers who know the code.

-- ---------------------------------------------------------------------------
-- 1. Preview: resolve a production by short_code (narrow public fields)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_production_by_short_code(p_code TEXT)
RETURNS TABLE (id UUID, name TEXT, short_code TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.id, p.name, p.short_code
  FROM public.productions p
  WHERE p.short_code = UPPER(p_code)
    AND p.deleted_at IS NULL
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_production_by_short_code IS
  'Resolves a production by short_code for the /p/[code] join flow. Returns only public fields. Bypasses RLS because non-members must be able to view the target production before joining.';

GRANT EXECUTE ON FUNCTION public.get_production_by_short_code(TEXT) TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- 2. Join: add the caller as a member of the production addressed by the code
-- ---------------------------------------------------------------------------
-- Scoping via short_code (not raw production_id) prevents a malicious client
-- from auto-joining any production whose UUID it happens to know.

CREATE OR REPLACE FUNCTION public.join_production_by_short_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_production RECORD;
  v_existing RECORD;
BEGIN
  SELECT id, name INTO v_production
  FROM public.productions
  WHERE short_code = UPPER(p_code)
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  SELECT id, role INTO v_existing
  FROM public.production_members
  WHERE production_id = v_production.id AND user_id = p_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'production_id', v_production.id,
      'production_name', v_production.name,
      'role', v_existing.role,
      'already_member', true
    );
  END IF;

  INSERT INTO public.production_members (production_id, user_id, role)
  VALUES (v_production.id, p_user_id, 'member');

  RETURN jsonb_build_object(
    'success', true,
    'production_id', v_production.id,
    'production_name', v_production.name,
    'role', 'member',
    'already_member', false
  );
END;
$$;

COMMENT ON FUNCTION public.join_production_by_short_code IS
  'Atomically joins the caller to the production addressed by the given short_code. Scopes access by code so a leaked production UUID cannot be used to auto-join.';

GRANT EXECUTE ON FUNCTION public.join_production_by_short_code(TEXT, UUID) TO authenticated;
