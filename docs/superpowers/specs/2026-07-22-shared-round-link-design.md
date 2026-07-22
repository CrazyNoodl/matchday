# Share a closed matchday via public link — design

Date: 2026-07-22

## Purpose

Addresses GitHub issue [#19](https://github.com/CrazyNoodl/matchday/issues/19) ("Idea:
share a tournament via link for read-only viewing"), narrowed in scope during
brainstorming: the tournament itself runs for a whole year, so "share the tournament"
doesn't make sense until it closes. Instead, this ships the ability to share a single
**closed matchday (an `ArchivedRound`) inside a still-open tournament** — a link anyone
can open in a browser to see that matchday's results, standings, stats, media, and
commentary, read-only, no login required.

Sharing a whole closed tournament (`ClosedTournament`) is explicitly out of scope for
this iteration — see "Known limitation" below.

## Scope decisions (from brainstorming)

- **What's shareable**: only `ArchivedRound`s that are still inside `tournamentSlice`'s
  `archivedRounds` (i.e. `rounds.status = 'archived'` in Supabase) — the tournament they
  belong to has not been closed. The currently-open round (`matches`, `status = 'open'`)
  is never shareable — this sidesteps issue [#18](https://github.com/CrazyNoodl/matchday/issues/18)
  (in-progress rounds staying local-only/unsynced) entirely, since a shared matchday is
  always one that's already fully synced to Supabase.
- **Delivery mechanism**: a public web page (not a native deep link) — no app install
  required to view.
- **Data shown**: full parity with what the app itself shows for that matchday — score,
  standings, all 23 match stats, media (photos/videos), commentary, player
  names/avatars, team badges. Same content as `app/archive-day.tsx`, just **read-only**:
  no edit/delete/add affordances anywhere on the page.
- **Link lifecycle**: link is generated automatically for every archived round — no
  manual "make public" toggle, no per-link revoke/regenerate. Simplicity was chosen
  explicitly over revocability; see "Known limitation" below.
- **Trigger UI**: a "Copy Link" row added to the existing `ShareRoundModal` (which today
  only shares a rendered image), not a new modal.
- **Unguessability without a token table**: `ArchivedRound.id` is generated as
  `round-${Date.now()}` (`tournamentSlice.ts`) — a predictable, enumerable string, unsafe
  to expose directly in a public URL. Rather than adding a separate `round_shares` table
  with token lifecycle management (rejected — no revoke feature needed, so the extra
  table/lifecycle would be unused complexity), `rounds` gets one new column,
  `share_id uuid default gen_random_uuid() unique`, and the public URL is keyed on that
  column instead of `id`. Same "unguessable identifier" property as a token, no separate
  table.

## Data layer (Supabase)

### Migration: `supabase/migrations/007_round_share_id.sql`

```sql
alter table public.rounds
  add column share_id uuid not null default gen_random_uuid() unique;
```

`default gen_random_uuid()` backfills existing rows automatically on `alter table`. Must
be applied manually against the live Supabase project, same as every prior migration in
this repo (see `docs/CONTEXT.md`'s note on migration 003).

### RPC function: `get_shared_round(p_share_id uuid)`

`security definer`, `grant execute to anon` (and `authenticated`, so the app's own
logged-in client can also use it if ever needed). Behavior:

1. Look up `rounds` where `share_id = p_share_id` **and** `status = 'archived'`. No row
   (bad id, or a round that's still open) → return `null`.
2. Join `matches` on `round_id`.
3. Join `players`/`teams` referenced by those matches' `a_id`/`b_id`/`team_code` —
   selecting only display-safe columns: `players.(id, name, nick, photo, team_code)`,
   `teams.(code, name, short, color, logo)`. Never `user_id`, never any auth-related
   column (confirmed neither table has one beyond `user_id` itself, which is excluded).
4. Return a single JSON object: `{ round, matches, players, teams }`.

No changes needed to Storage: the `match-media` bucket already has a public-read policy
(`storage.ts`'s existing "match-media: public read"), so `matches[].media[].uri` values
resolve for anonymous viewers with no extra work.

Because the RPC reads live tables (not a precomputed snapshot), edits made to an
already-archived-but-still-editable matchday (score/stats/media/note — all remain
editable per `CLAUDE.md`'s Match Editing Rules while the parent tournament is open)
show up on the shared page immediately, with no cache-invalidation step to maintain.

## Frontend routing

### New route: `app/shared/[shareId].tsx`

Must bypass the app's normal auth gate. Today, `app/_layout.tsx`'s `AppContent`
(`app/_layout.tsx:190-209`) blocks the **entire** app behind `session`: `session ===
null` renders `OfflineScreen` (offline) or `LoginScreen` (online), before any route ever
mounts. This is a hard requirement to view a public shared page without an account.

Fix: check `usePathname()` in `AppContent` before the session gate. If the path starts
with `/shared/`, render `SharedRoundScreen` unconditionally, skipping the
`fontsLoaded`/`session`/`passwordRecovery` checks that gate the rest of the app (fonts
still need to load for consistent typography, so that check alone stays; session/offline
checks do not apply to this route since it needs neither login nor local store data).

### `src/screens/shared/SharedRoundScreen.tsx` (+ `useSharedRound.ts`, `shared.styles.ts`)

Follows the existing thin-route / `src/screens/<name>/` pattern (see
`src/screens/match/`, `src/screens/rivalry/`):

- `useSharedRound.ts`: on mount, calls the anon Supabase RPC `get_shared_round(shareId)`
  (the existing `supabase` client from `src/supabase/client.ts` already supports
  unauthenticated calls — no second client needed). Tracks `loading` / `data` /
  `notFound` state.
- `SharedRoundScreen.tsx`: renders using the **same presentational components**
  `archive-day.tsx` already uses for a read-only archived round — `StandingsTable`
  (or `StandingCard` list, per the user's `standingsViewMode` — defaults to `'table'`
  since there's no store to read a display preference from), `MatchCard` per matchup,
  `StatsRow`/stat breakdown, `MediaThumbnail`/media viewer, commentary text. None of
  these components are passed edit/delete callbacks — same as how `archive-day.tsx`
  already renders these components in read-only mode for rounds sourced from
  `closedTournaments`, so no new "read-only variant" needs to be built.
  - `loading`: a centered spinner.
  - `notFound`: `EmptyState` — "This matchday could not be found or is no longer
    available."
- `shared.styles.ts`: styles, per project convention (no inline `StyleSheet.create`).
- Inherits system theme (`useEffectiveColorScheme`) and i18n like the rest of the app —
  not a stripped-down/bare page.

## UI trigger: `ShareRoundModal`

`src/components/ShareRoundModal/ShareRoundModal.tsx` gains one new row alongside the
existing "Save to Photos"/"Share" (image) actions: **"Copy Link"**.

- Builds the URL as `` `${BASE_URL}/shared/${round.shareId}` `` (`BASE_URL` is the same
  constant already used for the GitHub Pages base path elsewhere in the app).
- Copies to clipboard via `expo-clipboard` (new dependency — not currently installed;
  needs `npx expo prebuild` consideration per `CLAUDE.md`'s native-module gotcha) on
  native, `navigator.clipboard.writeText` on web.
- Shows a brief inline confirmation ("Link copied") on tap.
- `ShareRoundModal` is only ever opened from `app/archive-day.tsx`'s "···" menu, and
  every round reachable there is already archived — no extra guard needed to hide "Copy
  Link" for an open/unarchived round.
- Requires `ArchivedRound` to carry `shareId` end-to-end: `Match`/`ArchivedRound` types
  in `src/store/types.ts` gain `shareId: string`, populated from Supabase's `share_id`
  column on pull/sync (`src/supabase/sync.ts`) the same way every other round field
  already round-trips.

## Known limitations (explicitly out of scope for this iteration)

- **No revoke/regenerate.** Once a matchday's link has been copied and shared, it stays
  valid for as long as the round exists and its parent tournament stays open — by
  design, per brainstorming (no token table, no toggle UI). If this needs to change
  later, the `share_id` column can still be manually rotated via a one-off SQL
  `update`, but there's no in-app affordance for it.
- **Tournament close breaks the link.** When the tournament containing a shared round
  is eventually closed (`closeTournament()`), the round's data moves into the
  `closed_tournaments` model (per `docs/CONTEXT.md`'s state model) and `rounds.status`
  no longer reads `'archived'` in the shape this RPC expects — the previously-shared
  link stops resolving (`get_shared_round` returns `null`, page shows "not found").
  Extending sharing to closed tournaments is a separate future iteration (the original,
  broader ask in issue #19), not solved here.
- **Deleted rounds.** `deleteArchivedRound` removes the row outright — any previously
  shared link for it correctly starts returning "not found" with no special-casing
  needed.

## Testing

- **Unit (Jest)**: `buildSharedRoundUrl(shareId)` helper, and — if a mapping layer is
  needed to reshape the RPC's `{ round, matches, players, teams }` payload into the
  props `StandingsTable`/`MatchCard`/etc. expect — that pure mapping function, tested the
  same way `statsAggregation.ts`/`rivalryAggregation.ts` are (`src/utils/__tests__/`).
- **RPC function**: not covered by Jest (SQL, security-definer, runs in Postgres).
  Verified manually via the Supabase SQL editor: a `share_id` for an archived round
  returns the expected JSON; a `share_id` for a still-open round, or a nonexistent one,
  returns `null`.
- **E2E (Playwright)**: new smoke test for `/shared/[shareId]`, following the existing
  `blockSupabaseNetwork`-style route interception in `e2e/fixtures.ts` to mock the RPC
  response with fixture data:
  - Valid `shareId` → asserts the read-only view renders (score, players, standings)
    and that no edit/delete/add controls are present anywhere on the page.
  - Invalid/unknown `shareId` → asserts the not-found state renders, no crash.
- **"Copy Link" button**: manual verification only (clipboard-permission behavior in
  headless/CI browsers is not worth the flakiness of automating) — confirm it copies the
  correct URL and only appears for archived rounds.

## Files touched

- `supabase/migrations/007_round_share_id.sql` (new — must be applied manually to the
  live project, per `docs/CONTEXT.md`'s existing migration-application note)
- Supabase: new `get_shared_round` RPC function (applied via SQL editor/migration)
- `src/store/types.ts` — `shareId` field on `ArchivedRound`
- `src/supabase/sync.ts` — round-trip `share_id` on pull
- `app/_layout.tsx` — bypass session gate for `/shared/*` paths
- `app/shared/[shareId].tsx` (new)
- `src/screens/shared/SharedRoundScreen.tsx`, `useSharedRound.ts`, `shared.styles.ts`
  (new)
- `src/components/ShareRoundModal/ShareRoundModal.tsx` — new "Copy Link" row
- `package.json` — new dependency, `expo-clipboard`
- `src/utils/__tests__/` — new test file for the URL builder / mapper
- `e2e/` — new smoke test for the shared route
- `docs/CONTEXT.md` — update before `finish-feature.sh`, per project workflow
