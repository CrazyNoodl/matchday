# File Map — Matchday

> Where things live. Kept manually — update when a new file earns its place (a screen, a store slice, a shared hook/util/component with non-obvious purpose). Linked from `docs/CONTEXT.md` and `CLAUDE.md`; not duplicated there.

Grouped by area; within `src/components/` and `src/i18n/locales/*/` only the pattern is described, not every file, since those follow a strict 1-folder-per-component / 1-file-per-screen-domain convention.

## Screens (`app/`) — file-based routes, `expo-router`

```
app/_layout.tsx                 — root: font loading, GestureHandlerRootView, Stack config, ScreenViewTracker, useMediaRetryManager
app/index.tsx                   — Home; redirects to /welcome if !hasSeenOnboarding
app/welcome.tsx                 — first-launch onboarding carousel (5 slides)
app/setup.tsx                   — create tournament (multi-step modal-like flow)
app/round.tsx                   — active round (standings + match list + ADD MATCH modal) — formerly matchday.tsx
app/tournament.tsx              — tournament overview (standings + played rounds)
app/archive.tsx                 — archive (closed tournaments accordion)
app/archive-day.tsx             — single archived round
app/stats.tsx                   — Ranking + H2H tabs (all-time aggregation)
app/season-stats.tsx            — season-level stats
app/match/[id].tsx              — match detail
app/settings/index.tsx          — settings menu (account card, sections, Danger Zone)
app/settings/(data)/players.tsx     — player management
app/settings/(data)/teams.tsx       — team management
app/settings/(data)/backup.tsx      — local JSON backup export/import/restore
app/settings/(tournament)/tournaments.tsx — closed tournaments list
app/settings/(display)/display.tsx  — theme, Matches card, group-by-tours, avg-goals, standings view
app/settings/(language)/language.tsx — language picker
app/settings/(developer)/developer.tsx  — dev tools menu (dev-only)
app/settings/(developer)/import-round.tsx — import round from external data (dev-only)
app/settings/(developer)/ocr-lab.tsx    — AI stats extraction from photo (dev-only)
app/settings/(developer)/resize-lab.tsx — image resize before/after inspector (dev-only)
app/settings/(about)/changelog.tsx  — changelog viewer
```

Route groups (`(data)`, `(display)`, etc.) are URL-invisible folders used only to cluster related settings screens.

## Screen-local logic (`src/screens/<screen>/`)

Non-reusable modals/dialogs and hooks that belong to exactly one screen — kept out of the `app/` route file:

```
src/screens/round/AddMatchSheet.tsx, useAddMatchFlow.ts, RoundDialogs.tsx  — behind app/round.tsx
src/screens/match/MatchModals.tsx, useMatchDetail.ts       — behind app/match/[id].tsx
src/screens/archive-day/ArchiveDayModals.tsx                — behind app/archive-day.tsx
src/screens/tournament/TournamentModals.tsx                 — behind app/tournament.tsx
src/screens/settings/useSettings.ts, SettingsDialogs.tsx, SettingsRow.tsx, SettingsSection.tsx, DangerZoneCard.tsx — behind app/settings/index.tsx
src/screens/settings/players/PlayerDialogs.tsx              — behind app/settings/(data)/players.tsx
src/screens/settings/teams/TeamDialogs.tsx                  — behind app/settings/(data)/teams.tsx
src/screens/settings/backup/BackupDialogs.tsx               — behind app/settings/(data)/backup.tsx
src/screens/settings/developer/DeveloperModals.tsx          — behind app/settings/(developer)/developer.tsx
```

## Store (`src/store/`)

```
src/store/index.ts              — Zustand store assembly, MMKV/localStorage adapter, persist partialize
src/store/types.ts              — all types incl. Player/Team/Match/ArchivedRound/ClosedTournament, modal discriminated union
src/store/sliceHelpers.ts       — matchMediaFolder() and other cross-slice helpers
src/store/slices/tournamentSlice.ts — startRound/finishRound/closeTournament, standings inputs
src/store/slices/playersSlice.ts    — player CRUD, delete guard (prunes tournamentPlayers/roundPlayers)
src/store/slices/teamsSlice.ts      — team CRUD, delete guard (matches + player.teamCode, #82)
src/store/slices/settingsSlice.ts   — display prefs, demoMode, hasSeenOnboarding
src/store/slices/uiSlice.ts         — modal, selectedMatchId, viewingRound/Tournament (not persisted)
```

## Business logic (`src/utils/`)

```
src/utils/standings.ts          — standings calc + H2H tiebreaker + getFormChips
src/utils/statDefinitions.ts    — all 23 stat keys + labels
src/utils/statsAggregation.ts   — pure aggregation behind app/stats.tsx (3-layer merge, H2H pairs)
src/utils/seasonStatsAggregation.ts — pure aggregation behind app/season-stats.tsx (ranked/friendly filter, champ days)
src/utils/matchTours.ts         — getCurrentTourMatches/getPlayedPartnerIds (no-repeat pairing, tour grouping)
src/utils/roundOrdinals.ts      — getRankedRoundOrdinals — live-recomputed ranked-only round numbering
src/utils/shareCard.ts          — shared column config for share cards
src/utils/backup.ts             — local JSON backup export/import
src/utils/imageResize.ts        — photo downscale before upload (media, stat photos, team logos)
src/utils/extractStats.ts       — OCR stat extraction parsing
src/utils/ocrPhotoMerge.ts      — merges OCR-extracted stats into match state
src/utils/importRound.ts        — import round from external data (dev tool)
src/utils/mergedStats.ts        — stat override merge logic
src/utils/matchStats.ts         — per-match stat helpers
src/utils/addMatchState.ts      — Add Match sheet form state
src/utils/pendingSync.ts        — pending-media-upload tracking (offline retry)
src/utils/offlineBanner.ts      — resolveOfflineBannerVariant() — offline vs. push/pull-failing copy
src/utils/playerDisplay.ts      — nickname/name display resolution
src/utils/teamCode.ts           — team code generation/validation
src/utils/dateFormat.ts         — date formatting helpers
src/utils/useGoBack.ts          — back-navigation hook
```

## Hooks (`src/hooks/`)

```
src/hooks/useIsOnline.ts        — connectivity + Supabase reachability
src/hooks/useMediaRetryManager.ts — retries pendingUpload media across all matches on reconnect
src/hooks/usePlayerEditForm.ts  — shared form state behind PlayerEditSheet (Settings + Setup)
src/hooks/useTeamEditForm.ts    — shared form state behind TeamEditSheet (Settings + Setup)
src/hooks/useKeyboardHeight.ts  — keyboard-aware layout helper
src/hooks/useDropdownMenu.ts    — DropdownMenu open/position state
```

## Supabase (`src/supabase/`)

```
src/supabase/client.ts          — Supabase client, persistent auth session
src/supabase/auth.ts            — sign in/out flows
src/supabase/sync.ts            — push/pull, deleteAllCloudData, buildSyncPayload
src/supabase/useSyncManager.ts  — dirty-tracking, debounced push (300ms), reconnect retry
src/supabase/storage.ts         — upload/delete against match-media bucket, deleteStorageFolder()
src/supabase/health.ts          — reachability health-check
src/supabase/types.ts           — DB row types (mirrors src/store/types.ts shapes)
```

## Components (`src/components/`)

One folder per component: `Name.tsx` + `Name.stories.tsx` + `index.ts` barrel, imported via `src/components/index.ts`. Notable ones with non-obvious behavior or shared-across-screens usage:

```
src/components/PlayerEditSheet/, TeamEditSheet/, TeamAssignSheet/ — shared create/edit forms (Settings + Setup)
src/components/ShareRoundModal/, ShareStandingsModal/  — share-to-image modals
src/components/MediaSlider/, ZoomableImage.tsx  — match media full-screen swipeable viewer
src/components/SyncStatusIndicator/             — settings sync-status row + useSyncStatus.ts
src/components/ConfirmDialog/                   — shared confirm/alert dialog (replaces hand-rolled ones)
src/components/Sheet/, SheetHeader.tsx, SheetFooter.tsx — bottom-sheet primitive (see docs/pitfalls.md for scroll gotcha)
src/components/StandingsTable/, StandingCard/    — two standings render modes (table vs. cards)
src/components/Toggle/                          — shared on/off control (NewRoundModal + ShareRoundModal)
src/components/NewRoundModal/                   — start-round modal (ranked/friendly toggle)
src/components/DraggableMatchBlock/             — drag-to-reorder match list (dev-gated, see CONTEXT.md)
src/components/LoginScreen/, OfflineScreen/, ErrorFallback/ — full-screen states shown from app/_layout.tsx
```

## i18n (`src/i18n/`)

```
src/i18n/index.ts               — i18n init
src/i18n/locales/{en,fr,uk}/    — one file per screen/domain (e.g. matchday.ts, players.ts, settings.ts), mirrored across all 3 locales
```

## Theme (`src/theme/`)

```
src/theme/colors.ts             — Colors.bg/text/accent/border, Colors.team[]
src/theme/typography.ts         — FontFamily, FontSize
src/theme/spacing.ts            — Spacing, Radius
src/theme/useColors.ts, ThemeContext.tsx — dark/light/auto resolution
```

## Data & cross-cutting

```
src/demo/data.ts                — DEMO_STATE hardcoded dataset for Demo Mode
src/data/changelog.ts           — in-app changelog content (app/settings/(about)/changelog.tsx)
src/analytics.ts                — Aptabase initAnalytics()/trackEvent(), no-ops in __DEV__
src/sentry.ts                   — initSentry(), no-ops without a DSN
docs/pitfalls.md                — read before touching i18n or Sheet+scroll
.storybook/preview.tsx          — theme decorator, i18n init, layout:fullscreen handling
.storybook/mocks/               — Storybook-only stubs (gorhom-bottom-sheet, expo-router, etc.)
```
