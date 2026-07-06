# Project Context — Matchday

> Read this first at the start of every session. Updated manually when features land or the picture changes.

## What the app is

1-vs-1 football/FIFA tournament tracker for small groups. Players compete in round-robin rounds, stats are recorded per match, standings are calculated with H2H tiebreaker. Cloud sync via Supabase.

Platforms: iOS, Android, Web. Expo SDK 56, React Native 0.85.3, React 19.2.3.

---

## Delete round — implementation detail

- **Open round** (`roundOpen = true`): `···` button in `/round` header opens a small anchored `DropdownMenu` (`src/components/DropdownMenu/`) with Finish / Stats / Delete Round. `deleteRound()` clears `matches`, `roundPlayers`, sets `roundOpen = false`.
- **Archived round** (inside still-open tournament): `···` button in `/archive-day` header opens the same dropdown pattern (also used by the match stats menu — three near-identical inline copies existed before `DropdownMenu` was extracted). `deleteArchivedRound(id)` removes the round from `archivedRounds`.
- Delete is only available while `hasTournament = true`. Closed tournaments are fully read-only.

**Fixed bug ([#55](https://github.com/CrazyNoodl/matchday/issues/55), 2026-07-02):** the round options menu used to be a `Sheet` (bottom sheet). The sequence `···` → `FINISH` → (equal-games-rule blocks it) → "EVEN OUT THE GAMES" dialog → `Got it` left it stuck open, covering the `+ ADD MATCH` FAB. Root cause: a guard deep in `@gorhom/bottom-sheet` (`isLayoutCalculated`) silently no-ops `close()` when it's called in the same render as another overlay opening or the sheet's own content resetting — confirmed via direct library source inspection, not just app-code timing. No prop-memoization or delay/defer fix worked around it. **Fix:** replaced the Sheet with `DropdownMenu`, the same reliable `Modal`-based anchored-popup pattern already used elsewhere — sidesteps the library bug entirely rather than working around it. `AddMatchSheet` (`src/screens/round/AddMatchSheet.tsx`) still uses `Sheet` and can hit the same underlying bug (e.g. a small leftover sliver after `SAVE MATCH`) — not yet migrated.

**Partially fixed ([#51](https://github.com/CrazyNoodl/matchday/issues/51), 2026-07-02):** the `···` kebab menu above already solved the original overflow (Stats/Finish/Delete moved off the header row). Remaining piece: `headerTitle` Text in `app/round.tsx` had no `numberOfLines`/`ellipsizeMode`, so a long tournament name wrapped to a second line instead of truncating — fixed by adding `numberOfLines={1} ellipsizeMode="tail"`. **Not addressed:** the issue's acceptance criteria also asked for FINISH to stay visible as a standalone primary CTA outside the menu — it currently lives inside the `···` dropdown only. Left as-is; flag if that's still wanted.

---

## Round numbering — implementation detail

**Fixed bug ([#52](https://github.com/CrazyNoodl/matchday/issues/52), 2026-07-02):** round ordinals used to count every archived round including friendly ones (`startRound()` computed `round: archivedRounds.length + 1`), so a friendly round consumed a number in the sequence and later ranked rounds looked off (e.g. 4, 5=friendly, 6, 7… instead of 4, friendly, 5, 6…).

- `startRound()` now computes the ordinal from `archivedRounds.filter(r => r.ranked).length + 1` — friendly rounds no longer consume a slot going forward.
- Already-archived rounds still carry a stale `ArchivedRound.n` from before this fix (no data migration was run). Display code does **not** read `.n` directly anymore — `src/utils/roundOrdinals.ts` (`getRankedRoundOrdinals`) recomputes the ranked-only ordinal live from the rounds array every render, so historical data self-corrects without a migration. `.n` is still written on `finishRound()` for now but is otherwise unused for display.
- Friendly rounds show `–` in the numeric badge instead of a number: `RoundCard` (both `card` and `row` variants), the `/round` header (shows "FRIENDLY" instead of "Round N" when `!tournamentRanked`), and `app/season-stats.tsx`'s round header follow the same rule.
- `ShareRoundModal` takes an explicit `roundNumber` prop (computed by the caller via `getRankedRoundOrdinals`) instead of reading `round.n` — used for the shared image's footer text, filename, and share-sheet title.

---

## String-literal types — implementation detail

**Partially addressed ([#56](https://github.com/CrazyNoodl/matchday/issues/56), 2026-07-02):** audited `src/` and `app/` for de-facto enums typed as raw `string`. Fixed the small/mechanical candidates:

- `MediaType = 'image' | 'video'` now exported from `src/store/types.ts` and reused by `src/supabase/storage.ts`, `src/components/MediaThumbnail/`, `src/components/MediaSlider/`, `src/screens/match/useMatchDetail.ts` — previously redeclared inline in each.
- `MatchResult = 'W' | 'D' | 'L'` now exported from `src/store/types.ts` and reused by `src/utils/standings.ts` (`getFormChips` return type) and `src/components/FormChip/` (component + styles) — previously three independent local declarations.
- `TournamentSyncStatus`/`RoundSyncStatus` now exported from `src/supabase/types.ts` instead of inline unions on the `Database` table rows.
- `settingsSlice.language` now typed as the existing (previously unused) `Language` union from `src/i18n/index.ts` instead of raw `string`.
- `useAddMatchFlow.ts`'s OCR confidence ranking helper now uses `ExtractedStat['confidence']` instead of `string` — closes a real typo hole (a bad literal like `'hi'` used to typecheck silently).

`src/supabase/sync.ts`'s repeated `'active'/'closed'/'open'/'archived'` string literals were left as-is — already type-checked transitively via the typed `Database` schema in `.eq()` calls, so no safety gap there.

**`StatKey` follow-up ([#57](https://github.com/CrazyNoodl/matchday/issues/57), 2026-07-03):** the 23 match-stat keys now have a named type in `src/store/types.ts`:

- `KnownStatKey` — closed union of the 23 literal keys (`'possession' | 'shots' | ... `), kept in sync with `STAT_DEFINITIONS`.
- `StatKey = KnownStatKey | (string & {})` — the escape-hatch union proposed in the issue. Gives autocomplete/typo-protection for the known 23 while still accepting arbitrary OCR keys and the legacy simulated-only `shotsOnTarget` key as plain strings.
- Applied to single-value `key` fields: `StatDef.key` (`statDefinitions.ts`, strict `KnownStatKey` since that array only ever holds the canonical 23), `MatchStat.key` (`matchStats.ts`), `MergedStat.key` (`mergedStats.ts`), `ExtractedStat.key` (`extractStats.ts`), and `extractStats.ts`'s `normalizeKey()` return type / `KEY_ALIASES` value type.
- **Deliberately NOT applied** to `Record`s keyed *by* a stat key (`Match.statsOverride`, `updateMatchStats`'s `stats` param, `AddMatchState.pendingStats`) — those stay `Record<string, ...>`. Mapping a `Record`'s keys over a union that mixes literal members with a generic branch makes each literal a *required* property in TS (confirmed via `tsc`, not just theory), which breaks a sparse/partial map where only some of the 23 keys may be set. `StatKey` only helps at single-field-value positions, not as a `Record` key type — documented inline in `types.ts` so it isn't reintroduced by accident.
- OCR unknown-key fallback (`mergedStats.ts` appending keys outside `STAT_DEF_MAP` under their raw label) verified still working end-to-end, both via the existing `weirdCustomStat` Jest case and manually.

---

## Stat edit redesign — implementation detail

**Redesigned ([#63](https://github.com/CrazyNoodl/matchday/issues/63), 2026-07-03):** the stat edit sheet used to only render params present in `statsOverride`, so the visible rows — and their order — varied match-to-match depending on what OCR happened to capture that time, and a param OCR missed couldn't be added back except by wiping everything via "Clear". Scope was narrowed from the original issue during implementation at the user's direction: **no drag-and-drop reordering, no per-param delete** — the param order is one fixed list, not user-customizable, and the only way to remove all stats is still the existing global "Clear".

- `buildMergedStats()` (`src/utils/mergedStats.ts`) now always returns all 23 `STAT_DEFINITIONS` entries in their fixed canonical order — same order on both the read-only match screen and the edit sheet — whenever `hasStatsOverride` is true. A key missing from `statsOverride` gets `isNA: true` with `{aVal: 0, bVal: 0}` placeholders, rendered as a **muted "0"** (not a distinct "N/A" string — an earlier N/A-text design was deliberately simplified to color-only during review) via `StatsRow`'s `isNA` prop and `MatchModals`'s `isPlaceholder` check. Unknown OCR keys outside the 23 are still appended at the end, unaffected. The no-override fallback (`generateMatchStats`, simulated placeholder data) is untouched.
- `Match.statsOverride` entries now carry an optional `confidence?: StatConfidence` (new shared type in `src/store/types.ts`, also reused by `ExtractedStat` in `extractStats.ts`). Both the read-only screen and the edit sheet show a small yellow dot next to the label when `confidence` is `'low'`/`'medium'`. Confidence is dropped (`undefined`) the moment the user manually edits that row via +/- — it's then user-confirmed, not an AI guess.
- `StatDef` (`src/utils/statDefinitions.ts`) gained an optional `step` (default 1); `expectedGoals` (xG) is the only stat set to `0.1`. `adjustStat` (`useMatchDetail.ts`) rounds to 1 decimal place after every +/- to avoid float drift (repeated `+ 0.1` would otherwise drift to `2.0999999...`), and clamps to `[0, 100]` per side when the stat's `isPercent` is true.
- `openEditStats`/`handleSaveStats`/`adjustStat` track a `touchedStats: Set<string>` for the current edit session: a param that was never in `statsOverride` and stays untouched this session is excluded from the saved override (keeps showing as a muted placeholder); touching it via +/- includes it going forward even if the final value lands back on 0.
- **New per-photo OCR validation gate** in `handleImportStats`: each selected photo is scored independently by how many of the 23 canonical keys it recognizes (`MIN_CANONICAL_STATS = 8`, chosen over the originally-discussed 15 after user testing). A photo below that threshold is treated as the wrong screenshot, not a service error:
  - its extracted stats are excluded from the merge — never touch `statsOverride`, not even partially
  - it's never added to `match.media`
  - it's still uploaded to Supabase Storage (kept, not deleted) but with a `rejected-` filename prefix (`uploadMediaItem`'s new optional `context.filenamePrefix`, `src/supabase/storage.ts`) so it can be identified for cleanup later — **no cleanup job exists yet**, this is filename-tagging only
  - a new `showInvalidStatsPhoto` dialog ("Wrong Photo?" / `matchDetail.ocr.invalidPhoto*` i18n keys) asks the user to upload a clearer photo
  - this fully supersedes the old "0 stats found" case (`showOcrNoStats`): a photo with 0 recognized stats always also fails the 8-key threshold, so `showOcrNoStats` became unreachable and was removed (state/setter/modal deleted; the now-unused `matchDetail.ocr.noStats*` i18n strings were deliberately left in place across all 3 locales rather than touched for this)
  - re-scanning with only an invalid photo leaves the match's existing `statsOverride`/`media` completely untouched — the merge/media-write code simply never runs when nothing passed validation
  - OCR now runs **before** upload (previously upload-first) since each photo's validity must be known before deciding its upload filename and whether it joins `match.media`; per-photo upload failure tolerance is otherwise unchanged
- Covered by new tests in `src/utils/__tests__/mergedStats.test.ts` (fixed order, isNA placeholders, confidence passthrough, step field) and `src/screens/match/__tests__/useMatchDetail.test.ts` (`adjustStat` percent clamp / decimal rounding, `openEditStats`/`handleSaveStats` touched-tracking, the `#63` OCR-gate describe block covering rejected-prefix tagging and re-scan-preserves-old-stats). The 8 pre-existing OCR tests that mocked a single stat entry were updated to provide ≥8 canonical stats where they need to represent a "valid photo" scenario.

**OCR score-duplicate blacklist + per-param delete for non-canonical rows ([#72](https://github.com/CrazyNoodl/matchday/issues/72), 2026-07-06):** a real screenshot scan sometimes made the AI return a `goals`/`score`-style key that just duplicates the match score, and #63 had deliberately removed per-param delete — so that stray row was permanent short of nuking all stats via "Clear". Revisits that #63 scope decision specifically for non-canonical rows, at the user's direction:

- `extractStatsFromPhoto` (`src/utils/extractStats.ts`) now drops any AI-returned key matching a small blacklist (`goals`, `score`, `finalScore`, `matchScore`, `result`) before it ever reaches `normalizeKey`/the merge step; the prompt text also explicitly tells the model not to return those. This is the preferred fix path — most of these never make it into `statsOverride` at all anymore.
- For whatever still lands outside the 23 canonical keys (any other stray OCR key), `MergedStat` (`src/utils/mergedStats.ts`) gained an `isCanonical: boolean` field — `true` for the fixed 23, `false` for anything appended after them. The 23 canonical params are still edit-only, exactly as #63 left them; only non-canonical rows can be removed.
- `MatchModals.tsx`'s edit-stats sheet renders a delete ("×") button only when `!stat.isCanonical`, calling a new `deleteStat(key)` (`useMatchDetail.ts`) that removes the key from the in-progress `editValues`/`touchedStats` session state — the row disappears immediately (the sheet renders `mergedStats` filtered down to keys still present in `editValues`, not raw `mergedStats`, so a deleted row can't reappear before Save). The removal only actually reaches `match.statsOverride` once the user taps the sheet's own Save button, same as every other edit in this sheet — Cancel discards it like everything else.
- Covered by new Jest cases: `mergedStats.test.ts` (`isCanonical` true/false split) and `useMatchDetail.test.ts` (`deleteStat` describe block — removal survives to `statsOverride` after save, doesn't resurrect if previously touched). A Playwright e2e spec for the same flow was written and visually verified (delete button renders only on the non-canonical row, click removes it, persists after Save) but not kept — the existing `···`-menu → "Edit" click sequence has pre-existing flakiness (an intercepting full-screen backdrop `Pressable`, unrelated to this fix) that made the new spec unreliable; not fixed here, worth a look if that dropdown pattern gets touched again.

---

## Persistent auth session — implementation detail

**Fixed bug ([#54](https://github.com/CrazyNoodl/matchday/issues/54), 2026-07-02):** every cold app restart dropped the user back to the login screen. Root cause: `src/supabase/client.ts` set `persistSession: true` on the Supabase client but never supplied a `storage` adapter — on native, Supabase defaults to `@react-native-async-storage/async-storage`, which isn't installed in this project, so the session only ever lived in memory.

**Fix:** `src/supabase/client.ts` now builds an MMKV-backed storage adapter (`createMMKV({ id: 'supabase-auth' })`, a separate MMKV instance from the main store's `matchday-store`) and passes it as `auth.storage` — native only. On web, `storage` is left `undefined` so Supabase's default `localStorage` adapter (which already worked) keeps handling it. Mirrors the lazy-require + in-memory-fallback pattern already used for the main store's adapter in `src/store/index.ts` (falls back gracefully in Jest, where the native module isn't linked).

Covered by `src/supabase/__tests__/client.test.ts` (adapter wiring, web vs native branching, in-memory fallback) — but the actual cold-restart behavior can only be verified on a real device/simulator, not in Jest.

---

## Per-account data isolation on sign-out — implementation detail

**Fixed bug (2026-07-05):** `confirmSignOut` (`src/screens/settings/useSettings.ts`) called `signOut()` but never cleared the local Zustand/MMKV store. On a shared device, switching accounts left the previous account's `players`/`teams`/tournament data cached locally; `useSyncManager`'s bootstrap-push (`src/supabase/useSyncManager.ts`) would then see "cloud empty for the new user_id + local data present" and push the *previous* account's data into the newly signed-in account.

**Fix:** `confirmSignOut` now calls `store.resetStore()` after `signOut()` (even if `signOut()` throws), clearing all persisted state before another account can sign in on the same device. Safe against a push race because `SyncManager` unmounts (session → `LoginScreen` swap in `app/_layout.tsx`) before the debounced push timer would fire.

Also fixed while investigating: `public.players` had a single-column primary key (`id`), but `src/supabase/sync.ts` always upserted with `onConflict: 'id,user_id'` — a target matching no real constraint, so every players upsert to Supabase silently failed (push errors aren't surfaced). Migration `supabase/migrations/003_players_composite_key.sql` changes the PK to `(id, user_id)`, matching `teams`' `(code, user_id)`. **Must be applied manually against the live Supabase project** (SQL Editor or `supabase db push`) — it isn't run automatically.

Covered by new tests in `src/screens/settings/__tests__/useSettings.test.ts` (`confirmSignOut` clears players/teams, including when `signOut()` throws).

---

## State model (non-obvious)

```
matches          — current open round only (cleared on finishRound)
archivedRounds   — past rounds of the current active tournament
closedTournaments — fully finished tournaments (hasTournament = false after closeTournament())
```

- Once `closeTournament()` fires, `hasTournament` → false, matches move into `closedTournaments`, all edit UI disappears.
- Stats screen (`app/stats.tsx`) aggregates ALL three layers: `closedTournaments` + `archivedRounds` + `matches`.
- Modal system is a discriminated union in `src/store/types.ts`; all modals rendered inline in their screen, driven by `store.setModal('name')`.

**Fixed bug (2026-07-05):** `tournamentPlayers`/`roundPlayers` (the open tournament/round rosters, seeded once by `startRound()`) were never pruned when a player left the roster — neither `deleteMatch` nor `deletePlayer` touched them. Sequence that triggered it: add a player to an open round → delete their match (allowed, round not closed) → delete the player entity (allowed, `deletePlayer`'s guard only checks `matches`/`closedTournaments`, not the live roster) → the stale id stayed in `tournamentPlayers`, so `app/tournament.tsx`'s standings table (which trusts `tournamentPlayers` as source of truth, no filtering against `players`) rendered a ghost zero-stat row for a player that no longer exists. **Fix:** `deletePlayer` (`src/store/slices/playersSlice.ts`) now also filters the deleted id out of `tournamentPlayers` and `roundPlayers` whenever its existing guards allow the deletion to proceed. Covered by a new test in `src/store/__tests__/playersSlice.test.ts`.

---

## What is fully implemented

| Feature | Where |
|---|---|
| Tournament create/close/archive | `app/setup.tsx`, `app/tournament.tsx` |
| Round management (add match, finish, archive, delete) | `app/round.tsx`, `app/archive-day.tsx` |
| Match detail + 23-type stat entry | `app/match/[id].tsx` |
| Standings with H2H tiebreaker | `src/utils/standings.ts` |
| Form chips W/D/L (last 3) | `standings.ts → getFormChips` |
| Share Round as image | `src/components/ShareRoundModal/` |
| Share Standings as image | `src/components/ShareStandingsModal/` |
| Stats screen — Ranking (all-time) + H2H pairs | `app/stats.tsx` |
| Season stats | `app/season-stats.tsx` |
| Archive (closed tournaments accordion) | `app/archive.tsx`, `app/archive-day.tsx` |
| Match media: multi-select (up to 5), optimistic upload, full-screen swipeable viewer | `src/screens/match/useMatchDetail.ts`, `src/components/MediaSlider/` |
| Photos downscaled before upload (regular media, stat photos, team logos) | `src/utils/imageResize.ts` |
| OCR stat import (AI, dev-only) | `app/settings/(developer)/ocr-lab.tsx` |
| Resize Lab — before/after size inspector (AI, dev-only) | `app/settings/(developer)/resize-lab.tsx` |
| Player/team management | `app/settings/(data)/` |
| Supabase sync (selective, debounced 300ms) | `src/store/` |
| Persistent auth session (survives app restart) | `src/supabase/client.ts` |
| Demo mode | store flag |
| i18n (uk / en / fr) | `src/i18n/locales/` |
| Dark + light theme, with an Auto option that follows OS appearance live | `src/theme/` |
| Playwright E2E tests (18 tests, 8 smoke) | `e2e/` — `npm run e2e`, `npm run e2e:smoke` |
| Storybook: real dark/light theming, full component coverage (30/30) | `.storybook/`, `src/components/*/*.stories.tsx` |
| Loading feedback during stat re-scan / media upload (preparing → uploading → scanning) | `src/screens/match/useMatchDetail.ts`, `app/match/[id].tsx` |
| Stat edit: fixed order, all 23 params always shown, AI-confidence dot, per-photo OCR validation gate, score-duplicate OCR blacklist, per-param delete for non-canonical rows | `src/utils/mergedStats.ts`, `src/screens/match/useMatchDetail.ts`, `src/screens/match/MatchModals.tsx`, `src/utils/extractStats.ts` |
| Offline handling, phase 1: boot-time stub/banner, persisted pending-sync + push-before-pull on reconnect, per-feature upload/delete gating, Supabase reachability health-check | `src/hooks/useIsOnline.ts`, `app/_layout.tsx`, `src/supabase/useSyncManager.ts`, `src/supabase/health.ts`, `src/components/OfflineScreen/` |
| Team logo offline caching + graceful fallback | `src/components/TeamBadge/`, `src/components/Avatar/`, `src/components/ShareRoundModal/` (`CardAvatar`) |

## Offline/login screens theming + function-component error boundary — implementation detail

**Fixed (2026-07-06):** the boot-time offline stub (`OfflineStub`, previously inline in `app/_layout.tsx`) and `LoginScreen`'s error/success banners rendered with hardcoded dark colors regardless of the user's light/dark preference — a black screen in light mode, and near-invisible dark-red/dark-green banners.

- `OfflineStub` extracted to its own theme-aware component, `src/components/OfflineScreen/` (`OfflineScreen.tsx` + `.styles.ts` via `makeStyles(colors)`, `index.ts`, `.stories.tsx`), exported from the `src/components` barrel. `app/_layout.tsx` now renders `<OfflineScreen />` instead of the inline function.
- `LoginScreen.styles.ts`'s `errorBox`/`errorText`/`successBox` hardcoded hex colors (`#3a1a1a`, `#ff453a`, `#1a3a1a`) replaced with theme tokens (`colors.accent.redSubtle`/`red`, `colors.accent.greenSubtle`), matching the pattern already used in `settings/players`, `settings/teams`, etc.
- `LoginScreen.stories.tsx` gained a `ValidationError` story using a `play` function (`storybook/test`'s `userEvent`/`within`) that submits with empty fields to deterministically trigger the synchronous validation error banner — no network mocking needed.
- `AppErrorBoundary` (`app/_layout.tsx`) rewritten from a class component to a function component wrapping the new `react-error-boundary` dependency (`ErrorBoundary` with `onError`/`fallbackRender`). Its fallback UI is now `src/components/ErrorFallback/` (own `.tsx`/`.styles.ts`/`index.ts`/`.stories.tsx`), which — unlike the old class fallback — can call `useColors()`/`useTranslation()` directly, so it's theme-aware too. `errorStyles` (the old static-`Colors`-only styles) removed from `src/screens/layout/layout.styles.ts` entirely; `bannerStyles`/`offlineBannerStyles` in that file remain intentionally fixed-color (yellow/blue regardless of theme), unrelated to this fix.
- New dependency: `react-error-boundary` (peer-compatible with React 19). React itself has no hook equivalent for `componentDidCatch`/`getDerivedStateFromError` — this library is the standard way to keep error-boundary usage sites as plain function components while the (unavoidable) class lives inside the dependency instead of app code.

## Media upload — implementation detail

### Multi-select & slot cap

Both `handleAddMedia` (match detail, `src/screens/match/useMatchDetail.ts`) and `handlePickMedia` (add-match flow, `src/screens/round/useAddMatchFlow.ts`) enforce a **5-item cap** per match. The picker's `selectionLimit` is set dynamically to `5 - currentMediaCount` so the OS enforces the cap in the picker itself. If slots are full the button is disabled (`isMediaFull`).

### Optimistic upload

`handleAddMedia` saves items to the store **immediately** with `{ uri: localUri, type, uploading: true }` before the upload starts. The FlatList thumbnail shows a green spinner. Upload runs in the background; navigation away does not interrupt it. On completion the item is replaced:

- Upload OK → `{ uri: remoteUrl, type }` (remote URL, no flag)
- Upload failed → `{ uri: localUri, type, pendingUpload: true }` (retry overlay with ⚠)

`uploading: true` items are **stripped on store rehydration** (same as `pendingUpload`) so a crash during upload does not leave stuck spinners on next app launch. Implemented in `onRehydrateStorage` in `src/store/index.ts`.

UI rules for `uploading: true` thumbnails: no delete button, tap is disabled (can't view or retry something still in flight).

### Video temporarily disabled ([#59](https://github.com/CrazyNoodl/matchday/issues/59), 2026-07-03)

Video upload and playback were both broken (root cause not yet investigated — deferred, priority downgraded to `low`). Interim mitigation instead of a fix:

- Both pickers (`handleAddMedia` in `useMatchDetail.ts`, `handlePickMedia` in `useAddMatchFlow.ts`) now request `mediaTypes: ['images']` only — no new video can be picked.
- Video items already attached to existing matches are hidden from display: `useMatchDetail.ts` derives `visibleMedia` (media filtered to non-video, paired with each item's original array index) and the match detail screen renders that instead of `match.media` directly. Original indices are preserved so delete/retry/view-in-slider still target the correct underlying item.
- Hidden video items are **not deleted** — they still count toward the 5-item media cap, they're just not rendered until playback is fixed. `MediaThumbnail`/`MediaSlider` components themselves were not changed (they still have video-rendering branches, just never reached from match detail anymore).
- Root cause investigation (upload path, playback path, possible Expo SDK 56 `expo-av`→`expo-video` migration) is still needed before re-enabling — see issue #59 for the original investigation checklist.

### Loading feedback for re-scan / upload ([#65](https://github.com/CrazyNoodl/matchday/issues/65), 2026-07-03)

**Fixed bug:** triggering "Re-scan" (stats menu "···" → Re-scan) gave zero visible feedback for the whole upload+OCR duration. Root cause: the only spinner lived inside the stats context menu item, but the menu closes immediately on tap (`d.setShowStatsMenu(false)`), unmounting the spinner before `handleImportStats` (the actual upload+OCR work, via the `rescanAfterClose` ref flow) even starts. Separately, `uploadingMedia` state (driving the "+ Add" button's spinner) was declared but `setUploadingMedia` was never called anywhere — that spinner was permanently dead code.

**Fix:**
- `useMatchDetail.ts` now exposes `importStatsStep: 'preparing' | 'uploading' | 'scanning' | null` alongside the existing `importingStats` boolean.
- The match detail screen (`app/match/[id].tsx`) renders a persistent progress indicator (spinner + step text) directly in the "MATCH STATS" section header — in place of the "···" button — whenever `importingStats` is true. Since this lives in the main screen tree (not inside the menu `Modal`), it survives the menu closing and stays visible for the full duration.
- `'preparing'` is set **synchronously before** `ImagePicker.launchImageLibraryAsync()` is even called — this covers the OS fetching a not-yet-downloaded iCloud photo, which happens inside that single `await` with no progress-event API of its own. Trade-off: the spinner can flash briefly even if the user opens and immediately cancels the picker (deliberate — accepted over the app appearing frozen during a real iCloud download).
- `handleAddMedia` ("+ Add") got the same treatment: `setUploadingMedia(true)` now fires before the picker call and resets to `false` once optimistic thumbnails appear (each thumbnail then shows its own per-item spinner for the actual background upload).
- This intentionally supersedes a prior test assumption in `useMatchDetail.test.ts` ("Bug 8": spinner must stay off while the picker is open) — that test was removed rather than inverted, since this native-picker-touching flow isn't covered by new mocked Jest tests per project policy (see below); verified manually on a Release build on device instead.

---

## Media cleanup on delete — implementation detail

**Redesigned ([#67](https://github.com/CrazyNoodl/matchday/issues/67), 2026-07-03):** cleanup is now prefix-based (delete a whole storage folder in one sweep) instead of per-item, matching the new folder layout described below.

- `deleteMatch(id)` — deletes the match's whole storage folder in one `deleteStorageFolder()` call
- `deleteRound()` — deletes the currently open round's whole folder in one sweep
- `deleteArchivedRound(id)` — deletes that archived round's whole folder in one sweep
- `deleteClosedTournament(id)` — deletes the **entire tournament folder** in one sweep; since old flat-layout files also lived directly under `{tournamentId}/`, this one call incidentally cleans those up too (see below)
- `resetStore()` — already handled full cleanup (unchanged)

Pattern: fire-and-forget, same as before — local state updates synchronously; `deleteStorageFolder()` runs in the background without blocking the UI. Matches predating this feature (no `mediaFolder`, see below) don't live under the round-folder prefix, so `deleteMatch`/`deleteRound`/`deleteArchivedRound` additionally delete those legacy matches' folders individually as a fallback — only `deleteClosedTournament`'s tournament-wide sweep needs no such fallback.

`deleteStorageFolder(prefix)` (`src/supabase/storage.ts`) does the recursive `list()` → `remove()` walk itself — Supabase Storage has no native recursive folder delete; `list()` returns one level at a time, with sub-folders coming back as entries with `id === null`.

---

## Storage folder structure — implementation detail

**Redesigned ([#67](https://github.com/CrazyNoodl/matchday/issues/67), 2026-07-03):** new uploads go into a per-round/per-match hierarchical path inside the `match-media` bucket:

```
{userId}/{tournamentId}/matchday-{date}_{HHmm}/match_{aScore}-{bScore}_{date}_{HHmm}/{timestamp}-{randomId}.{ext}
```

- **Round folder** (`matchday-2026-07-03_1430`): generated once by `startRound()` via `buildRoundFolder()`, stored on `TournamentState.roundFolder` while the round is open, copied onto `ArchivedRound.folder` by `finishRound()` and cleared from `roundFolder` afterward.
- **Match folder** (`match_2-1_2026-07-03_1432`): generated once at match-creation time in `useAddMatchFlow.ts` via `buildMatchFolder(aScore, bScore, date)`, stored on `Match.mediaFolder`. **Fixed at creation, never renamed** — even if the score is edited later or stats are re-scanned, the folder name (and any score baked into it) stays the same. Both folder-naming helpers live in `src/supabase/storage.ts`.
- `uploadMediaItem(localUri, type, context?)` / `uploadMediaItems(items, context?)` now take `context: { tournamentId, mediaFolder }` (renamed from the old `matchId` field) — `mediaFolder` is the full relative path segment under the tournament id, e.g. `${roundFolder}/${match.mediaFolder}`.
- `useAddMatchFlow.ts` builds `mediaFolder` from the `roundFolder` prop (passed down from `app/round.tsx`, sourced from `store.roundFolder`) + the freshly generated match folder.
- `useMatchDetail.ts`'s `getMediaFolder(match)` resolves the round folder contextually — `store.roundFolder` for a live match, the owning `ArchivedRound.folder` for an archived one — then delegates to the same `matchMediaFolder()` helper the Add Match flow's fallback logic mirrors, so both flows always agree on the upload path for a given match (bug found and fixed 2026-07-04: previously `useMatchDetail.ts` duplicated this logic with a stricter condition requiring *both* `roundFolder` and `match.mediaFolder`, so a match whose round predated #67 — no `roundFolder` yet — got a different folder for media added via the detail screen than media added at creation).
- **Legacy fallback, no data migration was run:** `matchMediaFolder(roundFolder, match)` (`src/store/sliceHelpers.ts`) is the single shared helper, used by both upload flows and every delete action in `tournamentSlice.ts`: no `match.mediaFolder` → falls back to `match.id` (pre-#67 match, old flat layout); has `match.mediaFolder` but no `roundFolder` → uses the bare match folder (match created after #67 but its round predates it); both present → `${roundFolder}/${match.mediaFolder}`.
- Team logos still upload to the flat `{userId}/team-logos/...` path — unaffected by this change.

---

### Image resize on upload — implementation detail ([#62](https://github.com/CrazyNoodl/matchday/issues/62), 2026-07-04)

Photos were previously uploaded/sent at full camera resolution — only JPEG `quality` compression, no dimension downscaling. `src/utils/imageResize.ts` adds a shared `resizeImage(uri, {width, height}, maxDimension, opts)` helper (via `expo-image-manipulator`, context API) that caps the longest edge and no-ops if the source is already within the cap.

Presets, each applied at a different call site:
- `MEDIA_MAX_DIMENSION` (2000px) — regular match media, no OCR involved (`handleAddMedia` in `useMatchDetail.ts`)
- `OCR_PAYLOAD_MAX_DIMENSION` (2000px) — base64 sent to the AI OCR provider; light downscale, stays legible
- `STAT_PHOTO_STORAGE_MAX_DIMENSION` (1200px) — the persisted copy of a photo that went through OCR; more aggressive since nobody zooms into a stat screenshot in the gallery
- `TEAM_LOGO_MAX_DIMENSION` (600px) — logos only ever render as a small badge

**Hybrid split for dual-purpose photos:** `handleImportStats` (`useMatchDetail.ts`) and `handlePickMedia` (`useAddMatchFlow.ts`) both use the *same* picked photo for two purposes — OCR extraction and the stored match-media copy — so each runs `resizeImage` twice with different caps: once at `OCR_PAYLOAD_MAX_DIMENSION` for the base64 handed to the AI, once at `STAT_PHOTO_STORAGE_MAX_DIMENSION` for the file actually uploaded to Storage. `ocr-lab.tsx` only needs the OCR-payload downscale (no storage upload happens there).

Every call site wraps `resizeImage` in its own `try/catch` and falls back to the original, un-resized uri/base64 on failure — a resize hiccup degrades to pre-#62 behavior (full-res upload) rather than blocking the picker/OCR flow outright. **Debugging note:** this silent fallback means a broken resize looks identical to "nothing changed" with no visible error — if photos stop shrinking, check for a stale Metro/web bundle first (Fast Refresh doesn't always propagate edits to plain utility modules like `imageResize.ts` the way it does for React components) before assuming the resize logic itself regressed.

New dev tool: **Resize Lab** (`app/settings/(developer)/resize-lab.tsx`, Settings → Developer Menu) — pick any real photo and see before/after dimensions, file size, and reduction % for all four presets side by side, with errors surfaced instead of silently swallowed. Useful for confirming the resize actually ran on a given device/photo without needing to create a match or check the Supabase Storage dashboard.

---

### Share cards — implementation detail

Both `ShareRoundModal` and `ShareStandingsModal` use:
- Native: `react-native-view-shot` (`captureRef`) → save to Photos or `expo-sharing`
- Web: `html2canvas` → download PNG or `navigator.share`

Both modules are **dynamic imports** (`import('react-native-view-shot')`) so the web bundle doesn't crash. The pattern must be preserved when editing these components.

`ShareRoundModal` has toggles: **Include standings** and **Include all matches** — grow the card before capture. Both use the shared `Toggle` component (`src/components/Toggle/`), not the native RN `Switch` (replaced 2026-07-03) — `NewRoundModal`'s "Ranked" toggle was migrated to the same component so every on/off control in the app looks identical.

---

## What is NOT implemented (gaps)

### 1. Match stats not aggregated in season view — biggest gap

23 stat types are collected per match (`src/utils/statDefinitions.ts`): possession, shots, xG, passes, tackles, interceptions, saves, fouls, cards, dribbles, accuracy, etc.

**None of these appear in the season/tournament summary.** The stats screen shows only W/D/L/GF/GA/PTS. All the rich `statsOverride` data on each match is collected but never surfaced in aggregate.

### 2. Records / milestones

No biggest win, longest unbeaten streak, best xG match, etc. anywhere in the UI.

### 3. Share single match result

Share round (all matches) and share standings exist. Share for one specific match (e.g. "3:1 vs Петро") does not exist.

### 4. Streak display

`getFormChips` returns W/D/L but consecutive-win streaks are never counted or displayed on home or stats screen.

---

## Open GitHub issues

Status drifts too fast to keep a manual table in sync (a closed issue was still listed as open here more than once) — run `gh issue list --repo CrazyNoodl/matchday --state open` for the current list instead.

Notable non-obvious resolution: #52 (round screen ordinal numbering) was resolved incidentally by the #42 tour-grouping change, which removed sequential per-match numbering entirely — closed 2026-07-02.

---

## MediaSlider — implementation detail

`src/components/MediaSlider/MediaSlider.tsx` — full-screen photo/video viewer opened from the match detail screen via `Modal`.

**Touch architecture (do not regress):**

```
Pressable overlay (onPress=onClose)   ← closes on tap outside slide
  └── FlatList (horizontal, pagingEnabled)
        └── Pressable slide (onPress=onClose)   ← closes on tap on image
```

- `FlatList` is a **direct child of the outer Pressable**, never wrapped inside another Pressable. Wrapping FlatList in a Pressable kills swipe gestures — the Pressable claims the touch responder before FlatList's pan handler can negotiate.
- Each slide is a `Pressable` **inside** FlatList (standard RN pattern). FlatList steals the responder for horizontal pans via `onMoveShouldSetResponderCapture`; simple taps reach the slide Pressable and fire `onClose`.
- Slide dimensions: `width × height` (full screen), not square. Image uses `resizeMode="contain"` so portrait and landscape photos are centred correctly.
- `FlatList` has `style={{ height: screenHeight, flexGrow: 0 }}` to prevent vertical stretch in the flex container.

**Fixed bug (2026-07-03):** the pagination dots (`styles.dots`) had no `position: 'absolute'` — they sat in normal flow directly after a `FlatList` sized to the full screen height, so they were always pushed below the visible viewport and effectively invisible/unreachable in the real app, not just in Storybook. Fixed by anchoring `dots` with `position: 'absolute', bottom, left: 0, right: 0` (same pattern `closeBtn` already used).

---

## Storybook setup — implementation detail

`.storybook/preview.tsx` provides real dark/light theming (a toolbar `theme` global wraps every story in `ThemeContext.Provider`, not the old fake `backgrounds` color swap) plus `GestureHandlerRootView` + `SafeAreaProvider` + i18n init, so components using `useColors()`/`useTranslation()` render correctly. All 27 components in `src/components/` have stories, grouped into `Elements` / `Cards` / `Blocks` (by `title:` prefix — plain vs composite-row vs full-screen/modal).

**Non-obvious gotchas:**
- Stories with `parameters: { layout: 'fullscreen' }` (e.g. `MediaSlider`, `LoginScreen`) must NOT get the decorator's normal padding wrapper — they size themselves off the real window/iframe dimensions via `useWindowDimensions()`/`Dimensions`, and padding would misalign them. The decorator branches on `context.parameters.layout`.
- `@gorhom/bottom-sheet`'s open animation (Reanimated-driven `snapToIndex`) never plays under Vite — it resolves Reanimated's precompiled `lib/module` build instead of the raw `src` entry Metro processes with the reanimated babel plugin, so the shared value never updates. Worked around with a Storybook-only mock (`.storybook/mocks/gorhom-bottom-sheet.tsx`, aliased in `main.ts`) that renders the same content with plain React state instead — `Sheet` and `NewRoundModal` stories use it. Uses `position: 'fixed'` (not `absolute`) to anchor to the viewport, since the decorator's `GestureHandlerRootView`/`SafeAreaProvider` chain doesn't reliably propagate a definite height for `absolute`/percentage positioning to resolve against.
- `expo-router`, `expo-media-library/legacy`, `expo-sharing` are also aliased to thin stubs in `main.ts` (`.storybook/mocks/`) — native-only or navigation-context-dependent, never actually reached in the web preview's code paths.
- `DropdownMenu`'s `position` prop now accepts `{ top, left }` as well as `{ top, right }` (previously right-only) — additive, real app usage (`app/round.tsx` via `useDropdownMenu`) is unaffected.

---

## Keyboard avoidance in bottom sheets — implementation detail

`Sheet` component (`src/components/Sheet/Sheet.tsx`) has an `avoidKeyboard` prop. When set:
- Registers `Keyboard.addListener('keyboardWillShow/Hide')` via `useKeyboardHeight(enabled)` hook (`src/hooks/useKeyboardHeight.ts`)
- Adds keyboard height to the snap point so the sheet expands exactly to keep content above the keyboard
- Sets `keyboardBehavior='extend'` on the underlying BottomSheet

Any sheet with a `TextInput` must: pass `avoidKeyboard` to `<Sheet>` and use `BottomSheetTextInput` from `@gorhom/bottom-sheet` instead of the native `TextInput`.

Currently applied to: match commentary, add-match commentary step, edit round date, rename tournament.

---

## Auto theme — implementation detail

**Added ([#60](https://github.com/CrazyNoodl/matchday/issues/60), 2026-07-03):** the theme picker only offered Dark/Light; there was no option to follow the OS-level appearance setting.

- `ColorScheme` (`src/theme/colors.ts`) stays a closed `'dark' | 'light'` union — it's still what `colorsByScheme` is keyed by and what gets rendered. A new `ThemePreference = ColorScheme | 'auto'` is the *stored* value; the store's `colorScheme` field (unchanged name, `settingsSlice.ts`) is now typed `ThemePreference` instead of `ColorScheme` — no persisted-data migration needed since existing `'dark'`/`'light'` values already satisfy the wider type.
- `useEffectiveColorScheme()` (new export, `src/theme/ThemeContext.tsx`) is the single place that resolves preference → actual scheme: reads the stored preference plus React Native's `useColorScheme()` (OS-level, live-updating) and returns `'dark'`/`'light'`, defaulting to `'dark'` when the preference is `'auto'` and the OS reports anything other than `'light'`. `ThemeProvider` and `app/_layout.tsx`'s `StatusBar` both switched from reading raw `store.colorScheme` to this hook.
- Theme picker UI (`app/settings/(display)/display.tsx` and the duplicate inline picker in `app/settings/index.tsx` — two independent copies, not deduped as part of this change) gained a third "Auto" 🌓 button, highlighted when the *preference* is `'auto'` (not the resolved scheme).
- Also fixed in passing: `settings.display.themeDark`/`themeLight` i18n keys never actually existed in any of the three locale files — every locale silently fell back to hardcoded Ukrainian default text (`'Темна'`/`'Світла'`) baked into the `t()` calls, regardless of active language. Added proper `themeDark`/`themeLight`/`themeAuto`/`theme` keys to `en.ts`/`uk.ts`/`fr.ts` and removed the hardcoded fallbacks.
- **Real native bug found during device testing, not just a web check:** `app.config.js` had `userInterfaceStyle: 'dark'` set globally, which Expo bakes into iOS's `Info.plist` as `UIUserInterfaceStyle: Dark` (and the Android equivalent). That forces the OS-level trait collection to always report dark, so `useColorScheme()` returns `'dark'` unconditionally on native regardless of the real system setting — Auto would have silently never worked on a real device or simulator, only appearing to work in the web Playwright check (browser has no such native override). Fixed by setting `userInterfaceStyle: 'automatic'` and regenerating the native project (`npx expo prebuild --platform ios --clean`, `ios/` is gitignored/regenerable). Confirmed live-toggling via `xcrun simctl ui <udid> appearance dark|light` on a booted iPhone 17 simulator (iOS 26.5) re-themes the running app instantly with no reload, in both directions.
- Covered by `src/theme/__tests__/ThemeContext.test.tsx` (preference-to-resolved-scheme resolution, including the auto+unavailable-system-scheme default) — this only exercises the JS-side resolution logic, not the native `userInterfaceStyle` config, so a regression there wouldn't be caught by Jest; verify manually on-device/simulator if `app.config.js`'s `userInterfaceStyle` is ever touched again.

---

## i18n hardcoded-strings sweep — implementation detail

Swept remaining hardcoded English UI strings (dialog titles/buttons, form labels/placeholders, screen titles) across most screens and shared components into `en`/`uk`/`fr` locale keys — previously only some screens were fully localized while others (Teams edit sheet, Players/Teams "cannot delete" dialogs, several settings screens) had literal English baked in regardless of active language.

- New shared keys added under `common.*` (e.g. `common.ok`, `common.cannotDeleteTitle`) are reused by both `PlayerDialogs.tsx`/`TeamDialogs.tsx` — avoid re-introducing a screen-local duplicate when adding new "cannot delete"-style dialogs elsewhere.
- This landed the same day the Players/Teams settings screens were split into `PlayerEditSheet`/`PlayerDialogs`/`TeamEditSheet`/`TeamDialogs` components (see `src/screens/settings/players/`, `src/screens/settings/teams/`), so the two branches conflicted on `app/settings/(data)/players.tsx` and `teams.tsx`. Resolved by keeping the extracted-component structure and porting the i18n key changes into the new component files.

---

## Offline handling — implementation detail (2026-07-05/06, phase 1)

**Scope note:** phase 1 of a staged plan (issue #73). Boot-time stub/banner, queued-changes retry on reconnect, and per-feature upload/delete gating are all implemented (below). **Still not implemented:** a persistent visible sync-status indicator (e.g. "2 changes pending") — `syncStatus` exists in the store but nothing renders it as user-facing UI beyond the transient offline banner.

- **Persisted pending-sync + reconnect retry** (`src/supabase/useSyncManager.ts`, `src/store/index.ts`): dirty-table tracking used to live only in an in-memory `useRef` (`dirtyRef`), so an app crash/force-quit/OS eviction before the debounced push fired silently lost the edit — it was never retried because nothing marked the tables dirty again on next launch. Fixed by mirroring `dirtyRef` into a new persisted store field, `pendingSyncTables` (included in `partialize()`), via a `persistDirty()` helper guarded against re-entering the store-subscribe listener it triggers. On launch, `init()` seeds `dirtyRef` from `pendingSyncTables` and — if non-empty — pushes before ever pulling (pull's `applyCloudState()` is a blind overwrite, not a merge, and would wipe the unsynced local edits with a stale cloud snapshot). The offline→online transition is handled the same way via a `reconnectRef` callback wired from a dedicated `useEffect` watching `useIsOnline()`: push first if there's anything dirty, otherwise just pull to catch up on other devices' changes. Covered by `src/supabase/__tests__/useSyncManager.coldStartClobber.test.ts` and `useSyncManager.reconnect.test.ts`.

- New `useIsOnline()` hook (`src/hooks/useIsOnline.ts`): native uses `@react-native-community/netinfo` (`NetInfo.addEventListener`, treating `isConnected`/`isInternetReachable` `null` as online — avoids false "offline" on ambiguous states). **Web deliberately bypasses NetInfo** and listens to `window`'s `online`/`offline` events directly: confirmed via Chromium that NetInfo's web implementation prefers the Network Information API (`navigator.connection.addEventListener('change', ...)`) when the browser exposes it, and that event does not reliably fire on a real connectivity drop (`navigator.onLine` and window `online`/`offline` do fire correctly). Using NetInfo as-is on web silently never detected offline.
- `app/_layout.tsx`: two behaviors gated on `isOnline`, both intentionally shallow (see scope note):
  - **Not logged in + offline** → full-screen stub (`OfflineStub`, reuses `errorStyles`) replaces `LoginScreen`. This is the one place offline fully blocks the app — signing in requires reaching Supabase, there's no local-first path for an unauthenticated user.
  - **Logged in + offline** → a small bottom banner (`OfflineBanner`) appears alongside the existing `DemoBanner` pattern; the app is otherwise fully usable with local data (this already worked before this feature — `getSession()` reads the persisted MMKV session locally, no network call blocks boot). **Deliberately does NOT clear the store or force sign-out on offline boot** — an earlier version of the plan proposed that, but it was rejected during design: it would destroy any local changes not yet synced to Supabase, directly contradicting local-first architecture (phone is the source of truth, not the cloud).
- **Regression found and fixed before landing:** the first version of `OfflineBanner` had an inverted condition (`if (!isOnline || demoMode) return null`, should be `if (isOnline || demoMode) return null`), so the banner rendered whenever the app was *online* — i.e. on every normal screen. Combined with `position: 'absolute', bottom: 0` and no `pointerEvents`, it silently intercepted taps on bottom-anchored buttons (`e2e/06.game-loop.spec.ts`'s "START TOURNAMENT" click hung for the full 90s timeout, `locator.click` log showed the banner's `<div>` "intercepts pointer events"). Fixed both the inverted condition and added `pointerEvents="none"` on the banner's root `View` as defense-in-depth — a purely informational banner must never be able to block interaction with whatever's underneath it, regardless of position, since connectivity APIs (both NetInfo and the browser's) are known to have false positives.
- New regression test: `e2e/09.offline.spec.ts` — toggles `page.context().setOffline()`, asserts the banner appears/disappears and that a bottom CTA (`START NEW TOURNAMENT`) stays clickable while offline. Added to `@smoke`.
- `useIsOnline` has two Jest test files: `src/hooks/__tests__/useIsOnline.test.ts` (native/NetInfo branch) and `useIsOnline.web.test.ts` (web branch — mocks `Platform.OS: 'web'` and hand-rolls a minimal `EventTarget`-based `window`/`navigator` since the project's Jest `testEnvironment` is `node`, no jsdom). Note for future tests in this style: a local `afterEach` that restores `global.window`/`global.navigator` will run *before* `@testing-library/react-native`'s own auto-unmount `afterEach` (Jest runs inner-scope `afterEach` before outer/module-scope ones), causing the hook's cleanup to fire against the wrong `window` — the fix here was to not restore the fake globals between tests at all (harmless since each test reassigns a fresh one in `beforeEach`).

### Per-feature offline gating (2026-07-06)

Disables every UI action that performs a network upload/delete while offline, instead of letting the user tap it and hit a confusing failure later:

- Gating derives `isOffline` from the existing `useIsOnline()` hook (`!useIsOnline()`) — an earlier version of this feature added a second, independent hook (`useIsOffline`, built on `expo-network`) before the two branches were merged; consolidated into the single NetInfo-based `useIsOnline()` immediately after merging so there's one hook and one connectivity dependency (`@react-native-community/netinfo`), not two.
- Buttons gated on `isOffline` (`disabled` + a dimmed style, matching each screen's existing disabled-state pattern):
  - Add Match step 3 media picker (`src/screens/round/AddMatchSheet.tsx`)
  - Match detail: "+ Add" media (header + empty-state), "Import stats" (OCR), pending-upload retry thumbnail, media delete (×) — all in `app/match/[id].tsx` / `src/screens/match/useMatchDetail.ts`
  - Team logo picker and remove-logo (×) in `src/screens/settings/teams/TeamEditSheet.tsx`
- Deliberately **not** gated: login/sign-out (a different category — blocking them offline would remove the only path to recover, and they already surface a failure via the normal auth error path), and dev-only screens (`ocr-lab.tsx`, `resize-lab.tsx`, `import-round.tsx` — the last one is pure local parsing anyway, no network call to gate).
- Verified via live Playwright smoke runs using `page.context().setOffline(true/false)` against the real dev server (not committed as permanent e2e specs — ad hoc verification only), confirming each button gets `aria-disabled="true"` + `pointer-events: none` offline and reverts online.

### Supabase reachability health-check (2026-07-06)

**Gap addressed:** NetInfo (native) and the browser's online/offline events only report whether there's a network interface with a route — not whether requests to our own backend actually get through. A phone with mobile data cut off for non-payment, or a wifi network stuck behind a captive portal, can both still report "connected" while every real request fails (most exposed on iOS, where `isInternetReachable` is closer to "is there a route" than a real reachability probe). Previously `useIsOnline()` trusted the raw signal outright, so gating and the sync reconnect logic could stay falsely "online" indefinitely in that state.

- New `pingSupabase(timeoutMs?)` (`src/supabase/health.ts`): hits Supabase's GoTrue `/auth/v1/health` endpoint (lightweight, no auth/session needed) with an `AbortController` timeout (default 2500ms). Resolves `true` without making a request if `!supabaseConfigured`. `SUPABASE_URL`/`SUPABASE_ANON_KEY` were promoted from module-private to exported consts in `src/supabase/client.ts` for this.
- `useIsOnline()` (`src/hooks/useIsOnline.ts`) now layers a corroboration effect on top of the existing raw NetInfo/window-event signal: while the raw signal says online, it calls `pingSupabase()` once immediately, then every `HEALTH_CHECK_INTERVAL_MS` (60s), and again immediately whenever `AppState` transitions to `'active'` (catches "user just unlocked the phone and tapped a button" without waiting for the next interval tick). A hard raw "offline" is trusted as-is with no ping — nothing to gain by spending a request confirming an already-negative result. Final `isOnline = rawOnline && !verifiedUnreachable`. This is a single shared hook, so every existing `isOffline`-gated button (media upload/OCR/team logo) and the `useSyncManager` reconnect trigger all benefit automatically — no call-site changes needed.
- Deliberately **not implemented**: a pre-flight ping wired into each individual gated action's `onPress` (e.g. right when the media-upload button is tapped) — the periodic + foreground-triggered corroboration above was judged sufficient coverage for the added complexity of threading an async check through ~4 button handlers. If a tap-time check is wanted later, `pingSupabase()` is already exported and usable directly at a call site.
- New tests: `src/supabase/__tests__/health.test.ts` (ok/error/network-throw/timeout-abort/not-configured), `src/hooks/__tests__/useIsOnline.healthCheck.test.ts` (periodic re-verify, recovery, foreground re-verify, no-ping-while-hard-offline, hard-offline-overrides-stale-unreachable-flag). The existing `useIsOnline.test.ts`/`useIsOnline.web.test.ts` mock `@/supabase/health` to always resolve `true` so they stay focused on the raw-signal behavior they were written to lock in.
- **Jest gotcha found while testing this:** `AppState` cannot be tested via `jest.spyOn(AppState, 'addEventListener')` on the real module in this project's RN version — its `.remove()` doesn't actually clear the internal listener registry in the `@react-native/jest-preset` mock, so subscriptions leak across tests in the same file and pollute later assertions. Fix was to fully replace `'react-native'` with a flat `{ Platform, AppState }` mock (same pattern `useIsOnline.web.test.ts` already used) rather than spy on the real one. Also confirmed `jest.requireActual('react-native')` cannot be spread into a partial mock here — react-native's own `index.js` has circular internal requires (`FlatList` → `VirtualizedList` → ... → a `DevMenu` turbo module) that break when re-entered through a custom mock factory; a flat replacement with no `requireActual` sidesteps it.

---

## Team logo offline caching — implementation detail (2026-07-06)

**Fixed bug:** team logos are always remote Supabase Storage URLs (`Team.logo`, only ever `https://` — local `file://` URIs are rejected at display time). `TeamBadge`, `Avatar`, and `ShareRoundModal`'s `CardAvatar` rendered them with plain `react-native` `Image`, which has no reliable disk cache and no error fallback — offline, a previously-seen logo failed to (re)load and the badge rendered as a blank box instead of falling back to the existing colored-initials badge (the same fallback already used when a team has no logo at all).

- New dependency `expo-image` (added to `app.config.js`'s `plugins` and `package.json`). All three components now render logos via `expo-image`'s `Image` with `contentFit="cover"` and `cachePolicy="memory-disk"` instead of `react-native`'s `Image` + `resizeMode`. On native this gives a real disk cache so a logo seen once loads instantly offline on next launch; on web, browser HTTP caching still applies but isn't guaranteed (Supabase Storage's cache headers aren't controlled here).
- Each component now tracks `logoFailed` state (reset via `useEffect` whenever the logo URL changes) and passes `onError={() => setLogoFailed(true)}` — on any load failure (offline cache-miss, broken URL, etc.) the component falls back to the same colored circle/rounded-rect + initials it already renders when `team.logo` is unset. This is the actual offline fix: cache reduces how often the fallback is needed, but the fallback is what prevents blank badges when it still misses.
- `TeamEditSheet.tsx`'s logo picker preview (`formLogo`, shows the local `file://` URI immediately after picking, before upload completes) was **not** touched — that's an active editing-session preview, not the offline-display path this fix targets.
- Covered by new tests `src/components/TeamBadge/__tests__/TeamBadge.test.tsx` and `src/components/Avatar/__tests__/Avatar.test.tsx` (render with logo → fires `onError` → asserts fallback to initials). `expo-image` needs `expo-modules-core`'s native `EventEmitter`, which isn't set up under this project's `@react-native/jest-preset` (no `jest-expo` preset in use) — both test files `jest.mock('expo-image', ...)` to a plain `react-native` `Image` stand-in rather than touching the shared Jest config. `CardAvatar` (`ShareRoundModal.tsx`) has no dedicated test — same fix pattern, lower risk, verified via the manual check below instead.
- Verified via a real Playwright browser check against the dev server (not committed, ad hoc only, same precedent as the offline-gating verification above): created a team, injected an unreachable logo URL directly into the persisted `matchday-store` localStorage entry (simulating an offline cache-miss), reloaded, and confirmed the badge falls back to colored initials instead of staying blank.

---

## Key file locations

```
src/utils/statDefinitions.ts   — all 23 stat keys + labels
src/utils/standings.ts         — standings calc + H2H tiebreaker + getFormChips
src/utils/shareCard.ts         — shared column config for share cards
src/components/ShareRoundModal/    — share round image modal
src/components/ShareStandingsModal/ — share standings image modal
app/stats.tsx                  — Ranking + H2H tabs (all-time aggregation)
app/season-stats.tsx           — season-level stats screen
src/store/types.ts             — all types incl. modal discriminated union
src/store/index.ts             — Zustand store, MMKV/localStorage adapter
docs/pitfalls.md               — read before touching i18n or Sheet+scroll
.storybook/preview.tsx         — theme decorator, i18n init, layout:fullscreen handling
.storybook/mocks/              — Storybook-only stubs (gorhom-bottom-sheet, expo-router, etc.)
src/components/Toggle/         — shared on/off control, used by NewRoundModal + ShareRoundModal
```

---

## Worktree workflow reminder

```bash
./scripts/new-feature.sh <name> [fix|feature|test]   # creates ../matchday-wt-<name>
cp .env ../matchday-wt-<name>/.env                    # always — Supabase won't work without it
./scripts/finish-feature.sh <name>                    # only after explicit user confirmation
```

Never commit to `dev` directly. Never merge without the user explicitly saying so.
