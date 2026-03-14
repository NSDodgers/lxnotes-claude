-- Admin stats aggregation function
-- Returns JSONB with platform-wide metrics for the super admin dashboard

CREATE OR REPLACE FUNCTION admin_stats_aggregates()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Only super admin can call this
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    -- Notes by module
    'notes_by_module', (
      SELECT COALESCE(jsonb_object_agg(module_type, cnt), '{}'::jsonb)
      FROM (
        SELECT module_type, count(*) as cnt
        FROM notes
        WHERE deleted_at IS NULL
        GROUP BY module_type
      ) t
    ),

    -- Notes by status
    'notes_by_status', (
      SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
      FROM (
        SELECT status, count(*) as cnt
        FROM notes
        WHERE deleted_at IS NULL
        GROUP BY status
      ) t
    ),

    -- Notes by priority
    'notes_by_priority', (
      SELECT COALESCE(jsonb_object_agg(COALESCE(priority, 'none'), cnt), '{}'::jsonb)
      FROM (
        SELECT priority, count(*) as cnt
        FROM notes
        WHERE deleted_at IS NULL
        GROUP BY priority
      ) t
    ),

    -- Activity timeline (last 30 days)
    'activity_timeline', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d, 'count', cnt) ORDER BY d), '[]'::jsonb)
      FROM (
        SELECT date_trunc('day', created_at)::date as d, count(*) as cnt
        FROM notes
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY d
      ) t
    ),

    -- Busiest day (all-time)
    'busiest_day', (
      SELECT jsonb_build_object('date', d, 'count', cnt)
      FROM (
        SELECT date_trunc('day', created_at)::date as d, count(*) as cnt
        FROM notes
        GROUP BY d
        ORDER BY cnt DESC
        LIMIT 1
      ) t
    ),

    -- Production leaderboard
    'production_leaderboard', (
      SELECT COALESCE(jsonb_agg(row_data ORDER BY note_count DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'abbreviation', p.abbreviation,
          'notes', (SELECT count(*) FROM notes n WHERE n.production_id = p.id AND n.deleted_at IS NULL),
          'members', (SELECT count(*) FROM production_members pm WHERE pm.production_id = p.id),
          'fixtures', (SELECT count(*) FROM fixtures f WHERE f.production_id = p.id AND f.is_active = true)
        ) as row_data,
        (SELECT count(*) FROM notes n WHERE n.production_id = p.id AND n.deleted_at IS NULL) as note_count
        FROM productions p
        WHERE p.deleted_at IS NULL AND p.is_demo = false
      ) t
    ),

    -- User leaderboard (deduplicated by full_name, aggregate across accounts)
    'user_leaderboard', (
      SELECT COALESCE(jsonb_agg(row_data ORDER BY note_count DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'email', (array_agg(u.email ORDER BY u.created_at ASC))[1],
          'full_name', u.full_name,
          'notes', (SELECT count(*) FROM notes n WHERE n.created_by = u.full_name AND n.deleted_at IS NULL),
          'productions', (SELECT count(DISTINCT pm.production_id) FROM production_members pm WHERE pm.user_id = ANY(array_agg(u.id)))
        ) as row_data,
        (SELECT count(*) FROM notes n WHERE n.created_by = u.full_name AND n.deleted_at IS NULL) as note_count
        FROM users u
        GROUP BY u.full_name
      ) t
    ),

    -- Invitation stats
    'invitation_stats', (
      SELECT jsonb_build_object(
        'total', count(*),
        'pending', count(*) FILTER (WHERE status = 'pending'),
        'accepted', count(*) FILTER (WHERE status = 'accepted'),
        'expired', count(*) FILTER (WHERE status = 'expired'),
        'cancelled', count(*) FILTER (WHERE status = 'cancelled'),
        'avg_acceptance_hours', ROUND(EXTRACT(EPOCH FROM avg(accepted_at - created_at) FILTER (WHERE status = 'accepted')) / 3600, 1),
        'fastest_acceptance_minutes', ROUND(EXTRACT(EPOCH FROM min(accepted_at - created_at) FILTER (WHERE status = 'accepted')) / 60, 1)
      )
      FROM production_invitations
    ),

    -- Fun stats
    'completion_rate', (
      SELECT ROUND(
        count(*) FILTER (WHERE status = 'complete')::numeric /
        NULLIF(count(*), 0) * 100, 1
      )
      FROM notes WHERE deleted_at IS NULL
    ),
    'avg_notes_per_production', (
      SELECT ROUND(avg(cnt)::numeric, 1)
      FROM (
        SELECT count(*) as cnt
        FROM notes
        WHERE deleted_at IS NULL
        GROUP BY production_id
      ) t
    ),
    'avg_members_per_production', (
      SELECT ROUND(avg(cnt)::numeric, 1)
      FROM (
        SELECT count(*) as cnt
        FROM production_members
        GROUP BY production_id
      ) t
    ),
    'newest_user', (
      SELECT jsonb_build_object('email', email, 'created_at', created_at)
      FROM users
      ORDER BY created_at DESC
      LIMIT 1
    ),
    'oldest_production', (
      SELECT jsonb_build_object('name', name, 'created_at', created_at)
      FROM productions
      WHERE deleted_at IS NULL AND is_demo = false
      ORDER BY created_at ASC
      LIMIT 1
    ),
    'total_departments', (SELECT count(*) FROM departments),
    'total_note_transfers', (SELECT count(*) FROM note_transfers),
    'last_snapshot_at', (
      SELECT created_at FROM production_snapshots ORDER BY created_at DESC LIMIT 1
    ),
    'last_activity_at', (
      SELECT greatest(
        (SELECT max(created_at) FROM notes),
        (SELECT max(updated_at) FROM notes)
      )
    )
  ) INTO result;

  RETURN result;
END;
$$;
