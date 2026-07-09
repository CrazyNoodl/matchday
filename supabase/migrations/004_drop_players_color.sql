-- =============================================================================
-- Players — drop the `color` column.
--
-- The per-player color picker was UI-only: nothing in the app ever read
-- `player.color` (Avatar/MatchCard/StandingCard all color by the player's
-- team instead), so the field was write-only. Removed from the app; dropping
-- the column here since it was `not null` with no default.
-- =============================================================================

alter table public.players drop column color;
