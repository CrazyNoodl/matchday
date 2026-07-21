-- =============================================================================
-- Matches — add a `position` column so display order survives a sync
-- round-trip.
--
-- Order was previously derived purely from `ORDER BY id ASC` at pull time —
-- there was no column reflecting the app's actual (drag-reorderable) match
-- order. Any local reorder got silently overwritten back to id-sort order
-- the next time pullState() ran. `position` is scoped per (user_id,
-- round_id) — round_id is null for the currently open round's matches, and
-- Postgres groups NULLs together within a window PARTITION BY, so that
-- backfill still buckets "current round" matches as one group per user.
--
-- Backfill assigns each existing match its current id-sort rank within its
-- round so nothing visibly reorders the moment this migration runs — real
-- positions get written on the next push from the app.
-- =============================================================================

alter table public.matches add column position integer not null default 0;

update public.matches m
set position = ranked.rn - 1
from (
  select id, row_number() over (partition by user_id, round_id order by id asc) as rn
  from public.matches
) ranked
where m.id = ranked.id;
