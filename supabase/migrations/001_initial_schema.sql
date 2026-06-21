-- =============================================================================
-- Matchday — initial schema
-- =============================================================================

-- Players
create table public.players (
  id          text        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  nick        text,
  color       text        not null,
  team_code   text        not null,
  photo       text,
  updated_at  timestamptz not null default now()
);

-- Teams
create table public.teams (
  code        text        not null,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  short       text        not null,
  color       text        not null,
  custom      boolean     not null default false,
  logo        text,
  updated_at  timestamptz not null default now(),
  primary key (code, user_id)
);

-- Tournaments (active)
create table public.tournaments (
  id              text        primary key,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  name            text        not null,
  ranked          boolean     not null default true,
  rounds_target   int         not null default 0,
  player_ids      text[]      not null default '{}',
  round           int         not null default 1,
  round_open      boolean     not null default false,
  round_players   text[]      not null default '{}',
  status          text        not null default 'active' check (status in ('active', 'closed')),
  updated_at      timestamptz not null default now()
);

-- Rounds
create table public.rounds (
  id              text        primary key,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  tournament_id   text        references public.tournaments(id) on delete cascade,
  n               int         not null,
  date            timestamptz not null default now(),
  winner          text        not null default '',
  games           int         not null default 0,
  ranked          boolean     not null default true,
  name            text        not null default '',
  player_ids      text[]      not null default '{}',
  status          text        not null default 'archived' check (status in ('open', 'archived')),
  updated_at      timestamptz not null default now()
);

-- Matches
create table public.matches (
  id              text        primary key,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  tournament_id   text        references public.tournaments(id) on delete cascade,
  round_id        text        references public.rounds(id) on delete cascade,
  a_id            text        not null,
  b_id            text        not null,
  a_team          text        not null,
  b_team          text        not null,
  a_score         int         not null default 0,
  b_score         int         not null default 0,
  media           jsonb,
  note            text,
  stats_override  jsonb,
  updated_at      timestamptz not null default now()
);

-- Closed tournaments
create table public.closed_tournaments (
  id          text        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  date        timestamptz not null default now(),
  champ_id    text        not null,
  champ_name  text        not null,
  champ_color text        not null,
  champ_init  text        not null,
  player_ids  text[]      not null default '{}',
  updated_at  timestamptz not null default now()
);

-- =============================================================================
-- Row Level Security — кожен бачить тільки свої дані
-- =============================================================================

alter table public.players          enable row level security;
alter table public.teams            enable row level security;
alter table public.tournaments      enable row level security;
alter table public.rounds           enable row level security;
alter table public.matches          enable row level security;
alter table public.closed_tournaments enable row level security;

-- Helper: current user id
create or replace function auth_uid() returns uuid as $$
  select auth.uid();
$$ language sql stable;

-- Players RLS
create policy "players: own rows" on public.players
  using (user_id = auth_uid());
create policy "players: insert own" on public.players
  for insert with check (user_id = auth_uid());

-- Teams RLS
create policy "teams: own rows" on public.teams
  using (user_id = auth_uid());
create policy "teams: insert own" on public.teams
  for insert with check (user_id = auth_uid());

-- Tournaments RLS
create policy "tournaments: own rows" on public.tournaments
  using (user_id = auth_uid());
create policy "tournaments: insert own" on public.tournaments
  for insert with check (user_id = auth_uid());

-- Rounds RLS
create policy "rounds: own rows" on public.rounds
  using (user_id = auth_uid());
create policy "rounds: insert own" on public.rounds
  for insert with check (user_id = auth_uid());

-- Matches RLS
create policy "matches: own rows" on public.matches
  using (user_id = auth_uid());
create policy "matches: insert own" on public.matches
  for insert with check (user_id = auth_uid());

-- Closed tournaments RLS
create policy "closed_tournaments: own rows" on public.closed_tournaments
  using (user_id = auth_uid());
create policy "closed_tournaments: insert own" on public.closed_tournaments
  for insert with check (user_id = auth_uid());

-- =============================================================================
-- Real-time — дозволяємо підписку на зміни
-- =============================================================================

alter publication supabase_realtime
  add table public.players,
            public.teams,
            public.matches,
            public.rounds,
            public.tournaments,
            public.closed_tournaments;
