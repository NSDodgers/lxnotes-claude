-- Token-Based Invitation Acceptance
-- Migration: 20260205000000_invitation_token_acceptance
-- Description: Adds support for accepting invitations via token URL without email matching

-- ============================================
-- ADD ACCEPTED_BY COLUMN FOR AUDIT TRAIL
-- ============================================

ALTER TABLE production_invitations
ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES public.users(id);

COMMENT ON COLUMN production_invitations.accepted_by IS 'The user who accepted the invitation (may differ from email for alias cases)';

-- ============================================
-- FUNCTION: GET INVITATION BY TOKEN
-- ============================================
-- Returns invitation details for display on the acceptance page

CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_production RECORD;
  v_inviter RECORD;
BEGIN
  -- Get invitation by token
  SELECT * INTO v_invitation
  FROM production_invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'error', 'invalid_token');
  END IF;

  -- Get production (check if deleted)
  SELECT id, name, deleted_at INTO v_production
  FROM productions
  WHERE id = v_invitation.production_id;

  IF NOT FOUND OR v_production.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'production_deleted');
  END IF;

  -- Get inviter details
  SELECT id, email, full_name INTO v_inviter
  FROM users
  WHERE id = v_invitation.invited_by;

  -- Return full invitation details
  RETURN jsonb_build_object(
    'found', true,
    'id', v_invitation.id,
    'status', v_invitation.status,
    'role', v_invitation.role,
    'email', v_invitation.email,
    'expires_at', v_invitation.expires_at,
    'is_expired', (v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW()),
    'production', jsonb_build_object(
      'id', v_production.id,
      'name', v_production.name
    ),
    'inviter', jsonb_build_object(
      'id', v_inviter.id,
      'email', v_inviter.email,
      'full_name', v_inviter.full_name
    )
  );
END;
$$;

COMMENT ON FUNCTION get_invitation_by_token IS 'Gets invitation details by token for display on acceptance page';

-- ============================================
-- FUNCTION: ACCEPT INVITATION BY TOKEN
-- ============================================
-- Accepts invitation without email matching - used for token-based acceptance flow

CREATE OR REPLACE FUNCTION accept_invitation_by_token(
  p_token UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_existing_member RECORD;
  v_production RECORD;
BEGIN
  -- 1. Get and lock invitation by token
  SELECT * INTO v_invitation
  FROM production_invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_token');
  END IF;

  -- 2. Check if production still exists
  SELECT id, deleted_at INTO v_production
  FROM productions
  WHERE id = v_invitation.production_id;

  IF NOT FOUND OR v_production.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_token');
  END IF;

  -- 3. Check status
  IF v_invitation.status = 'accepted' THEN
    -- Check if THIS user is a member
    SELECT * INTO v_existing_member
    FROM production_members
    WHERE production_id = v_invitation.production_id AND user_id = p_user_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_accepted',
      'production_id', v_invitation.production_id,
      'is_member', FOUND
    );
  END IF;

  IF v_invitation.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'cancelled');
  END IF;

  -- 4. Check expiration
  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
    UPDATE production_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;

  -- 5. Check if user already a member (joined via different path)
  SELECT * INTO v_existing_member
  FROM production_members
  WHERE production_id = v_invitation.production_id AND user_id = p_user_id;

  IF FOUND THEN
    -- Mark invitation accepted, user already has access
    UPDATE production_invitations
    SET status = 'accepted', accepted_at = NOW(), accepted_by = p_user_id
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
      'success', true,
      'production_id', v_invitation.production_id,
      'role', v_existing_member.role,
      'already_member', true
    );
  END IF;

  -- 6. Add as member
  INSERT INTO production_members (production_id, user_id, role)
  VALUES (v_invitation.production_id, p_user_id, v_invitation.role);

  -- 7. Mark invitation accepted
  UPDATE production_invitations
  SET status = 'accepted', accepted_at = NOW(), accepted_by = p_user_id
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'production_id', v_invitation.production_id,
    'role', v_invitation.role,
    'already_member', false
  );
END;
$$;

COMMENT ON FUNCTION accept_invitation_by_token IS 'Atomically accepts an invitation by token without email matching - for token-based acceptance flow';
