# Project Context — Matchday

> Read this first at the start of every session, instead of exploring the codebase. Updated manually when features land or the picture changes. Branch/worktree workflow, commands, and design-system tokens live in `CLAUDE.md` — not duplicated here.

## Contents

1. [What the app is](#what-the-app-is)
2. [State model](#state-model)
3. [Storage folder structure](#storage-folder-structure)
4. [What is fully implemented](#what-is-fully-implemented)
5. [What is NOT implemented (gaps)](#what-is-not-implemented-gaps)
6. [Open GitHub issues](#open-github-issues)
7. [Gotchas & non-obvious behavior](#gotchas--non-obvious-behavior) — by subsystem
8. [Sync data-loss incident (2026-07-06)](#sync-data-loss-incident-2026-07-06)
9. [Key file locations](#key-file-locations)

---

## What the app is

1-vs-1 football/FIFA tournament tracker for small groups. Players compete in round-robin rounds, stats are recorded per match, standings are calculated with H2H tiebreaker. Cloud sync via Supabase.

Platforms: iOS, Android, Web. Expo SDK 56, React Native 0.85.3, React 19.2.3.

---

## State model

```
matches          — current open round only (cleared on finishRound)
archivedRounds   — past rounds of the current active tournament
closedTournaments — fully finished tournaments (hasTournament = false after closeTournament())
```

- Once `closeTournament()` fires, `hasTournament` → false, matches move into `closedTournaments`, all edit UI disappears.
- Stats screen (`app/stats.tsx`) aggregates ALL three layers: `closedTournaments` + `archivedRounds` + `matches`. The merge/union/H2H-pair logic behind this (`collectAllMatches`, `collectPlayerIds`, `buildH2HPairs`, `sumGoals`, `countMatchDaysPlayed`) is extracted into `src/utils/statsAggregation.ts` — pure functions, unit-tested in `src/utils/__tests__/statsAggregation.test.ts` — rather than left as inline `useMemo` blocks in the screen, specifically so the 3-layer merge and the H2H perspective-flip logic have real regression coverage. `app/season-stats.tsx` (single-`ClosedTournament` scope, no cross-layer merge) has its own `filterRoundsByRanked`/`countChampDaysWon` extracted the same way into `src/utils/seasonStatsAggregation.ts`, tested in `src/utils/__tests__/seasonStatsAggregation.test.ts`. **Known quirk, not fixed, flagged for a future call**: `countChampDaysWon` counts any round (including a friendly one) whose `winner` matches `champId`, but the champion itself is decided from ranked rounds only (`closeTournament()` in `tournamentSlice.ts`) — so with the season-stats INCLUDE filter set to "Friendly" or "Both", a champion's friendly-round wins can inflate "match days won" beyond what crowned them.
- Modal system is a discriminated union in `src/store/types.ts`; all modals rendered inline in their screen, driven by `store.setModal('name')`.
- `deletePlayer` (`src/store/slices/playersSlice.ts`) also prunes the deleted id from `tournamentPlayers`/`roundPlayers` — otherwise a deleted player who'd already been removed from their match leaves a ghost zero-stat row in `app/tournament.tsx`'s standings (which trusts `tournamentPlayers` as source of truth, no filtering against `players`).
- Round ordinals are **not** read from a stored field at display time. `startRound()` still writes `ArchivedRound.n`, but `src/utils/roundOrdinals.ts` (`getRankedRoundOrdinals`) recomputes the ranked-only ordinal live from `archivedRounds.filter(r => r.ranked)` every render — friendly rounds consume no slot and show `–` instead of a number. This makes historical data self-correct without a migration if the numbering rule ever changes again.
- `StatKey = KnownStatKey | (string & {})` (`src/store/types.ts`) is deliberately **not** used as a `Record`'s key type (only at single-value-field positions) — TS makes every literal member of a union-with-generic-branch a *required* property when it's a `Record` key, which breaks sparse maps like `Match.statsOverride` where only some of the 23 stats may be set.

---

## Storage folder structure

Supabase Storage (`match-media` bucket) layout for new uploads:

```
{userId}/{tournamentId}/matchday-{date}_{HHmm}/match_{aScore}-{bScore}_{date}_{HHmm}/{timestamp}-{randomId}.{ext}
```

- **Round folder**: generated once by `startRound()` (`buildRoundFolder()`), lives on `TournamentState.roundFolder` while open, copied to `ArchivedRound.folder` by `finishRound()`.
- **Match folder**: generated once at match creation (`buildMatchFolder`), stored on `Match.mediaFolder`. **Fixed at creation, never renamed** — editing the score or re-scanning stats later does not rename the folder.
- `matchMediaFolder(roundFolder, match)` (`src/store/sliceHelpers.ts`) is the single shared helper every upload/delete path uses to resolve a match's folder — no `match.mediaFolder` → falls back to `match.id` (pre-folder-structure legacy match); folder but no `roundFolder` → bare match folder; both present → `${roundFolder}/${match.mediaFolder}`. Both the Add Match flow and the match-detail "+ Add" flow must go through this helper — they diverged once before (see below) and produced inconsistent paths for the same match.
- Team logos upload to a flat `{userId}/team-logos/...` path — unaffected by the round/match hierarchy above.
- **Cleanup is prefix-based**: `deleteMatch`/`deleteRound`/`deleteArchivedRound`/`deleteClosedTournament` each delete their whole folder in one `deleteStorageFolder()` sweep (recursive `list()`→`remove()` walk — Supabase Storage has no native recursive delete) rather than per-item. Legacy matches with no `mediaFolder` are cleaned up via an individual fallback delete since they don't live under a round-folder prefix.

---

## What is fully implemented

| Feature | Where |
|---|---|
| Tournament create/close/archive | `app/setup.tsx`, `app/tournament.tsx` |
| Round management (add match, finish, archive, delete) | `app/round.tsx`, `app/archive-day.tsx` |
| No-repeat pairings within a round tour (already-played opponent disabled in Add Match) | `src/utils/matchTours.ts` (`getCurrentTourMatches`, `getPlayedPartnerIds`), `src/screens/round/AddMatchSheet.tsx` |
| Match detail + 23-type stat entry | `app/match/[id].tsx` |
| Standings with H2H tiebreaker | `src/utils/standings.ts` |
| Form chips W/D/L (last 3) | `standings.ts → getFormChips` |
| Share Round / Share Standings as image | `src/components/ShareRoundModal/`, `src/components/ShareStandingsModal/` |
| Stats screen — Ranking (all-time) + H2H pairs | `app/stats.tsx`, aggregation logic in `src/utils/statsAggregation.ts` |
| Season stats | `app/season-stats.tsx`, aggregation logic in `src/utils/seasonStatsAggregation.ts` |
| Archive (closed tournaments accordion) | `app/archive.tsx`, `app/archive-day.tsx` |
| Match media: multi-select (up to 5), optimistic upload, full-screen swipeable viewer | `src/screens/match/useMatchDetail.ts`, `src/components/MediaSlider/` |
| Photos downscaled before upload (media, stat photos, team logos) | `src/utils/imageResize.ts` |
| OCR stat import (AI, dev-only) | `app/settings/(developer)/ocr-lab.tsx` |
| Resize Lab — before/after size inspector (dev-only) | `app/settings/(developer)/resize-lab.tsx` |
| Player/team management | `app/settings/(data)/` |
| Supabase sync (selective, debounced 300ms) | `src/store/`, `src/supabase/useSyncManager.ts` |
| Persistent auth session (survives app restart) | `src/supabase/client.ts` |
| Local JSON backup (export/import/restore, auto-pushes to cloud on restore, excludes all media links) | `app/settings/(data)/backup.tsx`, `src/utils/backup.ts` |
| Reset All Data confirmation: "Backup My Data First" shortcut to backup screen, 5s cooldown (countdown in title) before Reset is tappable, resets on each open | `src/screens/settings/SettingsDialogs.tsx`, `src/screens/settings/useSettings.ts` |
| Settings screen: iOS-style layout — account card (avatar, email, Sign Out below), section order Personalize → Play → More → Danger Zone (More is a plain list with Demo Mode/Backup & Restore/Version, not an accordion; Danger Zone is a separate red-bordered card with Reset All Data as a row + pill button, not a full-width button). `SettingsSection` wraps the repeated title+card+divider shape, `DangerZoneCard` is the standalone red card | `app/settings/index.tsx`, `src/screens/settings/SettingsSection.tsx`, `src/screens/settings/DangerZoneCard.tsx` |
| Display settings: Theme card + a separate "Coming soon" card for Show nicknames/Show team logos, badged "In development" and disabled (not yet fully wired — see gotchas) | `app/settings/(display)/display.tsx` |
| Offline handling: boot-time stub/banner, persisted pending-sync + reconnect retry, per-feature upload/delete gating, Supabase reachability health-check | `src/hooks/useIsOnline.ts`, `app/_layout.tsx`, `src/supabase/useSyncManager.ts`, `src/supabase/health.ts` |
| Team logo offline caching + graceful fallback | `src/components/TeamBadge/`, `src/components/Avatar/`, `ShareRoundModal`'s `CardAvatar` |
| Demo mode | store flag |
| i18n (uk / en / fr) | `src/i18n/locales/` |
| Dark + light theme, with an Auto option that follows OS appearance live | `src/theme/` |
| Playwright E2E tests (18 tests, 8 smoke) | `e2e/` — `npm run e2e`, `npm run e2e:smoke` |
| Storybook: real dark/light theming, full component coverage | `.storybook/`, `src/components/*/*.stories.tsx` |
| Shared confirm/alert dialog and sheet header/footer — `ConfirmDialog`, `SheetHeader`, `SheetFooter` replace ~10 hand-rolled confirm-dialog implementations and repeated Sheet header/footer markup app-wide | `src/components/ConfirmDialog/`, `src/components/Sheet/SheetHeader.tsx`, `src/components/Sheet/SheetFooter.tsx` |
| Render-count optimization pass: full-store `useStore()` subscriptions converted to per-field selectors (`app/round.tsx`, `app/tournament.tsx`, all settings screens, `NewRoundModal`), `React.memo` on hot list rows (`Avatar`, `StandingCard`, `MatchCard`, `RoundCard`, `PlayerRankCard`, `FormChip`, `TeamBadge`, `StatusBadge`, `MediaThumbnail`), `useMemo` on `makeStyles`/derived standings/tour grouping, `MatchCard.onPress` contract changed to `(matchId: string) => void`. Measured: opening the Add Match sheet (a `modal`-only store write, unrelated to match data) no longer re-renders any `MatchCard` row — previously re-rendered every row in the round. `StandingCard` uses `useShallow` (`zustand/react/shallow`) on its `matches`-derived form-chips selector — the only place in the codebase using it | `app/round.tsx`, `app/tournament.tsx`, `src/components/StandingCard/`, `src/components/MatchCard/` |
| ESLint (`npm run lint` → `expo lint`): `eslint-config-expo` flat config + `eslint-plugin-storybook` (`flat/recommended`, scoped to `*.stories.tsx`) + a Node-globals override for `scripts/**/*.js`. `react-hooks/rules-of-hooks` is turned off for `e2e/**/*.ts` — Playwright fixtures take a `use` callback param that the rule otherwise mistakes for the React `use` hook. React Compiler is enabled by default in this project (via `babel-preset-expo`, SDK 56), so `react-hooks/*` findings (`preserve-manual-memoization`, `refs`, `set-state-in-effect`, `immutability`, `rules-of-hooks`) are real compiler-safety signals, not style nits — ~76 pre-existing findings (`teams.tsx`, `ZoomableImage.tsx`, `season-stats.tsx`, plus 16 intentional `require()` warnings for lazy MMKV loading in `src/store/index.ts`/`src/supabase/client.ts`) are left as backlog, not yet fixed | `eslint.config.js` |

---

## What is NOT implemented (gaps)

### 1. Match stats not aggregated in season view — biggest gap

23 stat types are collected per match (`src/utils/statDefinitions.ts`): possession, shots, xG, passes, tackles, interceptions, saves, fouls, cards, dribbles, accuracy, etc. **None of these appear in the season/tournament summary** — the stats screen shows only W/D/L/GF/GA/PTS.

### 2. Records / milestones

No biggest win, longest unbeaten streak, best xG match, etc. anywhere in the UI.

### 3. Share single match result

Share round (all matches) and share standings exist. Share for one specific match does not.

### 4. Streak display

`getFormChips` returns W/D/L but consecutive-win streaks are never counted or displayed.

### 5. No persistent sync-status indicator

`syncStatus` exists in the store but nothing renders it as user-facing UI beyond the transient offline banner — no "2 changes pending"-style indicator.

### 6. FINISH round is not a standalone CTA

Round options (Finish/Stats/Delete) live behind the `···` `DropdownMenu` only. The original ask ([#51](https://github.com/CrazyNoodl/matchday/issues/51)) also wanted FINISH visible as a standalone primary CTA outside the menu — left as-is, flag if still wanted.

### 7. ESLint react-hooks/react-compiler backlog not fixed

`npm run lint` reports ~76 pre-existing findings from `react-hooks/*` rules (`preserve-manual-memoization`, `refs`, `set-state-in-effect`, `immutability`, `rules-of-hooks`) — these are real React Compiler safety signals (Compiler is on by default in this project), not style nits. Worst offenders: `app/settings/(data)/teams.tsx` (mismatched `useCallback` deps skip compiler optimization), `src/components/MediaSlider/ZoomableImage.tsx` (Reanimated shared-value mutation flagged by `immutability` — likely needs a scoped disable rather than a real fix, since imperative `.value` mutation is Reanimated's intended pattern), `app/season-stats.tsx` (conditional hook calls). Each needs individual behavioral review + regression tests before changing, not a bulk fix.

---

## Open GitHub issues

Status drifts too fast to keep a manual table in sync — run `gh issue list --repo CrazyNoodl/matchday --state open` for the current list.

---

## Gotchas & non-obvious behavior

### Sync & auth

- **Persistent auth session**: `src/supabase/client.ts` builds an MMKV-backed `auth.storage` adapter for native (a separate MMKV instance, `supabase-auth`, from the main store's `matchday-store`) — Supabase's native default is `@react-native-async-storage/async-storage`, which isn't installed in this project, so without this the session only ever lived in memory and every cold restart dropped back to login. Web keeps Supabase's default `localStorage` adapter.
- **Sign-out clears local state**: `confirmSignOut` (`src/screens/settings/useSettings.ts`) calls `store.resetStore()` after `signOut()` — otherwise a second account signing in on the same device would see the previous account's cached `players`/`teams`, and the sync bootstrap-push could push that stale data into the new account.
- `public.players`' primary key is a composite `(id, user_id)` (migration `supabase/migrations/003_players_composite_key.sql`, matching `teams`' `(code, user_id)`) — **must be applied manually** against the live Supabase project, it does not run automatically.
- **Persisted pending-sync + reconnect retry** (`src/supabase/useSyncManager.ts`, `src/store/index.ts`): dirty-table tracking is mirrored from the in-memory `dirtyRef` into a persisted store field, `pendingSyncTables`, via `persistDirty()` — otherwise a crash/force-quit before the debounced push fires would silently lose the edit (nothing would re-mark it dirty on next launch). On launch and on reconnect, a push always runs before any pull, since `applyCloudState()` is a blind overwrite that would wipe unsynced local edits with a stale cloud snapshot.
- **Supabase reachability health-check** (`src/supabase/health.ts`): NetInfo/browser online-events only report "is there a network route," not "can we reach our backend" — a phone with data cut off for non-payment, or a captive-portal wifi, still reports "connected." `pingSupabase()` hits GoTrue's `/auth/v1/health` and `useIsOnline()` layers this on top of the raw signal (checked periodically, and on `AppState` → `'active'`). Final `isOnline = rawOnline && !verifiedUnreachable`. One shared hook, so every offline-gated button and the sync reconnect trigger benefit automatically.
- **Per-feature offline gating**: media upload/delete, OCR import, and team logo picker are all disabled while offline (`!useIsOnline()`) rather than letting the user hit a confusing failure later. Deliberately **not** gated: login/sign-out (blocking them would remove the only recovery path), and dev-only screens.
- Web's `useIsOnline` deliberately bypasses NetInfo and listens to `window`'s `online`/`offline` events directly — NetInfo prefers the Network Information API on web when available, and that event does not reliably fire on a real connectivity drop in Chromium.
- Not-logged-in + offline → full-screen `OfflineScreen` replaces `LoginScreen` (no local-first path without a session). Logged-in + offline → a small non-blocking `OfflineBanner` (`pointerEvents="none"`, since a purely informational banner must never intercept taps underneath it) — the app stays fully usable with local data. Offline boot deliberately does **not** clear the store or force sign-out.
- Local JSON backup (`/settings/backup`) auto-pushes to Supabase immediately after the single "Replace all local data?" confirmation — there is no separate "Push to Cloud" button/second modal anymore; that confirmation's copy now explicitly covers the cloud overwrite too, so one explicit tap authorizes both the local and cloud replace (still consistent with the "destructive/irreversible action needs its own explicit function" rule — restoring a backup is that one function, `handleConfirmImport` in `backup.tsx`, not a generic dirty-diff push). A full-screen blocking overlay covers the local-apply + cloud-push window (relevant for large backups over a slow connection). If the cloud push fails, the local restore is **not** rolled back — the failure only surfaces a "Retry Cloud Sync" button (no confirmation needed to retry, since intent was already established). Disabled during Demo Mode.

### Native modules & build

- Adding a native Expo module to `package.json` (e.g. `expo-document-picker`, `expo-file-system`) requires `npx expo prebuild --clean` (or `pod install`) + a fresh native rebuild before it works on a physical device — a Metro-only reload is **not** enough. Missed once for the backup feature's document picker: it worked fine on web but crashed on-device with a native-module-not-found error until prebuild was rerun. Now also guarded with a try/catch so a future miss degrades to an error state instead of a hard crash.

### Media & storage

- **5-item media cap** per match, enforced both in the picker's `selectionLimit` and by disabling the add button.
- **Optimistic upload**: media is saved to the store immediately as `{ uri: localUri, uploading: true }`; replaced with the remote URL on success or `{ pendingUpload: true }` (retry overlay) on failure. Both `uploading` and `pendingUpload` items are **stripped on store rehydration** (`onRehydrateStorage`) so a crash mid-upload doesn't leave stuck spinners on next launch.
- **Add Match flow media uploads also mark `pendingUpload`** ([#68](https://github.com/CrazyNoodl/matchday/issues/68)): `uploadMediaItems` (`src/supabase/storage.ts`), the batch upload called once at `handleSaveMatch`, previously fell back to the local `file://` URI silently on a failed upload with no flag — the match saved fine but that photo never reached Storage and there was no way to retry. It now marks the item `pendingUpload: true` (same shape match-detail already used), so the existing retry overlay on the match detail screen picks it up automatically once the match is saved and opened — no separate UI needed.
- **Video is temporarily disabled** ([#59](https://github.com/CrazyNoodl/matchday/issues/59)): both pickers request `mediaTypes: ['images']` only. Video items already attached to older matches are hidden from display (`useMatchDetail.ts`'s `visibleMedia` filters them out, preserving original array indices for delete/retry) but **not deleted** — they still count toward the 5-item cap. Root cause not yet investigated.
- Image resize presets (`src/utils/imageResize.ts`, via `expo-image-manipulator`): `MEDIA_MAX_DIMENSION` 2000px (regular media), `OCR_PAYLOAD_MAX_DIMENSION` 2000px (base64 sent to AI), `STAT_PHOTO_STORAGE_MAX_DIMENSION` 1200px (persisted stat screenshot), `TEAM_LOGO_MAX_DIMENSION` 600px. A dual-purpose stat photo gets resized twice with different caps for its two destinations. Every call site falls back silently to the original un-resized file on error. **Debugging note**: this silent fallback means a broken resize looks identical to "nothing changed" — if photos stop shrinking, check for a stale Metro/web bundle before assuming the resize logic regressed (Fast Refresh doesn't always propagate edits to plain utility modules the way it does for components). Resize Lab (Settings → Developer) shows before/after size for all four presets on a real photo.
- **Team logo offline caching**: logos render via `expo-image` (`cachePolicy="memory-disk"`) instead of RN's `Image`, giving a real disk cache on native. Each of `TeamBadge`/`Avatar`/`CardAvatar` tracks `logoFailed` and falls back to the colored-initials badge on `onError` — the fallback, not the cache, is what actually prevents a blank badge on a cache-miss.

### Stats / OCR

- **All 23 stats always render in a fixed canonical order** (`buildMergedStats()`, `src/utils/mergedStats.ts`), regardless of what OCR captured. A key missing from `statsOverride` renders as a muted "0" (`isNA: true`), not a distinct "N/A" string. Unknown OCR keys are appended after the 23, marked `isCanonical: false` — only those non-canonical rows can be deleted from the edit sheet (the 23 canonical ones are edit-only, never removable except via the sheet's global "Clear").
- `Match.statsOverride` entries carry optional `confidence?: StatConfidence` (shown as a small yellow dot when `'low'`/`'medium'`); confidence is dropped the moment the user manually edits that row, since it's then user-confirmed.
- `adjustStat` rounds to 1 decimal after every +/- (avoids float drift like `2.0999999...`) and clamps `[0, 100]` for percent stats. `touchedStats` tracks which params were edited in the current session — an untouched param stays excluded from the saved override even if its displayed value is 0.
- **Per-photo OCR validation gate**: a photo must recognize ≥8 of the 23 canonical stat keys (`MIN_CANONICAL_STATS`) or it's treated as the wrong screenshot — excluded from the merge entirely, never added to `match.media`, but still uploaded to Storage with a `rejected-` filename prefix for later cleanup (no cleanup job exists yet). Re-scanning with only an invalid photo leaves existing stats/media untouched.
- **`StatsRow`'s `aWins` is tri-state** (`boolean | null`, `null` = tie) ([#69](https://github.com/CrazyNoodl/matchday/issues/69)): both call sites (`app/match/[id].tsx`, `app/settings/(developer)/ocr-lab.tsx`) compute `stat.aVal === stat.bVal ? null : stat.aVal > stat.bVal` — a plain `boolean` with a `>=` comparison silently made every exact tie render as an "A wins" highlight. `null` renders both bars/values as neutral gray in `StatsRow.tsx`.
- `extractStatsFromPhoto` drops AI-returned keys that just duplicate the match score (`goals`, `score`, `finalScore`, `matchScore`, `result`) before they reach the merge step, and the OCR prompt explicitly tells the model not to return them.
- **Per-photo OCR tracking, not a flat merged blob** ([#71](https://github.com/CrazyNoodl/matchday/issues/71)): both the Add Match flow (`src/utils/addMatchState.ts`'s `ocrPhotos: OcrPhotoEntry[]`, replacing the old flat `ocrAssets`) and OCR Lab (`app/settings/(developer)/ocr-lab.tsx`'s `PhotoItem.stats`) track each photo's own scan result independently instead of only the final merged result. This fixed a real bug in the *production* Add Match flow (not just the OCR Lab dev tool the issue was filed against): adding a new photo used to re-send every already-scanned photo to the AI provider again, and removing any photo after a scan wiped every other photo's already-good stats, forcing a full re-scan. Now adding only scans the new photo(s), and removing a photo drops just its own contribution — `pendingStats` (Add Match) / `stats` (OCR Lab) are derived by merging each photo's own result (`src/utils/ocrPhotoMerge.ts`'s `mergeStatArrays`/`toPendingStatsRecord`, shared by both screens). A photo that fails OCR no longer nukes a sibling photo's already-succeeded stats — `ocrStatus: 'error'` isolates to the specific failing photo, and removing that one specific photo self-heals the status back to `'done'`.

### UI components & theming

- **`MediaSlider` touch architecture — do not regress**: the outer `Pressable` (closes on tap outside) must wrap `FlatList` directly, never with another `Pressable` in between — a wrapping `Pressable` claims the touch responder before `FlatList`'s pan handler can negotiate, killing swipe. Each slide is its own `Pressable` inside the list (standard RN pattern); the pagination dots need `position: 'absolute'` or they get pushed below the full-height `FlatList`, off-screen.
- Prefer the `DropdownMenu` (`Modal`-based anchored popup) pattern over `Sheet` (bottom sheet) for menus that must close reliably in the same render as another overlay opening — `@gorhom/bottom-sheet`'s `close()` silently no-ops in that situation (confirmed via library source, not just app-code timing). `AddMatchSheet` still uses `Sheet` and can hit the same class of bug; not yet migrated.
- **Every confirm/alert dialog in the app renders through `ConfirmDialog`** (`src/components/ConfirmDialog/`) — `{ title, description?, icon?, iconColor?, variant: 'default'|'destructive'|'gold'|'neutral', cancel?: {label, onPress}, confirm: {label, onPress, loading?, disabled?}, children? }`. `cancel` omitted → single-button alert mode. `children` renders between description and actions (e.g. `NeedEqualDialog`'s player list, `SettingsDialogs`' reset-app backup CTA). Do not hand-roll a new `Modal`+overlay+card confirm dialog — extend `ConfirmDialog`'s variants instead. Similarly, Sheet-based forms should use `SheetHeader`/`SheetFooter` (`src/components/Sheet/`) rather than re-declaring header/footer markup per screen; `SheetFooter` composes the shared `Button` component. Two known duplicate-dialog bugs were fixed as part of this consolidation: `MatchModals.tsx` had a second, visually-divergent delete-match dialog (now one `ConfirmDialog` call, intentional visible restyle to match the canonical look), and `app/settings/(tournament)/tournaments.tsx` had its own inline rename/close-tournament implementation racing `TournamentModals.tsx` for the same `store.modal` values (now reuses `TournamentModals.tsx`'s components).
- **Auto theme**: `app.config.js`'s `userInterfaceStyle` must be `'automatic'`, not `'dark'` — the latter bakes `UIUserInterfaceStyle: Dark` into `Info.plist` and forces `useColorScheme()` to always report dark on native, silently breaking Auto on real devices while still appearing to work on web (no such native override there). `useEffectiveColorScheme()` (`src/theme/ThemeContext.tsx`) is the single place that resolves stored preference (`'dark' | 'light' | 'auto'`) + live OS scheme → actual rendered scheme.
- Both `ShareRoundModal` and `ShareStandingsModal` use **dynamic imports** for `react-native-view-shot`/`html2canvas` so the web bundle doesn't crash importing a native-only module — preserve this pattern when editing either component.
- Sheets with a `TextInput` must pass `avoidKeyboard` to `<Sheet>` and use `BottomSheetTextInput` from `@gorhom/bottom-sheet`, not the native `TextInput` — currently applied to match commentary, add-match commentary, edit round date, rename tournament.
- Storybook (`.storybook/preview.tsx`) provides real dark/light theming via a `ThemeContext.Provider` toolbar global. Gotchas: `layout: 'fullscreen'` stories (e.g. `MediaSlider`, `LoginScreen`) must skip the decorator's padding wrapper since they size off real window dimensions; `@gorhom/bottom-sheet`'s open animation never plays under Vite (resolves the precompiled build, not the raw Reanimated-babel-plugin-processed source) — worked around with a Storybook-only mock; `expo-router`/`expo-media-library`/`expo-sharing` are aliased to thin stubs.
- **Show nicknames / Show team logos are disabled on `/settings/display`**, grouped under a "Coming soon" / "In development" badge: `showTeamLogo` is tracked in the store but nothing reads it to gate rendering ([#70](https://github.com/CrazyNoodl/matchday/issues/70)), and `showNick` — while actually wired (`StandingCard`, `ScoreCounter`, `season-stats`) — was disabled alongside it per an explicit design call to present both as a single upcoming feature rather than one working toggle next to one dead one. Re-enable `showNick` on its own if it should ship before `showTeamLogo` gets wired up.
- `AppErrorBoundary` (`app/_layout.tsx`) is a function component wrapping the `react-error-boundary` dependency — React has no hook equivalent for `componentDidCatch`/`getDerivedStateFromError`, so the (unavoidable) class lives inside the dependency instead of app code, keeping the error UI (`src/components/ErrorFallback/`) itself able to use `useColors()`/`useTranslation()`.
- Shared dialog strings (e.g. "cannot delete") live under `common.*` i18n keys, reused by `PlayerDialogs`/`TeamDialogs` — avoid re-introducing a screen-local duplicate when adding a similar dialog elsewhere.
- `src/i18n/locales/{en,uk,fr}/` are directories, one file per top-level translation group (`common.ts`, `home.ts`, ...) merged by that locale's `index.ts` — not single monolithic files anymore. `src/i18n/index.ts`'s `import en from './locales/en'` is unchanged (resolves to the directory's `index.ts`). `en/index.ts` derives a `TranslationSchema` type; `uk`/`fr` are checked against it via `satisfies`, so a key present in one locale but missing in another is a `tsc` error, not just a runtime gap. `noDuplicateKeys.test.ts` additionally enforces exact key-set parity across all three at test time. See `docs/pitfalls.md`.
- **`AddMatchSheet`'s player-chip disabling ("already played this tour") anchors off `addMatch.homeId ?? addMatch.awayId`, not just `homeId`** — the existing tap handler lets `homeId` be cleared while `awayId` stays set (tap the home chip again to deselect it), and a naive `homeId`-only anchor would stop disabling in that state, letting a duplicate pairing slip through. `getCurrentTourMatches`/`getPlayedPartnerIds` (`src/utils/matchTours.ts`) are positional — they treat the tail of `matches` past the last full `tourSize` block as the in-progress tour, which is only correct because this same feature guarantees no duplicate pairs land inside a block. Known accepted edge case: picking a player who's already faced everyone else this tour as the anchor disables every other chip (no valid opponent) — the player must deselect and pick someone else; no explicit message is shown.

### Testing gotchas

- `AppState` can't be tested via `jest.spyOn(AppState, 'addEventListener')` on the real RN module in this project — `.remove()` doesn't actually clear the mock's internal listener registry, so subscriptions leak across tests in the same file. Replace `'react-native'` with a flat `{ Platform, AppState }` mock instead; `jest.requireActual('react-native')` also fails here — RN's circular internal requires (`FlatList` → `VirtualizedList` → ... → a `DevMenu` turbo module) break when re-entered through a custom mock factory.
- A Playwright e2e spec for the non-canonical stat-delete flow was written, verified, and **not kept** — the `···`-menu → "Edit" click sequence has pre-existing flakiness from an intercepting full-screen backdrop `Pressable`, unrelated to whatever feature is under test. Worth fixing if that dropdown pattern is touched again.

---

## Sync data-loss incident (2026-07-06)

**Production incident:** a user's real Supabase data (players, teams, active tournament, matches) was permanently deleted. No Supabase backup/PITR existed (Free plan) — unrecoverable. Two independent bugs in the sync layer were found and fixed:

1. **`resetStore()` cascaded into a real cloud delete.** `resetStore()` (called by both "Reset All Data" and sign-out) wiped local Zustand state; `useSyncManager`'s subscriber saw `players`/`teams`/tournament fields change, marked them dirty like a normal edit, and the debounced push fired with an emptied payload — `pushState()` deletes any cloud row missing from the payload, i.e. it deleted every row for that user. **Fix:** a `syncSuppressionRef` (`src/store/index.ts`) is set around `resetStore()`'s wipe; the sync subscriber bails out early while it's set.
2. **Realtime-triggered `pull()` race.** After any push, a realtime event schedules a `pull()` ~400ms later. It unconditionally applied whatever `pullState()` returned without re-checking dirty/pushing state after the network `await` — a team or player added during that window got silently overwritten by the stale pre-add snapshot. **Fix:** `pull()` now bails out if `pushingRef.current || dirtyRef.current.size > 0` at the moment it's about to apply.

**Design correction found mid-fix:** "Reset All Data" is *intentionally* a full wipe including cloud data — making `resetStore()` unconditionally local-only broke that intent. The correct shape: destructive cloud deletion must only ever happen via one explicit, directly-called function, never as a side effect of generic dirty-diffing. `deleteAllCloudData()` (`src/supabase/sync.ts`) is that function; `handleReset` calls it explicitly before `store.resetStore()`. Sign-out still only does the local-only wipe.

**Structural risk still open:** this project uses a single Supabase project for both local development and real user data (every worktree gets the same `.env` copied in) — a dev-time mistake hits real data directly, as happened here. Worth a separate dev/staging Supabase project.

This incident is also why the [local JSON backup](#what-is-fully-implemented) feature exists — a second, independent safety net entirely separate from Supabase (`src/utils/backup.ts`, `/settings/backup`). Its `applyBackupLocally()` is bracketed with the same `syncSuppressionRef`. Backups deliberately exclude **all** media links (player photos, team logos, match photos/videos — `buildBackupPayload()`'s `stripPlayerMedia`/`stripTeamMedia`/`stripMatchMedia`/`stripRoundMedia`/`stripClosedTournamentMedia`): those are Supabase Storage URLs, a backup can be restored long after it was made, and a "Reset All Data" in between would leave any embedded URL pointing at nothing. Restoring a backup never reintroduces a broken media reference — the tradeoff is that photos/logos/match media are never restored either and must be re-added manually.

---

## Key file locations

```
src/utils/statDefinitions.ts   — all 23 stat keys + labels
src/utils/standings.ts         — standings calc + H2H tiebreaker + getFormChips
src/utils/shareCard.ts         — shared column config for share cards
src/components/ShareRoundModal/    — share round image modal
src/components/ShareStandingsModal/ — share standings image modal
src/utils/backup.ts            — local JSON backup export/import
src/supabase/sync.ts           — push/pull, deleteAllCloudData, buildSyncPayload
src/supabase/useSyncManager.ts — dirty-tracking, debounced push, reconnect retry
src/hooks/useIsOnline.ts       — connectivity + Supabase reachability
app/stats.tsx                  — Ranking + H2H tabs (all-time aggregation)
src/utils/statsAggregation.ts  — pure aggregation behind app/stats.tsx (3-layer merge, H2H pairs)
app/season-stats.tsx           — season-level stats screen
src/utils/seasonStatsAggregation.ts — pure aggregation behind app/season-stats.tsx (ranked/friendly filter, champ days)
src/store/types.ts             — all types incl. modal discriminated union
src/store/index.ts             — Zustand store, MMKV/localStorage adapter
docs/pitfalls.md               — read before touching i18n or Sheet+scroll
.storybook/preview.tsx         — theme decorator, i18n init, layout:fullscreen handling
.storybook/mocks/              — Storybook-only stubs (gorhom-bottom-sheet, expo-router, etc.)
src/components/Toggle/         — shared on/off control, used by NewRoundModal + ShareRoundModal
```
