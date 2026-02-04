-- Atomic Invitation Acceptance
-- Migration: 20260204000000_atomic_invitation_acceptance
-- Description: Creates a function to atomically accept invitations (add member + update invitation in single transaction)

-- ============================================
-- ATOMIC ACCEPT INVITATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION accept_invitation(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_user_email TEXT;
  v_result JSONB;
BEGIN
  -- Get the invitation (lock row to prevent concurrent acceptance)
  SELECT * INTO v_invitation
  FROM production_invitations
  WHERE id = p_invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  IF v_invitation.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation already processed');
  END IF;

  -- Get the accepting user's email
  SELECT email INTO v_user_email
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- SECURITY: Verify email matches
  IF LOWER(v_user_email) != LOWER(v_invitation.email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation is not for your email address');
  END IF;

  -- Check if expired
  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
    -- Mark as expired
    UPDATE production_invitations
    SET status = 'expired'
    WHERE id = p_invitation_id;

    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;

  -- Add user as production member (ignore if already exists)
  INSERT INTO production_members (production_id, user_id, role)
  VALUES (v_invitation.production_id, p_user_id, v_invitation.role)
  ON CONFLICT (production_id, user_id) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE production_invitations
  SET
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = p_invitation_id;

  RETURN jsonb_build_object(
    'success', true,
    'production_id', v_invitation.production_id,
    'role', v_invitation.role
  );
END;
$$;

COMMENT ON FUNCTION accept_invitation IS 'Atomically accepts an invitation: adds user to production_members and marks invitation as accepted in a single transaction';

-- ============================================
-- BATCH ACCEPT INVITATIONS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION accept_pending_invitations_for_user(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_invitation RECORD;
  v_accepted_count INT := 0;
  v_results JSONB := '[]'::JSONB;
BEGIN
  -- Get the user's email
  SELECT email INTO v_user_email
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found', 'accepted_count', 0);
  END IF;

  -- Process all pending invitations for this email
  FOR v_invitation IN
    SELECT *
    FROM production_invitations
    WHERE LOWER(email) = LOWER(v_user_email)
      AND status = 'pending'
    FOR UPDATE
  LOOP
    -- Skip expired invitations (mark them as expired)
    IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
      UPDATE production_invitations
      SET status = 'expired'
      WHERE id = v_invitation.id;
      CONTINUE;
    END IF;

    -- Add user as production member (ignore if already exists)
    INSERT INTO production_members (production_id, user_id, role)
    VALUES (v_invitation.production_id, p_user_id, v_invitation.role)
    ON CONFLICT (production_id, user_id) DO NOTHING;

    -- Mark invitation as accepted
    UPDATE production_invitations
    SET
      status = 'accepted',
      accepted_at = NOW()
    WHERE id = v_invitation.id;

    v_accepted_count := v_accepted_count + 1;
    v_results := v_results || jsonb_build_object(
      'invitation_id', v_invitation.id,
      'production_id', v_invitation.production_id
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'accepted_count', v_accepted_count,
    'accepted', v_results
  );
END;
$$;

COMMENT ON FUNCTION accept_pending_invitations_for_user IS 'Atomically accepts all pending invitations for a user email in a single transaction';
