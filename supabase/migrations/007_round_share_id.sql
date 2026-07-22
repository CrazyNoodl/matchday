-- =============================================================================
-- Rounds — public share link support.
--
-- `rounds.id` is a predictable, enumerable client-generated string
-- (`round-${Date.now()}`) — unsafe to expose directly in a public URL. This
-- adds a separate unguessable `share_id`, and a SECURITY DEFINER RPC that
-- lets an anonymous visitor fetch a single archived round (and only an
-- archived one — an open/in-progress round is never shareable) by that id,
-- without opening up RLS SELECT policies on the underlying per-user tables.
-- =============================================================================

alter table public.rounds
  add column share_id uuid not null default gen_random_uuid() unique;

create or replace function public.get_shared_round(p_share_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when r.id is null then null else jsonb_build_object(
    'round', jsonb_build_object(
      'id', r.id,
      'date', r.date,
      'winner', r.winner,
      'name', r.name,
      'n', r.n,
      'games', r.games,
      'ranked', r.ranked
    ),
    'matches', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', m.id,
        'aId', m.a_id,
        'bId', m.b_id,
        'aTeam', m.a_team,
        'bTeam', m.b_team,
        'aScore', m.a_score,
        'bScore', m.b_score,
        'media', m.media,
        'note', m.note,
        'statsOverride', m.stats_override
      )), '[]'::jsonb)
      from public.matches m
      where m.round_id = r.id
    ),
    'players', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'nick', p.nick,
        'photo', p.photo,
        'teamCode', p.team_code
      )), '[]'::jsonb)
      from public.players p
      where p.user_id = r.user_id and p.id = any(r.player_ids)
    ),
    'teams', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'code', t.code,
        'name', t.name,
        'short', t.short,
        'color', t.color,
        'logo', t.logo
      )), '[]'::jsonb)
      from public.teams t
      where t.user_id = r.user_id
        and t.code in (
          select m.a_team from public.matches m where m.round_id = r.id
          union
          select m.b_team from public.matches m where m.round_id = r.id
        )
    )
  ) end
  from public.rounds r
  where r.share_id = p_share_id and r.status = 'archived';
$$;

grant execute on function public.get_shared_round(uuid) to anon, authenticated;
