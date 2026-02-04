-- Migration: Notes Replica Identity Full
-- Description: Sets REPLICA IDENTITY FULL on notes table to enable Supabase Realtime
--              row-level filtering on production_id column.
--
-- Background: Supabase Realtime uses PostgreSQL logical replication. When subscribing
-- with a filter like `production_id=eq.${id}`, the filter column must be available
-- in the replication stream. By default, only primary key columns are included.
-- Setting REPLICA IDENTITY FULL includes all columns, enabling filtered broadcasts.
--
-- Impact: Slightly larger WAL size due to full row data in replication, but necessary
-- for real-time sync to work correctly across clients.
--
-- Issue: Without this, INSERT events from offline-synced notes weren't being broadcast
-- to other clients because the production_id filter couldn't be evaluated.

ALTER TABLE notes REPLICA IDENTITY FULL;

-- Also apply to fixtures table for consistency (uses production_id filter too)
ALTER TABLE fixtures REPLICA IDENTITY FULL;
