-- Migration: Allow production members to see their co-members
--
-- Problem: Regular (non-admin) members could only see their own membership
-- record due to overly restrictive RLS policies. This meant the Team Members
-- settings page appeared empty for non-admin users.
--
-- Fix: Replace the self-only SELECT policy on production_members with one that
-- allows any member to see all members in their shared productions. Also update
-- the users table SELECT policy so members can read profiles of co-members
-- (needed for the joined user data in member queries).

-- ============================================
-- FIX 1: production_members - let members see co-members
-- ============================================
-- Drop the old self-only policy
DROP POLICY IF EXISTS "Users can read their own memberships" ON public.production_members;

-- Replace with: members can see all members in productions they belong to
-- Uses has_production_access() which is SECURITY DEFINER, avoiding circular RLS
CREATE POLICY "Members can read co-members" ON public.production_members
  FOR SELECT TO authenticated
  USING (
    (SELECT public.has_production_access((SELECT auth.uid()), production_id))
  );

-- ============================================
-- FIX 2: users - let members read co-member profiles
-- ============================================
-- Drop the old policy that required admin to read other profiles
DROP POLICY IF EXISTS "Users can read profiles" ON public.users;

-- Replace with: members can read profiles of anyone in their shared productions
CREATE POLICY "Users can read profiles" ON public.users
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.is_super_admin((SELECT auth.uid())))
    OR EXISTS (
      SELECT 1 FROM public.production_members pm
      WHERE pm.user_id = public.users.id
      AND (SELECT public.has_production_access((SELECT auth.uid()), pm.production_id))
    )
  );
