# Rivalry records (H2H detail screen) — design

Date: 2026-07-20

## Purpose

The H2H tab (`app/stats.tsx`) currently shows only aggregate win/draw/loss counts and
total goals per player pair. This adds a dedicated detail screen per rivalry (pair of
players) surfacing records and streaks derived from real match data — biggest win
margin, highest-scoring match, longest win streak, and best single-match values from
the 23 collected match stats (`src/utils/statDefinitions.ts`) where that data exists.

Addresses gap #2 ("Records / milestones") and partially addresses gap #1 ("Match
stats not aggregated") from `docs/CONTEXT.md`'s "What is NOT implemented" list — scoped
to a single rivalry pair, not a full season-wide aggregate across all players.

## Scope decisions (from brainstorming)

- **Where it lives**: a separate detail screen, not inline in the H2H tab card.
- **Data source**: match score (`aScore`/`bScore`) AND the 23 `statsOverride` stats,
  where present. Stat-based records are omitted per-key when no match in the pair has
  that key recorded — never rendered as a fake zero/N-A row.
- **Streak definition**: a draw breaks a streak for both players. No "unbeaten"/"winless"
  streak concept — only strict win streaks.
- **Fact categories**: score-based records, streaks, and 23-stat records. Explicitly
  **excluded**: "non-obvious" facts (biggest scoreline reversal, grinder wins, first/last
  meeting date, etc.) — out of scope for this iteration.
- **Dates on records**: yes, each record shows the date it happened and is tappable
  through to `match/[id]`, except records from a match in the still-open current round
  (no date exists yet for those — shown without a date, not tappable).

## Data layer

### New file: `src/utils/rivalryAggregation.ts`

```ts
interface RivalryMatchEntry {
  match: Match;       // perspective-normalized: match.aId === playerIdA (flipped like buildH2HPairs)
  date: string | null; // null when the match is in the current open round (no round date yet)
  matchId: string;
}

function collectRivalryMatches(
  playerIdA: string,
  playerIdB: string,
  closedTournaments: ClosedTournament[],
  archivedRounds: ArchivedRound[],
  currentMatches: Match[],
): RivalryMatchEntry[]
```

Walks all three store layers (same three layers `collectAllMatches` merges, but this
function is a separate implementation because it must retain each match's round date,
which `collectAllMatches` deliberately flattens away). For matches from
`closedTournaments`, the date comes from the parent `ArchivedRound.date` inside that
tournament's `rounds`. For `archivedRounds`, same field directly. For `currentMatches`
(the open round), `date: null`. Order is chronological — the natural array order of the
three layers concatenated, same assumption `collectAllMatches` already relies on.

Perspective is normalized exactly like `buildH2HPairs`: when the underlying match has
`aId === playerIdB` (i.e. stored in the other direction), scores and stat values are
swapped so that `entry.match.aId` always equals `playerIdA` in the returned entries. This
keeps every downstream computation simple (no direction-checking needed after this
point).

```ts
interface RivalryRecords {
  biggestWin: { entry: RivalryMatchEntry; winner: 'a' | 'b'; margin: number } | null;
  highestScoring: { entry: RivalryMatchEntry; totalGoals: number } | null;
  winStreakA: number;
  winStreakB: number;
  statRecords: StatRecord[];
}

interface StatRecord {
  key: KnownStatKey;
  value: number;
  holder: 'a' | 'b' | 'tie';
  entry: RivalryMatchEntry; // for 'tie', the entry where the max was reached (either side, both hit the same value)
}

function computeRivalryRecords(entries: RivalryMatchEntry[]): RivalryRecords
```

- `biggestWin`: entry with max `|aScore - bScore|` among non-draw entries. Ties broken
  by most recent entry. `null` if every match in the pair was a draw.
- `highestScoring`: entry with max `aScore + bScore`. `null` only if `entries` is empty
  (can't happen in practice — the rivalry screen is only reachable for pairs with
  `games > 0`).
- `winStreakA` / `winStreakB`: longest run of consecutive entries decided in that
  player's favor; a draw or a loss resets the run to 0.
- `statRecords`: for each `STAT_DEFINITIONS` key, scan every entry's
  `statsOverride[key]`; skip the key entirely if no entry has it set. Otherwise take the
  max of `a` and `b` values across all entries; `holder` is `'a'`/`'b'` if one side's max
  is strictly higher, `'tie'` if equal.

Average goals per game is **not** part of `RivalryRecords` — the rivalry screen is a
separate route reached via `router.push`, so it does not receive the `H2HPair` object
`app/stats.tsx` already computed (only the two player IDs travel through the URL).
Instead, `useRivalryData.ts` derives it directly and trivially from `entries`
(`sum(aScore + bScore) / entries.length`) — no need for a third aggregation function.

Both `collectRivalryMatches` and `computeRivalryRecords` are pure, no store/React
dependency — unit-testable directly.

## Navigation

- New route: `app/rivalry/[a]/[b].tsx` (`a`/`b` are player IDs, two dynamic segments).
- `app/stats.tsx`'s H2H tab: the per-pair card becomes tappable
  (`router.push(`/rivalry/${playerA.id}/${playerB.id}${tournamentOnly ? '?scope=tournament' : ''}`)`),
  reusing the same `scope` convention `/stats` already uses (#87).
- The H2H card markup currently inline in `H2HTab` (`app/stats.tsx`) is extracted into
  a new reusable component, `src/components/H2HCard/`, so both `/stats`'s H2H tab and
  the new rivalry screen's summary block render identical markup — no duplicated JSX.

## Screen layout (`src/screens/rivalry/RivalryScreen.tsx`)

Following the existing `src/screens/match/` pattern (thin `app/` route, logic in a
`src/screens/<name>/` hook + screen component, styles in a sibling `.styles.ts`):

- `app/rivalry/[a]/[b].tsx` — thin route: reads `a`/`b` params + `scope` query param,
  renders `<RivalryScreen playerIdA={a} playerIdB={b} tournamentOnly={...} />`.
- `src/screens/rivalry/useRivalryData.ts` — store selectors (players, teams,
  closedTournaments, archivedRounds, matches) + calls `collectRivalryMatches` /
  `computeRivalryRecords`, memoized.
- `src/screens/rivalry/RivalryScreen.tsx` — presentation:
  1. **Header**: `NavHeader`-style back button + both players' `Avatar` + names either
     side of "VS".
  2. **Summary**: the extracted `H2HCard` (wins/draws/goals bar), same as the `/stats`
     H2H tab entry for this pair.
  3. **Records section** (`SectionLabel`), 2-column tile grid:
     - Biggest win (winner avatar, score, margin, date → tap to match) — tile omitted
       if `biggestWin === null`
     - Highest-scoring match (score, total goals, date → tap to match)
     - Longest win streak A / Longest win streak B, side by side; the longer one gets
       accent-color highlighting (same visual language as the H2H bar's leader)
     - Average goals per game (plain number, no date/tap)
  4. **Match stats section** (`SectionLabel`), rendered only if `statRecords.length > 0`
     (section omitted entirely otherwise, no empty state): one row per `StatRecord`, in
     canonical `STAT_DEFINITIONS` order — label (`+ ' %'` suffix when `isPercent`, same
     convention as `app/match/[id].tsx`), value, holder's avatar + name (or a "tie"
     badge with both avatars when `holder === 'tie'`), date. Row is tappable through to
     `match/[id]` unless `entry.date === null`.
- `src/screens/rivalry/rivalry.styles.ts` — all styles, per project convention (no
  inline `StyleSheet.create` in the screen file).

## i18n

New `rivalry.*` key group in all 3 locales: screen title/section labels, `biggestWin`,
`highestScoring`, `winStreak`, `avgGoalsPerGame`, `tie`, empty-state copy if needed. The
23 stat labels are **reused** from the existing `stats.*` keys (`stats.possession`,
`stats.expectedGoals`, etc.) — not duplicated under `rivalry.*`.

## Testing

`src/utils/__tests__/rivalryAggregation.test.ts` (new, mirrors
`statsAggregation.test.ts`'s pattern): perspective-flip correctness, streak counting
with a draw resetting both sides, `biggestWin`/`highestScoring` tie-breaking, stat
record tie handling (`holder: 'tie'`), and the "key omitted when no match has it" case
for `statRecords`.

No component/screen-level test is planned (screens/hooks reused from established
patterns), consistent with prior guidance to skip tests for UI/native flows and focus
coverage on pure aggregation logic.

## Files touched

- `src/utils/rivalryAggregation.ts` (new)
- `src/utils/__tests__/rivalryAggregation.test.ts` (new)
- `src/components/H2HCard/` (new — extracted from `app/stats.tsx`)
- `app/stats.tsx` (edited — use `H2HCard`, add tap navigation)
- `app/rivalry/[a]/[b].tsx` (new)
- `src/screens/rivalry/RivalryScreen.tsx`, `useRivalryData.ts`, `rivalry.styles.ts` (new)
- `src/i18n/locales/*/` — new `rivalry` key group in all 3 locales
- `docs/CONTEXT.md` — update before `finish-feature.sh`, per project workflow

## Addendum (2026-07-20): two-tab Match stats section

Follow-up brainstorming session added a second requirement on top of the single
`statRecords` list above: the "Match stats" section becomes two switchable tabs
(`SegmentedControl`, `variant="pill"`, same look already used by `/stats`'s
Ranking/Head-to-head toggle), both scoped to the same pair and the same "only
matches with real `statsOverride`" rule as `statRecords`.

(A third "Totals" tab — a plain text list of the same sum/average data — was
built and then deliberately dropped: it duplicated what Comparison already
shows, just as a list instead of bars, so it added a tab without adding
information.)

- **Records** (default/first tab) — exactly the `statRecords` list described above,
  unchanged in content. One behavior fix that applies regardless of tab: picking
  each side's "best" value must respect **direction** — for most stats higher is
  better, but for a few, lower is. `STAT_DEFINITIONS` (`src/utils/statDefinitions.ts`)
  gained an optional `higherIsBetter` field (default `true` when omitted), set to
  `false` for `timeToRegain`, `fouls`, `offsides`, `yellowCards`, `redCards`. This
  list is an assumption, flagged for the user to correct if any of these (or another
  stat) should go the other way. `computeStatRecords` now picks the min instead of
  the max for `higherIsBetter: false` keys; the row's winner-highlight color in
  `StatRecordRow` respects the same flag.
- **Comparison** (second tab) — sum of a stat across every pair-match that recorded
  it, with the per-match average, rendered as horizontal bars reusing the existing
  `StatsRow` component (already visually equivalent to this tab's target look) with
  two new optional props, `aSubLabel`/`bSubLabel`, holding the average-per-match
  annotation (e.g. "3.5/game") under each bar's value (`ComparisonRow` wraps
  `StatsRow` for this). Percent stats (`possession`, `successfulDribbles`,
  `shotAccuracy`, `passAccuracy`) show **only the average** as the bar value, no
  sum — summing a percentage across matches isn't meaningful. `StatsRow` also
  gained a third optional prop, `labelSubText`, a small muted line under the
  centered stat label — `ComparisonRow` uses it to show `row.games` (e.g. "2
  games"), since a stat that's only present in some of the pair's matches would
  otherwise look identical to one present in all of them.
- New pure function `computeRivalryTotals(entries): RivalryTotalRow[]` in
  `rivalryAggregation.ts` — sibling to `computeStatRecords`, shares the same
  per-key omission rule (skip a stat entirely if no match in the pair recorded it)
  and the same "only real stats, never the OCR/random fallback" scoping.
- `StatsRow` (`src/components/StatsRow/`) gained the two optional sub-label props —
  backward compatible, no existing call site (`app/match/[id].tsx`) passes them.
- New i18n keys in `rivalry.*` (all 3 locales): `tabRecords`, `tabComparison`,
  `perMatchSuffix` (`/матч` / `/game` / `/match`).
- Tests: `rivalryAggregation.test.ts` gained cases for direction-aware record
  picking (`timeToRegain` picks the minimum) and `computeRivalryTotals` (sum+avg,
  percent-only-average, per-key omission, average denominator excludes matches
  missing that specific key).
