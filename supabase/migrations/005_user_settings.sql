-- =============================================================================
-- User settings — account-scoped display preferences (#81)
--
-- showNick/showTeamLogo/groupByTours/showAvgGoals/standingsViewMode/
-- colorScheme/language were previously local-only (device storage), which
-- leaked across accounts on a shared device and didn't follow a user across
-- devices. One row per user, synced the same way players/teams/matches are.
-- =============================================================================

create table public.user_settings (
  user_id             uuid        primary key references auth.users(id) on delete cascade,
  show_nick           boolean     not null default true,
  show_team_logo      boolean     not null default true,
  group_by_tours      boolean     not null default true,
  show_avg_goals      boolean     not null default true,
  standings_view_mode text        not null default 'table' check (standings_view_mode in ('table', 'cards')),
  color_scheme        text        not null default 'dark',
  language            text        not null default 'en',
  updated_at          timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings: own row" on public.user_settings
  using (user_id = auth_uid());
create policy "user_settings: insert own" on public.user_settings
  for insert with check (user_id = auth_uid());
create policy "user_settings: update own" on public.user_settings
  for update using (user_id = auth_uid());

alter publication supabase_realtime add table public.user_settings;
