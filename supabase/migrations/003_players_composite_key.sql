-- =============================================================================
-- Players — scope the primary key to (id, user_id), matching teams.
--
-- Previously players.id alone was the primary key, but src/supabase/sync.ts
-- always upserted with onConflict: 'id,user_id' — a target that never matched
-- any real constraint, so Postgres rejected every players upsert. That silent
-- failure meant a stale local players cache left over from a previous account
-- on the same device could linger indefinitely.
-- =============================================================================

alter table public.players drop constraint players_pkey;
alter table public.players add primary key (id, user_id);
